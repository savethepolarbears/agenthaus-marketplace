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
 * Generate AGENTS.md content for Codex CLI / Windsurf.
 * Enforces a 2 KiB byte budget — throws if exceeded (caller catches into errors[]).
 */
function renderAgentsMd(plugin) {
  const desc = plugin.manifest.description || '';
  const name = plugin.manifest.name || plugin.name;

  let content = `# ${name}\n\n${desc}`;

  if (plugin.hasHooks) {
    content += '\n\n> **Platform note:** This plugin uses Claude Code hooks. Hook-based automation is not available on Codex CLI, Windsurf, Gemini CLI, or Cursor. Commands and skills remain usable.';
  }

  if (plugin.hasMcp) {
    content += '\n\n> **Codex CLI note:** This plugin requires MCP tools. Codex CLI does not implement MCP; configure the MCP server in your platform settings to enable full functionality.';
  }

  // Platform capability matrix
  const mcpCol = plugin.hasMcp;
  const hooksCol = plugin.hasHooks;

  const mcpCell = (val) => mcpCol ? val : 'n/a';
  const hooksCell = (val) => hooksCol ? val : 'n/a';

  content += '\n\n## Platform Support\n\n';
  content += '| Platform | MCP | Hooks | Commands/Agents | Skills |\n';
  content += '|----------|-----|-------|-----------------|--------|\n';
  content += `| Claude Code | ${mcpCell('full')} | ${hooksCell('full')} | full | full |\n`;
  content += `| Codex CLI | ${mcpCell('none')} | ${hooksCell('none')} | partial | full |\n`;
  content += `| Gemini CLI | ${mcpCell('via gemini-settings')} | ${hooksCell('none')} | partial | full |\n`;
  content += `| Cursor | ${mcpCell('via .cursor/mcp.json')} | ${hooksCell('none')} | partial | full |\n`;
  content += `| Windsurf | ${mcpCell('TBD')} | ${hooksCell('none')} | partial | full |`;

  // Env vars section
  if (plugin.hasMcp) {
    const envVars = [...new Set(
      Object.values(plugin.mcpServers).flatMap(s => Object.keys(s.env || {}))
    )];
    if (envVars.length > 0) {
      content += '\n\n## Environment Variables\n\n';
      content += envVars.map(v => `- \`${v}\``).join('\n');
    }
  }

  content += '\n';

  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > 2048) {
    throw new Error(`[${plugin.name}] AGENTS.md would be ${bytes} bytes — exceeds 2 KiB budget. Shorten description or remove capability matrix.`);
  }

  return content;
}

/**
 * Generate GEMINI.md content for Gemini CLI.
 */
function renderGeminiMd(plugin) {
  const desc = plugin.manifest.description || '';
  const name = plugin.manifest.name || plugin.name;

  let content = `# ${name}\n\n${desc}`;

  content += `\n\n## Plugin Reference\n\n@plugins/${plugin.name}/README.md`;

  if (plugin.hasMcp) {
    content += '\n\n## MCP Setup\n\nAdd the MCP server from `gemini-settings-snippet.json` to your Gemini settings.\n';
  }

  if (plugin.hasHooks) {
    content += '\n> **Note:** Hook-based automation requires Claude Code. Hooks are not executed by Gemini CLI.\n';
  }

  return content;
}

/**
 * Generate Cursor .mdc rule file content.
 */
function renderCursorMdc(plugin) {
  const desc = plugin.manifest.description || '';
  const name = plugin.manifest.name || plugin.name;
  const escapedDesc = desc.replace(/"/g, '\\"');

  let content = `---\ndescription: "${escapedDesc}"\nglobs: "**/*"\nalwaysApply: true\n---\n`;

  content += `\n# ${name}\n\n${desc}`;

  if (plugin.hasMcp) {
    content += '\n\n## MCP Configuration\n\nMCP servers for this plugin are in `.cursor/mcp.json`. Environment variables use `${env:VAR_NAME}` syntax in Cursor.\n';
  }

  if (plugin.hasHooks) {
    content += '\n> **Note:** This plugin uses Claude Code hooks which are not available in Cursor.\n';
  }

  return content;
}

/**
 * Generate .cursor/mcp.json content with Cursor env var syntax.
 * Returns null for plugins without MCP servers.
 */
function renderCursorMcp(plugin) {
  if (!plugin.hasMcp) return null;
  const transformed = transformEnvVars(plugin.mcpServers, 'cursor');
  return stableStringify({ mcpServers: transformed });
}

/**
 * Generate gemini-settings-snippet.json content.
 * Returns null for plugins without MCP servers.
 */
function renderGeminiSettingsSnippet(plugin) {
  if (!plugin.hasMcp) return null;
  const transformed = transformEnvVars(plugin.mcpServers, 'gemini');
  return stableStringify({
    _comment: 'Add mcpServers entries to your Gemini CLI settings',
    mcpServers: transformed
  });
}

/**
 * Generate repo-level AGENTS.md from manifest data only (not from CLAUDE.md).
 * Enforces a 6 KiB byte budget.
 */
function renderRepoAgentsMd(plugins, errors) {
  let content = '# AgentHaus Marketplace\n\n27 production-ready plugins for Claude Code with cross-platform support for Codex CLI, Gemini CLI, Cursor, and Windsurf.\n\n## Plugins\n\n';
  content += '| Plugin | Description | MCP | Hooks |\n';
  content += '|--------|-------------|-----|-------|\n';

  for (const plugin of plugins) {
    const rawDesc = plugin.manifest.description || '';
    const desc = rawDesc.length > 60 ? rawDesc.slice(0, 57) + '...' : rawDesc;
    const mcp = plugin.hasMcp ? 'yes' : 'no';
    const hooks = plugin.hasHooks ? 'yes' : 'no';
    content += `| ${plugin.manifest.name || plugin.name} | ${desc} | ${mcp} | ${hooks} |\n`;
  }

  content += '\n## Platform Support\n\n';
  content += '| Platform | MCP | Hooks | Commands | Skills |\n';
  content += '|----------|-----|-------|----------|--------|\n';
  content += '| Claude Code | full | full | full | full |\n';
  content += '| Codex CLI | none | none | partial | full |\n';
  content += '| Gemini CLI | via gemini-settings | none | partial | full |\n';
  content += '| Cursor | via .cursor/mcp.json | none | partial | full |\n';
  content += '| Windsurf | global config | none | partial | full |\n\n';
  content += '> Hooks are Claude Code-exclusive. MCP tool access requires platform-specific configuration.\n';

  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > 6144) {
    errors.push({ plugin: 'repo', error: `Repo-level AGENTS.md would be ${bytes} bytes — exceeds 6 KiB budget.` });
    return;
  }

  const outPath = path.resolve(PLUGINS_DIR, '..', 'AGENTS.md');
  const changed = writeIfChanged(outPath, content);
  console.log(`[repo] AGENTS.md ${changed ? 'written' : 'unchanged'}`);
}

