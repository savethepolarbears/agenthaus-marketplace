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

test('opt-in wiring preserves names/env and leaves native rendering unchanged', () => {
  const p = generator.loadPlugin(path.resolve('plugins/devops-flow'), 'devops-flow');
  const before = generator.renderCursorMcp(p);
  const result = generator.guardPlugin(p, { guardPath: path.resolve('src/safety-guard.js'), policyFile: '/operator/policy.json' });
  assert.equal(generator.renderCursorMcp(p), before);
  assert.deepEqual(Object.keys(result.plugin.mcpServers), Object.keys(p.mcpServers));
  for (const [name, original] of Object.entries(p.mcpServers)) {
    assert.equal(result.plugin.mcpServers[name].command, process.execPath);
    assert.deepEqual(result.plugin.mcpServers[name].env, original.env);
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
test('generated Cursor route executes the real guard before upstream', { timeout: 5000 }, async t => {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'guard-wiring-')));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const policyFile = path.join(dir, 'policy.json'), log = path.join(dir, 'calls.jsonl');
  fs.writeFileSync(policyFile, JSON.stringify({ version: 1, rules: [{ id: 'read', tool: 'read', action: 'allow-read' }] }));
  const p = { name: 'fixture', hasMcp: true, manifest: { version: '1.0.0' }, mcpServers: {
    fixture: { command: process.execPath, args: [path.resolve('tests/fixtures/mcp-upstream.js')], env: { CALL_LOG: log } }
  } };
  const { plugin } = generator.guardPlugin(p, { guardPath: path.resolve('src/safety-guard.js'), policyFile });
  const config = JSON.parse(generator.renderCursorMcp(plugin));
  const server = config.mcpServers.fixture;
  fs.writeFileSync(path.join(dir, 'mcp.json'), JSON.stringify(config));
  const child = spawn(server.command, server.args, { env: { ...process.env, ...server.env }, stdio: ['pipe', 'pipe', 'pipe'], shell: false });
  t.after(() => child.kill());
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
