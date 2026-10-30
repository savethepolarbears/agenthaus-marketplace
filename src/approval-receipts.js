'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { canonical, digest } = require('./safety-policy.js');
const { isPlainObject } = require('./fs-utils.js');
const FIELDS = ['version', 'receipt_id', 'request_sha256', 'policy_sha256', 'target_sha256', 'actor', 'provider', 'resource_scope', 'issued_at', 'expires_at', 'nonce'];
const MAX_TTL_MS = 60000;

function validateTarget(target) {
  const exact = (o, keys) => isPlainObject(o) && Object.keys(o).length === keys.length && keys.every(k => Object.hasOwn(o, k));
  const text = s => typeof s === 'string' && s.length > 0 && s.length <= 4096 && !s.includes('\0');
  if (!exact(target, ['version', 'installation', 'server', 'launch']) || target.version !== 1 ||
      ![target.installation, target.server].every(s => typeof s === 'string' && /^[a-zA-Z0-9_.:-]{1,128}$/.test(s))) throw new Error('Invalid trusted target');
  const l = target.launch;
  if (!exact(l, ['command', 'args', 'cwd', 'environment']) || !text(l.command) || !path.isAbsolute(l.command) ||
      !text(l.cwd) || !path.isAbsolute(l.cwd) || !Array.isArray(l.args) || l.args.length > 256 ||
      l.args.some(s => typeof s !== 'string' || s.length > 4096 || s.includes('\0')) ||
      !isPlainObject(l.environment) || Object.keys(l.environment).length > 256) throw new Error('Invalid target launch');
  for (const [name, entry] of Object.entries(l.environment)) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]{0,127}$/.test(name) ||
        !(exact(entry, ['value']) && typeof entry.value === 'string' && entry.value.length <= 8192 && !entry.value.includes('\0')) &&
        !(exact(entry, ['secret_ref']) && typeof entry.secret_ref === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]{0,127}$/.test(entry.secret_ref))) {
      throw new Error('Invalid target environment');
    }
  }
  return target;
}
function targetDigest(target) { return digest(validateTarget(target)); }
function resolveTargetLaunch(target, command, args, environment) {
  validateTarget(target);
  const launch = target.launch;
  if (command !== launch.command || canonical(args) !== canonical(launch.args)) throw new Error('Target launch mismatch');
  const env = Object.create(null);
  if (process.platform === 'win32') {
    for (const k of ['SystemRoot', 'ComSpec']) {
      if (typeof environment?.[k] === 'string' && !environment[k].includes('\0')) env[k] = environment[k];
    }
  }
  for (const [name, entry] of Object.entries(launch.environment)) {
    const value = Object.hasOwn(entry, 'value') ? entry.value : environment[entry.secret_ref];
    if (typeof value !== 'string' || value.includes('\0')) throw new Error('Target environment unavailable');
    env[name] = value;
  }
  return { cwd: launch.cwd, env };
}

