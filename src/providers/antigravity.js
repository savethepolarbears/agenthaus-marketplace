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
    let snippetParseFailed = false;

    if (fs.existsSync(snippetPath)) {
      try {
        const snippet = JSON.parse(fs.readFileSync(snippetPath, 'utf8'));
        if (typeof snippet !== 'object' || snippet === null || Array.isArray(snippet)) {
          snippetParseFailed = true;
          console.warn(`[warn] Gemini: Malformed snippet at ${snippetPath}: expected JSON object. Preserving existing MCP registrations.`);
        } else if (snippet.mcpServers !== undefined) {
          if (typeof snippet.mcpServers === 'object' && snippet.mcpServers !== null && !Array.isArray(snippet.mcpServers)) {
            mcpServers = snippet.mcpServers;
          } else {
            snippetParseFailed = true;
            console.warn(`[warn] Gemini: Invalid 'mcpServers' in snippet at ${snippetPath}: expected JSON object. Preserving existing MCP registrations.`);
          }
        } else {
          snippetParseFailed = true;
          console.warn(`[warn] Gemini: Snippet at ${snippetPath} missing 'mcpServers'. Preserving existing MCP registrations.`);
        }
      } catch (err) {
        snippetParseFailed = true;
        console.warn(`[warn] Gemini: Malformed snippet at ${snippetPath}: ${err.message}. Preserving existing MCP registrations.`);
      }
    }

    if (snippetParseFailed) return;

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

    const hasPreviousRegistration = settings._agenthaus_mcp &&
      Array.isArray(settings._agenthaus_mcp[pluginName]) &&
      settings._agenthaus_mcp[pluginName].length > 0;

    if (!mcpServers && !hasPreviousRegistration) return;
    if (!mcpServers) mcpServers = {};

    if (!settings.mcpServers) settings.mcpServers = {};
    if (!settings._agenthaus_mcp) settings._agenthaus_mcp = {};

    const registeredKeys = settings._agenthaus_mcp[pluginName] || [];
    const previousSourceMap = (settings._agenthaus_mcp_map && settings._agenthaus_mcp_map[pluginName]) || {};
    const newRegisteredKeys = [];
    const newSourceMap = {};

    const hasOtherOwners = (candidateKey) => Object.entries(settings._agenthaus_mcp || {}).some(
      ([otherPlugin, keys]) => otherPlugin !== pluginName && Array.isArray(keys) && keys.includes(candidateKey)
    );

    const findAvailableNamespacedKey = (baseKey, srvConfig) => {
      let candidate = baseKey;
      let counter = 1;
      while (true) {
        const existing = settings.mcpServers[candidate];
        const isClaimedInThisPass = newRegisteredKeys.includes(candidate);
        if (!existing && !isClaimedInThisPass) {
          return candidate;
        }
        if (existing && JSON.stringify(existing) === JSON.stringify(srvConfig) && !isClaimedInThisPass) {
          return candidate;
        }
        counter++;
        candidate = `${baseKey}-${counter}`;
      }
    };

    for (const [key, srvConfig] of Object.entries(mcpServers)) {
      let finalKey = key;
      const previousDest = previousSourceMap[key];

      if (previousDest && !newRegisteredKeys.includes(previousDest)) {
        if (hasOtherOwners(previousDest) && JSON.stringify(settings.mcpServers[previousDest]) !== JSON.stringify(srvConfig)) {
          finalKey = findAvailableNamespacedKey(`${pluginName}-${key}`, srvConfig);
          console.log(`[warn] Gemini: MCP server '${key}' diverged from shared configuration; registered as '${finalKey}' for ${pluginName}`);
        } else {
          finalKey = previousDest;
        }
      } else if (!previousDest && Object.keys(previousSourceMap).length === 0 && registeredKeys.includes(key) && !newRegisteredKeys.includes(key)) {
        if (hasOtherOwners(key) && JSON.stringify(settings.mcpServers[key]) !== JSON.stringify(srvConfig)) {
          finalKey = findAvailableNamespacedKey(`${pluginName}-${key}`, srvConfig);
          console.log(`[warn] Gemini: MCP server '${key}' diverged from shared configuration; registered as '${finalKey}' for ${pluginName}`);
        } else {
          finalKey = key;
        }
      } else {
        const baseKey = `${pluginName}-${key}`;
        if (settings.mcpServers[key] && !newRegisteredKeys.includes(key)) {
          if (JSON.stringify(settings.mcpServers[key]) === JSON.stringify(srvConfig)) {
            finalKey = key;
          } else {
            finalKey = findAvailableNamespacedKey(baseKey, srvConfig);
            console.log(`[warn] Gemini: MCP server '${key}' conflict detected; registered as '${finalKey}' for ${pluginName}`);
          }
        } else if (!settings.mcpServers[key] && !newRegisteredKeys.includes(key)) {
          finalKey = key;
        } else {
          finalKey = findAvailableNamespacedKey(baseKey, srvConfig);
        }
      }
      settings.mcpServers[finalKey] = srvConfig;
      newRegisteredKeys.push(finalKey);
      newSourceMap[key] = finalKey;
    }

    for (const oldKey of registeredKeys) {
      if (!newRegisteredKeys.includes(oldKey)) {
        let isShared = false;
        if (settings._agenthaus_mcp) {
          for (const [otherPlugin, keys] of Object.entries(settings._agenthaus_mcp)) {
            if (otherPlugin !== pluginName && Array.isArray(keys) && keys.includes(oldKey)) {
              isShared = true;
              break;
            }
          }
        }
        if (!isShared) {
          delete settings.mcpServers[oldKey];
        }
      }
    }

    if (newRegisteredKeys.length === 0) {
      delete settings._agenthaus_mcp[pluginName];
      if (settings._agenthaus_mcp_map) {
        delete settings._agenthaus_mcp_map[pluginName];
        if (Object.keys(settings._agenthaus_mcp_map).length === 0) {
          delete settings._agenthaus_mcp_map;
        }
      }
      if (Object.keys(settings._agenthaus_mcp).length === 0) {
        delete settings._agenthaus_mcp;
      }
    } else {
      settings._agenthaus_mcp[pluginName] = newRegisteredKeys;
      if (!settings._agenthaus_mcp_map) settings._agenthaus_mcp_map = {};
      settings._agenthaus_mcp_map[pluginName] = newSourceMap;
    }
    if (settings.mcpServers && Object.keys(settings.mcpServers).length === 0) {
      delete settings.mcpServers;
    }

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
      if (settings._agenthaus_mcp && settings._agenthaus_mcp[pluginName]) {
        const keysToRemove = settings._agenthaus_mcp[pluginName];
        delete settings._agenthaus_mcp[pluginName];
        if (Object.keys(settings._agenthaus_mcp).length === 0) {
          delete settings._agenthaus_mcp;
        }
        if (settings._agenthaus_mcp_map) {
          delete settings._agenthaus_mcp_map[pluginName];
          if (Object.keys(settings._agenthaus_mcp_map).length === 0) {
            delete settings._agenthaus_mcp_map;
          }
        }
        const remainingKeys = new Set();
        if (settings._agenthaus_mcp) {
          for (const keys of Object.values(settings._agenthaus_mcp)) {
            for (const k of keys) remainingKeys.add(k);
          }
        }
        for (const k of keysToRemove) {
          if (!remainingKeys.has(k)) {
            delete settings.mcpServers[k];
          }
        }
        if (settings.mcpServers && Object.keys(settings.mcpServers).length === 0) {
          delete settings.mcpServers;
        }
        if (!dryRun) {
          fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
        }
      } else if (settings.mcpServers) {
        if (settings.mcpServers[pluginName]) {
          delete settings.mcpServers[pluginName];
        }
        for (const k of Object.keys(settings.mcpServers)) {
          if (k.startsWith(`${pluginName}-`)) {
            delete settings.mcpServers[k];
          }
        }
        if (settings._agenthaus_mcp_map) {
          delete settings._agenthaus_mcp_map[pluginName];
          if (Object.keys(settings._agenthaus_mcp_map).length === 0) {
            delete settings._agenthaus_mcp_map;
          }
        }
        if (!dryRun) {
          fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
        }
      }
    } catch {}
  }
};
