'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { readServersSnippet, resolvePluginRoot, syncPluginServers, removePluginServers } = require('./mcp-ownership.js');

const LABEL = 'Cursor MCP config';

function getConfigPath(targetDir) {
  return path.join(path.dirname(targetDir), 'mcp.json');
}

function loadPluginServers(sourceDir, targetDir) {
  const pluginName = path.basename(sourceDir);
  const { servers, failed } = readServersSnippet(path.join(sourceDir, '.cursor', 'mcp.json'), 'Cursor');
  if (failed || !servers) return { servers, failed };
  const installedRoot = path.join(targetDir, pluginName);
  return {
    servers: resolvePluginRoot(servers, [`\${workspaceFolder}/plugins/${pluginName}`], installedRoot),
    failed: false
  };
}

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
  getConfigPaths(cwd, home = os.homedir()) {
    return [path.join(home, '.cursor', 'mcp.json'), path.join(cwd, '.cursor', 'mcp.json')];
  },
  getCapabilities() {
    return { mcp: 'via .cursor/mcp.json', hooks: false, commands: 'partial', skills: true };
  },
  isMcpInSync(sourceDir, targetDir) {
    const { servers, failed } = loadPluginServers(sourceDir, targetDir);
    if (failed) return true;
    const pluginName = path.basename(sourceDir);
    return !syncPluginServers({ configPath: getConfigPath(targetDir), pluginName, servers, label: LABEL, dryRun: true }).changed;
  },
  postInstall(sourceDir, targetDir, { dryRun = false } = {}) {
    const pluginName = path.basename(sourceDir);
    const cursorDir = path.dirname(targetDir);

    // 1. Mirror rules/*.mdc — Cursor discovers rules only under .cursor/rules/
    const sourceRulesDir = path.join(sourceDir, '.cursor', 'rules');
    if (fs.existsSync(sourceRulesDir)) {
      for (const file of fs.readdirSync(sourceRulesDir)) {
        if (!file.endsWith('.mdc')) continue;
        const targetRulesDir = path.join(cursorDir, 'rules');
        if (!dryRun) {
          fs.mkdirSync(targetRulesDir, { recursive: true });
          fs.copyFileSync(path.join(sourceRulesDir, file), path.join(targetRulesDir, file));
        }
      }
    }

    // 2. Reconcile MCP servers into .cursor/mcp.json
    const { servers, failed } = loadPluginServers(sourceDir, targetDir);
    if (failed) return;
    syncPluginServers({ configPath: getConfigPath(targetDir), pluginName, servers, label: LABEL, dryRun });
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    const mdcFile = path.join(path.dirname(targetDir), 'rules', `${pluginName}.mdc`);
    if (fs.existsSync(mdcFile) && !dryRun) {
      try { fs.unlinkSync(mdcFile); } catch {}
    }
    removePluginServers({ configPath: getConfigPath(targetDir), pluginName, label: LABEL, dryRun });
  }
};
