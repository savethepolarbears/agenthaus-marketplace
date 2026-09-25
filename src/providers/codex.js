'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { isPlainObject, writeFileAtomic } = require('../fs-utils.js');
const { renderCodexServer, renderServerBlock } = require('../codex-toml.js');

function getConfigPath(targetDir) {
  return path.join(path.dirname(targetDir), 'config.toml');
}

function blockMarkers(pluginName) {
  return {
    start: `# >>> agenthaus:${pluginName} (managed by agenthaus; edits are overwritten) >>>`,
    end: `# <<< agenthaus:${pluginName} <<<`
  };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Remove this plugin's managed block; returns the remaining text.
function stripBlock(content, pluginName) {
  const { start, end } = blockMarkers(pluginName);
  const re = new RegExp(`\\n*${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}\\n?`, 'g');
  return content.replace(re, '\n');
}

// Server names declared as [mcp_servers.<name>] / [mcp_servers."<name>"] tables.
function declaredServerKeys(content) {
  const keys = new Set();
  const re = /^\s*\[\s*mcp_servers\s*\.\s*(?:"((?:[^"\\]|\\.)*)"|'([^']*)'|([A-Za-z0-9_-]+))\s*[\].]/gm;
  for (const m of content.matchAll(re)) keys.add(m[1] !== undefined ? JSON.parse(`"${m[1]}"`) : (m[2] ?? m[3]));
  return keys;
}

function readPluginServers(sourceDir) {
  const mcpPath = path.join(sourceDir, '.mcp.json');
  if (!fs.existsSync(mcpPath)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
    return isPlainObject(parsed) && isPlainObject(parsed.mcpServers) ? parsed.mcpServers : null;
  } catch (err) {
    console.warn(`[warn] Codex: Malformed .mcp.json at ${mcpPath}: ${err.message}. Preserving existing MCP registrations.`);
    return undefined;
  }
}

/**
 * Compute the new config.toml text for a plugin. Returns null when the file
 * should not be touched (nothing to add and nothing to remove).
 */
function planConfig(configPath, pluginName, servers, pluginRoot) {
  const exists = fs.existsSync(configPath);
  const original = exists ? fs.readFileSync(configPath, 'utf8') : '';
  const base = stripBlock(original, pluginName).replace(/\n{3,}/g, '\n\n').trimEnd();
  const taken = declaredServerKeys(base);

  const rendered = [];
  for (const [key, server] of Object.entries(servers || {})) {
    const candidates = [key, `${pluginName}-${key}`];
    const finalKey = candidates.find(k => !taken.has(k));
    if (!finalKey) {
      console.warn(`[warn] Codex: MCP server '${key}' already declared in ${configPath}; skipping for ${pluginName}`);
      continue;
    }
    if (finalKey !== key) console.log(`[warn] Codex: MCP server '${key}' conflicts with an existing entry; registered as '${finalKey}' for ${pluginName}`);
    const r = renderCodexServer(finalKey, server, { pluginRoot });
    if (!r.supported) {
      console.warn(`[warn] Codex: ${r.notes.join('; ')}`);
      continue;
    }
    taken.add(finalKey);
    rendered.push(renderServerBlock(r));
  }

  let next = base;
  if (rendered.length > 0) {
    const { start, end } = blockMarkers(pluginName);
    next = `${base}${base ? '\n\n' : ''}${start}\n${rendered.join('\n\n')}\n${end}`;
  }
  next = next ? next + '\n' : '';
  if (next === original || (!exists && next === '')) return null;
  return next;
}

