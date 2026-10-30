'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const { once } = require('node:events');
const { runGuard, readFrames, MAX_FRAME } = require('../src/safety-guard.js');
const { evaluate, validatePolicy } = require('../src/safety-policy.js');

function harness(t, options = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-guard-'));
  const log = path.join(dir, 'calls.jsonl');
  const input = new PassThrough(), output = new PassThrough(), diagnostics = new PassThrough();
  const messages = [], waiters = new Map(); let stderr = '', outputText = '';
  diagnostics.on('data', b => { stderr += b; });
  output.on('data', b => { outputText += b; });
  readFrames(output, m => { messages.push(m); if (waiters.has(m.id)) { waiters.get(m.id)(m); waiters.delete(m.id); } }, () => {});
  const guard = runGuard({ command: process.execPath, args: [path.join(__dirname, 'fixtures/mcp-upstream.js')],
    policy: { version: 1, rules: [{ id: 'read', tool: 'read', action: 'allow-read' }] },
    input, output, diagnostics, env: { ...process.env, CALL_LOG: log }, ...options });
  t.after(async () => {
    if (guard.child.exitCode === null && guard.child.signalCode === null) { const exit = once(guard.child, 'exit'); guard.stop('Test cleanup'); await exit; }
    input.destroy(); output.destroy(); diagnostics.destroy(); fs.rmSync(dir, { recursive: true, force: true });
  });
  function send(m) { input.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n'); }
  function request(id, method, params) {
    return new Promise(resolve => { waiters.set(id, resolve); send({ id, method, ...(params ? { params } : {}) }); });
  }
  return { guard, input, messages, request, send, stderr: () => stderr, outputText: () => outputText,
    calls: () => fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [],
    async init() { await request('init', 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } }); send({ method: 'notifications/initialized' }); } };
}

