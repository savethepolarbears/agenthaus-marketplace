'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const generator = require('../scripts/generate-cross-platform.js');
const { readFrames } = require('../src/safety-guard.js');
const crypto = require('node:crypto');
const { signReceipt, requestDigest, targetDigest } = require('../src/approval-receipts.js');
const { digest } = require('../src/safety-policy.js');

test('opt-in wiring preserves names/env and leaves native rendering unchanged', () => {
  const p = generator.loadPlugin(path.resolve('plugins/devops-flow'), 'devops-flow');
  const before = generator.renderCursorMcp(p);
  const result = generator.guardPlugin(p, { guardPath: path.resolve('src/safety-guard.js'), policyFile: '/operator/policy.json' });
  assert.equal(generator.renderCursorMcp(p), before);
  assert.deepEqual(Object.keys(result.plugin.mcpServers), Object.keys(p.mcpServers));
  for (const [name, original] of Object.entries(p.mcpServers)) {
    assert.equal(result.plugin.mcpServers[name].command, process.execPath);
    for (const [key, value] of Object.entries(original.env || {})) assert.equal(result.plugin.mcpServers[name].env[key], value);
    assert.equal(result.plugin.mcpServers[name].env.NODE_OPTIONS, '');
    assert.deepEqual(result.plugin.mcpServers[name].args.slice(3), ['--', original.command, ...original.args]);
  }
  for (const render of [generator.renderClaudeDesktop, generator.renderCursorMcp, generator.renderGeminiSettingsSnippet, generator.renderWindsurfMcp, generator.renderCodexToml]) {
    assert.match(render(result.plugin), /safety-guard\.js/);
  }
});
test('remote transports and incomplete approval configuration never produce a partial route', () => {
  const options = { guardPath: '/runtime/guard.js', policyFile: '/operator/policy.json' };
  assert.throws(() => generator.guardPlugin({ mcpServers: { remote: { url: 'https://example.org/mcp' } } }, options));
  assert.throws(() => generator.guardPlugin({ mcpServers: { local: { command: 'node' } } }, { ...options, approval: { actor: 'test' } }));
  assert.throws(() => generator.guardPlugin({ mcpServers: {} }, { ...options, policyFile: '../policy' }));
});
test('approval wiring selects a separate trusted target file for every server', t => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'target-selection-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const name of ['a', 'b']) fs.writeFileSync(path.join(dir, `target-${name}.json`), JSON.stringify({
    version: 1, installation: 'fixture', server: name, launch: { command: '/usr/bin/node', args: [`${name}.js`], cwd: dir, environment: {} }
  }));
  const plugin = { mcpServers: { a: { command: '/usr/bin/node', args: ['a.js'] }, b: { command: '/usr/bin/node', args: ['b.js'] } } };
  const options = { guardPath: '/runtime/guard.js', policyFile: '/operator/policy.json', approval: {
    'public-key': '/operator/public.pem', 'receipt-dir': '/operator/used', 'receipt-file': '/operator/receipt.json', actor: 'operator', provider: 'cursor',
    'target-files': { a: path.join(dir, 'target-a.json'), b: path.join(dir, 'target-b.json') }
  } };
  const result = generator.guardPlugin(plugin, options);
  for (const name of ['a', 'b']) {
    const args = result.plugin.mcpServers[name].args;
    assert.equal(args[args.indexOf('--target') + 1], path.join(dir, `target-${name}.json`));
  }
  delete options.approval['target-files'].b;
  assert.throws(() => generator.guardPlugin(plugin, options), /per-server target/i);
});
test('generated Cursor route executes the real guard before upstream', { timeout: 5000 }, async t => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'guard-wiring-')));
  let child;
  t.after(() => { try { child?.kill(); } catch {} fs.rmSync(dir, { recursive: true, force: true }); });
  const policyFile = path.join(dir, 'policy.json'), log = path.join(dir, 'calls.jsonl');
  fs.writeFileSync(policyFile, JSON.stringify({ version: 1, rules: [{ id: 'read', tool: 'read', action: 'allow-read' }] }));
  const p = { name: 'fixture', hasMcp: true, manifest: { version: '1.0.0' }, mcpServers: {
    fixture: { command: process.execPath, args: [path.resolve('tests/fixtures/mcp-upstream.js')], env: { CALL_LOG: log } }
  } };
  const { plugin } = generator.guardPlugin(p, { guardPath: path.resolve('src/safety-guard.js'), policyFile });
  const config = JSON.parse(generator.renderCursorMcp(plugin));
  const server = config.mcpServers.fixture;
  fs.writeFileSync(path.join(dir, 'mcp.json'), JSON.stringify(config));
  child = spawn(server.command, server.args, { env: { ...process.env, ...server.env }, stdio: ['pipe', 'pipe', 'pipe'], shell: false });
  const waiting = new Map();
  readFrames(child.stdout, m => { waiting.get(m.id)?.(m); waiting.delete(m.id); }, () => {});
  const send = m => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
  const request = (id, method, params) => new Promise(resolve => { waiting.set(id, resolve); send({ id, method, ...(params ? { params } : {}) }); });
  assert.ok((await request(1, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } })).result);
  send({ method: 'notifications/initialized' });
  assert.ok((await request(2, 'tools/call', { name: 'read' })).result);
  assert.equal((await request(3, 'tools/call', { name: 'delete' })).error.code, -32003);
  const exit = once(child, 'exit'); child.stdin.end(); await exit;
  const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(calls.filter(m => m.method === 'tools/call').length, 1);
});
test('operator broker refuses noninteractive execution without writing a receipt', () => {
  const result = spawnSync(process.execPath, [path.resolve('scripts/approve-guard-request.js')], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no authorization issued/);
  assert.equal(result.stdout, '');
});
test('a bare-node approval route pins the reviewed executable and prevents outer Node preloads', { timeout: 5000 }, async t => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'approval-wiring-')));
  let child;
  t.after(() => { try { child?.kill(); } catch {} fs.rmSync(dir, { recursive: true, force: true }); });
  const log = path.join(dir, 'calls.jsonl'), marker = path.join(dir, 'preload-executed'), preload = path.join(dir, 'preload.cjs');
  fs.writeFileSync(preload, `require('node:fs').writeFileSync(${JSON.stringify(marker)},'ran');`);
  const upstreamArgs = [path.resolve('tests/fixtures/mcp-upstream.js')];
  const target = { version: 1, installation: 'test-install', server: 'fixture', launch: {
    command: process.execPath, args: upstreamArgs, cwd: dir, environment: { CALL_LOG: { value: log } }
  } };
  const policy = { version: 1, rules: [{ id: 'write', tool: 'delete', action: 'require-approval' }] };
  const request = { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'delete', arguments: {} } };
  const keys = crypto.generateKeyPairSync('ed25519'), now = Date.now();
  const receipt = signReceipt({ version: 2, receipt_id: crypto.randomUUID(), nonce: crypto.randomUUID(), request_sha256: requestDigest(request),
    policy_sha256: digest(policy), target_sha256: targetDigest(target), actor: 'operator', provider: 'cursor', resource_scope: 'unspecified',
    issued_at: new Date(now).toISOString(), expires_at: new Date(now + 60000).toISOString() }, keys.privateKey.export({ type: 'pkcs8', format: 'pem' }));
  for (const [name, value] of Object.entries({ target, policy, receipt })) fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(value));
  fs.writeFileSync(path.join(dir, 'public.pem'), keys.publicKey.export({ type: 'spki', format: 'pem' }));
  const plugin = { name: 'fixture', hasMcp: true, manifest: { version: '1.0.0' }, mcpServers: {
    fixture: { command: 'node', args: upstreamArgs, env: { NODE_OPTIONS: `--require ${preload}` } }
  } };
  const options = { guardPath: path.resolve('src/safety-guard.js'), policyFile: path.join(dir, 'policy.json'), approval: {
    'public-key': path.join(dir, 'public.pem'), 'receipt-dir': dir, 'receipt-file': path.join(dir, 'receipt.json'), actor: 'operator', provider: 'cursor',
    'target-files': { fixture: path.join(dir, 'target.json') }
  } };
  const guarded = generator.guardPlugin(plugin, options).plugin;
  const server = JSON.parse(generator.renderCursorMcp(guarded)).mcpServers.fixture;
  assert.equal(server.args[server.args.indexOf('--') + 1], process.execPath);
  child = spawn(server.command, server.args, { env: { ...process.env, NODE_OPTIONS: `--require ${preload}`, ...server.env }, stdio: ['pipe', 'pipe', 'pipe'] });
  const waiters = new Map();
  readFrames(child.stdout, m => { waiters.get(m.id)?.(m); waiters.delete(m.id); }, () => assert.fail('invalid output'));
  const send = m => child.stdin.write(JSON.stringify(m) + '\n');
  const call = m => new Promise(resolve => { waiters.set(m.id, resolve); send(m); });
  await call({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } });
  send({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.ok((await call(request)).result);
  assert.equal(fs.existsSync(marker), false);
  assert.equal(fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse).filter(m => m.method === 'tools/call').length, 1);
  const exit = once(child, 'exit'); child.stdin.end(); await exit;
  assert.throws(() => generator.guardPlugin({ ...plugin, mcpServers: { fixture: { command: 'python', args: upstreamArgs } } }, options), /target/i);
  assert.throws(() => generator.guardPlugin({ ...plugin, mcpServers: { fixture: { command: 'node', args: ['unreviewed.js'] } } }, options), /target/i);
});
