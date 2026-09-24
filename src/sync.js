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
