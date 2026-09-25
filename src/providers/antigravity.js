'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

module.exports = {
  id: 'antigravity',
  name: 'Antigravity (Gemini CLI)',
  detect(cwd) {
    const home = os.homedir();
    return fs.existsSync(path.join(home, '.gemini', 'extensions')) ||
           fs.existsSync(path.join(home, '.gemini', 'settings.json')) ||
           fs.existsSync(path.join(home, '.gemini', 'antigravity')) ||
           fs.existsSync(path.join(home, '.gemini')) ||
           fs.existsSync(path.join(cwd, '.gemini')) ||
           fs.existsSync(path.join(cwd, '.agent'));
  },
  getTargetDir(cwd, mode) {
    if (mode === 'project') return path.join(cwd, '.gemini', 'extensions');
    return path.join(os.homedir(), '.gemini', 'extensions');
  },
  getCapabilities() {
    return { mcp: 'via gemini-settings', hooks: false, commands: 'partial', skills: true };
  },
  postInstall(sourceDir, targetDir, { dryRun = false } = {}) {
    const pluginName = path.basename(sourceDir);
    const destPath = path.join(targetDir, pluginName);

    // 1. Generate valid Gemini extension manifest (gemini-extension.json)
    // Avoid writing through a whole-directory symlink to sourceDir (which dirties
    // the source repo and fails if sourceDir is read-only). Convert the whole-directory
    // symlink into an installation-owned directory containing item-level symlinks
    // to sourceDir entries, plus the installation's own gemini-extension.json manifest.
    let isSymlink = false;
    let isDir = false;
    try {
      const st = fs.lstatSync(destPath);
      isSymlink = st.isSymbolicLink();
      isDir = st.isDirectory();
      if (isSymlink) {
        const rawTarget = fs.readlinkSync(destPath);
        const resolvedTarget = path.resolve(path.dirname(destPath), rawTarget);
        let isSame = false;
        try {
          isSame = fs.realpathSync(destPath) === fs.realpathSync(sourceDir);
        } catch {
          isSame = (resolvedTarget === sourceDir);
        }
        if (!isSame && fs.existsSync(resolvedTarget)) {
          return; // Preserve foreign symlink
        }
      }
    } catch {}

    if (isSymlink && !dryRun) {
      fs.unlinkSync(destPath);
      fs.mkdirSync(destPath, { recursive: true });
      for (const entry of fs.readdirSync(sourceDir)) {
        const srcEntry = path.join(sourceDir, entry);
        const dstEntry = path.join(destPath, entry);
        let stat;
        try {
          stat = fs.statSync(srcEntry);
        } catch {
          continue;
        }
        const symType = stat.isDirectory() ? (process.platform === 'win32' ? 'junction' : 'dir') : 'file';
        fs.symlinkSync(srcEntry, dstEntry, symType);
      }
    } else if (isDir && !dryRun) {
      const entries = fs.readdirSync(destPath);
      const srcEntries = new Set(fs.readdirSync(sourceDir));
      let hasSymlinksToSource = false;
      for (const entry of entries) {
        const dstEntry = path.join(destPath, entry);
        try {
          const st = fs.lstatSync(dstEntry);
          if (st.isSymbolicLink()) {
            const rawTarget = fs.readlinkSync(dstEntry);
            const resolvedTarget = path.resolve(destPath, rawTarget);
            if (resolvedTarget === path.join(sourceDir, entry) || resolvedTarget.startsWith(sourceDir + path.sep)) {
              hasSymlinksToSource = true;
              if (!srcEntries.has(entry)) {
                fs.unlinkSync(dstEntry);
              }
            }
          }
        } catch {}
      }

      if (hasSymlinksToSource) {
        for (const entry of srcEntries) {
          const dstEntry = path.join(destPath, entry);
          let exists = false;
          try {
            fs.lstatSync(dstEntry);
            exists = true;
          } catch {}
          if (!exists) {
            const srcEntry = path.join(sourceDir, entry);
            let stat;
            try { stat = fs.statSync(srcEntry); } catch { continue; }
            const symType = stat.isDirectory() ? (process.platform === 'win32' ? 'junction' : 'dir') : 'file';
            fs.symlinkSync(srcEntry, dstEntry, symType);
          }
        }
      }
    }

    const manifestPath = path.join(sourceDir, '.claude-plugin', 'plugin.json');
    let manifest = {};
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch {}
    }

    const geminiManifest = {
      name: manifest.name || pluginName,
      version: manifest.version || '1.0.0',
      description: manifest.description || '',
      contextFileName: 'GEMINI.md'
    };

    if (!dryRun) {
      fs.mkdirSync(destPath, { recursive: true });
      fs.writeFileSync(
        path.join(destPath, 'gemini-extension.json'),
        JSON.stringify(geminiManifest, null, 2) + '\n',
        'utf8'
      );
    }

    // 2. Merge MCP servers into settings.json (preserving existing settings or aborting on malformed JSON)
    const snippetPath = path.join(sourceDir, 'gemini-settings-snippet.json');
    let mcpServers = null;

    if (fs.existsSync(snippetPath)) {
      try {
        const snippet = JSON.parse(fs.readFileSync(snippetPath, 'utf8'));
        if (snippet.mcpServers && Object.keys(snippet.mcpServers).length > 0) {
          mcpServers = snippet.mcpServers;
        }
      } catch {}
    }

    if (!mcpServers) return;

    const settingsDir = path.dirname(targetDir);
    const settingsPath = path.join(settingsDir, 'settings.json');

    let settings = {};
    if (fs.existsSync(settingsPath)) {
      try {
        settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      } catch (err) {
        let backupMsg = '';
        if (!dryRun) {
          const backupPath = `${settingsPath}.bak.${Date.now()}`;
          fs.copyFileSync(settingsPath, backupPath);
          backupMsg = ` (backed up to ${backupPath})`;
        }
        throw new Error(`Malformed Gemini settings at ${settingsPath}${backupMsg}: ${err.message}. Aborting to preserve existing configuration.`);
      }
    }

    settings.mcpServers = { ...(settings.mcpServers || {}), ...mcpServers };

    if (!dryRun) {
      fs.mkdirSync(settingsDir, { recursive: true });
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    }
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    const settingsDir = path.dirname(targetDir);
    const settingsPath = path.join(settingsDir, 'settings.json');
    if (!fs.existsSync(settingsPath)) return;

    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (!settings.mcpServers) return;

      if (settings.mcpServers[pluginName]) {
        delete settings.mcpServers[pluginName];
        if (!dryRun) {
          fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
        }
      }
    } catch {}
  }
};