/**
 * Inject a `platforms` array into every entry in skills_index.json.
 * Skills are Markdown — readable on all supported platforms.
 */
function injectSkillsPlatforms(plugins, errors) {
  const indexPath = path.resolve(__dirname, '..', 'skills_index.json');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (err) {
    errors.push({ plugin: 'skills_index', error: `Could not read skills_index.json: ${err.message}` });
    return;
  }

  for (const entry of data.entries) {
    entry.platforms = ['claude-code', 'codex', 'cursor', 'gemini', 'windsurf'].sort();
  }
  data.generated = new Date().toISOString().slice(0, 10);

  writeIfChanged(indexPath, stableStringify(data));
  console.log('[skills_index] platforms field injected');
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

    try {
      // --- AGENTS.md (Codex CLI / Windsurf) ---
      const agentsContent = renderAgentsMd(plugin);
      const agentsPath = path.join(plugin.dir, 'AGENTS.md');
      const changed = writeIfChanged(agentsPath, agentsContent);
      console.log(`[${plugin.name}] AGENTS.md ${changed ? 'written' : 'unchanged'}`);
      if (changed) written++; else skipped++;
    } catch (err) {
      errors.push({ plugin: plugin.name, error: err.message });
    }

    try {
      // --- GEMINI.md (Gemini CLI) ---
      const geminiContent = renderGeminiMd(plugin);
      const geminiPath = path.join(plugin.dir, 'GEMINI.md');
      const changed = writeIfChanged(geminiPath, geminiContent);
      console.log(`[${plugin.name}] GEMINI.md ${changed ? 'written' : 'unchanged'}`);
      if (changed) written++; else skipped++;
    } catch (err) {
      errors.push({ plugin: plugin.name, error: err.message });
    }

    try {
      // --- Cursor .mdc rule ---
      const mdcContent = renderCursorMdc(plugin);
      const mdcPath = path.join(plugin.dir, '.cursor', 'rules', plugin.name + '.mdc');
      const changed = writeIfChanged(mdcPath, mdcContent);
      console.log(`[${plugin.name}] .cursor/rules/${plugin.name}.mdc ${changed ? 'written' : 'unchanged'}`);
      if (changed) written++; else skipped++;
    } catch (err) {
      errors.push({ plugin: plugin.name, error: err.message });
    }

    try {
      // --- Cursor mcp.json (MCP plugins only) ---
      const cursorMcpContent = renderCursorMcp(plugin);
      if (cursorMcpContent !== null) {
        const cursorMcpPath = path.join(plugin.dir, '.cursor', 'mcp.json');
        const changed = writeIfChanged(cursorMcpPath, cursorMcpContent);
        console.log(`[${plugin.name}] .cursor/mcp.json ${changed ? 'written' : 'unchanged'}`);
        if (changed) written++; else skipped++;
      } else {
        console.log(`[${plugin.name}] .cursor/mcp.json skipped (no MCP servers)`);
      }
    } catch (err) {
      errors.push({ plugin: plugin.name, error: err.message });
    }

    try {
      // --- gemini-settings-snippet.json (MCP plugins only) ---
      const geminiSnippetContent = renderGeminiSettingsSnippet(plugin);
      if (geminiSnippetContent !== null) {
        const geminiSnippetPath = path.join(plugin.dir, 'gemini-settings-snippet.json');
        const changed = writeIfChanged(geminiSnippetPath, geminiSnippetContent);
        console.log(`[${plugin.name}] gemini-settings-snippet.json ${changed ? 'written' : 'unchanged'}`);
        if (changed) written++; else skipped++;
      } else {
        console.log(`[${plugin.name}] gemini-settings-snippet.json skipped (no MCP servers)`);
      }
    } catch (err) {
      errors.push({ plugin: plugin.name, error: err.message });
    }
  }

  // Repo-level AGENTS.md and skills_index platforms injection
  try {
    renderRepoAgentsMd(plugins, errors);
  } catch (err) {
    errors.push({ plugin: 'repo', error: err.message });
  }

  try {
    injectSkillsPlatforms(plugins, errors);
  } catch (err) {
    errors.push({ plugin: 'skills_index', error: err.message });
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

module.exports = { discoverPlugins, generateAll, injectSkillsPlatforms, loadPlugin, parseFrontmatter, renderAgentsMd, renderClaudeDesktop, renderCursorMcp, renderCursorMdc, renderGeminiMd, renderGeminiSettingsSnippet, renderRepoAgentsMd, stableStringify, transformEnvVars, writeIfChanged };
