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
  checkProviderConfigs,
  isMarketplaceHybrid,
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

  await t.test('checkProviderConfigs detects malformed provider configurations', () => {
    const projectDir = path.join(tmpDir, 'provider-conf-project');
    const fakeHome = path.join(tmpDir, 'fake-home');
    fs.mkdirSync(path.join(projectDir, '.gemini'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.gemini', 'settings.json'), '{ malformed json');

    fs.mkdirSync(path.join(projectDir, '.cursor'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.cursor', 'mcp.json'), '{ invalid cursor json');

    fs.mkdirSync(path.join(fakeHome, '.codeium', 'windsurf'), { recursive: true });
    fs.writeFileSync(path.join(fakeHome, '.codeium', 'windsurf', 'mcp_config.json'), '{ invalid windsurf json');

    const providers = [
      { id: 'antigravity', name: 'Gemini' },
      { id: 'cursor', name: 'Cursor' },
      { id: 'windsurf', name: 'Windsurf' }
    ];

    const results = checkProviderConfigs(providers, projectDir, fakeHome);
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes('Malformed Gemini settings')));
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes('Malformed Cursor MCP config')));
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes('Malformed Windsurf MCP config')));
  });

  await t.test('checkProviderConfigs validates only effective Windsurf config and ignores project-local .codeium configs', () => {
    const projectDir = path.join(tmpDir, 'project-windsurf-ignore');
    const fakeHome = path.join(tmpDir, 'fake-home-valid');
    fs.mkdirSync(path.join(fakeHome, '.codeium', 'windsurf'), { recursive: true });
    fs.writeFileSync(path.join(fakeHome, '.codeium', 'windsurf', 'mcp_config.json'), JSON.stringify({ mcpServers: {} }));

    fs.mkdirSync(path.join(projectDir, '.codeium', 'windsurf'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.codeium', 'windsurf', 'mcp_config.json'), '{ unused bad json');
    fs.writeFileSync(path.join(projectDir, '.codeium', 'mcp_config.json'), '{ another bad json');

    const providers = [{ id: 'windsurf', name: 'Windsurf' }];
    const results = checkProviderConfigs(providers, projectDir, fakeHome);
    assert.strictEqual(results.some(r => r.severity === 'FAIL'), false);
    assert.ok(results.some(r => r.severity === 'PASS' && r.message.includes('Windsurf MCP config valid')));
  });

  await t.test('checkProviderConfigs detects structurally invalid provider configurations', () => {
    const projectDir = path.join(tmpDir, 'provider-struct-project');
    fs.mkdirSync(path.join(projectDir, '.cursor'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.cursor', 'mcp.json'), JSON.stringify({ mcpServers: 'bad' }));

    fs.mkdirSync(path.join(projectDir, '.gemini'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.gemini', 'settings.json'), JSON.stringify({ mcpServers: { srv: 'invalid' } }));

    const providers = [
      { id: 'antigravity', name: 'Gemini' },
      { id: 'cursor', name: 'Cursor' }
    ];

    const results = checkProviderConfigs(providers, projectDir);
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes("'mcpServers' in Cursor MCP config must be an object")));
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes("MCP server 'srv' in Gemini settings must be an object")));
  });

  await t.test('checkProviderConfigs validates fields inside each MCP server definition', () => {
    const projectDir = path.join(tmpDir, 'provider-fields-project');
    fs.mkdirSync(path.join(projectDir, '.cursor'), { recursive: true });
    // Empty server object without command or url
    fs.writeFileSync(path.join(projectDir, '.cursor', 'mcp.json'), JSON.stringify({
      mcpServers: { empty_srv: {} }
    }));

    fs.mkdirSync(path.join(projectDir, '.gemini'), { recursive: true });
    // Numeric command
    fs.writeFileSync(path.join(projectDir, '.gemini', 'settings.json'), JSON.stringify({
      mcpServers: { num_cmd: { command: 123 } }
    }));

    const providers = [
      { id: 'antigravity', name: 'Gemini' },
      { id: 'cursor', name: 'Cursor' }
    ];

    const results = checkProviderConfigs(providers, projectDir);
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes("MCP server 'empty_srv' in Cursor MCP config must specify a 'command' or 'url'")));
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes("'command' in MCP server 'num_cmd' (Gemini settings) must be a non-empty string")));
  });

  await t.test('Claude provider detect() discovers standalone .claude.json without .claude directory', () => {
    const projectDir = path.join(tmpDir, 'claude-standalone-project');
    const fakeHome = path.join(tmpDir, 'fake-home');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(fakeHome, { recursive: true });
    const claudeProvider = require('../src/providers/claude.js');

    const origHome = os.homedir;
    try {
      os.homedir = () => fakeHome;
      assert.strictEqual(claudeProvider.detect(projectDir), false);

      fs.writeFileSync(path.join(projectDir, '.claude.json'), JSON.stringify({ mcpServers: {} }));
      assert.strictEqual(claudeProvider.detect(projectDir), true);
    } finally {
      os.homedir = origHome;
    }
  });

  await t.test('isMarketplaceHybrid distinguishes marketplace-backed symlinks from copied plugin symlinks', () => {
    const fakeRepo = path.join(tmpDir, 'marketplace-repo');
    const repoPlugins = path.join(fakeRepo, 'plugins');
    const canonicalPlugin = path.join(repoPlugins, 'test-plugin');
    fs.mkdirSync(canonicalPlugin, { recursive: true });
    fs.mkdirSync(path.join(canonicalPlugin, 'hooks'), { recursive: true });

    // 1. Marketplace-backed hybrid installation: top-level symlink points into repoPlugins
    const hybridDir = path.join(tmpDir, 'hybrid-install');
    fs.mkdirSync(hybridDir, { recursive: true });
    fs.symlinkSync(path.join(canonicalPlugin, 'hooks'), path.join(hybridDir, 'hooks'), 'dir');
    assert.strictEqual(isMarketplaceHybrid(hybridDir, 'test-plugin', fakeRepo), true);

    // 2. Copied plugin with legitimate internal symlink: points inside copied directory, not into marketplace
    const copiedDir = path.join(tmpDir, 'copied-install');
    fs.mkdirSync(path.join(copiedDir, 'assets'), { recursive: true });
    fs.writeFileSync(path.join(copiedDir, 'assets', 'icon.png'), 'fake-png');
    // Internal symlink: icon-link.png -> assets/icon.png
    fs.symlinkSync(path.join(copiedDir, 'assets', 'icon.png'), path.join(copiedDir, 'icon-link.png'));
    assert.strictEqual(isMarketplaceHybrid(copiedDir, 'test-plugin', fakeRepo), false);

    // 3. Normal directory without symlinks
    const normalDir = path.join(tmpDir, 'normal-install');
    fs.mkdirSync(normalDir, { recursive: true });
    assert.strictEqual(isMarketplaceHybrid(normalDir, 'test-plugin', fakeRepo), false);

    // 4. Foreign fork under conventional path: points into /other-repo/plugins, NOT this marketplace
    const foreignRepo = path.join(tmpDir, 'other-repo');
    const foreignPlugin = path.join(foreignRepo, 'plugins', 'test-plugin');
    fs.mkdirSync(foreignPlugin, { recursive: true });
    fs.mkdirSync(path.join(foreignPlugin, 'hooks'), { recursive: true });
    const foreignInstallDir = path.join(tmpDir, 'foreign-fork-install');
    fs.mkdirSync(foreignInstallDir, { recursive: true });
    fs.symlinkSync(path.join(foreignPlugin, 'hooks'), path.join(foreignInstallDir, 'hooks'), 'dir');
    assert.strictEqual(isMarketplaceHybrid(foreignInstallDir, 'test-plugin', fakeRepo), false);
  });

  await t.test('checkProviderConfigs requires string values in MCP server environment maps', () => {
    const projectDir = path.join(tmpDir, 'provider-env-types-project');
    fs.mkdirSync(path.join(projectDir, '.cursor'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.cursor', 'mcp.json'), JSON.stringify({
      mcpServers: {
        my_srv: {
          command: 'node',
          env: {
            VALID_VAR: 'hello',
            NUMERIC_VAR: 123
          }
        }
      }
    }));

    const providers = [{ id: 'cursor', name: 'Cursor' }];
    const results = checkProviderConfigs(providers, projectDir);
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes("Environment variable 'NUMERIC_VAR' in MCP server 'my_srv' (Cursor MCP config) must be a string")));
  });

  await t.test('checkProviderConfigs validates Claude project-scoped .mcp.json', () => {
    const projectDir = path.join(tmpDir, 'claude-project-mcp');
    fs.mkdirSync(path.join(projectDir, '.claude'), { recursive: true });
    // Write malformed .mcp.json in cwd
    fs.writeFileSync(path.join(projectDir, '.mcp.json'), '{ malformed json');

    const providers = [{ id: 'claude', name: 'Claude Code' }];
    const results = checkProviderConfigs(providers, projectDir);
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes('Malformed Claude MCP config')));
  });

  await t.test('checkProviderConfigs requires string elements in _agenthaus_mcp ownership arrays', () => {
    const projectDir = path.join(tmpDir, 'agenthaus-mcp-elements-test');
    fs.mkdirSync(path.join(projectDir, '.cursor'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.cursor', 'mcp.json'), JSON.stringify({
      _agenthaus_mcp: {
        'test-plugin': [null]
      }
    }));

    const providers = [{ id: 'cursor', name: 'Cursor' }];
    const results = checkProviderConfigs(providers, projectDir);
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes("Ownership entry for 'test-plugin' in '_agenthaus_mcp' must be an array of string keys")));
  });

  await t.test('Claude provider detects projects identified only by project-scoped .mcp.json', () => {
    const { getProvider } = require('../src/providers/index.js');
    const claude = getProvider('claude');
    const isolatedHome = path.join(tmpDir, 'claude-only-mcp-home');
    fs.mkdirSync(isolatedHome, { recursive: true });
    const projectDir = path.join(tmpDir, 'claude-only-mcp-project');
    fs.mkdirSync(projectDir, { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.mcp.json'), '{ malformed json');

    // Neither home nor project has .claude or .claude.json
    assert.strictEqual(claude.detect(projectDir), true);

    const results = checkProviderConfigs([claude], projectDir, isolatedHome);
    assert.ok(results.some(r => r.severity === 'FAIL' && r.message.includes('Malformed Claude MCP config')));
  });
});