// These client correlation fields are deliberately unavailable to upstream tools.
// All remaining metadata stays in both the signed intent and the forwarded request.
function normalizeToolRequest(request) {
  if (request.method !== 'tools/call' || !isPlainObject(request.params) || !Object.hasOwn(request.params, '_meta')) return request;
  const meta = request.params._meta;
  if (!isPlainObject(meta) ||
      (Object.hasOwn(meta, 'progressToken') && !(typeof meta.progressToken === 'string' || (typeof meta.progressToken === 'number' && Number.isFinite(meta.progressToken)))) ||
      (Object.hasOwn(meta, 'claudecode/toolUseId') && !(typeof meta['claudecode/toolUseId'] === 'string' && meta['claudecode/toolUseId'].length > 0 && meta['claudecode/toolUseId'].length <= 512))) {
    throw new Error('Invalid tool metadata');
  }
  const params = { ...request.params }, remaining = { ...meta };
  delete remaining.progressToken;
  delete remaining['claudecode/toolUseId'];
  if (Object.keys(remaining).length) params._meta = remaining;
  else delete params._meta;
  return { ...request, params };
}
function requestDigest(request) {
  const normalized = normalizeToolRequest(request);
  return digest({ method: normalized.method, params: normalized.params });
}
function validatePayload(p, now = Date.now()) {
  if (!isPlainObject(p) || Object.keys(p).length !== FIELDS.length || FIELDS.some(k => !Object.hasOwn(p, k)) || p.version !== 2) return false;
  if (![p.receipt_id, p.nonce].every(v => typeof v === 'string' && /^[a-zA-Z0-9_-]{16,128}$/.test(v))) return false;
  if (![p.request_sha256, p.policy_sha256, p.target_sha256].every(v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v))) return false;
  if (![p.actor, p.provider, p.resource_scope].every(v => typeof v === 'string' && v.length > 0 && v.length <= 512)) return false;
  if (![p.issued_at, p.expires_at].every(v => typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v))) return false;
  const issued = Date.parse(p.issued_at), expires = Date.parse(p.expires_at);
  return Number.isFinite(issued) && Number.isFinite(expires) && new Date(issued).toISOString() === p.issued_at &&
    new Date(expires).toISOString() === p.expires_at && issued <= now && now < expires && expires > issued && expires - issued <= MAX_TTL_MS;
}

// For an independently trusted operator broker only. Not exported through MCP.
function signReceipt(payload, privateKey) {
  if (!validatePayload(payload)) throw new Error('Invalid approval payload');
  const key = crypto.createPrivateKey(privateKey);
  if (key.asymmetricKeyType !== 'ed25519') throw new Error('Ed25519 operator key required');
  return { payload, signature: crypto.sign(null, Buffer.from(canonical(payload)), key).toString('base64') };
}

// The public key and consumption directory must be protected from the agent OS identity.
// File permissions alone do not isolate another process running under the same user.
function consumeReceipt(receipt, { publicKey, directory, request, policy, target, actor, provider, resourceScope, now = Date.now() }) {
  try {
    if (!isPlainObject(receipt) || Object.keys(receipt).length !== 2 || typeof receipt.signature !== 'string' ||
        !/^[A-Za-z0-9+/]{86}==$/.test(receipt.signature) || !validatePayload(receipt.payload, now)) return false;
    const key = crypto.createPublicKey(publicKey);
    if (key.asymmetricKeyType !== 'ed25519' || !crypto.verify(null, Buffer.from(canonical(receipt.payload)), key, Buffer.from(receipt.signature, 'base64'))) return false;
    const p = receipt.payload;
    if (p.request_sha256 !== requestDigest(request) || p.policy_sha256 !== digest(policy) || p.target_sha256 !== targetDigest(target) ||
        p.actor !== actor || p.provider !== provider || p.resource_scope !== resourceScope) return false;
    const dir = path.resolve(directory), stat = fs.lstatSync(dir);
    if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(dir) !== dir) return false;
    if (process.platform !== 'win32' && ((stat.mode & 0o077) !== 0 || stat.uid !== process.getuid())) return false;
    const marker = path.join(dir, digest({ nonce: p.nonce }));
    const fd = fs.openSync(marker, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY, 0o600);
    try { fs.writeFileSync(fd, p.receipt_id); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    return true;
  } catch { return false; }
}

function createAuthorizer({ publicKey, directory, receiptFile, policy, target, actor, provider }) {
  validateTarget(target);
  return (request, decision) => {
    try {
      const stat = fs.statSync(receiptFile);
      if (!stat.isFile() || stat.size > 16384) return false;
      return consumeReceipt(JSON.parse(fs.readFileSync(receiptFile, 'utf8')), {
        publicKey, directory, request, policy, target, actor, provider, resourceScope: decision.resource_scope
      });
    } catch { return false; }
  };
}
module.exports = { MAX_TTL_MS, requestDigest, normalizeToolRequest, validatePayload, signReceipt, consumeReceipt, createAuthorizer, validateTarget, targetDigest, resolveTargetLaunch };
