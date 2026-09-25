'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { writeFileAtomic } = require('../fs-utils.js');
const os = require('node:os');
const { readServersSnippet, resolvePluginRoot, syncPluginServers, removePluginServers } = require('./mcp-ownership.js');

const LABEL = 'Windsurf MCP config';

// Windsurf is now Devin Desktop; its docs place MCP config under the user config dir.
// The legacy ~/.codeium/windsurf path is still used when no Devin install exists.
function getDevinConfigDir(home = os.homedir()) {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'devin');
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'devin');
}

function getLegacyConfigDir(home = os.homedir()) {
  return path.join(home, '.codeium', 'windsurf');
}

// The config the adapter reads and writes: Devin when installed, else legacy Windsurf.
function getConfigPath(home = os.homedir()) {
  const dir = fs.existsSync(getDevinConfigDir(home)) ? getDevinConfigDir(home) : getLegacyConfigDir(home);
  return path.join(dir, 'mcp_config.json');
}

function getAllConfigPaths(home = os.homedir()) {
  return [path.join(getDevinConfigDir(home), 'mcp_config.json'), path.join(getLegacyConfigDir(home), 'mcp_config.json')];
}

function loadPluginServers(sourceDir, targetDir) {
  const pluginName = path.basename(sourceDir);
  // Only the generated snippet is merged: raw .mcp.json uses Claude-style ${VAR}
  // interpolation, which Windsurf/Devin does not expand.
  const { servers, failed } = readServersSnippet(path.join(sourceDir, 'windsurf-mcp-snippet.json'), 'Windsurf');
  if (failed || !servers) return { servers, failed };
  return {
    servers: resolvePluginRoot(servers, [`./plugins/${pluginName}`], path.join(targetDir, pluginName)),
    failed: false
  };
}

module.exports = {
  id: 'windsurf',
  name: 'Windsurf / Devin Desktop',
  detect(cwd) {
    return fs.existsSync(getDevinConfigDir()) ||
           fs.existsSync(getLegacyConfigDir()) ||
           fs.existsSync(path.join(cwd, '.codeium')) ||
           fs.existsSync(path.join(cwd, '.windsurf'));
  },
  getTargetDir(cwd, mode) {
    if (mode === 'project') return path.join(cwd, '.codeium', 'plugins');
    return path.join(os.homedir(), '.codeium', 'windsurf', 'plugins');
  },
  getConfigPaths(cwd, home = os.homedir()) {
    return [getConfigPath(home)];
  },
  getCapabilities() {
    return { mcp: 'via mcp_config.json', hooks: false, commands: 'partial', skills: true };
  },
  isMcpInSync(sourceDir, targetDir) {
    const { servers, failed } = loadPluginServers(sourceDir, targetDir);
    if (failed) return true;
    return !syncPluginServers({ configPath: getConfigPath(), pluginName: path.basename(sourceDir), servers, label: LABEL, dryRun: true }).changed;
  },
  postInstall(sourceDir, targetDir, { dryRun = false } = {}) {
    // 1. Reconcile MCP servers into the Windsurf/Devin mcp_config.json
    const { servers, failed } = loadPluginServers(sourceDir, targetDir);
    if (!failed) {
      syncPluginServers({ configPath: getConfigPath(), pluginName: path.basename(sourceDir), servers, label: LABEL, dryRun });
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
            writeFileAtomic(projectRules, updated, { backup: false });
          }
        } catch {}
      }
    }
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    // 1. Remove MCP registrations from both current and legacy config locations
    for (const configPath of getAllConfigPaths()) {
      removePluginServers({ configPath, pluginName, label: LABEL, dryRun });
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
              writeFileAtomic(projectRules, content + '\n', { backup: false });
            } else {
              fs.unlinkSync(projectRules);
            }
          }
        }
      } catch {}
    }
  }
};
