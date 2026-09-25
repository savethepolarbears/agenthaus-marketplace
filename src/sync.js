const fs = require('fs');
const path = require('path');
const { isMarketplaceHybrid } = require('./hybrid.js');
const { writeFileAtomic } = require('./fs-utils.js');

const STALE_AGE_MS = 3600000;
const ATOMIC_TMP_PATTERN = /\.\d+\.[0-9a-f]{8}\.tmp$/;

function isPathUnder(childPath, parentPath) {
  const normChild = process.platform === 'win32' ? path.normalize(childPath).toLowerCase() : path.normalize(childPath);
  const normParent = process.platform === 'win32' ? path.normalize(parentPath).toLowerCase() : path.normalize(parentPath);
  const rel = path.relative(normParent, normChild);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function isPriorPluginsLocation(resolvedTarget, entry) {
  const targetNorm = process.platform === 'win32' ? path.normalize(resolvedTarget).toLowerCase() : path.normalize(resolvedTarget);
  const expectedSuffix = `${path.sep}plugins${path.sep}${entry}`;
  const expectedNorm = process.platform === 'win32' ? expectedSuffix.toLowerCase() : expectedSuffix;
  return path.basename(resolvedTarget) === entry && targetNorm.endsWith(expectedNorm);
}

function cleanOrphanedCache(cacheDir, { dryRun = false } = {}) {
  if (!fs.existsSync(cacheDir)) return [];

  const actions = [];
  const entries = fs.readdirSync(cacheDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && (entry.name.startsWith('temp_git_') || entry.name.startsWith('temp_subdir_'))) {
      const fullPath = path.join(cacheDir, entry.name);
      try {
        // Note: directory mtime only changes when immediate entries are added/removed.
        // For an hour-long cleanup threshold, this is sufficient.
        const stat = fs.statSync(fullPath);
        if (Date.now() - stat.mtimeMs > STALE_AGE_MS) {
          actions.push({ type: 'prune-temp', path: fullPath });
          
          if (!dryRun) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          }
        }
      } catch (e) {
        // Directory may have been removed concurrently mid-sweep; ignore ENOENT
        continue;
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
        
        const isOurs = isPathUnder(resolvedTarget, repoPluginsDir) || isPriorPluginsLocation(resolvedTarget, entry);
        if (!isOurs) {
          actions.push({ type: 'foreign', path: entryPath });
          continue;
        }

        if (!fs.existsSync(resolvedTarget)) {
          // dangling symlink
          const pluginSource = path.join(repoPluginsDir, entry);
          if (fs.existsSync(pluginSource)) {
            actions.push({ type: 'repair-link', path: entryPath, target: pluginSource });
            if (!dryRun) {
              fs.unlinkSync(entryPath);
              fs.symlinkSync(pluginSource, entryPath, process.platform === 'win32' ? 'junction' : 'dir');
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

  const stripApprovalKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    if ('requires_approval' in obj) {
      delete obj.requires_approval;
      modified = true;
      actions.push({ type: 'strip-requires-approval' });
    }
    if ('approval_message' in obj) {
      delete obj.approval_message;
      modified = true;
      actions.push({ type: 'strip-approval-message' });
    }
  };

  // Strip at root level
  stripApprovalKeys(data);
  if (data.hooks && typeof data.hooks === 'object') {
    stripApprovalKeys(data.hooks);
  }

  const checkGroup = (groups) => {
    if (!Array.isArray(groups)) return;
    for (let i = groups.length - 1; i >= 0; i--) {
      const group = groups[i];
      if (!group || typeof group !== 'object') continue;
      stripApprovalKeys(group);

      if (Array.isArray(group.hooks) && group.hooks.length === 0) {
        groups.splice(i, 1);
        modified = true;
        actions.push({ type: 'prune-empty-group' });
        continue;
      }
      if (Array.isArray(group.hooks)) {
        for (const h of group.hooks) {
          stripApprovalKeys(h);
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

  const backupPath = dryRun ? null : `${filePath}.bak.${Date.now()}`;
  if (!dryRun) {
    fs.copyFileSync(filePath, backupPath);
    writeFileAtomic(filePath, JSON.stringify(data, null, 2) + '\n', { backup: false });
  }

  return { repaired: true, backupPath, actions };
}

function getPluginHookFiles(pluginDir) {
  const hookFiles = new Set();
  const manifestPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (Array.isArray(manifest.hooks)) {
        for (const hookRef of manifest.hooks) {
          if (typeof hookRef === 'string') {
            hookFiles.add(path.resolve(pluginDir, hookRef));
          }
        }
      } else if (typeof manifest.hooks === 'string') {
        hookFiles.add(path.resolve(pluginDir, manifest.hooks));
      }
    } catch {}
  }
  const defaultHook = path.join(pluginDir, 'hooks', 'hooks.json');
  if (fs.existsSync(defaultHook)) {
    hookFiles.add(defaultHook);
  }
  return Array.from(hookFiles);
}

/**
 * Remove temp files left behind when an atomic config write was interrupted
 * (<config>.<pid>.<hex>.tmp next to each provider config), once they are stale.
 */
function cleanStaleTempFiles(configPaths, { dryRun = false } = {}) {
  const actions = [];
  for (const dir of new Set(configPaths.map(p => path.dirname(p)))) {
    let entries;
    try { entries = fs.readdirSync(dir); } catch { continue; }
    for (const entry of entries) {
      if (!ATOMIC_TMP_PATTERN.test(entry)) continue;
      const fullPath = path.join(dir, entry);
      try {
        if (Date.now() - fs.statSync(fullPath).mtimeMs <= STALE_AGE_MS) continue;
        actions.push({ type: 'prune-temp', path: fullPath });
        if (!dryRun) fs.unlinkSync(fullPath);
      } catch {}
    }
  }
  return actions;
}

/**
 * Strip deprecated approval keys from hook files of copied catalog plugins in a
 * provider target dir. Symlinked and marketplace-hybrid installs are skipped
 * because their hook files belong to the marketplace checkout.
 */
function repairInstalledHooks(targetDir, { catalogNames, repoPluginsDir, dryRun = false }) {
  const results = [];
  if (!fs.existsSync(targetDir)) return results;
  for (const entry of fs.readdirSync(targetDir)) {
    if (!catalogNames.has(entry)) continue;
    const entryDir = path.join(targetDir, entry);
    try {
      if (fs.lstatSync(entryDir).isSymbolicLink()) continue;
      if (isMarketplaceHybrid(entryDir, entry)) continue;
      for (const hookFile of getPluginHookFiles(entryDir)) {
        if (!fs.existsSync(hookFile)) continue;
        try {
          const real = fs.realpathSync(hookFile);
          if (real === repoPluginsDir || real.startsWith(repoPluginsDir + path.sep)) continue;
        } catch {}
        const res = repairHookFile(hookFile, { dryRun });
        if (res.repaired) results.push({ plugin: entry, hookFile, actions: res.actions });
      }
    } catch {}
  }
  return results;
}

module.exports = {
  cleanOrphanedCache,
  cleanStaleTempFiles,
  repairInstalledHooks,
  healDirectorySymlinks,
  repairHookFile,
  getPluginHookFiles
};
