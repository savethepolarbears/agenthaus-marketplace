'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { canonical, digest } = require('./safety-policy.js');
const { isPlainObject } = require('./fs-utils.js');
const FIELDS = ['version', 'receipt_id', 'request_sha256', 'policy_sha256', 'actor', 'provider', 'resource_scope', 'issued_at', 'expires_at', 'nonce'];
const MAX_TTL_MS = 60000;

function requestDigest(request) { return digest({ method: request.method, params: request.params }); }
function validatePayload(p, now = Date.now()) {
  if (!isPlainObject(p) || Object.keys(p).length !== FIELDS.length || FIELDS.some(k => !Object.hasOwn(p, k)) || p.version !== 1) return false;
  if (![p.receipt_id, p.nonce].every(v => typeof v === 'string' && /^[a-zA-Z0-9_-]{16,128}$/.test(v))) return false;
  if (![p.request_sha256, p.policy_sha256].every(v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v))) return false;
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
function consumeReceipt(receipt, { publicKey, directory, request, policy, actor, provider, resourceScope, now = Date.now() }) {
  try {
    if (!isPlainObject(receipt) || Object.keys(receipt).length !== 2 || typeof receipt.signature !== 'string' ||
        !/^[A-Za-z0-9+/]{86}==$/.test(receipt.signature) || !validatePayload(receipt.payload, now)) return false;
    const key = crypto.createPublicKey(publicKey);
    if (key.asymmetricKeyType !== 'ed25519' || !crypto.verify(null, Buffer.from(canonical(receipt.payload)), key, Buffer.from(receipt.signature, 'base64'))) return false;
    const p = receipt.payload;
    if (p.request_sha256 !== requestDigest(request) || p.policy_sha256 !== digest(policy) ||
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

function createAuthorizer({ publicKey, directory, receiptFile, policy, actor, provider }) {
  return (request, decision) => {
    try {
      const stat = fs.statSync(receiptFile);
      if (!stat.isFile() || stat.size > 16384) return false;
      return consumeReceipt(JSON.parse(fs.readFileSync(receiptFile, 'utf8')), {
        publicKey, directory, request, policy, actor, provider, resourceScope: decision.resource_scope
      });
    } catch { return false; }
  };
}
module.exports = { MAX_TTL_MS, requestDigest, validatePayload, signReceipt, consumeReceipt, createAuthorizer };
