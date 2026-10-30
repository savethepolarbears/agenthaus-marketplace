'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runReference } = require('../scripts/run-handoff-reference.js');
function workspace(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-reference-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return dir; }
test('offline reference succeeds without credentials and clearly labels its provenance', async t => {
 const result = await runReference({ projectRoot: workspace(t) });
 assert.equal(result.fixture, true); assert.equal(result.completed_stages, 3); assert.equal(result.published, false);
 assert.equal(result.memory.source, 'native'); assert.equal(result.capture.status, 'skipped');
 assert.equal(result.artifacts.length, 3); assert.ok(result.artifacts.every(e => /^[a-f0-9]{64}$/.test(e.sha256)));
});
test('capture uses only an explicitly opted-in fixture adapter', async t => {
 let writes = 0;
 const memory = { enabled: true, recall: async () => { throw new Error('unavailable'); }, capture: async value => { assert.equal(value.fixture, true); writes++; } };
 await runReference({ projectRoot: workspace(t), memory }); assert.equal(writes, 0);
 const result = await runReference({ projectRoot: workspace(t), memory, captureOptIn: true });
 assert.equal(writes, 1); assert.equal(result.memory.reason, 'memory-unavailable'); assert.equal(result.capture.status, 'captured');
});
test('correlation, actor and digest substitutions stop the offline chain', async t => {
 for (const attack of ['correlation', 'actor', 'digest']) {
  await assert.rejects(runReference({ projectRoot: workspace(t), beforeAccept: e => {
   if (e.kind === 'result') { e = structuredClone(e); if (attack === 'correlation') e.correlation_id = '00000000-0000-4000-8000-000000000000'; if (attack === 'actor') e.producer = 'other:project:actor'; if (attack === 'digest') e.evidence[0].sha256 = '0'.repeat(64); } return e;
  } }));
 }
});
test('failed stages stop later work and replayed results are rejected', async t => {
 await assert.rejects(runReference({ projectRoot: workspace(t), failStage: 2 }));
 await assert.rejects(runReference({ projectRoot: workspace(t), replayResult: true }));
});
test('persisted trace can independently revalidate every typed lifecycle and actor', async t => {
 const result = await runReference({ projectRoot: workspace(t) });
 assert.match(result.correlation_id, /^[0-9a-f-]{36}$/);
 const file = path.join(result.workspace, result.trace_artifact.artifact_path);
 const trace = JSON.parse(fs.readFileSync(file, 'utf8'));
 assert.equal(trace.length, 9);
 const session = require('../src/handoff.js').createHandoffSession({ projectRoot: result.workspace });
 for (const { envelope, actor } of trace) { assert.equal(envelope.correlation_id, result.correlation_id); session.accept(envelope, { actor }); }
 assert.equal(new Set(trace.map(e => e.envelope.task_id)).size, 3);
});
