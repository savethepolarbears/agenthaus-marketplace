'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { isPlainObject, writeFileAtomic } = require('../fs-utils.js');
const { renderCodexServer, renderServerBlock } = require('../codex-toml.js');
const { parseToml, findManagedBlocks, serverKeys } = require('../toml-structure.js');
const { validServers } = require('./mcp-ownership.js');

function getConfigPath(targetDir) {
  return path.join(path.dirname(targetDir), 'config.toml');
}

function blockMarkers(pluginName) {
  return {
    start: `# >>> agenthaus:${pluginName} (managed by agenthaus; edits are overwritten) >>>`,
    end: `# <<< agenthaus:${pluginName} <<<`
  };
}

function boundedText(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const limit = 4 * 1024 * 1024;
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > limit) throw new Error('Codex configuration file exceeds supported regular-file size limit.');
    const buffer = Buffer.alloc(limit + 1);
    let count = 0, read;
    while (count < buffer.length && (read = fs.readSync(fd, buffer, count, buffer.length - count, null))) count += read;
    if (count > limit) throw new Error('Codex configuration file exceeds size limit.');
    const text = buffer.subarray(0,count).toString('utf8');
    if (!Buffer.from(text).equals(buffer.subarray(0,count))) throw new Error('Codex configuration is not valid UTF-8.');
    return text;
  } finally { fs.closeSync(fd); }
}

function readPluginServers(sourceDir) {
  const mcpPath = path.join(sourceDir, '.mcp.json');
  if (!fs.existsSync(mcpPath)) return null;
  const fail = (reason) => {
    console.warn(`[warn] Codex: ${reason} at ${mcpPath}. Preserving existing MCP registrations.`);
    return undefined;
  };
  let parsed;
  try {
    parsed = JSON.parse(boundedText(mcpPath));
  } catch (err) {
    return fail('Malformed or unsupported .mcp.json');
  }
  if (!isPlainObject(parsed)) return fail('Malformed .mcp.json: expected JSON object');
  if (!isPlainObject(parsed.mcpServers)) return fail("Invalid 'mcpServers': expected JSON object");
  if (!validServers(parsed.mcpServers)) return fail('Invalid MCP server definitions');
  return parsed.mcpServers;
}

/**
 * Compute the new config.toml text for a plugin. Returns null when the file
 * should not be touched (nothing to add and nothing to remove).
 */
function planConfig(configPath, pluginName, servers, pluginRoot) {
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(pluginName)) throw new Error('Invalid Codex plugin ownership identity.');
  const exists = fs.existsSync(configPath);
  const original = exists ? boundedText(configPath) : '';
  const document = parseToml(original);
  const blocks = findManagedBlocks(document);
  const own = blocks.get(pluginName);
  const base = own ? original.slice(0,own.start) + original.slice(own.end) : original;
  const taken = serverKeys(parseToml(base));
  const rendered = [];
  for (const [key, server] of Object.entries(servers || {})) {
    let finalKey = key;
    for (let n = 1; taken.has(finalKey); n++) finalKey = n === 1 ? `${pluginName}-${key}` : `${pluginName}-${key}-${n}`;
    if (finalKey !== key) console.log(`[warn] Codex: MCP server '${key}' conflicts with an existing entry; registered as '${finalKey}' for ${pluginName}`);
    const result = renderCodexServer(finalKey, server, { pluginRoot });
    if (!result.supported) { console.warn(`[warn] Codex: ${result.notes.join('; ')}`); continue; }
    taken.add(finalKey); rendered.push(renderServerBlock(result));
  }
  let next = base;
  if (rendered.length) {
    const separator = own ? '\n'.repeat(own.separator) : (base ? (base.endsWith('\n') ? '\n' : '\n\n') : '');
    const {start,end} = blockMarkers(pluginName);
    const block = `${separator}${start}\n# agenthaus-separator-bytes: ${separator.length}\n${rendered.join('\n\n')}\n${end}\n`;
    next = own ? original.slice(0,own.start) + block + original.slice(own.end) : base + block;
  }
  // Validate the complete candidate before any provider write (including AGENTS).
  findManagedBlocks(parseToml(next));
  return next === original || (!exists && !next) ? null : next;
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
  preflightInstall(sourceDir, targetDir) {
    const pluginName = path.basename(sourceDir);
    const servers = readPluginServers(sourceDir);
    if (servers === undefined) throw new Error('Codex MCP source is malformed or unsupported; no provider writes are authorized.');
    const configPath = getConfigPath(targetDir);
    return { configPath, next: planConfig(configPath, pluginName, servers, path.join(targetDir, pluginName)) };
  },
  preflightUninstall(pluginName, targetDir) {
    const configPath = getConfigPath(targetDir);
    return { configPath, next: planConfig(configPath, pluginName, {}, null) };
  },
  postInstall(sourceDir, targetDir, { dryRun = false } = {}) {
    const pluginName = path.basename(sourceDir);
    const servers = readPluginServers(sourceDir);
    if (servers === undefined) return;
    const configPath = getConfigPath(targetDir);
    const next = planConfig(configPath, pluginName, servers, path.join(targetDir, pluginName));
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

    // The complete candidate was preflighted before any AGENTS/config writes.
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
    if (fs.existsSync(agentsPath)) {
      try {
        const content = fs.readFileSync(agentsPath, 'utf8');
        const suffix = `${pluginName}/skills/`;
        const updated = content.replace(/^<!-- agenthaus:codex-skills -->\r?\n- Read skills from ([^\r\n]+)(?:\r?\n|$)/gm, (block, reference) => {
          const normalized = reference.replace(/\\/g, '/');
          return normalized === suffix || normalized.endsWith('/' + suffix) ? '' : block;
        });
        if (updated !== content && !dryRun) {
          writeFileAtomic(agentsPath, updated, { backup: false });
        }
      } catch {}
    }
  }
};
