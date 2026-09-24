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
      } catch {
        settings = {};
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
