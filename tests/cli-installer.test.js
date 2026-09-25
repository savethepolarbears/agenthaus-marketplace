const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateTargetSafety, installPlugin, uninstallPlugin, updatePlugin } = require('../src/installer');
const { getOwnedKeys } = require('../src/providers/mcp-ownership.js');

process.env.AGENTHAUS_STATE_FILE = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-state-')), 'state.json');

test('validateTargetSafety throws for dangerous paths', (t) => {
  assert.throws(() => validateTargetSafety(''), /targetDir must be a non-empty string/);
  assert.throws(() => validateTargetSafety(null), /targetDir must be a non-empty string/);
  assert.throws(() => validateTargetSafety('/'), /Refusing to operate/);
  assert.throws(() => validateTargetSafety('/shallow-dir'), /Refusing to operate/); // 1 segment
  assert.throws(() => validateTargetSafety(os.homedir()), /Refusing to operate/);
});

test('validateTargetSafety accepts deep safe paths', (t) => {
  const safePath = path.join(os.tmpdir(), 'agenthaus-test', 'safe');
  const result = validateTargetSafety(safePath);
  assert.ok(result.endsWith('safe'));
});

test('installPlugin via symlink', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const source = path.join(tmpDir, 'src-plugin');
  const target = path.join(tmpDir, 'target-dir');
  fs.mkdirSync(source);
  
  const res = installPlugin(source, target, { method: 'symlink' });
  assert.strictEqual(res.status, 'installed');
  
  const destPath = path.join(target, 'src-plugin');
  assert.strictEqual(fs.lstatSync(destPath).isSymbolicLink(), true);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('installPlugin via copy', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const source = path.join(tmpDir, 'src-plugin');
  const target = path.join(tmpDir, 'target-dir');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'test.txt'), 'hello');
  
  const res = installPlugin(source, target, { method: 'copy' });
  assert.strictEqual(res.status, 'installed');
  
  const destPath = path.join(target, 'src-plugin');
  assert.strictEqual(fs.lstatSync(destPath).isDirectory(), true);
  assert.strictEqual(fs.readFileSync(path.join(destPath, 'test.txt'), 'utf8'), 'hello');
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('installPlugin skips already installed', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const source = path.join(tmpDir, 'src-plugin');
  const target = path.join(tmpDir, 'target-dir');
  fs.mkdirSync(source);
  
  installPlugin(source, target, { method: 'symlink' });
  const res = installPlugin(source, target, { method: 'symlink' });
  assert.strictEqual(res.status, 'skipped');
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('uninstallPlugin removes plugin', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const source = path.join(tmpDir, 'src-plugin');
  const target = path.join(tmpDir, 'target-dir');
  fs.mkdirSync(source);
  
  installPlugin(source, target, { method: 'symlink' });
  const res = uninstallPlugin(target, 'src-plugin');
  
  assert.strictEqual(res.status, 'removed');
  assert.strictEqual(fs.existsSync(path.join(target, 'src-plugin')), false);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin updates copy', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const source = path.join(tmpDir, 'src-plugin');
  const target = path.join(tmpDir, 'target-dir');
  
  fs.mkdirSync(source);
  fs.mkdirSync(path.join(source, '.claude-plugin'));
  fs.writeFileSync(path.join(source, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '1.0.0' }));
  
  installPlugin(source, target, { method: 'copy' });
  
  // update source
  fs.writeFileSync(path.join(source, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '2.0.0' }));
  
  const res = updatePlugin(source, target);
  assert.strictEqual(res.status, 'updated');
  assert.strictEqual(res.fromVersion, '1.0.0');
  assert.strictEqual(res.toVersion, '2.0.0');
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin preserves foreign symlinks', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');
  const foreignTarget = path.join(tmpDir, 'foreign-fork', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });
  fs.mkdirSync(foreignTarget, { recursive: true });

  const destPath = path.join(target, 'src-plugin');
  fs.symlinkSync(foreignTarget, destPath);

  const res = updatePlugin(source, target);
  assert.strictEqual(res.status, 'skipped');
  assert.strictEqual(res.reason, 'foreign symlink');
  assert.strictEqual(path.resolve(fs.readlinkSync(destPath)), path.resolve(foreignTarget));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin updates outdated marketplace symlinks', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');
  const oldMarketplaceTarget = path.join(tmpDir, 'old-repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });

  const destPath = path.join(target, 'src-plugin');
  fs.symlinkSync(oldMarketplaceTarget, destPath);

  const res = updatePlugin(source, target);
  assert.strictEqual(res.status, 'updated');
  assert.strictEqual(path.resolve(fs.readlinkSync(destPath)), path.resolve(source));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin preserves conventional foreign fork symlinks with /plugins/<name> layout when valid', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');
  const forkTarget = path.join(tmpDir, 'work', 'fork', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });
  fs.mkdirSync(forkTarget, { recursive: true });

  const destPath = path.join(target, 'src-plugin');
  fs.symlinkSync(forkTarget, destPath, process.platform === 'win32' ? 'junction' : 'dir');

  const res = updatePlugin(source, target);
  assert.strictEqual(res.status, 'skipped');
  assert.strictEqual(res.reason, 'foreign symlink');
  assert.strictEqual(path.resolve(fs.readlinkSync(destPath)), path.resolve(forkTarget));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('installPlugin invokes provider postInstall hook', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });

  let postInstallCalled = false;
  const mockProvider = {
    postInstall(src, tgt, opts) {
      postInstallCalled = true;
    }
  };

  const res = installPlugin(source, target, { provider: mockProvider });
  assert.strictEqual(res.status, 'installed');
  assert.strictEqual(postInstallCalled, true);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin invokes provider postInstall hook on copied update', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(path.join(source, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(source, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '1.0.0' }));

  installPlugin(source, target, { method: 'copy' });

  // Update source version
  fs.writeFileSync(path.join(source, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '2.0.0' }));

  let postInstallCalled = false;
  const mockProvider = {
    postInstall(src, tgt, opts) {
      postInstallCalled = true;
      assert.strictEqual(src, source);
      assert.strictEqual(tgt, validateTargetSafety(target));
    }
  };

  const res = updatePlugin(source, target, { provider: mockProvider });
  assert.strictEqual(res.status, 'updated');
  assert.strictEqual(postInstallCalled, true);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin invokes provider postInstall hook on outdated symlink update', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');
  const oldMarketplaceTarget = path.join(tmpDir, 'old-repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });

  const destPath = path.join(target, 'src-plugin');
  fs.symlinkSync(oldMarketplaceTarget, destPath);

  let postInstallCalled = false;
  const mockProvider = {
    postInstall(src, tgt, opts) {
      postInstallCalled = true;
    }
  };

  const res = updatePlugin(source, target, { provider: mockProvider });
  assert.strictEqual(res.status, 'updated');
  assert.strictEqual(postInstallCalled, true);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('installPlugin rolls back destPath on provider postInstall failure', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });

  const failingProvider = {
    postInstall() {
      throw new Error('Simulation: Malformed settings');
    }
  };

  assert.throws(() => {
    installPlugin(source, target, { method: 'symlink', provider: failingProvider });
  }, /Simulation: Malformed settings/);

  // destPath should have been rolled back so it is not left in a partial unrecoverable state
  assert.strictEqual(fs.existsSync(path.join(target, 'src-plugin')), false);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('installPlugin reruns provider postInstall on already existing plugin', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });

  // First install without provider
  installPlugin(source, target, { method: 'symlink' });
  assert.strictEqual(fs.existsSync(path.join(target, 'src-plugin')), true);

  // Second install with provider: should return skipped, but still rerun provider.postInstall
  let postInstallCount = 0;
  const mockProvider = {
    postInstall() {
      postInstallCount++;
    }
  };

  const res = installPlugin(source, target, { method: 'symlink', provider: mockProvider });
  assert.strictEqual(res.status, 'skipped');
  assert.strictEqual(postInstallCount, 1);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin updates hybrid item-level symlink installations when version bumps or artifacts change', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(path.join(source, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(source, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'src-plugin', version: '1.0.0' }));

  // Simulate hybrid installation in target: directory with item-level symlinks and gemini-extension.json
  const destPath = path.join(target, 'src-plugin');
  fs.mkdirSync(destPath, { recursive: true });
  fs.symlinkSync(path.join(source, '.claude-plugin'), path.join(destPath, '.claude-plugin'), 'dir');
  fs.writeFileSync(path.join(destPath, 'gemini-extension.json'), JSON.stringify({ name: 'src-plugin', version: '1.0.0' }));

  // 1. Initially, identical version and artifacts -> should skip
  let postInstallCount = 0;
  const mockProvider = {
    postInstall(src, tgt) {
      postInstallCount++;
      fs.writeFileSync(path.join(tgt, 'src-plugin', 'gemini-extension.json'), JSON.stringify({ name: 'src-plugin', version: '1.1.0' }));
    }
  };

  let res = updatePlugin(source, target, { provider: mockProvider });
  assert.strictEqual(res.status, 'skipped');
  assert.strictEqual(postInstallCount, 0);

  // 2. Now bump version in sourceDir and add a new top-level directory
  fs.writeFileSync(path.join(source, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'src-plugin', version: '1.1.0' }));
  fs.mkdirSync(path.join(source, 'commands'), { recursive: true });
  fs.writeFileSync(path.join(source, 'commands', 'cmd.md'), '# Command');

  res = updatePlugin(source, target, { provider: mockProvider });
  assert.strictEqual(res.status, 'updated');
  assert.strictEqual(res.fromVersion, '1.0.0');
  assert.strictEqual(res.toVersion, '1.1.0');
  assert.strictEqual(postInstallCount, 1);

  // Verify the new top-level directory was linked
  assert.strictEqual(fs.existsSync(path.join(destPath, 'commands')), true);
  assert.strictEqual(fs.lstatSync(path.join(destPath, 'commands')).isSymbolicLink(), true);

  // 3. Second run without changes -> should skip
  res = updatePlugin(source, target, { provider: mockProvider });
  assert.strictEqual(res.status, 'skipped');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin preserves foreign item-level symlink installations', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');
  const foreignDir = path.join(tmpDir, 'foreign-repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });
  fs.mkdirSync(foreignDir, { recursive: true });

  const destPath = path.join(target, 'src-plugin');
  fs.mkdirSync(destPath, { recursive: true });
  fs.symlinkSync(foreignDir, path.join(destPath, 'foreign-link'), 'dir');

  const res = updatePlugin(source, target);
  assert.strictEqual(res.status, 'skipped');
  assert.strictEqual(res.reason, 'foreign symlink');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('installPlugin skips foreign symlinks and does not invoke provider postInstall', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');
  const foreignDir = path.join(tmpDir, 'foreign-repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });
  fs.mkdirSync(foreignDir, { recursive: true });

  const destPath = path.join(target, 'src-plugin');
  fs.symlinkSync(foreignDir, destPath, 'dir');

  let postInstallCalled = false;
  const mockProvider = {
    postInstall() {
      postInstallCalled = true;
    }
  };

  const res = installPlugin(source, target, { method: 'symlink', provider: mockProvider });
  assert.strictEqual(res.status, 'skipped');
  assert.strictEqual(res.reason, 'foreign symlink');
  assert.strictEqual(postInstallCalled, false);
  // Ensure the foreign symlink was preserved
  assert.strictEqual(fs.lstatSync(destPath).isSymbolicLink(), true);
  assert.strictEqual(path.resolve(fs.readlinkSync(destPath)), path.resolve(foreignDir));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('antigravity postInstall preserves foreign symlink without unlinking', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'extensions');
  const source = path.join(tmpDir, 'repo', 'plugins', 'my-ext');
  const foreignDir = path.join(tmpDir, 'user-managed', 'my-ext');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });
  fs.mkdirSync(foreignDir, { recursive: true });

  const destPath = path.join(target, 'my-ext');
  fs.symlinkSync(foreignDir, destPath, 'dir');

  const antigravity = require('../src/providers/antigravity');
  antigravity.postInstall(source, target, { dryRun: false });

  // Foreign symlink must NOT be unlinked or converted to a directory
  assert.strictEqual(fs.lstatSync(destPath).isSymbolicLink(), true);
  assert.strictEqual(path.resolve(fs.readlinkSync(destPath)), path.resolve(foreignDir));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin preserves user-managed directories without agenthaus ownership metadata', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(path.join(source, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(source, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '2.0.0' }));

  // Simulate a manual user checkout/fork without .agenthaus-install.json
  const destPath = path.join(target, 'src-plugin');
  fs.mkdirSync(path.join(destPath, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(destPath, '.claude-plugin', 'plugin.json'), JSON.stringify({ version: '1.0.0' }));
  fs.writeFileSync(path.join(destPath, 'user-work.txt'), 'do not delete');

  const res = updatePlugin(source, target);
  assert.strictEqual(res.status, 'skipped');
  assert.strictEqual(res.reason, 'user-managed directory');
  assert.strictEqual(fs.existsSync(path.join(destPath, 'user-work.txt')), true);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin invokes provider postInstall hook when updating current symlink', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const target = path.join(tmpDir, 'target-dir');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(source, { recursive: true });

  const destPath = path.join(target, 'src-plugin');
  fs.symlinkSync(source, destPath, process.platform === 'win32' ? 'junction' : 'dir');

  let postInstallCalled = false;
  const mockProvider = {
    postInstall(src, tgt, opts) {
      postInstallCalled = true;
      assert.strictEqual(src, source);
    }
  };

  const res = updatePlugin(source, target, { provider: mockProvider });
  assert.strictEqual(res.status, 'updated');
  assert.strictEqual(postInstallCalled, true);

  // Without provider, it remains skipped
  const resNoProvider = updatePlugin(source, target);
  assert.strictEqual(resNoProvider.status, 'skipped');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('updatePlugin updates hybrid item-level symlink installations when MCP servers are dropped', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-inst-test-'));
  const fakeGeminiDir = path.join(tmpDir, 'gemini');
  const target = path.join(fakeGeminiDir, 'extensions');
  const source = path.join(tmpDir, 'repo', 'plugins', 'src-plugin');
  const antigravity = require('../src/providers/antigravity.js');

  fs.mkdirSync(target, { recursive: true });
  fs.mkdirSync(path.join(source, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(source, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'src-plugin', version: '1.0.0' }));

  // Simulate hybrid installation in target
  const destPath = path.join(target, 'src-plugin');
  fs.mkdirSync(destPath, { recursive: true });
  fs.symlinkSync(path.join(source, '.claude-plugin'), path.join(destPath, '.claude-plugin'), 'dir');
  fs.writeFileSync(path.join(destPath, 'gemini-extension.json'), JSON.stringify({ name: 'src-plugin', version: '1.0.0' }));

  // Settings originally has srvA and srvB registered for src-plugin
  const settingsPath = path.join(fakeGeminiDir, 'settings.json');
  fs.writeFileSync(settingsPath, JSON.stringify({
    mcpServers: {
      srvA: { command: 'node', args: ['a.js'] },
      srvB: { command: 'node', args: ['b.js'] }
    },
    _agenthaus_mcp: {
      'src-plugin': ['srvA', 'srvB']
    }
  }, null, 2));

  // Source now only defines srvA (srvB was dropped)
  fs.writeFileSync(path.join(source, 'gemini-settings-snippet.json'), JSON.stringify({
    mcpServers: {
      srvA: { command: 'node', args: ['a.js'] }
    }
  }));

  const res = updatePlugin(source, target, { provider: antigravity });
  assert.strictEqual(res.status, 'updated');

  const updatedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  assert.ok(updatedSettings.mcpServers.srvA);
  assert.strictEqual(updatedSettings.mcpServers.srvB, undefined);
  // Legacy in-config ownership markers are migrated into the state file
  assert.strictEqual(updatedSettings._agenthaus_mcp, undefined);
  assert.deepStrictEqual(getOwnedKeys(settingsPath, 'src-plugin'), ['srvA']);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});



