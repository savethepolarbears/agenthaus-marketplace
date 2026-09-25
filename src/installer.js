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
      const hybridInfo = getHybridSymlinkInfo(destPath, sourceDir);
      if (hybridInfo.isForeign) {
        return true;
      }
      const manifestPath = path.join(destPath, '.claude-plugin', 'plugin.json');
      if (fs.existsSync(manifestPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          if (pkg.name && pkg.name !== path.basename(sourceDir)) {
            return true;
          }
        } catch {}
      }
      return false;
    }
  } catch {}
  return false;
}

function installPlugin(sourceDir, targetDir, { method = 'symlink', dryRun = false, provider = null } = {}) {
  if (method !== 'symlink' && method !== 'copy') {
    throw new Error(`Unsupported method: ${method}`);
  }
  const safeTargetDir = validateTargetSafety(targetDir);
  const destPath = path.join(safeTargetDir, path.basename(sourceDir));

  let exists = false;
  try {
    fs.lstatSync(destPath);
    exists = true;
  } catch (e) {
    // doesn't exist
  }

  if (exists) {
    if (isForeignInstallation(destPath, sourceDir)) {
      return { status: 'skipped', reason: 'foreign symlink', path: destPath };
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

function uninstallPlugin(targetDir, pluginName, { dryRun = false, provider = null } = {}) {
  const safeTargetDir = validateTargetSafety(targetDir);
  const destPath = path.join(safeTargetDir, pluginName);

  let lstat;
  try {
    lstat = fs.lstatSync(destPath);
  } catch (e) {
    return { status: 'not_found', path: destPath };
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
  const destPath = path.join(safeTargetDir, pluginName);

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

      let snippetChanged = false;
      const snippetPath = path.join(sourceDir, 'gemini-settings-snippet.json');
      if (fs.existsSync(snippetPath)) {
        try {
          const snippet = JSON.parse(fs.readFileSync(snippetPath, 'utf8'));
          if (snippet.mcpServers && Object.keys(snippet.mcpServers).length > 0) {
            const settingsPath = path.join(path.dirname(safeTargetDir), 'settings.json');
            if (!fs.existsSync(settingsPath)) {
              snippetChanged = true;
            } else {
              const currentSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
              const currentServers = currentSettings.mcpServers || {};
              for (const [k, v] of Object.entries(snippet.mcpServers)) {
                if (JSON.stringify(currentServers[k]) !== JSON.stringify(v)) {
                  snippetChanged = true;
                  break;
                }
              }
            }
          }
        } catch {}
      }

      const needsUpdate = (sourceVersion !== destVersion) || !hasGeminiManifest || hasMissingEntries || hasRemovedEntries || snippetChanged;

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

module.exports = {
  validateTargetSafety,
  installPlugin,
  uninstallPlugin,
  updatePlugin
};
