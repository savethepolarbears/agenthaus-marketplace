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
    provider.postInstall(sourceDir, safeTargetDir, { dryRun });
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

function updatePlugin(sourceDir, targetDir, { dryRun = false } = {}) {
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
    return { status: 'updated', path: destPath };
  } else if (lstat.isDirectory()) {
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
