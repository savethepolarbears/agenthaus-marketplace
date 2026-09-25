'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

module.exports = {
  id: 'windsurf',
  name: 'Windsurf (Codeium)',
  detect(cwd) {
    return fs.existsSync(path.join(os.homedir(), '.codeium', 'windsurf')) ||
           fs.existsSync(path.join(cwd, '.codeium'));
  },
  getTargetDir(cwd, mode) {
    if (mode === 'project') return path.join(cwd, '.codeium', 'plugins');
    return path.join(os.homedir(), '.codeium', 'windsurf', 'plugins');
  },
  getCapabilities() {
    return { mcp: 'via mcp_config.json', hooks: false, commands: 'partial', skills: true };
  },
  postInstall(sourceDir, targetDir, { dryRun = false } = {}) {
    // 1. Merge MCP servers into ~/.codeium/windsurf/mcp_config.json
    let mcpServers = null;
    let snippetParseFailed = false;
    const snippetPath = path.join(sourceDir, 'windsurf-mcp-snippet.json');
    const mcpJsonPath = path.join(sourceDir, '.mcp.json');

    if (fs.existsSync(snippetPath)) {
      try {
        const snippet = JSON.parse(fs.readFileSync(snippetPath, 'utf8'));
        if (typeof snippet !== 'object' || snippet === null || Array.isArray(snippet)) {
          snippetParseFailed = true;
          console.warn(`[warn] Windsurf: Malformed MCP snippet at ${snippetPath}: expected JSON object. Preserving existing MCP registrations.`);
        } else if (snippet.mcpServers !== undefined) {
          if (typeof snippet.mcpServers === 'object' && snippet.mcpServers !== null && !Array.isArray(snippet.mcpServers)) {
            mcpServers = snippet.mcpServers;
          } else {
            snippetParseFailed = true;
            console.warn(`[warn] Windsurf: Invalid 'mcpServers' in snippet at ${snippetPath}: expected JSON object. Preserving existing MCP registrations.`);
          }
        } else {
          snippetParseFailed = true;
          console.warn(`[warn] Windsurf: Snippet at ${snippetPath} missing 'mcpServers'. Preserving existing MCP registrations.`);
        }
      } catch (err) {
        snippetParseFailed = true;
        console.warn(`[warn] Windsurf: Malformed MCP snippet at ${snippetPath}: ${err.message}. Preserving existing MCP registrations.`);
      }
    } else if (fs.existsSync(mcpJsonPath)) {
      try {
        const mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
        if (typeof mcpJson !== 'object' || mcpJson === null || Array.isArray(mcpJson)) {
          snippetParseFailed = true;
          console.warn(`[warn] Windsurf: Malformed .mcp.json at ${mcpJsonPath}: expected JSON object. Preserving existing MCP registrations.`);
        } else if (mcpJson.mcpServers !== undefined) {
          if (typeof mcpJson.mcpServers === 'object' && mcpJson.mcpServers !== null && !Array.isArray(mcpJson.mcpServers)) {
            mcpServers = mcpJson.mcpServers;
          } else {
            snippetParseFailed = true;
            console.warn(`[warn] Windsurf: Invalid 'mcpServers' in .mcp.json at ${mcpJsonPath}: expected JSON object. Preserving existing MCP registrations.`);
          }
        } else {
          snippetParseFailed = true;
          console.warn(`[warn] Windsurf: .mcp.json at ${mcpJsonPath} missing 'mcpServers'. Preserving existing MCP registrations.`);
        }
      } catch (err) {
        snippetParseFailed = true;
        console.warn(`[warn] Windsurf: Malformed .mcp.json at ${mcpJsonPath}: ${err.message}. Preserving existing MCP registrations.`);
      }
    }

    if (!snippetParseFailed) {
      const pluginName = path.basename(sourceDir);
      const configDir = path.join(os.homedir(), '.codeium', 'windsurf');
      const configPath = path.join(configDir, 'mcp_config.json');

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
          throw new Error(`Malformed Windsurf MCP config at ${configPath}${backupMsg}: ${err.message}`);
        }
      }

      const hasPreviousRegistration = config._agenthaus_mcp &&
        Array.isArray(config._agenthaus_mcp[pluginName]) &&
        config._agenthaus_mcp[pluginName].length > 0;

      if (mcpServers || hasPreviousRegistration) {
      if (!mcpServers) mcpServers = {};

      if (!config.mcpServers) config.mcpServers = {};
      if (!config._agenthaus_mcp) config._agenthaus_mcp = {};

      const registeredKeys = config._agenthaus_mcp[pluginName] || [];
      const newRegisteredKeys = [];

      const hasOtherOwners = (candidateKey) => Object.entries(config._agenthaus_mcp || {}).some(
        ([otherPlugin, keys]) => otherPlugin !== pluginName && Array.isArray(keys) && keys.includes(candidateKey)
      );

      const findAvailableNamespacedKey = (baseKey, srvConfig) => {
        let candidate = baseKey;
        let counter = 1;
        while (true) {
          const existing = config.mcpServers[candidate];
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

        if (registeredKeys.includes(key)) {
          if (hasOtherOwners(key) && JSON.stringify(config.mcpServers[key]) !== JSON.stringify(srvConfig)) {
            finalKey = findAvailableNamespacedKey(`${pluginName}-${key}`, srvConfig);
            console.log(`[warn] Windsurf: MCP server '${key}' diverged from shared configuration; registered as '${finalKey}' for ${pluginName}`);
          } else {
            finalKey = key;
          }
        } else {
          const baseKey = `${pluginName}-${key}`;
          const existingNamespaced = registeredKeys.find(k => k === baseKey || k.startsWith(`${baseKey}-`));
          if (existingNamespaced && !hasOtherOwners(existingNamespaced)) {
            finalKey = existingNamespaced;
          } else if (existingNamespaced && hasOtherOwners(existingNamespaced)) {
            if (JSON.stringify(config.mcpServers[existingNamespaced]) === JSON.stringify(srvConfig)) {
              finalKey = existingNamespaced;
            } else {
              finalKey = findAvailableNamespacedKey(baseKey, srvConfig);
              console.log(`[warn] Windsurf: MCP server '${key}' diverged from shared configuration; registered as '${finalKey}' for ${pluginName}`);
            }
          } else if (config.mcpServers[key]) {
            if (JSON.stringify(config.mcpServers[key]) === JSON.stringify(srvConfig) && !newRegisteredKeys.includes(key)) {
              finalKey = key;
            } else {
              finalKey = findAvailableNamespacedKey(baseKey, srvConfig);
              console.log(`[warn] Windsurf: MCP server '${key}' conflict detected; registered as '${finalKey}' for ${pluginName}`);
            }
          } else if (newRegisteredKeys.includes(key)) {
            finalKey = findAvailableNamespacedKey(baseKey, srvConfig);
          } else {
            finalKey = key;
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
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
      }
    }
  }

    // 2. Install project context rules (.windsurfrules) if running in a project workspace
    const agentsPath = path.join(sourceDir, 'AGENTS.md');
    if (fs.existsSync(agentsPath)) {
      const pluginName = path.basename(sourceDir);
      const projectRules = path.join(process.cwd(), '.windsurfrules');
      const isInProject = fs.existsSync(path.join(process.cwd(), '.codeium')) ||
                          fs.existsSync(projectRules) ||
                          targetDir.includes(process.cwd());

      if (isInProject) {
        try {
          const pluginRules = fs.readFileSync(agentsPath, 'utf8').trim();
          const startMarker = `<!-- agenthaus:windsurf-plugin:${pluginName} -->`;
          const endMarker = `<!-- /agenthaus:windsurf-plugin:${pluginName} -->`;
          const sectionContent = `${startMarker}\n${pluginRules}\n${endMarker}`;

          let currentContent = '';
          if (fs.existsSync(projectRules)) {
            currentContent = fs.readFileSync(projectRules, 'utf8');
          }

          let updated;
          if (currentContent.includes(startMarker)) {
            const markerRegex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}\\n?`, 'g');
            updated = currentContent.replace(markerRegex, sectionContent + '\n');
          } else if (currentContent.trim().length > 0) {
            updated = currentContent.trimEnd() + '\n\n' + sectionContent + '\n';
          } else {
            updated = sectionContent + '\n';
          }

          if (!dryRun) {
            fs.writeFileSync(projectRules, updated, 'utf8');
          }
        } catch {}
      }
    }
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    const configPath = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
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

    // 2. Remove plugin context section from .windsurfrules
    const projectRules = path.join(process.cwd(), '.windsurfrules');
    if (fs.existsSync(projectRules)) {
      try {
        let content = fs.readFileSync(projectRules, 'utf8');
        const startMarker = `<!-- agenthaus:windsurf-plugin:${pluginName} -->`;
        const endMarker = `<!-- /agenthaus:windsurf-plugin:${pluginName} -->`;
        if (content.includes(startMarker)) {
          if (content.includes(endMarker)) {
            const markerRegex = new RegExp(`\\n*${startMarker}[\\s\\S]*?${endMarker}\\n*`, 'g');
            content = content.replace(markerRegex, '\n\n').trim();
          } else {
            const markerRegex = new RegExp(`\\n*${startMarker}[\\s\\S]*$`, 'g');
            content = content.replace(markerRegex, '').trim();
          }
          if (!dryRun) {
            if (content.length > 0) {
              fs.writeFileSync(projectRules, content + '\n', 'utf8');
            } else {
              fs.unlinkSync(projectRules);
            }
          }
        }
      } catch {}
    }
  }
};
