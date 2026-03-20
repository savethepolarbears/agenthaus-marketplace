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
// Renderers
// ---------------------------------------------------------------------------

/**
 * Transform ${VAR} env var syntax for the target platform format.
 * 'claude'  → no change (${VAR} is native)
 * 'cursor'  → ${env:VAR} (Phase 3 fills this in)
 * 'gemini'  → no change (Phase 3 fills this in)
 */
function transformEnvVars(obj, format) {
  if (format === 'claude' || format === 'claude-desktop') return obj;
  if (format === 'cursor') {
    const str = JSON.stringify(obj);
    const transformed = str.replace(/\$\{([^}]+)\}/g, '$${env:$1}');
    return JSON.parse(transformed);
  }
  // Other formats: passthrough until Phase 3
  return obj;
}

/**
 * Generate claude-desktop-snippet.json content for MCP-equipped plugins.
 * Returns null for plugins without MCP servers.
 */
function renderClaudeDesktop(plugin) {
  if (!plugin.hasMcp) return null;
  const snippet = {
    _comment: 'Paste the "mcpServers" entries below into your claude_desktop_config.json',
    _plugin: plugin.name,
    _version: plugin.manifest.version,
    mcpServers: plugin.mcpServers  // ${VAR} syntax is correct for Claude Desktop
  };
  return stableStringify(snippet);
}

/**
 * Run all renderers over the full plugin list.
 * Returns { written, skipped } counts (excludes no-MCP skips from both).
 */
function generateAll(plugins, errors) {
  let written = 0;
  let skipped = 0;

  for (const plugin of plugins) {
    try {
      // --- Claude Desktop snippet ---
      const snippetContent = renderClaudeDesktop(plugin);
      if (snippetContent !== null) {
        const snippetPath = path.join(plugin.dir, 'claude-desktop-snippet.json');
        const changed = writeIfChanged(snippetPath, snippetContent);
        if (changed) {
          console.log(`[${plugin.name}] claude-desktop-snippet.json written`);
          written++;
        } else {
          console.log(`[${plugin.name}] claude-desktop-snippet.json unchanged`);
          skipped++;
        }
      } else {
        console.log(`[${plugin.name}] claude-desktop-snippet.json skipped (no MCP servers)`);
      }
    } catch (err) {
      errors.push({ plugin: plugin.name, error: err.message });
    }
  }

  return { written, skipped };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const errors = [];

  let plugins;
  try {
    plugins = discoverPlugins();
  } catch (err) {
    console.error('FATAL: plugin discovery failed:', err.message);
    process.exit(1);
  }

  console.log(`Discovered ${plugins.length} plugins.`);

  const { written, skipped } = generateAll(plugins, errors);

  const mcpCount = plugins.filter(p => p.hasMcp).length;
  const noMcpCount = plugins.length - mcpCount;
  console.log(`Generated ${written} snippet(s), ${skipped} unchanged, ${noMcpCount} skipped (no MCP). ${errors.length} error(s).`);

  if (errors.length > 0) {
    errors.forEach(e => console.error(`ERROR [${e.plugin}]: ${e.error}`));
    process.exit(1);
  }
}

main();

module.exports = { discoverPlugins, generateAll, loadPlugin, parseFrontmatter, renderClaudeDesktop, stableStringify, transformEnvVars, writeIfChanged };
