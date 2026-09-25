'use strict';

const fs = require('node:fs');
const path = require('node:path');

function defaultRepoRoot() {
  return process.env.AGENTHAUS_REPO_ROOT ? path.resolve(process.env.AGENTHAUS_REPO_ROOT) : path.resolve(__dirname, '..');
}

function repoPluginsDirFor(repoRoot) {
  return process.env.AGENTHAUS_PLUGINS_DIR ? path.resolve(process.env.AGENTHAUS_PLUGINS_DIR) : path.resolve(repoRoot, 'plugins');
}

/**
 * True when `dir` is an installation-owned directory whose entries are symlinks
 * into this marketplace checkout (the Antigravity/Gemini extension layout).
 */
function isMarketplaceHybrid(dir, pluginName = path.basename(dir), repoRoot = defaultRepoRoot()) {
  try {
    const entries = fs.readdirSync(dir);
    const repoPlugins = repoPluginsDirFor(repoRoot);
    let realRepoPlugins;
    try {
      realRepoPlugins = fs.realpathSync(repoPlugins);
    } catch {
      realRepoPlugins = repoPlugins;
    }

    const expectedSourceDir = path.join(repoPlugins, pluginName);
    let realExpectedSource;
    try {
      realExpectedSource = fs.realpathSync(expectedSourceDir);
    } catch {
      realExpectedSource = expectedSourceDir;
    }

    const sep = path.sep;

    for (const entry of entries) {
      const p = path.join(dir, entry);
      try {
        const st = fs.lstatSync(p);
        if (st.isSymbolicLink()) {
          const rawTarget = fs.readlinkSync(p);
          const resolvedTarget = path.resolve(dir, rawTarget);
          let realTarget;
          try {
            realTarget = fs.realpathSync(p);
          } catch {
            realTarget = resolvedTarget;
          }

          // Strictly verify if symlink target is within this marketplace checkout
          let isMarketplaceTarget = false;
          if (process.platform === 'win32') {
            const realTargetLower = realTarget.toLowerCase();
            const resolvedTargetLower = resolvedTarget.toLowerCase();
            const realRepoPluginsLower = realRepoPlugins.toLowerCase();
            const repoPluginsLower = repoPlugins.toLowerCase();
            const realExpectedSourceLower = realExpectedSource.toLowerCase();
            const expectedSourceDirLower = expectedSourceDir.toLowerCase();
            isMarketplaceTarget =
              realTargetLower === realRepoPluginsLower || realTargetLower.startsWith(realRepoPluginsLower + sep) ||
              resolvedTargetLower === repoPluginsLower || resolvedTargetLower.startsWith(repoPluginsLower + sep) ||
              realTargetLower === realExpectedSourceLower || realTargetLower.startsWith(realExpectedSourceLower + sep) ||
              resolvedTargetLower === expectedSourceDirLower || resolvedTargetLower.startsWith(expectedSourceDirLower + sep);
          } else {
            isMarketplaceTarget =
              realTarget === realRepoPlugins || realTarget.startsWith(realRepoPlugins + sep) ||
              resolvedTarget === repoPlugins || resolvedTarget.startsWith(repoPlugins + sep) ||
              realTarget === realExpectedSource || realTarget.startsWith(realExpectedSource + sep) ||
              resolvedTarget === expectedSourceDir || resolvedTarget.startsWith(expectedSourceDir + sep);
          }

          if (isMarketplaceTarget) {
            return true;
          }
        }
      } catch {}
    }
  } catch {}
  return false;
}

module.exports = { isMarketplaceHybrid };
