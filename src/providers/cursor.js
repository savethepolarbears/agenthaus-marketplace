'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

module.exports = {
  id: 'cursor',
  name: 'Cursor IDE',
  detect(cwd) {
    return fs.existsSync(path.join(os.homedir(), '.cursor')) ||
           fs.existsSync(path.join(cwd, '.cursor'));
  },
  getTargetDir(cwd, mode) {
    return path.join(mode === 'project' ? cwd : os.homedir(), '.cursor', 'plugins');
  },
  getCapabilities() {
    return { mcp: 'via .cursor/mcp.json', hooks: false, commands: 'partial', skills: true };
  },
  postInstall(sourceDir, targetDir, { dryRun = false } = {}) {
    const pluginName = path.basename(sourceDir);
    const cursorDir = path.dirname(targetDir);

    // 1. Copy rules/*.mdc if present
    const sourceRulesDir = path.join(sourceDir, '.cursor', 'rules');
    if (fs.existsSync(sourceRulesDir)) {
      try {
        const files = fs.readdirSync(sourceRulesDir);
        for (const file of files) {
          if (!file.endsWith('.mdc')) continue;
          const targetRulesDir = path.join(cursorDir, 'rules');
          const targetFile = path.join(targetRulesDir, file);
          if (!dryRun) {
            fs.mkdirSync(targetRulesDir, { recursive: true });
            fs.copyFileSync(path.join(sourceRulesDir, file), targetFile);
          }
        }
      } catch {}
    }

    // 2. Merge .cursor/mcp.json if present
    let mcpServers = null;
    const sourceMcpPath = path.join(sourceDir, '.cursor', 'mcp.json');
    if (fs.existsSync(sourceMcpPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(sourceMcpPath, 'utf8'));
        if (parsed.mcpServers && Object.keys(parsed.mcpServers).length > 0) {
          mcpServers = parsed.mcpServers;
        }
      } catch {}
    }

    if (mcpServers) {
      const configPath = path.join(cursorDir, 'mcp.json');
      let config = {};
      if (fs.existsSync(configPath)) {
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (err) {
          let backupMsg = '';
          if (!dryRun) {
            const backupPath = `${configPath}.bak.${Date.now()}`;
            fs.copyFileSync(configPath, backupPath);
            backupMsg = ` (backed up to ${backupPath})`;
          }
          throw new Error(`Malformed Cursor MCP config at ${configPath}${backupMsg}: ${err.message}`);
        }
      }

      if (!config.mcpServers) config.mcpServers = {};
      if (!config._agenthaus_mcp) config._agenthaus_mcp = {};

      const registeredKeys = config._agenthaus_mcp[pluginName] || [];
      const newRegisteredKeys = [];

      for (const [key, srvConfig] of Object.entries(mcpServers)) {
        let finalKey = key;
        if (registeredKeys.includes(key)) {
          finalKey = key;
        } else if (registeredKeys.includes(`${pluginName}-${key}`)) {
          finalKey = `${pluginName}-${key}`;
        } else if (config.mcpServers[key]) {
          if (JSON.stringify(config.mcpServers[key]) === JSON.stringify(srvConfig)) {
            finalKey = key;
          } else {
            finalKey = `${pluginName}-${key}`;
            console.log(`[warn] Cursor: MCP server '${key}' conflict detected; registered as '${finalKey}' for ${pluginName}`);
          }
        }
        config.mcpServers[finalKey] = srvConfig;
        newRegisteredKeys.push(finalKey);
      }

      for (const oldKey of registeredKeys) {
        if (!newRegisteredKeys.includes(oldKey)) {
          let isShared = false;
          if (config._agenthaus_mcp) {
            for (const [otherPlugin, keys] of Object.entries(config._agenthaus_mcp)) {
              if (otherPlugin !== pluginName && Array.isArray(keys) && keys.includes(oldKey)) {
                isShared = true;
                break;
              }
            }
          }
          if (!isShared) {
            delete config.mcpServers[oldKey];
          }
        }
      }

      if (newRegisteredKeys.length === 0) {
        delete config._agenthaus_mcp[pluginName];
        if (Object.keys(config._agenthaus_mcp).length === 0) {
          delete config._agenthaus_mcp;
        }
      } else {
        config._agenthaus_mcp[pluginName] = newRegisteredKeys;
      }
      if (config.mcpServers && Object.keys(config.mcpServers).length === 0) {
        delete config.mcpServers;
      }

      if (!dryRun) {
        fs.mkdirSync(cursorDir, { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
      }
    }
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    const cursorDir = path.dirname(targetDir);

    // 1. Remove rules/<pluginName>.mdc
    const mdcFile = path.join(cursorDir, 'rules', `${pluginName}.mdc`);
    if (fs.existsSync(mdcFile) && !dryRun) {
      try {
        fs.unlinkSync(mdcFile);
      } catch {}
    }

    // 2. Clean up MCP servers
    const configPath = path.join(cursorDir, 'mcp.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config._agenthaus_mcp && config._agenthaus_mcp[pluginName]) {
          const keysToRemove = config._agenthaus_mcp[pluginName];
          delete config._agenthaus_mcp[pluginName];
          if (Object.keys(config._agenthaus_mcp).length === 0) {
            delete config._agenthaus_mcp;
          }
          const remainingKeys = new Set();
          if (config._agenthaus_mcp) {
            for (const keys of Object.values(config._agenthaus_mcp)) {
              for (const k of keys) remainingKeys.add(k);
            }
          }
          for (const k of keysToRemove) {
            if (!remainingKeys.has(k)) {
              delete config.mcpServers[k];
            }
          }
          if (config.mcpServers && Object.keys(config.mcpServers).length === 0) {
            delete config.mcpServers;
          }
          if (!dryRun) {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
          }
        } else if (config.mcpServers) {
          if (config.mcpServers[pluginName]) {
            delete config.mcpServers[pluginName];
          }
          for (const k of Object.keys(config.mcpServers)) {
            if (k.startsWith(`${pluginName}-`)) {
              delete config.mcpServers[k];
            }
          }
          if (!dryRun) {
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
          }
        }
      } catch {}
    }
  }
};
