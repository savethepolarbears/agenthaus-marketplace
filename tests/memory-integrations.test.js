'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { discoverPlugins } = require('../src/catalog.js');
const { validateIntegrations, buildIntegrationMatrix, recallOptional, captureOptional } = require('../src/memory-integrations.js');
const source = path.resolve('plugins/agent-memory/references/integrations.json');

test('every dynamically discovered plugin has explicit non-runtime memory coverage', () => {
  const plugins = discoverPlugins(); const declarations = JSON.parse(fs.readFileSync(source, 'utf8'));
  const matrix = buildIntegrationMatrix(plugins, declarations);
  assert.equal(matrix.entries.length, plugins.length);
  assert.equal(matrix.live_verified, false);
  assert.ok(matrix.entries.every(e => /^[a-f0-9]{64}$/.test(e.source_sha256) && e.reason.length > 0));
});
test('missing, renamed, extra or malformed coverage is rejected', () => {
  const plugins = [{ name: 'a' }];
  const valid = { version: 1, plugins: { a: { status: 'optional', reason: 'Native fallback is available.' } } };
  assert.doesNotThrow(() => validateIntegrations(plugins, valid));
  for (const declarations of [{ version: 1, plugins: {} }, { ...valid, plugins: { b: valid.plugins.a } }, { ...valid, plugins: { ...valid.plugins, b: valid.plugins.a } }, { ...valid, plugins: { a: { status: 'connected', reason: 'claimed' } } }, { ...valid, plugins: { a: { ...valid.plugins.a, secret: 'synthetic' } } }]) assert.throws(() => validateIntegrations(plugins, declarations));
});
test('disabled memory does not call adapters and returns native provenance', async () => {
  let calls = 0;
  const state = { local: true };
  const result = await recallOptional({ nativeState: state, recall: async () => { calls++; } });
  assert.equal(calls, 0); assert.deepEqual(result.state, state); assert.equal(result.provenance.source, 'native');
});
test('unavailable memory falls back without exposing errors or silently capturing', async () => {
  const result = await recallOptional({ enabled: true, nativeState: { local: 1 }, recall: async () => { throw new Error('SYNTHETIC_SECRET'); } });
  assert.equal(result.provenance.reason, 'memory-unavailable');
  assert.equal(JSON.stringify(result).includes('SYNTHETIC_SECRET'), false);
});
test('recall and capture are separate; capture requires explicit opt-in', async () => {
  let reads = 0, writes = 0;
  const recall = await recallOptional({ enabled: true, nativeState: {}, recall: async () => { reads++; return { remembered: true }; } });
  assert.equal(recall.provenance.source, 'memory'); assert.equal(reads, 1);
  const capture = async () => { writes++; return 'fixture-receipt'; };
  const denied = await captureOptional({ enabled: true, capture, value: {} });
  assert.equal(denied.status, 'skipped'); assert.equal(writes, 0);
  const accepted = await captureOptional({ enabled: true, optIn: true, capture, value: { fixture: true } });
  assert.equal(accepted.status, 'captured'); assert.equal(writes, 1);
});
test('configuration strings cannot opt into recall or capture', async () => {
 let calls = 0;
 for (const flag of ['false', 'true', 1, {}, []]) {
  const recalled = await recallOptional({ enabled: flag, nativeState: {}, recall: async () => { calls++; return {}; } });
  assert.equal(recalled.provenance.source, 'native');
  const captured = await captureOptional({ enabled: true, optIn: flag, capture: async () => { calls++; } });
  assert.equal(captured.status, 'skipped');
  const disabled = await captureOptional({ enabled: flag, optIn: true, capture: async () => { calls++; } });
  assert.equal(disabled.status, 'skipped');
 }
 assert.equal(calls, 0);
});
