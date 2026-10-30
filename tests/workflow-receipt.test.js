'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { captureSource, createWorkflowReceipt, validateWorkflowReceipt, consumeWorkflowReceipt } = require('../src/workflow-receipt.js');
function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-receipt-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src')); fs.writeFileSync(path.join(root, 'src/a.js'), 'original'); fs.writeFileSync(path.join(root, 'policy.json'), '{}');
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture'], { cwd: root });
  const options = { repoRoot: root, policyFiles: ['policy.json'] };
  const result = { status: 'pass', commands: [{ command: ['node', 'fixture'], exit: 0 }], errors: [], coverage: { plugins: ['fixture'] } };
  return { root, options, result, receipt: createWorkflowReceipt({ source: captureSource(options), result }) };
}
test('local workflow receipt binds exact HEAD and dirty source bytes', t => {
  const f = fixture(t); assert.equal(validateWorkflowReceipt(f.receipt, f.options).ok, true);
  fs.writeFileSync(path.join(f.root, 'src/a.js'), 'changed');
  assert.equal(validateWorkflowReceipt(f.receipt, f.options).ok, false);
});
test('policy scope cannot be narrowed or changed by a submitted receipt', t => {
  const f = fixture(t); fs.writeFileSync(path.join(f.root, 'policy.json'), '{"changed":true}');
  assert.equal(validateWorkflowReceipt(f.receipt, f.options).ok, false);
});
test('a new HEAD invalidates an otherwise unchanged receipt', t => {
  const f = fixture(t); execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'next'], { cwd: f.root });
  assert.equal(validateWorkflowReceipt(f.receipt, f.options).ok, false);
});
test('reports do not change scoped workflow source identity', t => {
  const f = fixture(t); fs.mkdirSync(path.join(f.root, 'reports')); fs.writeFileSync(path.join(f.root, 'reports/unrelated.json'), '{}');
  assert.equal(validateWorkflowReceipt(f.receipt, f.options).ok, true);
});
test('stale receipts fail before nonce consumption and a valid receipt is consumed once', t => {
  const f = fixture(t), stateDir = path.join(f.root, 'receipts'); fs.mkdirSync(stateDir, { mode: 0o700 });
  const stale = structuredClone(f.receipt); stale.source.head = '0'.repeat(40);
  assert.equal(consumeWorkflowReceipt(stale, { ...f.options, stateDir }).ok, false);
  assert.equal(fs.readdirSync(stateDir).length, 0);
  assert.equal(consumeWorkflowReceipt(f.receipt, { ...f.options, stateDir }).ok, true);
  assert.equal(consumeWorkflowReceipt(f.receipt, { ...f.options, stateDir }).ok, false);
});
test('failed, malformed, or invented hosted receipts cannot satisfy the local gate', t => {
  const f = fixture(t);
  for (const receipt of [{}, { ...f.receipt, evidence: 'hosted' }, createWorkflowReceipt({ source: captureSource(f.options), result: { ...f.result, status: 'fail' } })]) {
    assert.equal(validateWorkflowReceipt(receipt, f.options).ok, false);
  }
});
test('environment-prefixed executable sources remain bound by the worktree receipt', t => {
  const f = fixture(t); fs.writeFileSync(path.join(f.root, 'src/.env-loader.js'), 'original');
  const receipt = createWorkflowReceipt({ source: captureSource(f.options), result: f.result });
  fs.writeFileSync(path.join(f.root, 'src/.env-loader.js'), 'changed');
  assert.equal(validateWorkflowReceipt(receipt, f.options).ok, false);
});
