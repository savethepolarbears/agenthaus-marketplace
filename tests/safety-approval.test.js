'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');
const { PassThrough } = require('node:stream');
const { once } = require('node:events');
const { digest } = require('../src/safety-policy.js');
const { signReceipt, consumeReceipt, requestDigest, createAuthorizer, targetDigest } = require('../src/approval-receipts.js');
const { runGuard, readFrames } = require('../src/safety-guard.js');

function fixture(t) {
  const directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-approval-'))); fs.chmodSync(directory, 0o700);
  const guards = [], extras = [];
  t.after(async () => {
    for (const fn of extras) { try { await fn(); } catch {} }
    for (const g of guards) {
      if (g.child.exitCode === null && g.child.signalCode === null) {
        const exit = once(g.child, 'exit');
        g.stop('cleanup');
        await exit;
      }
    }
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const keys = crypto.generateKeyPairSync('ed25519');
  const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' });
  const privateKey = keys.privateKey.export({ type: 'pkcs8', format: 'pem' });
  const request = { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'delete', arguments: { resource: '/fixture' } } };
  const policy = { version: 1, rules: [{ id: 'write', tool: 'delete', action: 'require-approval', resource_scope: '/fixture' }] };
  const target = { version: 1, installation: 'fixture-install', server: 'server-a', launch: {
    command: process.execPath, args: [path.join(__dirname, 'fixtures/mcp-upstream.js')], cwd: directory,
    environment: { CALL_LOG: { value: path.join(directory, 'calls.jsonl') } }
  } };
  const now = Date.now();
  const payload = { version: 2, target_sha256: targetDigest(target), receipt_id: crypto.randomUUID(), nonce: crypto.randomUUID(), request_sha256: requestDigest(request),
    policy_sha256: digest(policy), actor: 'test-operator', provider: 'fixture', resource_scope: '/fixture',
    issued_at: new Date(now).toISOString(), expires_at: new Date(now + 60000).toISOString() };
  const receipt = signReceipt(payload, privateKey);
  const options = { publicKey, directory, request, policy, target, actor: payload.actor, provider: payload.provider, resourceScope: payload.resource_scope, now };
  return { directory, guards, extras, publicKey, privateKey, request, policy, target, now, payload, receipt, options };
}

test('Ed25519 receipt is consumed once and replay is denied', t => {
  const f = fixture(t);
  assert.equal(consumeReceipt(f.receipt, f.options), true);
  assert.equal(consumeReceipt(f.receipt, f.options), false);
});
test('client correlation fields do not change the approved semantic request', t => {
  const f = fixture(t);
  for (const meta of [
    { progressToken: 2, 'claudecode/toolUseId': 'toolu_first' },
    { progressToken: 'later-progress', 'claudecode/toolUseId': 'toolu_second' }
  ]) assert.equal(requestDigest({ ...f.request, params: { ...f.request.params, _meta: meta } }), requestDigest(f.request));
  assert.equal(consumeReceipt(f.receipt, { ...f.options, request: { ...f.request,
    params: { ...f.request.params, _meta: { progressToken: 2, tenant: 'other' } } } }), false);
  assert.deepEqual(fs.readdirSync(f.directory), []);
  assert.equal(consumeReceipt(f.receipt, { ...f.options, request: { ...f.request,
    params: { ...f.request.params, _meta: { progressToken: 3, 'claudecode/toolUseId': 'toolu_actual' } } } }), true);
});
test('malformed client correlation metadata fails before receipt consumption', t => {
  const f = fixture(t);
  for (const meta of [null, [], { progressToken: {} }, { progressToken: Infinity }, { 'claudecode/toolUseId': 3 }, { 'claudecode/toolUseId': 'x'.repeat(513) }]) {
    const request = { ...f.request, params: { ...f.request.params, _meta: meta } };
    assert.throws(() => requestDigest(request), /metadata/i);
    assert.equal(consumeReceipt(f.receipt, { ...f.options, request }), false);
  }
  assert.deepEqual(fs.readdirSync(f.directory), []);
});
test('approval for server A cannot authorize server B or another launch configuration', t => {
  const f = fixture(t);
  const target = f.target;
  const options = { ...f.options, target };
  for (const other of [
    { ...target, server: 'server-b' },
    { ...target, installation: 'other-install' },
    { ...target, launch: { ...target.launch, args: ['other-server.js'] } },
    { ...target, launch: { ...target.launch, cwd: path.dirname(f.directory) } },
    { ...target, launch: { ...target.launch, environment: { ACCOUNT: { value: 'other' } } } }
  ]) assert.equal(consumeReceipt(f.receipt, { ...options, target: other }), false);
  assert.deepEqual(fs.readdirSync(f.directory), []);
  assert.equal(consumeReceipt(f.receipt, options), true);
});
test('the real guard rejects a command that differs from its trusted target before launch', t => {
  const f = fixture(t);
  const target = { version: 1, installation: 'fixture-install', server: 'server-a', launch: {
    command: process.execPath, args: ['reviewed.js'], cwd: f.directory, environment: {}
  } };
  assert.throws(() => runGuard({ command: process.execPath, args: ['unreviewed.js'], policy: f.policy, target }), /target/i);
  assert.throws(() => runGuard({ command: '/different/node', args: ['reviewed.js'], policy: f.policy, target }), /target/i);
});
test('guard CLI rejects a substituted launch before the upstream executes', t => {
  const f = fixture(t), marker = path.join(f.directory, 'unreviewed-upstream-ran');
  const files = { policy: f.policy, target: f.target, receipt: f.receipt };
  for (const [name, value] of Object.entries(files)) fs.writeFileSync(path.join(f.directory, name + '.json'), JSON.stringify(value));
  fs.writeFileSync(path.join(f.directory, 'public.pem'), f.publicKey);
  const result = spawnSync(process.execPath, [path.resolve('src/safety-guard.js'), '--policy', path.join(f.directory, 'policy.json'),
    '--target', path.join(f.directory, 'target.json'), '--public-key', path.join(f.directory, 'public.pem'),
    '--receipt-dir', f.directory, '--receipt-file', path.join(f.directory, 'receipt.json'), '--actor', f.payload.actor,
    '--provider', f.payload.provider, '--', process.execPath, '-e', `require('node:fs').writeFileSync(${JSON.stringify(marker)},'ran')`],
  { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  assert.equal(fs.existsSync(marker), false);
  assert.match(result.stderr, /no upstream started/);
  assert.equal(fs.readdirSync(f.directory).filter(name => /^[0-9a-f]{64}$/.test(name)).length, 0);
});
test('unbound v1 receipts are rejected without consuming their nonce', t => {
  const f = fixture(t);
  const { target_sha256, ...unbound } = f.payload;
  unbound.version = 1;
  // Sign the old format directly to prove rejection is independent of our signer.
  const { canonical } = require('../src/safety-policy.js');
  const old = { payload: unbound, signature: crypto.sign(null, Buffer.from(canonical(unbound)), f.privateKey).toString('base64') };
  assert.equal(consumeReceipt(old, f.options), false);
  assert.deepEqual(fs.readdirSync(f.directory), []);
  assert.equal(consumeReceipt(f.receipt, f.options), true);
});
test('target-bound launch pins cwd and environment without recording resolved secrets', { timeout: 5000 }, async t => {
  const f = fixture(t);
  const code = 'process.stdout.write(JSON.stringify({jsonrpc:"2.0",id:"init",result:{cwd:process.cwd(),literal:process.env.ACCOUNT,secret:process.env.API_KEY,ambient:process.env.AMBIENT_CANARY??null}})+"\\n");setInterval(()=>{},1000);';
  const target = { ...f.target, launch: { command: process.execPath, args: ['-e', code], cwd: f.directory,
    environment: { ACCOUNT: { value: 'reviewed-account' }, API_KEY: { secret_ref: 'OPERATOR_KEY' } } } };
  const input = new PassThrough(), output = new PassThrough(), diagnostics = new PassThrough();
  const result = new Promise(resolve => readFrames(output, resolve, () => assert.fail('invalid frame')));
  const guard = runGuard({ command: process.execPath, args: ['-e', code], policy: f.policy, target,
    input, output, diagnostics, env: { ...process.env, ACCOUNT: 'unreviewed-account', OPERATOR_KEY: 'FAKE_TEST_SECRET', AMBIENT_CANARY: 'untrusted' } });
  f.guards.push(guard);
  input.write('{"jsonrpc":"2.0","id":"init","method":"initialize"}\n');
  assert.deepEqual((await result).result, { cwd: f.directory, literal: 'reviewed-account', secret: 'FAKE_TEST_SECRET', ambient: null });
  assert.doesNotMatch(JSON.stringify(target), /FAKE_TEST_SECRET/);
  assert.throws(() => runGuard({ command: process.execPath, args: ['-e', code], policy: f.policy, target, env: {} }), /environment unavailable/i);
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
  fs.symlinkSync(f.directory, alias, process.platform === 'win32' ? 'junction' : 'dir');
  f.extras.push(() => fs.rmSync(alias, { recursive: true, force: true }));
  assert.equal(consumeReceipt(f.receipt, { ...f.options, directory: alias }), false);
  if (process.platform !== 'win32') { fs.chmodSync(f.directory, 0o755); assert.equal(consumeReceipt(f.receipt, f.options), false); }
});
test('competing processes can consume one nonce only once', { timeout: 5000 }, async t => {
  const f = fixture(t);
  const modulePath = require.resolve('../src/approval-receipts.js');
  const inputFile = path.join(os.tmpdir(), `agenthaus-consume-${crypto.randomUUID()}.json`);
  fs.writeFileSync(inputFile, JSON.stringify({ receipt: f.receipt, options: f.options }));
  f.extras.push(() => fs.rmSync(inputFile, { force: true }));
  const code = 'const fs=require("node:fs");const {consumeReceipt}=require(process.argv[1]);const d=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));console.log(consumeReceipt(d.receipt,d.options));';
  const consume = () => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', code, modulePath, inputFile], { stdio: ['ignore', 'pipe', 'pipe'] }); let out = '';
    f.extras.push(() => { try { child.kill(); } catch {} });
    child.stdout.on('data', b => { out += b; }); child.on('error', reject); child.on('exit', c => c === 0 ? resolve(out.trim()) : reject(new Error('consumer failed')));
  });
  assert.deepEqual((await Promise.all([consume(), consume()])).sort(), ['false', 'true']);
});
test('signed authorization is wired to the proxy; replay never reaches upstream', { timeout: 5000 }, async t => {
  const f = fixture(t), receiptFile = path.join(f.directory, 'receipt.json'), log = path.join(f.directory, 'calls.jsonl');
  fs.writeFileSync(receiptFile, JSON.stringify(f.receipt));
  // Server B exposes the identical tool/args and shares the receipt store and key.
  const targetB = { ...f.target, server: 'server-b' };
  const inputB = new PassThrough(), outputB = new PassThrough(), stderrB = new PassThrough(), waitersB = new Map();
  const guardB = runGuard({ command: f.target.launch.command, args: f.target.launch.args, policy: f.policy, target: targetB,
    input: inputB, output: outputB, diagnostics: stderrB, authorize: createAuthorizer({ ...f.options, target: targetB, receiptFile }) });
  f.guards.push(guardB);
  readFrames(outputB, m => { waitersB.get(m.id)?.(m); waitersB.delete(m.id); }, () => assert.fail('invalid output'));
  const requestB = m => new Promise(resolve => { waitersB.set(m.id, resolve); inputB.write(JSON.stringify(m) + '\n'); });
  await requestB({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } });
  inputB.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
  assert.equal((await requestB(f.request)).error.code, -32003);
  assert.equal(fs.readdirSync(f.directory).filter(name => /^[0-9a-f]{64}$/.test(name)).length, 0);
  const input = new PassThrough(), output = new PassThrough(), stderr = new PassThrough(), waiters = new Map();
  const authorizer = createAuthorizer({ ...f.options, receiptFile });
  const guard = runGuard({ command: process.execPath, args: [path.join(__dirname, 'fixtures/mcp-upstream.js')], policy: f.policy,
    input, output, diagnostics: stderr, env: { ...process.env, CALL_LOG: log }, target: f.target, authorize: authorizer });
  f.guards.push(guard);
  readFrames(output, m => { if (waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id); } }, () => assert.fail('invalid output'));
  const request = m => new Promise(resolve => { waiters.set(m.id, resolve); input.write(JSON.stringify(m) + '\n'); });
  await request({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } });
  input.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
  const correlated = { ...f.request, params: { ...f.request.params, _meta: { progressToken: 2, 'claudecode/toolUseId': 'toolu_actual' } } };
  assert.ok((await request(correlated)).result);
  assert.equal((await request({ ...f.request, id: 8 })).error.code, -32003);
  assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse).filter(m => m.method === 'tools/call').length, 1);
  const forwarded = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse).find(m => m.method === 'tools/call');
  assert.deepEqual(forwarded.params, f.request.params);
});
