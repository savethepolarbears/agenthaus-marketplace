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
    const snippetPath = path.join(sourceDir, 'windsurf-mcp-snippet.json');
    const mcpJsonPath = path.join(sourceDir, '.mcp.json');

    if (fs.existsSync(snippetPath)) {
      try {
        const snippet = JSON.parse(fs.readFileSync(snippetPath, 'utf8'));
        if (snippet.mcpServers && Object.keys(snippet.mcpServers).length > 0) {
          mcpServers = snippet.mcpServers;
        }
      } catch {}
    } else if (fs.existsSync(mcpJsonPath)) {
      try {
        const mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
        if (mcpJson.mcpServers && Object.keys(mcpJson.mcpServers).length > 0) {
          mcpServers = mcpJson.mcpServers;
        }
      } catch {}
    }

    if (mcpServers) {
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

      config.mcpServers = { ...(config.mcpServers || {}), ...mcpServers };

      if (!dryRun) {
        fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
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
        if (config.mcpServers && config.mcpServers[pluginName]) {
          delete config.mcpServers[pluginName];
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
