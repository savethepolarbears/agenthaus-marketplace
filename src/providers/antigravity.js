'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { writeJsonAtomic } = require('../fs-utils.js');
const { readServersSnippet, syncPluginServers, removePluginServers } = require('./mcp-ownership.js');

const GEMINI_LABEL = 'Gemini settings';
const ANTIGRAVITY_LABEL = 'Antigravity MCP config';

// Gemini CLI reads mcpServers from <scope>/.gemini/settings.json.
function getGeminiSettingsPath(targetDir) {
  return path.join(path.dirname(targetDir), 'settings.json');
}

// Antigravity reads ~/.gemini/config/mcp_config.json (global) or .agents/mcp_config.json (workspace).
function getAntigravityConfigPath(targetDir) {
  const geminiDir = path.dirname(targetDir);
  if (path.resolve(geminiDir) === path.resolve(os.homedir(), '.gemini')) {
    return path.join(geminiDir, 'config', 'mcp_config.json');
  }
  return path.join(path.dirname(geminiDir), '.agents', 'mcp_config.json');
}

function isAntigravityPresent(configPath) {
  return fs.existsSync(path.dirname(configPath)) ||
         fs.existsSync(path.join(os.homedir(), '.gemini', 'antigravity'));
}

// Antigravity accepts only `serverUrl` for remote servers ("url"/"httpUrl" are rejected).
function toAntigravityServers(servers) {
  if (!servers) return servers;
  const out = {};
  for (const [key, srv] of Object.entries(servers)) {
    const remoteUrl = srv.serverUrl || srv.httpUrl || srv.url;
    if (!srv.command && remoteUrl) {
      const { url, httpUrl, type, ...rest } = srv;
      out[key] = { ...rest, serverUrl: remoteUrl };
    } else {
      out[key] = srv;
    }
  }
  return out;
}

function loadPluginServers(sourceDir) {
  return readServersSnippet(path.join(sourceDir, 'gemini-settings-snippet.json'), 'Gemini');
}

function syncAll(sourceDir, targetDir, { dryRun }) {
  const pluginName = path.basename(sourceDir);
  const { servers, failed } = loadPluginServers(sourceDir);
  if (failed) return false;
  const gemini = syncPluginServers({
    configPath: getGeminiSettingsPath(targetDir), pluginName, servers, label: GEMINI_LABEL, dryRun
  });
  const agConfigPath = getAntigravityConfigPath(targetDir);
  const antigravity = syncPluginServers({
    configPath: agConfigPath,
    pluginName,
    servers: isAntigravityPresent(agConfigPath) ? toAntigravityServers(servers) : null,
    label: ANTIGRAVITY_LABEL,
    dryRun
  });
  return gemini.changed || antigravity.changed;
}

module.exports = {
  id: 'antigravity',
  name: 'Antigravity / Gemini CLI',
  detect(cwd) {
    const home = os.homedir();
    return fs.existsSync(path.join(home, '.gemini')) ||
           fs.existsSync(path.join(cwd, '.gemini')) ||
           fs.existsSync(path.join(cwd, '.agents')) ||
           fs.existsSync(path.join(cwd, '.agent'));
  },
  getTargetDir(cwd, mode) {
    if (mode === 'project') return path.join(cwd, '.gemini', 'extensions');
    return path.join(os.homedir(), '.gemini', 'extensions');
  },
  getConfigPaths(cwd, home = os.homedir()) {
    return [
      path.join(home, '.gemini', 'settings.json'),
      path.join(cwd, '.gemini', 'settings.json'),
      path.join(home, '.gemini', 'config', 'mcp_config.json'),
      path.join(cwd, '.agents', 'mcp_config.json')
    ];
  },
  getCapabilities() {
    return { mcp: 'via settings.json / mcp_config.json', hooks: false, commands: 'partial', skills: true };
  },
  isMcpInSync(sourceDir, targetDir) {
    return !syncAll(sourceDir, targetDir, { dryRun: true });
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
      writeJsonAtomic(path.join(destPath, 'gemini-extension.json'), geminiManifest, { backup: false });
    }

    // 2. Reconcile MCP servers into Gemini CLI settings and Antigravity mcp_config.json
    syncAll(sourceDir, targetDir, { dryRun });
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    removePluginServers({ configPath: getGeminiSettingsPath(targetDir), pluginName, label: GEMINI_LABEL, dryRun });
    removePluginServers({ configPath: getAntigravityConfigPath(targetDir), pluginName, label: ANTIGRAVITY_LABEL, dryRun });
  }
};
