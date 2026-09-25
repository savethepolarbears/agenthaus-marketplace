const fs = require('fs');
const path = require('path');
const os = require('os');

function validateTargetSafety(targetDir) {
  if (!targetDir || typeof targetDir !== 'string') {
    throw new Error('targetDir must be a non-empty string');
  }

  let canonical;
  try {
    canonical = fs.realpathSync(targetDir);
  } catch (err) {
    // If it doesn't exist, resolve it manually
    canonical = path.resolve(targetDir);
  }

  const { root } = path.parse(canonical);
  let canonicalHome;
  try {
    canonicalHome = fs.realpathSync(os.homedir());
  } catch (err) {
    canonicalHome = os.homedir();
  }

  if (canonical === root || canonical === os.homedir() || canonical === canonicalHome) {
    throw new Error(`Refusing to operate on root, home, or shallow directory: ${targetDir}`);
  }

  // Calculate segment count relative to root
  const relativeToRoot = path.relative(root, canonical);
  const segCount = relativeToRoot.split(path.sep).filter(s => s.length > 0).length;

  if (segCount < 2) {
    throw new Error(`Refusing to operate on root, home, or shallow directory: ${targetDir}`);
  }

  return canonical;
}

const PLUGIN_NAME_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;

/**
 * Resolve <targetDir>/<pluginName>, rejecting names that could escape the target
 * directory (e.g. '../x') before any recursive delete is attempted.
 */
function resolvePluginPath(safeTargetDir, pluginName) {
  if (typeof pluginName !== 'string' || !PLUGIN_NAME_PATTERN.test(pluginName) || pluginName.includes('..')) {
    throw new Error(`Invalid plugin name: ${JSON.stringify(pluginName)}`);
  }
  const destPath = path.join(safeTargetDir, pluginName);
  if (path.dirname(destPath) !== safeTargetDir) {
    throw new Error(`Refusing to operate outside ${safeTargetDir}: ${pluginName}`);
  }
  return destPath;
}

function isManagedProvider(provider) {
  return Boolean(provider && typeof provider.install === 'function');
}

function getHybridSymlinkInfo(destPath, sourceDir) {
  let entries;
  try {
    entries = fs.readdirSync(destPath);
  } catch {
    return { isHybrid: false, isForeign: false };
  }

  let linkedToSourceCount = 0;
  let foreignLinkCount = 0;
  let realSource;
  try {
    realSource = fs.realpathSync(sourceDir);
  } catch {
    realSource = path.resolve(sourceDir);
  }

  for (const entry of entries) {
    const p = path.join(destPath, entry);
    try {
      const st = fs.lstatSync(p);
      if (st.isSymbolicLink()) {
        const rawTarget = fs.readlinkSync(p);
        const resolvedTarget = path.resolve(destPath, rawTarget);
        let realTarget;
        try {
          realTarget = fs.realpathSync(p);
        } catch {
          realTarget = resolvedTarget;
        }

        const isToSource = (realTarget === realSource || realTarget.startsWith(realSource + path.sep) ||
                            resolvedTarget === path.join(sourceDir, entry) || resolvedTarget.startsWith(sourceDir + path.sep));

        if (isToSource) {
          linkedToSourceCount++;
        } else {
          foreignLinkCount++;
        }
      }
    } catch {}
  }

  if (foreignLinkCount > 0) {
    return { isHybrid: false, isForeign: true };
  }
  if (linkedToSourceCount > 0) {
    return { isHybrid: true, isForeign: false };
  }
  return { isHybrid: false, isForeign: false };
}

