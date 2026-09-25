const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { cleanOrphanedCache, healDirectorySymlinks } = require('../src/sync');
// Keep agenthaus ownership state out of the real home directory
process.env.AGENTHAUS_STATE_FILE = require('node:path').join(require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'agenthaus-state-')), 'state.json');

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
  
  const pastTime = new Date(Date.now() - 4000000);
  fs.utimesSync(tempGit, pastTime, pastTime);
  fs.utimesSync(tempSubdir, pastTime, pastTime);
  
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
  
  const pastTime = new Date(Date.now() - 4000000);
  fs.utimesSync(tempGit, pastTime, pastTime);
  
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
  const badTarget = path.join(repoDir, 'does-not-exist');
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
  assert.strictEqual(path.resolve(newTarget), path.resolve(validSource));
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('healDirectorySymlinks detects dangling symlink and prunes if unknown plugin', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  
  const targetDir = path.join(tmpDir, 'target');
  const repoDir = path.join(tmpDir, 'repo');
  
  fs.mkdirSync(targetDir);
  fs.mkdirSync(repoDir);
  
  const pluginName = 'unknown-plugin';
  const badTarget = path.join(repoDir, 'does-not-exist');
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

test('healDirectorySymlinks preserves foreign symlinks', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  const targetDir = path.join(tmpDir, 'target');
  const repoDir = path.join(tmpDir, 'repo', 'plugins');
  const foreignDir = path.join(tmpDir, 'foreign-fork', 'my-plugin');

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(repoDir, { recursive: true });
  fs.mkdirSync(foreignDir, { recursive: true });

  const symlinkPath = path.join(targetDir, 'my-plugin');
  fs.symlinkSync(foreignDir, symlinkPath);

  const actions = healDirectorySymlinks(targetDir, repoDir);
  assert.strictEqual(actions.length, 1);
  assert.strictEqual(actions[0].type, 'foreign');
  assert.strictEqual(actions[0].path, symlinkPath);
  assert.strictEqual(fs.existsSync(symlinkPath), true);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('healDirectorySymlinks preserves sibling-prefix path (/repo/plugins-old/foo)', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  const targetDir = path.join(tmpDir, 'target');
  const repoPluginsDir = path.join(tmpDir, 'repo', 'plugins');
  const siblingDir = path.join(tmpDir, 'repo', 'plugins-old', 'my-plugin');

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(repoPluginsDir, { recursive: true });
  fs.mkdirSync(siblingDir, { recursive: true });

  const symlinkPath = path.join(targetDir, 'my-plugin');
  fs.symlinkSync(siblingDir, symlinkPath);

  const actions = healDirectorySymlinks(targetDir, repoPluginsDir);
  assert.strictEqual(actions.length, 1);
  assert.strictEqual(actions[0].type, 'foreign');
  assert.strictEqual(actions[0].path, symlinkPath);
  assert.strictEqual(fs.existsSync(symlinkPath), true);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('healDirectorySymlinks heals dangling symlink pointing to an old checkout location', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  const targetDir = path.join(tmpDir, 'target');
  const currentPluginsDir = path.join(tmpDir, 'new-checkout', 'plugins');
  const oldPluginsTarget = path.join(tmpDir, 'old-checkout', 'plugins', 'my-plugin');

  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(currentPluginsDir, { recursive: true });

  // Valid plugin in new checkout
  const validSource = path.join(currentPluginsDir, 'my-plugin');
  fs.mkdirSync(validSource, { recursive: true });

  // Symlink pointing to nonexistent old checkout
  const symlinkPath = path.join(targetDir, 'my-plugin');
  fs.symlinkSync(oldPluginsTarget, symlinkPath);

  const actions = healDirectorySymlinks(targetDir, currentPluginsDir);
  assert.strictEqual(actions.length, 1);
  assert.strictEqual(actions[0].type, 'repair-link');
  assert.strictEqual(actions[0].path, symlinkPath);
  assert.strictEqual(actions[0].target, validSource);
  assert.strictEqual(path.resolve(fs.readlinkSync(symlinkPath)), path.resolve(validSource));

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
  assert.strictEqual(updatedContent.PreToolUse[0].matcher, '*');
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
  assert.strictEqual(result.backupPath, null);
  
  // Verify file not modified and backup not created
  assert.strictEqual(fs.readFileSync(hookFile, 'utf8'), originalStr);
  
  // check for any .bak files
  const files = fs.readdirSync(tmpDir);
  assert.strictEqual(files.length, 1); // only the hook file
  
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('repairHookFile removes deprecated approval properties at root, wrapped, group, and hook levels', (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-sync-test-'));
  const hookFile = path.join(tmpDir, 'hook.json');

  const multiLevelInvalidHook = {
    requires_approval: true,
    approval_message: 'root approval',
    hooks: {
      requires_approval: true,
      approval_message: 'wrapped approval',
      PreToolUse: [
        {
          matcher: '*',
          requires_approval: true,
          approval_message: 'group approval',
          hooks: [
            {
              command: 'echo hello',
              requires_approval: true,
              approval_message: 'hook approval'
            }
          ]
        }
      ]
    }
  };

  fs.writeFileSync(hookFile, JSON.stringify(multiLevelInvalidHook, null, 2));

  const { repairHookFile } = require('../src/sync');
  const result = repairHookFile(hookFile);

  assert.strictEqual(result.repaired, true);

  const updated = JSON.parse(fs.readFileSync(hookFile, 'utf8'));
  assert.strictEqual('requires_approval' in updated, false);
  assert.strictEqual('approval_message' in updated, false);
  assert.strictEqual('requires_approval' in updated.hooks, false);
  assert.strictEqual('approval_message' in updated.hooks, false);
  assert.strictEqual('requires_approval' in updated.hooks.PreToolUse[0], false);
  assert.strictEqual('approval_message' in updated.hooks.PreToolUse[0], false);
  assert.strictEqual('requires_approval' in updated.hooks.PreToolUse[0].hooks[0], false);
  assert.strictEqual('approval_message' in updated.hooks.PreToolUse[0].hooks[0], false);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
