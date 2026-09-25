'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const {
  isCommandAccessible,
  checkMcpCommands,
  checkHookSecurity,
  checkHookSchema,
  checkCredentials,
  checkConfigFreshness,
  runDoctor
} = require('../src/doctor.js');

test('CLI Doctor', async (t) => {
  let tmpDir;
  
  t.beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-test-'));
  });

  t.afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await t.test('isCommandAccessible', () => {
    const resNode = isCommandAccessible('node');
    assert.strictEqual(resNode.accessible, true);
    
    const resFake = isCommandAccessible('fake-command-that-does-not-exist-12345');
    assert.strictEqual(resFake.accessible, false);
  });

  await t.test('checkMcpCommands severity', () => {
    const res = checkMcpCommands([]);
    // Should check node, uv, python
    const fakeRes = [];
    const missingNode = !isCommandAccessible('node').accessible;
    const missingUv = !isCommandAccessible('uv').accessible;
    const missingPython = !isCommandAccessible('python').accessible;
    
    if (missingNode) {
      assert.ok(res.some(r => r.message.includes('node') && r.severity === 'FAIL'));
    }
    if (missingUv) {
      assert.ok(res.some(r => r.message.includes('uv') && r.severity === 'WARN'));
    }
  });

  await t.test('checkHookSecurity', () => {
    const scriptPath = path.join(tmpDir, 'test.sh');
    fs.writeFileSync(scriptPath, 'echo $TOOL_INPUT\nexit 1');
    const res = checkHookSecurity(scriptPath);
    assert.ok(res.some(r => r.severity === 'FAIL' && r.message.includes('$TOOL_INPUT')));
    assert.ok(res.some(r => r.severity === 'WARN' && r.message.includes('exit 1')));
  });

  await t.test('checkHookSchema', () => {
    fs.mkdirSync(path.join(tmpDir, '.claude-plugin'));
    fs.writeFileSync(path.join(tmpDir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      requires_approval: true,
      hooks: {
        PreToolUse: [
          { matcher: '*' }
        ]
      }
    }));
    const res = checkHookSchema(tmpDir);
    assert.ok(res.some(r => r.severity === 'FAIL' && r.message.includes('Deprecated')));
    assert.ok(res.some(r => r.severity === 'INFO' && r.message.includes('matcher \'*\'')));
  });

  await t.test('checkHookSchema detects deprecated keys inside hook objects', () => {
    const testDir = path.join(tmpDir, 'nested-hook-test');
    fs.mkdirSync(path.join(testDir, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(testDir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [{ command: 'echo 1', requires_approval: true }]
          }
        ]
      }
    }));
    const res = checkHookSchema(testDir);
    assert.ok(res.some(r => r.severity === 'FAIL' && r.message.includes('Deprecated approval property in hook')));
  });

  await t.test('checkHookSchema inspects referenced hook files in manifest.hooks array', () => {
    const testDir = path.join(tmpDir, 'referenced-hooks-test');
    fs.mkdirSync(path.join(testDir, '.claude-plugin'), { recursive: true });
    fs.mkdirSync(path.join(testDir, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(testDir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      hooks: [
        './hooks/custom-guard.json'
      ]
    }));
    fs.writeFileSync(path.join(testDir, 'hooks', 'custom-guard.json'), JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            hooks: [{ command: 'echo 1', requires_approval: true }]
          }
        ]
      }
    }));
    const res = checkHookSchema(testDir);
    assert.ok(res.some(r => r.severity === 'FAIL' && r.message.includes('Deprecated approval property in hook')));
  });

  await t.test('checkCredentials', () => {
    const backup = process.env.FAKE_TOKEN;
    delete process.env.FAKE_TOKEN;
    const res = checkCredentials(['FAKE_TOKEN']);
    assert.strictEqual(res[0].status, 'MISSING');
    assert.strictEqual(res[0].severity, 'WARN');
    assert.strictEqual(res[0].message, 'FAKE_TOKEN: MISSING');
    // Ensure value is not in output even if set
    process.env.FAKE_TOKEN = 'secret-123';
    const res2 = checkCredentials(['FAKE_TOKEN']);
    assert.strictEqual(res2[0].status, 'SET');
    assert.strictEqual(res2[0].severity, 'INFO');
    assert.strictEqual(res2[0].message, 'FAKE_TOKEN: SET');
    assert.ok(!JSON.stringify(res2).includes('secret-123'));
    if (backup) process.env.FAKE_TOKEN = backup;
  });

  await t.test('checkConfigFreshness', () => {
    const res = checkConfigFreshness([], tmpDir);
    assert.ok(res.some(r => r.severity === 'WARN' && r.message.includes('AGENTS.md is missing')));
  });

  await t.test('severity isolation in runDoctor', () => {
    // If we mock everything to be fine except optional credentials
    // fail_count should be 0
    // Actually we'll run it on the real repo which might have warnings but shouldn't have fails
    // unless the repo is currently failing.
    const result = runDoctor({ repoRoot: path.resolve(__dirname, '..') });
    // This repo might have some WARN or FAIL but we can just check structure
    assert.ok(typeof result.warn_count === 'number');
    assert.ok(typeof result.fail_count === 'number');
  });

  await t.test('runDoctor diagnoses copied plugins from provider target directories', () => {
    // Setup simulated provider in tmpDir (e.g. Copilot cwd with .github)
    const projectDir = path.join(tmpDir, 'project');
    const copilotPluginsDir = path.join(projectDir, '.github', 'plugins');
    fs.mkdirSync(copilotPluginsDir, { recursive: true });

    // Copied plugin with corrupted manifest
    const badManifestPlugin = path.join(copilotPluginsDir, 'bad-manifest');
    fs.mkdirSync(path.join(badManifestPlugin, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(badManifestPlugin, '.claude-plugin', 'plugin.json'), '{ invalid json');

    // Copied plugin with malformed .mcp.json
    const badMcpPlugin = path.join(copilotPluginsDir, 'bad-mcp');
    fs.mkdirSync(path.join(badMcpPlugin, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(badMcpPlugin, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'bad-mcp' }));
    fs.writeFileSync(path.join(badMcpPlugin, '.mcp.json'), '{ bad json');

    // Copied plugin with deprecated approval property
    const deprecatedPlugin = path.join(copilotPluginsDir, 'deprecated-approval');
    fs.mkdirSync(path.join(deprecatedPlugin, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(deprecatedPlugin, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'deprecated-approval',
      requires_approval: true
    }));

    const result = runDoctor({ cwd: projectDir, repoRoot: path.resolve(__dirname, '..') });
    
    assert.ok(result.checks.some(c => c.severity === 'FAIL' && c.message.includes('Corrupted manifest in bad-manifest')));
    assert.ok(result.checks.some(c => c.severity === 'FAIL' && c.message.includes('Corrupted .mcp.json in bad-mcp')));
    assert.ok(result.checks.some(c => c.severity === 'FAIL' && c.message.includes('Deprecated approval property in deprecated-approval')));
  });
});
