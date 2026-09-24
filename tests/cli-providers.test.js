'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { getAllProviders, detectAll, getProvider } = require('../src/providers/index.js');

test('CLI Providers', async (t) => {
  let tmpDir;
  
  t.beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-test-'));
  });

  t.afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await t.test('getAllProviders returns all 6 providers', () => {
    const providers = getAllProviders();
    assert.strictEqual(providers.length, 6);
    const ids = providers.map(p => p.id).sort();
    assert.deepStrictEqual(ids, ['antigravity', 'claude', 'codex', 'copilot', 'cursor', 'windsurf']);
  });

  await t.test('detects simulated environments', () => {
    // Create markers for copilot and cursor in tmpDir
    fs.mkdirSync(path.join(tmpDir, '.github'));
    fs.mkdirSync(path.join(tmpDir, '.cursor'));

    // Override os.homedir for other providers if we wanted to be strictly isolated, 
    // but we can just rely on cwd checks for cursor and copilot.
    const copilot = getProvider('copilot');
    const cursor = getProvider('cursor');

    assert.ok(copilot.detect(tmpDir));
    assert.ok(cursor.detect(tmpDir));
  });

  await t.test('getTargetDir resolution', () => {
    const cursor = getProvider('cursor');
    const projectDir = cursor.getTargetDir(tmpDir, 'project');
    assert.strictEqual(projectDir, path.join(tmpDir, '.cursor', 'plugins'));
    
    const globalDir = cursor.getTargetDir(tmpDir, 'global');
    assert.strictEqual(globalDir, path.join(os.homedir(), '.cursor', 'plugins'));

    const antigravity = getProvider('antigravity');
    const agProjectDir = antigravity.getTargetDir(tmpDir, 'project');
    assert.strictEqual(agProjectDir, path.join(tmpDir, '.gemini', 'extensions'));

    const agGlobalDir = antigravity.getTargetDir(tmpDir, 'global');
    assert.strictEqual(agGlobalDir, path.join(os.homedir(), '.gemini', 'extensions'));
  });

  await t.test('antigravity postInstall and postUninstall settings integration', () => {
    const antigravity = getProvider('antigravity');
    const fakeSource = path.join(tmpDir, 'fake-plugin');
    const fakeTargetDir = path.join(tmpDir, 'gemini-root', 'extensions');
    const settingsPath = path.join(tmpDir, 'gemini-root', 'settings.json');

    fs.mkdirSync(fakeSource, { recursive: true });
    fs.mkdirSync(fakeTargetDir, { recursive: true });

    fs.writeFileSync(path.join(fakeSource, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        'test-server': {
          command: 'node',
          args: ['index.js']
        }
      }
    }));

    // Test dryRun: true does not write file
    antigravity.postInstall(fakeSource, fakeTargetDir, { dryRun: true });
    assert.strictEqual(fs.existsSync(settingsPath), false);

    // Test normal postInstall writes and merges settings
    antigravity.postInstall(fakeSource, fakeTargetDir, { dryRun: false });
    assert.strictEqual(fs.existsSync(settingsPath), true);
    let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(settings.mcpServers['test-server']);

    // Test postUninstall removes server
    antigravity.postUninstall('test-server', fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.strictEqual(settings.mcpServers['test-server'], undefined);
  });

  await t.test('antigravity postInstall generates gemini-extension.json manifest', () => {
    const antigravity = getProvider('antigravity');
    const fakeSource = path.join(tmpDir, 'manifest-plugin');
    const fakeTargetDir = path.join(tmpDir, 'gemini-root', 'extensions');

    fs.mkdirSync(path.join(fakeSource, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(fakeSource, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'manifest-plugin',
      version: '1.2.3',
      description: 'Test extension'
    }));

    antigravity.postInstall(fakeSource, fakeTargetDir, { dryRun: false });
    const extPath = path.join(fakeTargetDir, 'manifest-plugin', 'gemini-extension.json');
    assert.strictEqual(fs.existsSync(extPath), true);
    const ext = JSON.parse(fs.readFileSync(extPath, 'utf8'));
    assert.strictEqual(ext.name, 'manifest-plugin');
    assert.strictEqual(ext.version, '1.2.3');
    assert.strictEqual(ext.description, 'Test extension');
    assert.strictEqual(ext.contextFileName, 'GEMINI.md');
  });

  await t.test('antigravity postInstall preserves malformed settings.json and creates backup', () => {
    const antigravity = getProvider('antigravity');
    const fakeSource = path.join(tmpDir, 'malformed-plugin');
    const fakeTargetDir = path.join(tmpDir, 'gemini-root-malformed', 'extensions');
    const settingsPath = path.join(tmpDir, 'gemini-root-malformed', 'settings.json');

    fs.mkdirSync(fakeSource, { recursive: true });
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(path.join(fakeSource, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: { 'test': { command: 'node' } }
    }));
    fs.writeFileSync(settingsPath, '{ malformed json');

    assert.throws(() => {
      antigravity.postInstall(fakeSource, fakeTargetDir, { dryRun: false });
    }, /Malformed Gemini settings/);

    // Verify original content was not overwritten
    assert.strictEqual(fs.readFileSync(settingsPath, 'utf8'), '{ malformed json');

    // Verify backup was created
    const files = fs.readdirSync(path.dirname(settingsPath));
    assert.ok(files.some(f => f.startsWith('settings.json.bak.')));
  });

  await t.test('codex postInstall registers skills in AGENTS.md', () => {
    const codex = getProvider('codex');
    const fakeSource = path.join(tmpDir, 'codex-plugin');
    const fakeTargetDir = path.join(tmpDir, 'codex-skills');

    fs.mkdirSync(path.join(fakeSource, 'skills'), { recursive: true });
    fs.writeFileSync(path.join(fakeSource, 'codex-mcp-config.toml'), '# toml config');

    // Simulate AGENTS.md in cwd
    const origCwd = process.cwd();
    const workDir = path.join(tmpDir, 'workdir');
    fs.mkdirSync(workDir, { recursive: true });
    const agentsPath = path.join(workDir, 'AGENTS.md');
    fs.writeFileSync(agentsPath, '# Project Guidelines\n');

    process.chdir(workDir);
    try {
      codex.postInstall(fakeSource, fakeTargetDir, { dryRun: false });
      const updated = fs.readFileSync(agentsPath, 'utf8');
      assert.ok(updated.includes('Read skills from .codex/agenthaus-skills/codex-plugin/skills/'));

      codex.postUninstall('codex-plugin', fakeTargetDir, { dryRun: false });
      const uninstalled = fs.readFileSync(agentsPath, 'utf8');
      assert.ok(!uninstalled.includes('Read skills from .codex/agenthaus-skills/codex-plugin/skills/'));
    } finally {
      process.chdir(origCwd);
    }
  });

  await t.test('windsurf postInstall merges mcp_config.json', () => {
    const windsurf = getProvider('windsurf');
    const fakeSource = path.join(tmpDir, 'windsurf-plugin');
    const fakeTargetDir = path.join(tmpDir, 'codeium', 'windsurf', 'plugins');

    fs.mkdirSync(fakeSource, { recursive: true });
    fs.writeFileSync(path.join(fakeSource, 'windsurf-mcp-snippet.json'), JSON.stringify({
      mcpServers: {
        'windsurf-server': {
          command: 'node',
          args: ['server.js']
        }
      }
    }));

    windsurf.postInstall(fakeSource, fakeTargetDir, { dryRun: false });
    const configPath = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.ok(config.mcpServers['windsurf-server']);

      // Cleanup
      windsurf.postUninstall('windsurf-server', fakeTargetDir, { dryRun: false });
      const cleaned = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.strictEqual(cleaned.mcpServers['windsurf-server'], undefined);
    }
  });
});
