'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PLUGINS_DIR = path.resolve(__dirname, '..', 'plugins');

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  let str = '{';
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    str += JSON.stringify(key) + ':' + stableStringify(obj[key]);
    if (i < keys.length - 1) str += ',';
  }
  str += '}';
  return str;
}

function stableStringifyFormat(obj) {
  const sortKeys = (o) => {
    if (o === null || typeof o !== 'object') return o;
    if (Array.isArray(o)) return o.map(sortKeys);
    const sorted = {};
    Object.keys(o).sort().forEach(k => {
      sorted[k] = sortKeys(o[k]);
    });
    return sorted;
  };
  return JSON.stringify(sortKeys(obj), null, 2) + '\n';
}

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

  const mcpJsonPath = path.join(pluginDir, '.mcp.json');
  let mcpJson = { mcpServers: {} };
  let mcpParseError = null;
  if (fs.existsSync(mcpJsonPath)) {
    try {
      mcpJson = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf8'));
    } catch (e) {
      mcpParseError = e.message;
    }
  }

  const hooksJsonPath = path.join(pluginDir, 'hooks', 'hooks.json');
  if (fs.existsSync(hooksJsonPath)) {
    try {
      const h = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
      if (h.hooks) {
        manifest.hooks = { ...(manifest.hooks || {}), ...h.hooks };
      }
    } catch (e) {}
  }

  const mcpServers = { ...(manifest.mcpServers || {}), ...(mcpJson.mcpServers || {}) };
  const hasMcp = Object.keys(mcpServers).length > 0;

  let hasHooks = false;
  if (manifest.hooks && (manifest.hooks.PreToolUse || manifest.hooks.PostToolUse)) {
    const preCount = Array.isArray(manifest.hooks.PreToolUse) ? manifest.hooks.PreToolUse.length : 0;
    const postCount = Array.isArray(manifest.hooks.PostToolUse) ? manifest.hooks.PostToolUse.length : 0;
    hasHooks = (preCount + postCount) > 0;
  }

  let hasCommands = false;
  const cmdsDir = path.join(pluginDir, 'commands');
  if (fs.existsSync(cmdsDir)) {
    hasCommands = fs.readdirSync(cmdsDir).length > 0;
  }

  let hasSkills = false;
  const skillsDir = path.join(pluginDir, 'skills');
  if (fs.existsSync(skillsDir)) {
    hasSkills = fs.readdirSync(skillsDir).length > 0;
  }

  return {
    name,
    version: manifest.version || '0.0.0',
    description: manifest.description || '',
    path: pluginDir,
    badges: {
      mcp: hasMcp,
      hooks: hasHooks,
      commands: hasCommands,
      skills: hasSkills
    },
    mcpServers,
    mcpParseError,
    manifest
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

module.exports = { PLUGINS_DIR, loadPlugin, discoverPlugins, stableStringify: stableStringifyFormat };