test('MCP initialize/list/read tracer and deny-before-forwarding', { timeout: 5000 }, async t => {
  const h = harness(t); await h.init();
  assert.equal((await h.request(1, 'tools/list')).result.tools[0].name, 'read');
  assert.ok((await h.request(2, 'tools/call', { name: 'read' })).result);
  assert.equal((await h.request(3, 'tools/call', { name: 'delete', arguments: { dry_run: true } })).error.code, -32003);
  assert.equal(h.calls().filter(m => m.method === 'tools/call').length, 1);
});
test('unknown methods and pre-initialization calls never reach upstream', { timeout: 5000 }, async t => {
  const h = harness(t);
  assert.equal((await h.request(1, 'tools/call', { name: 'read' })).error.code, -32000);
  await h.init(); assert.equal((await h.request(2, 'arbitrary/mutate')).error.code, -32601);
  assert.equal(h.calls().filter(m => m.method === 'arbitrary/mutate' || m.method === 'tools/call').length, 0);
});
test('policy rejects unbounded regex and ambiguous matches', () => {
  assert.throws(() => validatePolicy({ version: 1, rules: [{ id: 'x', tool: '(a+)+$', action: 'allow-read' }] }));
  assert.throws(() => validatePolicy({ version: 1, rules: [], bypass: true }));
  const policy = { version: 1, rules: [{ id: 'x', tool: '*', action: 'allow-read' }, { id: 'y', tool: 'read', action: 'allow-read' }] };
  assert.equal(evaluate(policy, { name: 'read' }).action, 'deny');
  assert.equal(evaluate({ version: 1, rules: [] }, { name: 'read' }).action, 'deny');
  assert.equal(evaluate(policy, { name: 'read', arguments: [] }).action, 'deny');
});
test('approval unavailable, rejected or throwing blocks', { timeout: 5000 }, async t => {
  const h = harness(t, { policy: { version: 1, rules: [{ id: 'write', tool: '*', action: 'require-approval' }] }, authorize: () => { throw new Error('CANARY_SECRET'); } });
  await h.init(); assert.equal((await h.request(1, 'tools/call', { name: 'delete' })).error.code, -32003);
  assert.equal(h.calls().filter(m => m.method === 'tools/call').length, 0);
  assert.equal(h.outputText().includes('CANARY_SECRET'), false);
});
test('malformed metadata never reaches approval or upstream and leaves the guard usable', { timeout: 5000 }, async t => {
  let approvals = 0;
  const h = harness(t, { policy: { version: 1, rules: [{ id: 'write', tool: '*', action: 'require-approval' }] },
    authorize: () => { approvals++; return true; } });
  await h.init();
  let id = 0;
  for (const meta of [null, [], { progressToken: {} }, { progressToken: true }, { 'claudecode/toolUseId': 3 }, { 'claudecode/toolUseId': 'x'.repeat(513) }]) {
    assert.equal((await h.request(id++, 'tools/call', { name: 'delete', _meta: meta })).error?.code, -32602);
  }
  await h.request('still-usable', 'ping');
  assert.equal(approvals, 0);
  assert.equal(h.calls().filter(m => m.method === 'tools/call').length, 0);
});
test('read tool forwarding discards only correlation metadata and retains semantic metadata', { timeout: 5000 }, async t => {
  const h = harness(t); await h.init();
  await h.request(1, 'tools/call', { name: 'read', _meta: { progressToken: 1, 'claudecode/toolUseId': 'toolu_read', tenant: 'retained' } });
  assert.deepEqual(h.calls().find(m => m.method === 'tools/call').params._meta, { tenant: 'retained' });
});
test('upstream error code and request ID survive without stderr/secret leakage', { timeout: 5000 }, async t => {
  const h = harness(t, { policy: { version: 1, rules: [{ id: 'x', tool: 'error', action: 'allow-read' }] } });
  await h.init(); const response = await h.request('error-id', 'tools/call', { name: 'error' });
  assert.equal(response.id, 'error-id'); assert.equal(response.error.code, -32042);
  assert.equal(h.outputText().includes('CANARY_SECRET'), false); assert.equal(h.stderr().includes('CANARY_SECRET'), false);
});
test('timeout kills upstream and produces a bounded protocol error', { timeout: 5000 }, async t => {
  const h = harness(t, { timeoutMs: 500, policy: { version: 1, rules: [{ id: 'x', tool: 'hang', action: 'allow-read' }] } });
  await h.init(); const exit = once(h.guard.child, 'exit');
  assert.equal((await h.request(1, 'tools/call', { name: 'hang' })).error.code, -32001); await exit;
});
test('a stalled upstream cannot accumulate unbounded notification input', { timeout: 5000 }, async t => {
  // This real child initializes but never reads stdin, so its pipe fills reliably.
  const code = 'process.stdout.write(JSON.stringify({jsonrpc:"2.0",id:"init",result:{}})+"\\n");setInterval(()=>{},1000);';
  const h = harness(t, { args: ['-e', code] });
  await h.init();
  const exit = once(h.guard.child, 'exit');
  const params = { progressToken: 'fixture', progress: 1, message: 'x'.repeat(900000) };
  for (let i = 0; i < 8; i++) h.send({ method: 'notifications/progress', params });
  assert.ok(h.guard.child.stdin.writableLength <= 4 * MAX_FRAME);
  await exit;
  assert.match(h.stderr(), /Upstream input limit exceeded/);
});
test('duplicate in-flight IDs close the connection instead of forwarding twice', { timeout: 5000 }, async t => {
  const h = harness(t, { policy: { version: 1, rules: [{ id: 'x', tool: 'hang', action: 'allow-read' }] } });
  await h.init(); const exit = once(h.guard.child, 'exit');
  h.send({ id: 4, method: 'tools/call', params: { name: 'hang' } });
  h.send({ id: 4, method: 'tools/call', params: { name: 'hang' } }); await exit;
  assert.ok(h.calls().filter(m => m.method === 'tools/call').length <= 1);
});
test('cancellation is forwarded and a late result cannot revive its pending ID', { timeout: 5000 }, async t => {
  const h = harness(t);
  await h.init(); h.send({ id: 4, method: 'tools/call', params: { name: 'read' } });
  h.send({ method: 'notifications/cancelled', params: { requestId: 4 } });
  await h.request(5, 'ping');
  assert.ok(h.calls().some(m => m.method === 'notifications/cancelled'));
  assert.ok(!h.messages.some(m => m.id === 4));
});
test('an upstream ignoring cancellation still reaches its request deadline', { timeout: 5000 }, async t => {
  const h = harness(t, { timeoutMs: 800, policy: { version: 1, rules: [{ id: 'x', tool: 'hang', action: 'allow-read' }] } });
  await h.init();
  const exit = once(h.guard.child, 'exit');
  h.send({ id: 4, method: 'tools/call', params: { name: 'hang' } });
  h.send({ method: 'notifications/cancelled', params: { requestId: 4 } });
  await exit;
  assert.match(h.stderr(), /Request timed out/);
  assert.ok(h.calls().some(m => m.method === 'notifications/cancelled'));
  assert.ok(!h.messages.some(m => m.id === 4));
});
test('cancelled operations retain concurrency slots until upstream completes', { timeout: 5000 }, async t => {
  const h = harness(t, { policy: { version: 1, rules: [{ id: 'x', tool: 'hang', action: 'allow-read' }] } });
  await h.init();
  for (let id = 0; id < 128; id++) {
    h.send({ id, method: 'tools/call', params: { name: 'hang' } });
    h.send({ method: 'notifications/cancelled', params: { requestId: id } });
  }
  const response = await h.request('overflow', 'ping');
  assert.equal(response.error.code, -32000);
  assert.equal(response.error.message, 'Too many requests');
  assert.ok(!h.calls().some(m => m.id === 'overflow'));
});
test('oversized, invalid UTF-8, malformed JSON and batched frames fail closed', () => {
  for (const bytes of [Buffer.alloc(MAX_FRAME + 1, 65), Buffer.from([0xff, 10]), Buffer.from('{bad}\n'), Buffer.from('[]\n')]) {
    const stream = new PassThrough(); let rejected = 0, accepted = 0;
    readFrames(stream, () => { accepted++; }, () => { rejected++; }); stream.write(bytes);
    assert.equal(rejected, 1); assert.equal(accepted, 0); stream.destroy();
  }
});
test('split Unicode frames are decoded correctly', () => {
  const stream = new PassThrough(), found = []; const bytes = Buffer.from('{"jsonrpc":"2.0","id":"🎯","method":"ping"}\n');
  readFrames(stream, m => found.push(m), () => assert.fail('valid fragmented frame rejected'));
  for (const b of bytes) stream.write(Buffer.from([b]));
  assert.equal(found[0].id, '🎯'); stream.destroy();
});
test('shell metacharacters are argv data; malformed policy starts no child', () => {
  assert.throws(() => runGuard({ command: process.execPath, policy: null }));
  assert.throws(() => runGuard({ command: 'node\0sh', policy: { version: 1, rules: [] } }));
});
test('upstream crash and malformed upstream output fail pending requests', { timeout: 5000 }, async t => {
  for (const name of ['crash', 'invalid']) {
    const h = harness(t, { policy: { version: 1, rules: [{ id: 'fixture', tool: name, action: 'allow-read' }] } });
    await h.init(); const exit = once(h.guard.child, 'exit');
    assert.equal((await h.request(name, 'tools/call', { name })).error.code, -32001); await exit;
  }
});
test('disconnect terminates the upstream and command arguments never invoke a shell', { timeout: 5000 }, async t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-argv-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const marker = path.join(dir, 'should-not-exist');
  const h = harness(t, { args: [path.join(__dirname, 'fixtures/mcp-upstream.js'), `; touch ${marker}`] });
  await h.init(); assert.equal(fs.existsSync(marker), false);
  const exit = once(h.guard.child, 'exit'); h.input.end(); await exit;
  assert.ok(h.stderr().includes('Client disconnected'));
});
