const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { cleanOrphanedCache, healDirectorySymlinks } = require('../src/sync');

test('cleanOrphanedCache identifies and prunes temp_git_ and temp_subdir_ directories', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  
  // Create directories
  const tempGit = path.join(tmpDir, 'temp_git_12345');
  const tempSubdir = path.join(tmpDir, 'temp_subdir_67890');
  const validDir = path.join(tmpDir, 'valid_plugin');
  const validFile = path.join(tmpDir, 'temp_git_file.txt');
  
  fs.mkdirSync(tempGit);
  fs.mkdirSync(tempSubdir);
  fs.mkdirSync(validDir);
  fs.writeFileSync(validFile, 'test');
  
  const actions = cleanOrphanedCache(tmpDir);
  
  assert.strictEqual(actions.length, 2);
  assert.strictEqual(actions[0].type, 'prune-temp');
  assert.strictEqual(actions[1].type, 'prune-temp');
  
  assert.strictEqual(fs.existsSync(tempGit), false);
  assert.strictEqual(fs.existsSync(tempSubdir), false);
  assert.strictEqual(fs.existsSync(validDir), true);
  assert.strictEqual(fs.existsSync(validFile), true);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('cleanOrphanedCache with dryRun records pruning actions without deleting', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  
  const tempGit = path.join(tmpDir, 'temp_git_12345');
  fs.mkdirSync(tempGit);
  
  const actions = cleanOrphanedCache(tmpDir, { dryRun: true });
  
  assert.strictEqual(actions.length, 1);
  assert.strictEqual(fs.existsSync(tempGit), true);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('healDirectorySymlinks detects dangling symlink and repairs to marketplace plugin', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  
  const targetDir = path.join(tmpDir, 'target');
  const repoDir = path.join(tmpDir, 'repo');
  
  fs.mkdirSync(targetDir);
  fs.mkdirSync(repoDir);
  
  const pluginName = 'my-plugin';
  const badTarget = path.join(tmpDir, 'does-not-exist');
  const symlinkPath = path.join(targetDir, pluginName);
  
  // Create dangling symlink
  fs.symlinkSync(badTarget, symlinkPath);
  
  // Create valid marketplace plugin
  const validSource = path.join(repoDir, pluginName);
  fs.mkdirSync(validSource);
  
  const actions = healDirectorySymlinks(targetDir, repoDir);
  
  assert.strictEqual(actions.length, 1);
  assert.strictEqual(actions[0].type, 'repair-link');
  assert.strictEqual(actions[0].path, symlinkPath);
  assert.strictEqual(actions[0].target, validSource);
  
  // Verify it was fixed
  const newTarget = fs.readlinkSync(symlinkPath);
  assert.strictEqual(newTarget, validSource);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('healDirectorySymlinks detects dangling symlink and prunes if unknown plugin', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  
  const targetDir = path.join(tmpDir, 'target');
  const repoDir = path.join(tmpDir, 'repo');
  
  fs.mkdirSync(targetDir);
  fs.mkdirSync(repoDir);
  
  const pluginName = 'unknown-plugin';
  const badTarget = path.join(tmpDir, 'does-not-exist');
  const symlinkPath = path.join(targetDir, pluginName);
  
  // Create dangling symlink
  fs.symlinkSync(badTarget, symlinkPath);
  
  const actions = healDirectorySymlinks(targetDir, repoDir);
  
  assert.strictEqual(actions.length, 1);
  assert.strictEqual(actions[0].type, 'prune-dangling');
  assert.strictEqual(actions[0].path, symlinkPath);
  
  // Verify it was removed
  assert.strictEqual(fs.existsSync(symlinkPath), false);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('healDirectorySymlinks preserves valid active symlinks', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  
  const targetDir = path.join(tmpDir, 'target');
  const repoDir = path.join(tmpDir, 'repo');
  
  fs.mkdirSync(targetDir);
  fs.mkdirSync(repoDir);
  
  const pluginName = 'valid-plugin';
  const symlinkPath = path.join(targetDir, pluginName);
  
  // Create valid source
  const validSource = path.join(repoDir, pluginName);
  fs.mkdirSync(validSource);
  
  // Create valid symlink
  fs.symlinkSync(validSource, symlinkPath);
  
  const actions = healDirectorySymlinks(targetDir, repoDir);
  
  assert.strictEqual(actions.length, 1);
  assert.strictEqual(actions[0].type, 'valid');
  assert.strictEqual(actions[0].path, symlinkPath);
  
  // Verify it still exists
  assert.strictEqual(fs.existsSync(symlinkPath), true);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('repairHookFile repairs invalid schema and writes backup', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  const hookFile = path.join(tmpDir, 'hook.json');
  
  const invalidHook = {
    PreToolUse: [
      {
        matcher: '*',
        hooks: [
          {
            command: 'echo hello',
            requires_approval: true,
            approval_message: 'ok?'
          }
        ]
      },
      {
        matcher: '.*',
        hooks: []
      }
    ]
  };
  
  fs.writeFileSync(hookFile, JSON.stringify(invalidHook));
  
  const { repairHookFile } = require('../src/sync');
  const result = repairHookFile(hookFile);
  
  assert.strictEqual(result.repaired, true);
  assert.ok(result.backupPath);
  assert.strictEqual(fs.existsSync(result.backupPath), true);
  
  const updatedContent = JSON.parse(fs.readFileSync(hookFile, 'utf8'));
  assert.strictEqual(updatedContent.PreToolUse.length, 1);
  assert.strictEqual(updatedContent.PreToolUse[0].matcher, '.*');
  assert.strictEqual('requires_approval' in updatedContent.PreToolUse[0].hooks[0], false);
  assert.strictEqual('approval_message' in updatedContent.PreToolUse[0].hooks[0], false);
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('repairHookFile with dryRun true does not write changes to disk', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  const hookFile = path.join(tmpDir, 'hook.json');
  
  const invalidHook = {
    PreToolUse: [
      {
        matcher: '*',
        hooks: [
          {
            command: 'echo hello',
            requires_approval: true
          }
        ]
      }
    ]
  };
  
  const originalStr = JSON.stringify(invalidHook);
  fs.writeFileSync(hookFile, originalStr);
  
  const { repairHookFile } = require('../src/sync');
  const result = repairHookFile(hookFile, { dryRun: true });
  
  assert.strictEqual(result.repaired, true);
  
  // Verify file not modified and backup not created
  assert.strictEqual(fs.readFileSync(hookFile, 'utf8'), originalStr);
  
  // check for any .bak files
  const files = fs.readdirSync(tmpDir);
  assert.strictEqual(files.length, 1); // only the hook file
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
