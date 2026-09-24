const fs = require('fs');
const path = require('path');

function cleanOrphanedCache(cacheDir, { dryRun = false } = {}) {
  if (!fs.existsSync(cacheDir)) return [];

  const actions = [];
  const entries = fs.readdirSync(cacheDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && (entry.name.startsWith('temp_git_') || entry.name.startsWith('temp_subdir_'))) {
      const fullPath = path.join(cacheDir, entry.name);
      actions.push({ type: 'prune-temp', path: fullPath });
      
      if (!dryRun) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    }
  }

  return actions;
}

function healDirectorySymlinks(targetDir, repoPluginsDir, { dryRun = false } = {}) {
  if (!fs.existsSync(targetDir)) return [];

  const actions = [];
  const entries = fs.readdirSync(targetDir);

  for (const entry of entries) {
    const entryPath = path.join(targetDir, entry);
    try {
      const lstat = fs.lstatSync(entryPath);
      if (lstat.isSymbolicLink()) {
        const rawTarget = fs.readlinkSync(entryPath);
        const resolvedTarget = path.resolve(path.dirname(entryPath), rawTarget);
        
        if (!fs.existsSync(resolvedTarget)) {
          // dangling symlink
          const pluginSource = path.join(repoPluginsDir, entry);
          if (fs.existsSync(pluginSource)) {
            actions.push({ type: 'repair-link', path: entryPath, target: pluginSource });
            if (!dryRun) {
              fs.unlinkSync(entryPath);
              fs.symlinkSync(pluginSource, entryPath);
            }
          } else {
            actions.push({ type: 'prune-dangling', path: entryPath, target: rawTarget });
            if (!dryRun) {
              fs.unlinkSync(entryPath);
            }
          }
        } else {
          actions.push({ type: 'valid', path: entryPath });
        }
      }
    } catch (err) {
      actions.push({ type: 'error', path: entryPath, error: err.message });
    }
  }

  return actions;
}

module.exports = {
  cleanOrphanedCache,
  healDirectorySymlinks
};

function repairHookFile(filePath, { dryRun = false } = {}) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return { repaired: false, error: err.message };
  }

  let data;
  try {
    data = JSON.parse(content);
  } catch (err) {
    return { repaired: false, error: err.message };
  }

  let modified = false;
  const actions = [];

  const checkGroup = (groups) => {
    if (!Array.isArray(groups)) return;
    for (let i = groups.length - 1; i >= 0; i--) {
      const group = groups[i];
      if (group.matcher === '*') {
        group.matcher = '.*';
        modified = true;
        actions.push({ type: 'fix-matcher' });
      }
      if (Array.isArray(group.hooks) && group.hooks.length === 0) {
        groups.splice(i, 1);
        modified = true;
        actions.push({ type: 'prune-empty-group' });
        continue;
      }
      if (Array.isArray(group.hooks)) {
        for (const h of group.hooks) {
          if ('requires_approval' in h) {
            delete h.requires_approval;
            modified = true;
            actions.push({ type: 'strip-requires-approval' });
          }
          if ('approval_message' in h) {
            delete h.approval_message;
            modified = true;
            actions.push({ type: 'strip-approval-message' });
          }
        }
      }
    }
  };

  // Support both wrapped ({hooks: {PreToolUse: [...]}}) and unwrapped ({PreToolUse: [...]}) formats
  const hookData = data.hooks || data;
  if (hookData.PreToolUse) checkGroup(hookData.PreToolUse);
  if (hookData.PostToolUse) checkGroup(hookData.PostToolUse);

  if (!modified) {
    return { repaired: false };
  }

  const backupPath = `${filePath}.bak.${Date.now()}`;
  if (!dryRun) {
    fs.copyFileSync(filePath, backupPath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  }

  return { repaired: true, backupPath, actions };
}

module.exports.repairHookFile = repairHookFile;
