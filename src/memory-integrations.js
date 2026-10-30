'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { isPlainObject } = require('./fs-utils.js');
const STATUSES = new Set(['supported', 'optional', 'unsupported', 'not-applicable']);
function validateIntegrations(plugins, declarations) {
  if (!isPlainObject(declarations) || declarations.version !== 1 || Object.keys(declarations).sort().join(',') !== 'plugins,version' || !isPlainObject(declarations.plugins)) throw new Error('Invalid memory integration declarations');
  const names = plugins.map(p => p.name).sort();
  if (new Set(names).size !== names.length || JSON.stringify(Object.keys(declarations.plugins).sort()) !== JSON.stringify(names)) throw new Error('Memory coverage must match every discovered plugin exactly');
  for (const name of names) {
    const entry = declarations.plugins[name];
    if (!isPlainObject(entry) || Object.keys(entry).sort().join(',') !== 'reason,status' || !STATUSES.has(entry.status) || typeof entry.reason !== 'string' || !entry.reason.trim() || entry.reason.length > 1000) throw new Error(`Invalid memory integration for ${name}`);
  }
  return declarations;
}
function buildIntegrationMatrix(plugins, declarations) {
  validateIntegrations(plugins, declarations);
  return { schema_version: 1, coverage: 'guidance-and-local-contract', live_verified: false, identity_format: 'runtime:project:actor', entries: [...plugins].sort((a, b) => a.name.localeCompare(b.name)).map(p => ({
    plugin: p.name, ...declarations.plugins[p.name], source_file: `plugins/${p.name}/.claude-plugin/plugin.json`,
    source_sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(p.path, '.claude-plugin/plugin.json'))).digest('hex')
  })) };
}
async function recallOptional({ enabled = false, nativeState, recall } = {}) {
  if (enabled !== true) return { state: nativeState, provenance: { source: 'native', reason: 'memory-disabled', live_verified: false } };
  try {
    if (typeof recall !== 'function') throw new Error('No adapter');
    const state = await recall();
    if (state === undefined) throw new Error('Unavailable memory');
    return { state, provenance: { source: 'memory', live_verified: false } };
  } catch {
    return { state: nativeState, provenance: { source: 'native', reason: 'memory-unavailable', live_verified: false } };
  }
}
async function captureOptional({ enabled = false, optIn = false, capture, value } = {}) {
  if (enabled !== true || optIn !== true) return { status: 'skipped', reason: 'explicit-capture-opt-in-required' };
  try {
    if (typeof capture !== 'function') throw new Error('No adapter');
    await capture(value);
    return { status: 'captured', live_verified: false };
  } catch { return { status: 'unavailable', reason: 'memory-unavailable' }; }
}
module.exports = { validateIntegrations, buildIntegrationMatrix, recallOptional, captureOptional };
