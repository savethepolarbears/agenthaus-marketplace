'use strict';
// Local evidence receipts bind the observed worktree. They are not signed hosted attestations.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { canonical } = require('./safety-policy.js');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const DEFAULT_POLICIES = ['AGENTS.md', 'schemas/plugin.schema.json', 'schemas/safety-policy.schema.json', 'schemas/approval-receipt.schema.json', 'schemas/skills-index.schema.json'];
const SOURCE_DIRS = ['src', 'scripts', 'schemas', 'tests', 'bin', 'plugins', '.claude-plugin', '.github/workflows'];
const SOURCE_FILES = ['AGENTS.md', 'GEMINI.md', 'README.md', 'CONTRIBUTING.md', 'skills_index.json'];
function filesBelow(root, dir) {
  const result = [];
  if (!fs.existsSync(path.join(root, dir))) return result;
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const secretEnvFile = /^\.env(?:\.[a-z0-9_-]+)*$/i.test(entry.name) && !/\.(?:[cm]?js|jsx|tsx?|sh|bash|zsh|py|rb|pl|ps1)$/i.test(entry.name);
    if (entry.name === 'node_modules' || entry.name === '.git' || secretEnvFile || entry.name === '__pycache__') continue;
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...filesBelow(root, rel));
    else if (entry.isFile() || entry.isSymbolicLink()) result.push(rel);
  }
  return result;
}
function fileDigest(root, rel) {
  if (typeof rel !== 'string' || path.isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) throw new Error('Invalid source path');
  const file = path.join(root, rel), real = fs.realpathSync(file), base = fs.realpathSync(root);
  if (real !== base && !real.startsWith(base + path.sep)) throw new Error('Source symlink escapes repository');
  return { path: rel, sha256: hash(fs.readFileSync(file)) };
}
function captureSource({ repoRoot, policyFiles = DEFAULT_POLICIES }) {
  const root = path.resolve(repoRoot);
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  if (!/^[a-f0-9]{40,64}$/.test(head)) throw new Error('Full source HEAD unavailable');
  const policies = [...new Set(policyFiles)].sort().map(rel => fileDigest(root, rel));
  const paths = [...new Set([...SOURCE_DIRS.flatMap(dir => filesBelow(root, dir)), ...SOURCE_FILES.filter(rel => fs.existsSync(path.join(root, rel)))])].sort();
  const files = paths.map(rel => fileDigest(root, rel));
  return { head, policies, policy_sha256: hash(canonical(policies)), files, worktree_sha256: hash(canonical(files)) };
}
function createWorkflowReceipt({ source, result }) {
  return { version: 1, id: crypto.randomUUID(), created_at: new Date().toISOString(), evidence: 'local', source, result,
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    external_evidence: { hosted_ci: 'unknown', provider_acceptance: 'unknown', phase6_acceptance: 'open' } };
}
function validateWorkflowReceipt(receipt, options) {
  try {
    if (!receipt || receipt.version !== 1 || receipt.evidence !== 'local' || !/^[a-f0-9-]{36}$/.test(receipt.id) ||
        !receipt.source || !receipt.result || receipt.result.status !== 'pass' || !Array.isArray(receipt.result.commands) ||
        receipt.result.commands.length === 0 || receipt.result.commands.some(c => c.exit !== 0) ||
        !Array.isArray(receipt.result.errors) || receipt.result.errors.length !== 0) return { ok: false, reason: 'INVALID_OR_FAILED_RECEIPT' };
    const current = captureSource(options);
    if (receipt.source.head !== current.head) return { ok: false, reason: 'HEAD_CHANGED' };
    if (canonical(receipt.source.policies) !== canonical(current.policies) || receipt.source.policy_sha256 !== current.policy_sha256) return { ok: false, reason: 'POLICY_CHANGED' };
    if (canonical(receipt.source.files) !== canonical(current.files) || receipt.source.worktree_sha256 !== current.worktree_sha256) return { ok: false, reason: 'WORKTREE_CHANGED' };
    return { ok: true, reason: 'CURRENT_LOCAL_EVIDENCE' };
  } catch { return { ok: false, reason: 'SOURCE_UNAVAILABLE' }; }
}
function consumeWorkflowReceipt(receipt, { stateDir, ...options }) {
  const validation = validateWorkflowReceipt(receipt, options);
  if (!validation.ok) return validation; // Never consume stale or failed evidence.
  try {
    const dir = path.resolve(stateDir), stat = fs.lstatSync(dir);
    if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(dir) !== dir) return { ok: false, reason: 'UNSAFE_RECEIPT_STATE' };
    const fd = fs.openSync(path.join(dir, hash(receipt.id)), 'wx', 0o600);
    try { fs.writeFileSync(fd, receipt.source.worktree_sha256); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    return { ok: true, reason: 'CONSUMED_CURRENT_LOCAL_EVIDENCE' };
  } catch { return { ok: false, reason: 'REPLAY_OR_STATE_UNAVAILABLE' }; }
}
module.exports = { DEFAULT_POLICIES, filesBelow, captureSource, createWorkflowReceipt, validateWorkflowReceipt, consumeWorkflowReceipt };