function isForeignInstallation(destPath, sourceDir) {
  try {
    const lstat = fs.lstatSync(destPath);
    if (lstat.isSymbolicLink()) {
      const rawTarget = fs.readlinkSync(destPath);
      const resolvedTarget = path.resolve(path.dirname(destPath), rawTarget);
      let isSame = false;
      try {
        isSame = fs.realpathSync(destPath) === fs.realpathSync(sourceDir);
      } catch {
        isSame = (resolvedTarget === sourceDir);
      }
      if (!isSame && fs.existsSync(resolvedTarget)) {
        return true;
      }
      return false;
    } else if (lstat.isDirectory()) {
      if (fs.existsSync(path.join(destPath, '.git'))) {
        return true;
      }
      const hybridInfo = getHybridSymlinkInfo(destPath, sourceDir);
      if (hybridInfo.isForeign) {
        return true;
      }
      if (hybridInfo.isHybrid) {
        return false;
      }
      const metaPath = path.join(destPath, '.agenthaus-install.json');
      if (fs.existsSync(metaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          if (meta.managedBy === 'agenthaus' && meta.plugin === path.basename(sourceDir)) {
            return false;
          }
        } catch {}
      }
      // If it's a directory with no Agenthaus ownership metadata, treat as user-managed
      return true;
    }
  } catch {}
  return false;
}

function installPlugin(sourceDir, targetDir, { method = 'symlink', dryRun = false, provider = null } = {}) {
  if (method !== 'symlink' && method !== 'copy') {
    throw new Error(`Unsupported method: ${method}`);
  }
  const safeTargetDir = validateTargetSafety(targetDir);
  const destPath = resolvePluginPath(safeTargetDir, path.basename(sourceDir));
  if (isManagedProvider(provider)) {
    return provider.install(sourceDir, safeTargetDir, { dryRun });
  }

  let exists = false;
  try {
    fs.lstatSync(destPath);
    exists = true;
  } catch (e) {
    // doesn't exist
  }

  if (exists) {
    if (isForeignInstallation(destPath, sourceDir)) {
      const lstat = fs.lstatSync(destPath);
      const reason = lstat.isSymbolicLink() ? 'foreign symlink' : 'user-managed directory';
      return { status: 'skipped', reason, path: destPath };
    }
    if (provider && typeof provider.postInstall === 'function') {
      provider.postInstall(sourceDir, safeTargetDir, { dryRun });
    }
    return { status: 'skipped', reason: 'already exists', path: destPath };
  }

  if (!dryRun) {
    fs.mkdirSync(safeTargetDir, { recursive: true });
    if (method === 'symlink') {
      fs.symlinkSync(sourceDir, destPath, process.platform === 'win32' ? 'junction' : 'dir');
    } else if (method === 'copy') {
      fs.cpSync(sourceDir, destPath, { recursive: true });
      fs.writeFileSync(path.join(destPath, '.agenthaus-install.json'), JSON.stringify({
        plugin: path.basename(sourceDir),
        managedBy: 'agenthaus'
      }, null, 2) + '\n', 'utf8');
    }
  }

  if (provider && typeof provider.postInstall === 'function') {
    try {
      provider.postInstall(sourceDir, safeTargetDir, { dryRun });
    } catch (err) {
      if (!dryRun) {
        try {
          const lstat = fs.lstatSync(destPath);
          if (lstat.isSymbolicLink()) {
            fs.unlinkSync(destPath);
          } else if (lstat.isDirectory()) {
            fs.rmSync(destPath, { recursive: true, force: true });
          }
        } catch {}
      }
      throw err;
    }
  }

  return { status: 'installed', method, path: destPath };
}

function uninstallPlugin(targetDir, pluginName, { dryRun = false, provider = null, sourceDir = null } = {}) {
  const safeTargetDir = validateTargetSafety(targetDir);
  const destPath = resolvePluginPath(safeTargetDir, pluginName);
  if (isManagedProvider(provider)) {
    return provider.uninstall(pluginName, safeTargetDir, { dryRun, sourceDir });
  }

  let lstat;
  try {
    lstat = fs.lstatSync(destPath);
  } catch (e) {
    return { status: 'not_found', path: destPath };
  }

  if (sourceDir && isForeignInstallation(destPath, sourceDir)) {
    const reason = lstat.isSymbolicLink() ? 'foreign symlink' : 'user-managed directory';
    return { status: 'skipped', reason, path: destPath };
  }

  if (!dryRun) {
    if (lstat.isSymbolicLink()) {
      fs.unlinkSync(destPath);
    } else if (lstat.isDirectory()) {
      fs.rmSync(destPath, { recursive: true, force: true });
    }
  }

  if (provider && typeof provider.postUninstall === 'function') {
    provider.postUninstall(pluginName, safeTargetDir, { dryRun });
  }

  return { status: 'removed', path: destPath };
}