function findOrCreateAgentsPath(cwd) {
  let cur = path.resolve(cwd);
  while (true) {
    const candidate = path.join(cur, 'AGENTS.md');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return path.join(cwd, 'AGENTS.md');
}

module.exports = {
  id: 'codex',
  name: 'Codex CLI',
  detect(cwd) {
    return fs.existsSync(path.join(os.homedir(), '.codex')) ||
           fs.existsSync(path.join(cwd, '.codex'));
  },
  getTargetDir(cwd, mode) {
    return path.join(mode === 'project' ? cwd : os.homedir(), '.codex', 'agenthaus-skills');
  },
  getConfigPaths(cwd, home = os.homedir()) {
    return [path.join(home, '.codex', 'config.toml'), path.join(cwd, '.codex', 'config.toml')];
  },
  getCapabilities() {
    return { mcp: 'via config.toml', hooks: false, commands: 'partial', skills: true };
  },
  postInstall(sourceDir, targetDir, { dryRun = false } = {}) {
    const pluginName = path.basename(sourceDir);
    const hasSkills = fs.existsSync(path.join(sourceDir, 'skills'));
    
    if (hasSkills) {
      const skillsDest = path.join(targetDir, pluginName, 'skills');
      let skillPath;

      const realpathDeep = (p) => {
        let cur = path.resolve(p);
        const parts = [];
        while (!fs.existsSync(cur)) {
          const parent = path.dirname(cur);
          if (parent === cur) break;
          parts.unshift(path.basename(cur));
          cur = parent;
        }
        try {
          const realBase = fs.realpathSync(cur);
          return path.join(realBase, ...parts);
        } catch {
          return path.resolve(p);
        }
      };

      const realCwd = realpathDeep(process.cwd());
      const realHome = realpathDeep(os.homedir());
      const realDest = realpathDeep(skillsDest);

      const relCwd = path.relative(realCwd, realDest);
      const isInsideCwd = !relCwd.startsWith('..') && !path.isAbsolute(relCwd);

      const relHome = path.relative(realHome, realDest);
      const isInsideHome = !relHome.startsWith('..') && !path.isAbsolute(relHome);

      if (isInsideCwd) {
        skillPath = relCwd.replace(/\\/g, '/');
      } else if (isInsideHome) {
        skillPath = `~/${relHome.replace(/\\/g, '/')}`;
      } else {
        skillPath = skillsDest.replace(/\\/g, '/');
      }
      if (!skillPath.endsWith('/')) skillPath += '/';

      const skillRef = `Read skills from ${skillPath}`;
      const agentsPath = findOrCreateAgentsPath(process.cwd());
      let content = '';
      if (fs.existsSync(agentsPath)) {
        try {
          content = fs.readFileSync(agentsPath, 'utf8');
        } catch {}
      } else {
        content = '# Project Guidelines\n';
      }

      if (!content.includes(skillRef)) {
        const updated = content.trimEnd() + `\n\n<!-- agenthaus:codex-skills -->\n- ${skillRef}\n`;
        if (!dryRun) {
          writeFileAtomic(agentsPath, updated, { backup: false });
        }
      }
      console.log(`[info] Codex: Reference skills in AGENTS.md: '${skillRef}'`);
    }

    // Register MCP servers as [mcp_servers.<name>] tables in config.toml
    const servers = readPluginServers(sourceDir);
    if (servers === undefined) return;
    const configPath = getConfigPath(targetDir);
    const next = planConfig(configPath, pluginName, servers, path.join(targetDir, pluginName));
    if (next !== null && !dryRun) {
      writeFileAtomic(configPath, next);
      if (path.resolve(path.dirname(configPath)) !== path.resolve(os.homedir(), '.codex')) {
        console.log(`[info] Codex: project config ${configPath} is only loaded for trusted projects`);
      }
    }
  },
  isMcpInSync(sourceDir, targetDir) {
    const servers = readPluginServers(sourceDir);
    if (servers === undefined) return true;
    const pluginName = path.basename(sourceDir);
    return planConfig(getConfigPath(targetDir), pluginName, servers, path.join(targetDir, pluginName)) === null;
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    const configPath = getConfigPath(targetDir);
    if (fs.existsSync(configPath)) {
      const next = planConfig(configPath, pluginName, {}, null);
      if (next !== null && !dryRun) writeFileAtomic(configPath, next);
    }

    const agentsPath = findOrCreateAgentsPath(process.cwd());
    const skillPattern = `${pluginName}/skills/`;
    if (fs.existsSync(agentsPath)) {
      try {
        const content = fs.readFileSync(agentsPath, 'utf8');
        if (content.includes(skillPattern)) {
          const updated = content
            .split('\n')
            .filter(line => !line.includes(skillPattern))
            .join('\n');
          if (!dryRun) {
            writeFileAtomic(agentsPath, updated, { backup: false });
          }
        }
      } catch {}
    }
  }
};
