'use strict';

const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.resolve(__dirname, '..', 'plugins');

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Regex-based YAML frontmatter parser.
 * Handles simple scalar values only (string, unquoted, single/double-quoted).
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([\w-]+):\s*["']?(.+?)["']?\s*$/);
    if (m) fm[m[1]] = m[2];
  }
  return fm;
}

/**
 * Key-sorted JSON serialization for byte-for-byte consistency across runs.
 * All JSON output in this generator must go through this function.
 */
function stableStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      );
    }
    return value;
  }, 2) + '\n';
}

/**
 * Compare-before-write for idempotency.
 * Returns true if file was written, false if content was unchanged.
 */
function writeIfChanged(filePath, content) {
  try {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === content) return false;
  } catch (_) { /* file does not exist yet */ }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

/**
 * Load all source files for one plugin into a normalized object.
 * Merges mcpServers from plugin.json inline AND .mcp.json (.mcp.json wins on key conflict).
 */
function loadPlugin(dir, name) {
  const manifestPath = path.join(dir, '.claude-plugin', 'plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const mcpPath = path.join(dir, '.mcp.json');
  const mcpFile = fs.existsSync(mcpPath)
    ? JSON.parse(fs.readFileSync(mcpPath, 'utf8'))
    : null;
  // Merge: manifest inline first, .mcp.json overrides on key conflict
  const mcpServers = {
    ...(manifest.mcpServers || {}),
    ...(mcpFile ? (mcpFile.mcpServers || {}) : {})
  };
  const hasMcp = Object.keys(mcpServers).length > 0;
  const hasHooks = Array.isArray(manifest.hooks) && manifest.hooks.length > 0;
  return { dir, name, manifest, mcpServers, hasMcp, hasHooks };
}

/**
 * Discover all plugin directories in sorted order (required for idempotency).
 */
function discoverPlugins() {
  return fs.readdirSync(PLUGINS_DIR)
    .filter(name => fs.statSync(path.join(PLUGINS_DIR, name)).isDirectory())
    .sort()
    .map(name => loadPlugin(path.join(PLUGINS_DIR, name), name));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const errors = [];
  const plugins = [];

  // Discover and load all plugins
  let discovered;
  try {
    discovered = discoverPlugins();
  } catch (err) {
    console.error('FATAL: plugin discovery failed:', err.message);
    process.exit(1);
  }

  for (const plugin of discovered) {
    try {
      plugins.push(plugin);
    } catch (err) {
      errors.push({ plugin: plugin.name, error: err.message });
    }
  }

  // Phase 2 generation happens here (renderers added in plan 02)
  // For now: report discovery summary
  console.log(`Discovered ${plugins.length} plugins.`);

  if (errors.length > 0) {
    errors.forEach(e => console.error(`ERROR [${e.plugin}]: ${e.error}`));
    process.exit(1);
  }
}

main();

module.exports = { discoverPlugins, loadPlugin, parseFrontmatter, stableStringify, writeIfChanged };
