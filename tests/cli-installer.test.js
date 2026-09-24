const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateTargetSafety, installPlugin, uninstallPlugin, updatePlugin } = require('../src/installer');

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

