'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const provider = require('../src/providers/antigravity.js');

test('Gemini and Antigravity resolve cached plugin roots before storing MCP configuration', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-gemini-root-'));
  const previousState = process.env.AGENTHAUS_STATE_FILE;
  process.env.AGENTHAUS_STATE_FILE = path.join(dir, 'ownership.json');
  t.after(() => {
    if (previousState === undefined) delete process.env.AGENTHAUS_STATE_FILE;
    else process.env.AGENTHAUS_STATE_FILE = previousState;
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const source = path.join(dir, 'source', 'outscraper');
  const target = path.join(dir, 'project', '.gemini', 'extensions');
  const installed = path.join(target, 'outscraper');
  fs.mkdirSync(path.join(source, '.claude-plugin'), { recursive: true });
  fs.mkdirSync(installed, { recursive: true });
  fs.mkdirSync(path.join(dir, 'project', '.agents'), { recursive: true });
  fs.writeFileSync(path.join(source, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'outscraper', version: '1.0.0' }));
  fs.writeFileSync(path.join(source, 'gemini-settings-snippet.json'), JSON.stringify({ mcpServers: {
    outscraper: { command: 'node', args: ['${CLAUDE_PLUGIN_ROOT}/node_modules/@outscraper/mcp-server/dist/index.js'], cwd: '${CLAUDE_PLUGIN_ROOT}', env: { OUTSCRAPER_API_KEY: '${OUTSCRAPER_API_KEY}' } }
  } }));
  provider.postInstall(source, target);
  for (const file of [path.join(dir, 'project', '.gemini', 'settings.json'), path.join(dir, 'project', '.agents', 'mcp_config.json')]) {
    const entry = JSON.parse(fs.readFileSync(file, 'utf8')).mcpServers.outscraper;
    assert.equal(entry.args[0], path.join(installed, 'node_modules', '@outscraper', 'mcp-server', 'dist', 'index.js'));
    assert.equal(entry.cwd, installed);
    assert.equal(entry.env.OUTSCRAPER_API_KEY, '${OUTSCRAPER_API_KEY}');
  }
  assert.equal(provider.isMcpInSync(source, target), true);
});
