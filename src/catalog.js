'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PLUGINS_DIR = path.resolve(__dirname, '..', 'plugins');

function loadPlugin(dir, name) {
  const pluginDir = path.join(dir, name);
  const manifestPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
  
  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    return null;
  }

  return {
    name,
    version: manifest.version || '0.0.0',
    description: manifest.description || ''
  };
}

function discoverPlugins(pluginsDir = PLUGINS_DIR) {
  if (!fs.existsSync(pluginsDir)) {
    return [];
  }

  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  const plugins = entries
    .filter(entry => entry.isDirectory())
    .map(entry => loadPlugin(pluginsDir, entry.name))
    .filter(plugin => plugin !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return plugins;
}

module.exports = { PLUGINS_DIR, loadPlugin, discoverPlugins };
