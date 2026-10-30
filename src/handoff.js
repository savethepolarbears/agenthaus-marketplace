'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { isPlainObject } = require('./fs-utils.js');
const { stableStringify } = require('./catalog.js');

const FIELDS = ['schema_version', 'kind', 'task_id', 'correlation_id', 'producer', 'consumer', 'created_at', 'status', 'input', 'output', 'evidence'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTOR = /^[a-zA-Z0-9_.-]{1,64}:[a-zA-Z0-9_.-]{1,64}:[a-zA-Z0-9_.-]{1,64}$/;
const exact = (value, fields) => isPlainObject(value) && Object.keys(value).length === fields.length && fields.every(k => Object.hasOwn(value, k));
const fail = message => { throw new Error(message); };

function checkJson(value, depth = 0, seen = new Set()) {
  if (depth > 64) fail('Handoff JSON exceeds nesting limit');
  if (value === null || typeof value === 'boolean' || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) return;
  if ((!Array.isArray(value) && (!isPlainObject(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value)))) || seen.has(value)) fail('Handoff must contain JSON values');
  seen.add(value);
  for (const child of Object.values(value)) checkJson(child, depth + 1, seen);
  seen.delete(value);
}

function rootDirectory(projectRoot) {
  if (typeof projectRoot !== 'string' || !path.isAbsolute(projectRoot)) fail('Absolute projectRoot required');
  const root = fs.realpathSync(projectRoot);
  if (!fs.statSync(root).isDirectory()) fail('Project root must be a directory');
  return root;
}

function evidenceFor(projectRoot, artifactPath) {
  const root = rootDirectory(projectRoot);
  if (typeof artifactPath !== 'string' || !artifactPath || artifactPath.length > 4096 || artifactPath.includes('\0') ||
      artifactPath.includes('\\') || path.isAbsolute(artifactPath) || path.win32.isAbsolute(artifactPath) ||
      artifactPath.split('/').some(part => !part || part === '.' || part === '..')) fail('Artifact path must be project-contained and relative');
  let real;
  try { real = fs.realpathSync(path.join(root, artifactPath)); }
  catch { fail('Artifact path unavailable or outside project'); }
  const relative = path.relative(root, real);
  if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) fail('Artifact path outside project containment');
  const fd = fs.openSync(real, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    if (!fs.fstatSync(fd).isFile()) fail('Evidence artifact must be a regular file');
    const sha256 = crypto.createHash('sha256');
    const buffer = Buffer.alloc(65536);
    let size;
    while ((size = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) sha256.update(buffer.subarray(0, size));
    return { artifact_path: artifactPath, sha256: sha256.digest('hex') };
  } finally { fs.closeSync(fd); }
}

function validateEnvelope(envelope, { projectRoot } = {}) {
  checkJson(envelope);
  if (Buffer.byteLength(JSON.stringify(envelope)) > 1024 * 1024) fail('Handoff envelope exceeds size limit');
  if (!exact(envelope, FIELDS) || envelope.schema_version !== 1 || !['task', 'result'].includes(envelope.kind) ||
      ![envelope.task_id, envelope.correlation_id].every(value => typeof value === 'string' && UUID.test(value)) ||
      ![envelope.producer, envelope.consumer].every(value => typeof value === 'string' && ACTOR.test(value))) fail('Invalid handoff identity or schema version');
  const timestamp = envelope.created_at;
  if (typeof timestamp !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(timestamp) ||
      !Number.isFinite(Date.parse(timestamp)) || new Date(timestamp).toISOString() !== timestamp) fail('Invalid handoff timestamp');
  if (envelope.kind === 'task') {
    if (!['pending', 'in_progress'].includes(envelope.status) || !isPlainObject(envelope.input) || envelope.output !== null) fail('Invalid task discriminant, input or output');
  } else {
    if (!['completed', 'failed'].includes(envelope.status) || envelope.input !== null || !isPlainObject(envelope.output) || !Object.keys(envelope.output).length) fail('Invalid result discriminant, input or output');
    if (envelope.status === 'failed' && (typeof envelope.output.error !== 'string' || !envelope.output.error.trim() || envelope.output.error.length > 4096)) fail('Failed result requires error details');
  }
  rootDirectory(projectRoot);
  if (!Array.isArray(envelope.evidence) || envelope.evidence.length > 128 || (envelope.status === 'completed' && !envelope.evidence.length)) fail('Completed result requires evidence');
  const paths = new Set();
  for (const entry of envelope.evidence) {
    if (!exact(entry, ['artifact_path', 'sha256']) || typeof entry.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(entry.sha256) || paths.has(entry.artifact_path)) fail('Invalid or duplicate evidence entry');
    paths.add(entry.artifact_path);
    if (evidenceFor(projectRoot, entry.artifact_path).sha256 !== entry.sha256) fail('Artifact digest mismatch');
  }
  const validated = JSON.parse(JSON.stringify(envelope));
  // UUID text is case-insensitive; normalize before using it as a replay identity.
  validated.task_id = validated.task_id.toLowerCase();
  validated.correlation_id = validated.correlation_id.toLowerCase();
  return validated;
}

// Sequential in-memory validation, not a durable queue, lease, executor or OS boundary.
function createHandoffSession({ projectRoot } = {}) {
  const root = rootDirectory(projectRoot), tasks = new Map();
  return {
    accept(envelope, { actor } = {}) {
      const next = validateEnvelope(envelope, { projectRoot: root }), previous = tasks.get(next.task_id);
      if (typeof actor !== 'string' || !ACTOR.test(actor)) fail('Valid runtime:project:actor identity required');
      if (!previous) {
        if (next.kind !== 'task' || next.status !== 'pending') fail('Unknown task must begin pending');
        if (actor !== next.producer) fail('Dispatch actor must match producer');
      } else {
        if (['completed', 'failed'].includes(previous.status)) fail('Duplicate result or terminal task identity');
        if (next.correlation_id !== previous.correlation_id || next.created_at < previous.created_at) fail('Correlation or timestamp mismatch');
        if (previous.status === 'pending') {
          if (next.kind !== 'task' || next.status !== 'in_progress') fail('Invalid transition: task must be claimed');
          if (next.producer !== previous.producer || next.consumer !== previous.consumer ||
              stableStringify(next.input) !== stableStringify(previous.input) || stableStringify(next.evidence) !== stableStringify(previous.evidence)) fail('Claim changed task identity, input or evidence');
          if (actor !== previous.consumer) fail('Claim actor must match task consumer');
        } else {
          if (next.kind !== 'result' || !['completed', 'failed'].includes(next.status)) fail('Invalid result transition');
          if (next.producer !== previous.consumer || next.consumer !== previous.producer) fail('Result actor identities do not match claimed task');
          if (actor !== next.producer) fail('Result actor must match producer');
        }
      }
      tasks.set(next.task_id, next);
      return JSON.parse(JSON.stringify(next));
    }
  };
}
module.exports = { validateEnvelope, evidenceFor, createHandoffSession };
