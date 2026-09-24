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
  fs.writeFileSync(path.join(source, 'plugin.json'), JSON.stringify({ version: '1.0.0' }));
  
  installPlugin(source, target, { method: 'copy' });
  
  // update source
  fs.writeFileSync(path.join(source, 'plugin.json'), JSON.stringify({ version: '2.0.0' }));
  
  const res = updatePlugin(source, target);
  assert.strictEqual(res.status, 'updated');
  assert.strictEqual(res.fromVersion, '1.0.0');
  assert.strictEqual(res.toVersion, '2.0.0');
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