function updatePlugin(sourceDir, targetDir, { dryRun = false, provider = null } = {}) {
  const safeTargetDir = validateTargetSafety(targetDir);
  const pluginName = path.basename(sourceDir);
  const destPath = resolvePluginPath(safeTargetDir, pluginName);
  if (isManagedProvider(provider)) {
    return provider.update(sourceDir, safeTargetDir, { dryRun });
  }

  let lstat;
  try {
    lstat = fs.lstatSync(destPath);
  } catch (e) {
    return { status: 'not_found', path: destPath };
  }

  if (lstat.isSymbolicLink()) {
    const rawTarget = fs.readlinkSync(destPath);
    const resolvedTarget = path.resolve(path.dirname(destPath), rawTarget);

    let isSame = false;
    try {
      isSame = fs.realpathSync(destPath) === fs.realpathSync(sourceDir);
    } catch (e) {
      isSame = (resolvedTarget === sourceDir);
    }
    if (isSame) {
      if (provider && typeof provider.postInstall === 'function') {
        provider.postInstall(sourceDir, safeTargetDir, { dryRun });
        return { status: 'updated', path: destPath };
      }
      return { status: 'skipped', path: destPath };
    }

    // Preserve valid links: if the target exists and is not our sourceDir,
    // it is a valid foreign symlink (including user forks with conventional /plugins/<name> layout).
    if (fs.existsSync(resolvedTarget)) {
      return { status: 'skipped', reason: 'foreign symlink', path: destPath };
    }

    // For dangling symlinks (target does not exist), check if it pointed to a marketplace plugins directory
    const targetNorm = process.platform === 'win32' ? resolvedTarget.toLowerCase() : resolvedTarget;
    const expectedSuffix = `${path.sep}plugins${path.sep}${pluginName}`;
    const expectedNorm = process.platform === 'win32' ? expectedSuffix.toLowerCase() : expectedSuffix;
    const isOurBrokenLink = path.basename(resolvedTarget) === pluginName && targetNorm.endsWith(expectedNorm);

    if (!isOurBrokenLink) {
      return { status: 'skipped', reason: 'foreign symlink', path: destPath };
    }

    if (!dryRun) {
      fs.unlinkSync(destPath);
      fs.symlinkSync(sourceDir, destPath, process.platform === 'win32' ? 'junction' : 'dir');
    }
    if (provider && typeof provider.postInstall === 'function') {
      provider.postInstall(sourceDir, safeTargetDir, { dryRun });
    }
    return { status: 'updated', path: destPath };
  } else if (lstat.isDirectory()) {
    const hybridInfo = getHybridSymlinkInfo(destPath, sourceDir);
    if (hybridInfo.isForeign) {
      return { status: 'skipped', reason: 'foreign symlink', path: destPath };
    }

    if (hybridInfo.isHybrid) {
      const sourcePkgPath = path.join(sourceDir, '.claude-plugin', 'plugin.json');
      let sourceVersion = '0.0.0';
      try { sourceVersion = JSON.parse(fs.readFileSync(sourcePkgPath, 'utf8')).version || '0.0.0'; } catch {}

      const geminiExtPath = path.join(destPath, 'gemini-extension.json');
      let destVersion = '0.0.0';
      let hasGeminiManifest = false;
      if (fs.existsSync(geminiExtPath)) {
        hasGeminiManifest = true;
        try { destVersion = JSON.parse(fs.readFileSync(geminiExtPath, 'utf8')).version || '0.0.0'; } catch {}
      }

      const destEntries = fs.readdirSync(destPath);
      const sourceEntries = new Set(fs.readdirSync(sourceDir));

      let hasMissingEntries = false;
      for (const entry of sourceEntries) {
        const dstEntry = path.join(destPath, entry);
        let exists = false;
        try {
          fs.lstatSync(dstEntry);
          exists = true;
        } catch {}
        if (!exists) {
          hasMissingEntries = true;
          break;
        }
      }

      let hasRemovedEntries = false;
      for (const entry of destEntries) {
        const dstEntry = path.join(destPath, entry);
        try {
          const st = fs.lstatSync(dstEntry);
          if (st.isSymbolicLink() && !sourceEntries.has(entry)) {
            hasRemovedEntries = true;
            break;
          }
        } catch {}
      }

      // Provider-specific derived config (MCP registrations) may drift independently of files.
      const mcpDrifted = Boolean(provider && typeof provider.isMcpInSync === 'function' &&
        !provider.isMcpInSync(sourceDir, safeTargetDir));

      const needsUpdate = (sourceVersion !== destVersion) || !hasGeminiManifest || hasMissingEntries || hasRemovedEntries || mcpDrifted;

      if (!needsUpdate) {
        return { status: 'skipped', path: destPath };
      }

      if (!dryRun) {
        for (const entry of destEntries) {
          const dstEntry = path.join(destPath, entry);
          try {
            const st = fs.lstatSync(dstEntry);
            if (st.isSymbolicLink() && !sourceEntries.has(entry)) {
              fs.unlinkSync(dstEntry);
            }
          } catch {}
        }

        for (const entry of sourceEntries) {
          const dstEntry = path.join(destPath, entry);
          let exists = false;
          try {
            fs.lstatSync(dstEntry);
            exists = true;
          } catch {}
          if (!exists) {
            const srcEntry = path.join(sourceDir, entry);
            let stat;
            try {
              stat = fs.statSync(srcEntry);
              const symType = stat.isDirectory() ? (process.platform === 'win32' ? 'junction' : 'dir') : 'file';
              fs.symlinkSync(srcEntry, dstEntry, symType);
            } catch {}
          }
        }
      }

      if (provider && typeof provider.postInstall === 'function') {
        provider.postInstall(sourceDir, safeTargetDir, { dryRun });
      }

      return { status: 'updated', path: destPath, fromVersion: destVersion, toVersion: sourceVersion };
    }

    // Verify ownership before modifying or deleting copied directory
    if (isForeignInstallation(destPath, sourceDir)) {
      return { status: 'skipped', reason: 'user-managed directory', path: destPath };
    }

    const sourcePkgPath = path.join(sourceDir, '.claude-plugin', 'plugin.json');
    const destPkgPath = path.join(destPath, '.claude-plugin', 'plugin.json');
    let sourceVersion = '0.0.0';
    let destVersion = '0.0.0';

    try { sourceVersion = JSON.parse(fs.readFileSync(sourcePkgPath)).version || '0.0.0'; } catch (e) {}
    try { destVersion = JSON.parse(fs.readFileSync(destPkgPath)).version || '0.0.0'; } catch (e) {}

    // basic semver string compare for now
    if (sourceVersion !== destVersion) {
      if (!dryRun) {
        fs.rmSync(destPath, { recursive: true, force: true });
        fs.cpSync(sourceDir, destPath, { recursive: true });
        fs.writeFileSync(path.join(destPath, '.agenthaus-install.json'), JSON.stringify({
          plugin: pluginName,
          managedBy: 'agenthaus'
        }, null, 2) + '\n', 'utf8');
      }
      if (provider && typeof provider.postInstall === 'function') {
        provider.postInstall(sourceDir, safeTargetDir, { dryRun });
      }
      return { status: 'updated', path: destPath, fromVersion: destVersion, toVersion: sourceVersion };
    }
    return { status: 'skipped', path: destPath };
  }

  return { status: 'skipped', path: destPath };
}

function isInstalled(sourceDir, targetDir, provider = null) {
  const pluginName = path.basename(sourceDir);
  if (provider && typeof provider.isInstalled === 'function') {
    return provider.isInstalled(pluginName, targetDir, { sourceDir });
  }
  try {
    fs.lstatSync(path.join(targetDir, pluginName));
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  validateTargetSafety,
  resolvePluginPath,
  isInstalled,
  installPlugin,
  uninstallPlugin,
  updatePlugin
};
