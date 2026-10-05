'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { PassThrough } = require('node:stream');
const { once } = require('node:events');
const { digest } = require('../src/safety-policy.js');
const { signReceipt, consumeReceipt, requestDigest, createAuthorizer } = require('../src/approval-receipts.js');
const { runGuard, readFrames } = require('../src/safety-guard.js');

function fixture(t) {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-approval-'))); fs.chmodSync(directory, 0o700);
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const keys = crypto.generateKeyPairSync('ed25519');
  const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' });
  const privateKey = keys.privateKey.export({ type: 'pkcs8', format: 'pem' });
  const request = { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'delete', arguments: { resource: '/fixture' } } };
  const policy = { version: 1, rules: [{ id: 'write', tool: 'delete', action: 'require-approval', resource_scope: '/fixture' }] };
  const now = Date.now();
  const payload = { version: 1, receipt_id: crypto.randomUUID(), nonce: crypto.randomUUID(), request_sha256: requestDigest(request),
    policy_sha256: digest(policy), actor: 'test-operator', provider: 'fixture', resource_scope: '/fixture',
    issued_at: new Date(now).toISOString(), expires_at: new Date(now + 60000).toISOString() };
  const receipt = signReceipt(payload, privateKey);
  const options = { publicKey, directory, request, policy, actor: payload.actor, provider: payload.provider, resourceScope: payload.resource_scope, now };
  return { directory, publicKey, privateKey, request, policy, now, payload, receipt, options };
}

test('Ed25519 receipt is consumed once and replay is denied', t => {
  const f = fixture(t);
  assert.equal(consumeReceipt(f.receipt, f.options), true);
  assert.equal(consumeReceipt(f.receipt, f.options), false);
});
test('changed payload/signature/key or missing provenance is denied', t => {
  const f = fixture(t);
  assert.equal(consumeReceipt({ payload: { ...f.payload, actor: 'attacker' }, signature: f.receipt.signature }, f.options), false);
  assert.equal(consumeReceipt({ payload: f.payload, signature: 'A'.repeat(86) + '==' }, f.options), false);
  assert.equal(consumeReceipt({ payload: f.payload }, f.options), false);
  const other = crypto.generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'pem' });
  assert.equal(consumeReceipt(f.receipt, { ...f.options, publicKey: other }), false);
  assert.deepEqual(fs.readdirSync(f.directory), []);
});
test('request/policy/actor/provider/resource mismatch, expiry and future issuance fail without consuming', t => {
  const f = fixture(t);
  for (const overrides of [
    { request: { ...f.request, params: { name: 'delete', arguments: { resource: '/other' } } } },
    { policy: { version: 1, rules: [] } }, { actor: 'other' }, { provider: 'other' }, { resourceScope: '/other' },
    { now: f.now + 60000 }, { now: f.now - 1 }
  ]) assert.equal(consumeReceipt(f.receipt, { ...f.options, ...overrides }), false);
  assert.deepEqual(fs.readdirSync(f.directory), []);
});
test('excessive TTL, unknown fields and malformed dates cannot be signed', t => {
  const f = fixture(t);
  for (const overrides of [{ expires_at: new Date(f.now + 60001).toISOString() }, { arbitrary: true },
    { issued_at: '2026-02-31T12:00:00.000Z' }, { nonce: '../escape' }]) {
    assert.throws(() => signReceipt({ ...f.payload, ...overrides }, f.privateKey));
  }
});
test('unsafe or symlinked consumption directories fail closed', t => {
  const f = fixture(t), alias = f.directory + '-link';
  fs.symlinkSync(f.directory, alias); t.after(() => fs.unlinkSync(alias));
  assert.equal(consumeReceipt(f.receipt, { ...f.options, directory: alias }), false);
  if (process.platform !== 'win32') { fs.chmodSync(f.directory, 0o755); assert.equal(consumeReceipt(f.receipt, f.options), false); }
});
test('competing processes can consume one nonce only once', { timeout: 5000 }, async t => {
  const f = fixture(t);
  const modulePath = require.resolve('../src/approval-receipts.js');
  const code = 'const fs=require("node:fs");const {consumeReceipt}=require(process.argv[1]);const d=JSON.parse(fs.readFileSync(0,"utf8"));console.log(consumeReceipt(d.receipt,d.options));';
  const consume = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', code, modulePath], { stdio: ['pipe', 'pipe', 'pipe'] }); let out = '';
    child.stdout.on('data', b => { out += b; }); child.on('error', reject); child.on('exit', c => c === 0 ? resolve(out.trim()) : reject(new Error('consumer failed')));
    child.stdin.end(JSON.stringify({ receipt: f.receipt, options: f.options }));
  });
  assert.deepEqual((await Promise.all([consume(), consume()])).sort(), ['false', 'true']);
});
test('signed authorization is wired to the proxy; replay never reaches upstream', { timeout: 5000 }, async t => {
  const f = fixture(t), receiptFile = path.join(f.directory, 'receipt.json'), log = path.join(f.directory, 'calls.jsonl');
  fs.writeFileSync(receiptFile, JSON.stringify(f.receipt));
  const input = new PassThrough(), output = new PassThrough(), stderr = new PassThrough(), waiters = new Map();
  const authorizer = createAuthorizer({ ...f.options, receiptFile });
  const guard = runGuard({ command: process.execPath, args: [path.join(__dirname, 'fixtures/mcp-upstream.js')], policy: f.policy,
    input, output, diagnostics: stderr, env: { ...process.env, CALL_LOG: log }, authorize: authorizer });
  t.after(async () => { if (guard.child.exitCode === null && guard.child.signalCode === null) { const exit = once(guard.child, 'exit'); guard.stop('cleanup'); await exit; } });
  readFrames(output, m => { if (waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id); } }, () => assert.fail('invalid output'));
  const request = m => new Promise(resolve => { waiters.set(m.id, resolve); input.write(JSON.stringify(m) + '\n'); });
  await request({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } });
  input.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
  assert.ok((await request(f.request)).result);
  assert.equal((await request({ ...f.request, id: 8 })).error.code, -32003);
  assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse).filter(m => m.method === 'tools/call').length, 1);
});
