'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { validateEnvelope, createHandoffSession, evidenceFor } = require('../src/handoff.js');

function fixture(t) {
  const projectRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'typed-handoff-')));
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));
  fs.mkdirSync(path.join(projectRoot, 'artifacts'));
  fs.writeFileSync(path.join(projectRoot, 'artifacts/result.txt'), 'verified fixture result\n');
  const evidence = [{ artifact_path: 'artifacts/result.txt', sha256: 'a'.repeat(64) }];
  evidence[0].sha256 = crypto.createHash('sha256').update('verified fixture result\n').digest('hex');
  const task = { schema_version: 1, kind: 'task', task_id: crypto.randomUUID(), correlation_id: crypto.randomUUID(),
    producer: 'node:fixture:coordinator', consumer: 'node:fixture:worker', created_at: '2026-10-24T10:00:00.000Z',
    status: 'pending', input: { requirements: 'Produce an offline fixture', provenance: 'fixture' }, output: null, evidence: [] };
  const claimed = { ...task, status: 'in_progress', created_at: '2026-10-24T10:00:01.000Z' };
  const result = { ...task, kind: 'result', producer: task.consumer, consumer: task.producer, status: 'completed',
    created_at: '2026-10-24T10:00:02.000Z', input: null, output: { summary: 'Fixture produced', provenance: 'fixture' }, evidence };
  return { projectRoot, task, claimed, result, evidence };
}

test('typed dispatch, claim and digest-checked result complete once', t => {
  const f = fixture(t), session = createHandoffSession({ projectRoot: f.projectRoot });
  assert.deepEqual(evidenceFor(f.projectRoot, 'artifacts/result.txt'), f.evidence[0]);
  assert.equal(validateEnvelope(f.task, { projectRoot: f.projectRoot }).status, 'pending');
  session.accept(f.task, { actor: f.task.producer });
  session.accept(f.claimed, { actor: f.task.consumer });
  assert.equal(session.accept(f.result, { actor: f.task.consumer }).status, 'completed');
  assert.throws(() => session.accept(f.result, { actor: f.task.consumer }), /duplicate|terminal/i);
  assert.throws(() => session.accept({ ...f.task, task_id: f.task.task_id.toUpperCase() }, { actor: f.task.producer }), /duplicate|terminal/i);
});

test('unknown fields, versions, malformed timestamps and invalid discriminants reject', t => {
  const f = fixture(t);
  const missing = { ...f.task }; delete missing.correlation_id;
  for (const invalid of [missing, { ...f.task, schema_version: 2 }, { ...f.task, unexpected: true },
    { ...f.task, created_at: '2026-02-31T10:00:00.000Z' }, { ...f.task, kind: 'result' },
    { ...f.task, producer: 'fixed-persona' }, { ...f.task, producer: [f.task.producer] },
    { ...f.task, task_id: [f.task.task_id] }, { ...f.task, correlation_id: [f.task.correlation_id] },
    { ...f.task, output: {} }, { ...f.result, evidence: [] }]) {
    assert.throws(() => validateEnvelope(invalid, { projectRoot: f.projectRoot }));
  }
});

test('results require a claim and correlated task, consumer and actor identities', t => {
  const f = fixture(t), session = createHandoffSession({ projectRoot: f.projectRoot });
  assert.throws(() => session.accept(f.result, { actor: f.task.consumer }), /pending|task|unknown/i);
  session.accept(f.task, { actor: f.task.producer });
  assert.throws(() => session.accept(f.result, { actor: f.task.consumer }), /transition|claim/i);
  assert.throws(() => session.accept(f.claimed, { actor: 'node:fixture:other' }), /actor/i);
  assert.throws(() => session.accept(f.claimed, { actor: [f.task.consumer] }), /actor/i);
  assert.throws(() => session.accept({ ...f.claimed, input: { requirements: 'Changed work' } }, { actor: f.task.consumer }), /input|identity/i);
  session.accept(f.claimed, { actor: f.task.consumer });
  for (const result of [{ ...f.result, correlation_id: crypto.randomUUID() }, { ...f.result, producer: 'node:fixture:other' },
    { ...f.result, consumer: 'node:fixture:other' }, { ...f.result, created_at: f.task.created_at }]) {
    assert.throws(() => session.accept(result, { actor: result.producer }));
  }
  assert.equal(session.accept(f.result, { actor: f.task.consumer }).status, 'completed');
});

test('path traversal, external symlinks, nonfiles and altered evidence fail closed', t => {
  const f = fixture(t);
  for (const artifact_path of ['../outside.txt', '/etc/hosts', 'C:\\outside.txt', 'artifacts/../result.txt', 'artifacts']) {
    assert.throws(() => evidenceFor(f.projectRoot, artifact_path));
  }
  assert.throws(() => validateEnvelope({ ...f.result, evidence: [{ ...f.evidence[0], sha256: '0'.repeat(64) }] }, { projectRoot: f.projectRoot }), /digest/i);
  fs.writeFileSync(path.join(f.projectRoot, 'artifacts/result.txt'), 'tampered');
  assert.throws(() => validateEnvelope(f.result, { projectRoot: f.projectRoot }), /digest/i);
  if (process.platform !== 'win32') {
    const outside = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'handoff-outside-')));
    t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
    fs.writeFileSync(path.join(outside, 'unrelated.txt'), 'outside project');
    fs.symlinkSync(outside, path.join(f.projectRoot, 'outside'));
    assert.throws(() => evidenceFor(f.projectRoot, 'outside/unrelated.txt'), /contain|outside|path/i);
  }
});

test('failed results require error details and do not reopen terminal tasks', t => {
  const f = fixture(t), session = createHandoffSession({ projectRoot: f.projectRoot });
  session.accept(f.task, { actor: f.task.producer }); session.accept(f.claimed, { actor: f.task.consumer });
  const failed = { ...f.result, status: 'failed', evidence: [], output: { error: 'Fixture unavailable', provenance: 'fixture' } };
  assert.throws(() => validateEnvelope({ ...failed, output: {} }, { projectRoot: f.projectRoot }), /error/i);
  session.accept(failed, { actor: f.task.consumer });
  assert.throws(() => session.accept(f.task, { actor: f.task.producer }), /terminal|duplicate/i);
});

test('caller mutation cannot change an accepted task identity or input', t => {
  const f = fixture(t), session = createHandoffSession({ projectRoot: f.projectRoot });
  session.accept(f.task, { actor: f.task.producer });
  const claimed = structuredClone(f.claimed);
  f.task.input.requirements = 'Mutated caller object';
  assert.doesNotThrow(() => session.accept(claimed, { actor: claimed.consumer }));
});
