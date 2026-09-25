'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { detectAll } = require('./providers/index.js');
const { discoverPlugins } = require('./catalog.js');
const { getPluginHookFiles } = require('./sync.js');

function isCommandAccessible(command) {
  const extensions = process.platform === 'win32'
    ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').map(e => e.toLowerCase())
    : [''];

  const checkFile = (filePath) => {
    try {
      if (process.platform === 'win32') {
        fs.accessSync(filePath, fs.constants.F_OK);
        return true;
      }
      fs.accessSync(filePath, fs.constants.X_OK);
      return true;
    } catch {
      return false;
    }
  };

  const getCandidatePaths = (basePath) => {
    const list = [];
    if (process.platform === 'win32') {
      const ext = path.extname(basePath);
      if (ext) {
        list.push(basePath);
      } else {
        for (const e of extensions) {
          list.push(basePath + e);
          list.push(basePath + e.toUpperCase());
        }
      }
    } else {
      list.push(basePath);
    }
    return list;
  };

  if (path.isAbsolute(command)) {
    for (const candidate of getCandidatePaths(command)) {
      if (checkFile(candidate)) {
        return { accessible: true, path: candidate };
      }
    }
    return { accessible: false, path: null };
  }

  const paths = (process.env.PATH || '').split(path.delimiter);
  for (const p of paths) {
    if (!p) continue;
    for (const candidate of getCandidatePaths(path.join(p, command))) {
      if (checkFile(candidate)) {
        return { accessible: true, path: candidate };
      }
    }
  }
  return { accessible: false, path: null };
}

function checkMcpCommands(plugins) {
  const binaries = new Set();
  for (const plugin of plugins) {
    if (plugin.mcpServers) {
      for (const key of Object.keys(plugin.mcpServers)) {
        const cmd = plugin.mcpServers[key].command;
        if (cmd) binaries.add(cmd);
      }
    }
  }
  
  const results = [];
  const required = ['node'];
  const optional = ['uv', 'python'];
  
  const toCheck = new Set([...binaries, ...required, ...optional]);
  
  for (const bin of toCheck) {
    const res = isCommandAccessible(bin);
    if (!res.accessible) {
      if (required.includes(bin)) {
        results.push({ severity: 'FAIL', message: `Mandatory runtime missing: ${bin}` });
      } else if (optional.includes(bin)) {
        results.push({ severity: 'WARN', message: `Optional runner missing: ${bin}` });
      } else {
        results.push({ severity: 'WARN', message: `MCP command missing: ${bin}` });
      }
    }
  }
  return results;
}

function checkHookSecurity(hookScriptPath) {
  const results = [];
  if (!fs.existsSync(hookScriptPath)) return results;
  const content = fs.readFileSync(hookScriptPath, 'utf8');
  
  const lines = content.split('\n');
  let hasViolation = false;
  for (const line of lines) {
    if (line.trim().startsWith('#')) continue;
    if (line.includes('$TOOL_INPUT') || line.includes('${TOOL_INPUT}')) {
      if (!content.includes('TOOL_INPUT=$(cat)')) {
        hasViolation = true;
      }
    }
  }

  if (hasViolation) {
    results.push({ severity: 'FAIL', message: `Insecure $TOOL_INPUT read in ${path.basename(hookScriptPath)}` });
  }

  if (content.match(/^exit 1\b/m) || content.match(/\bexit 1$/m)) {
    results.push({ severity: 'WARN', message: `Bare exit 1 in ${path.basename(hookScriptPath)} does not block execution` });
  }
  return results;
}

function checkHookSchema(pluginDir) {
  const results = [];
  const manifestPath = path.join(pluginDir, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(manifestPath)) return results;
  
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (e) {
    return [{ severity: 'FAIL', message: `Corrupted manifest in ${path.basename(pluginDir)}` }];
  }
  
  if (manifest.requires_approval !== undefined || manifest.approval_message !== undefined) {
    results.push({ severity: 'FAIL', message: `Deprecated approval property in ${path.basename(pluginDir)}` });
  }

  const checkHookData = (hooks) => {
    if (hooks.requires_approval !== undefined || hooks.approval_message !== undefined) {
      results.push({ severity: 'FAIL', message: `Deprecated approval property in ${path.basename(pluginDir)}` });
    }
    for (const groupName of ['PreToolUse', 'PostToolUse']) {
      if (hooks[groupName] && Array.isArray(hooks[groupName])) {
        if (hooks[groupName].length === 0) {
          results.push({ severity: 'WARN', message: `Empty hooks array in ${path.basename(pluginDir)}` });
        }
        for (const group of hooks[groupName]) {
          if (group.matcher === '*') {
            results.push({ severity: 'INFO', message: `Wildcard matcher '*' in ${path.basename(pluginDir)} (matches all tools)` });
          }
          if (group.requires_approval !== undefined || group.approval_message !== undefined) {
            results.push({ severity: 'FAIL', message: `Deprecated approval property in ${path.basename(pluginDir)}` });
          }
          if (Array.isArray(group.hooks)) {
            for (const h of group.hooks) {
              if (h && (h.requires_approval !== undefined || h.approval_message !== undefined)) {
                results.push({ severity: 'FAIL', message: `Deprecated approval property in hook within ${path.basename(pluginDir)}` });
              }
            }
          }
        }
      }
    }
  };

  // If manifest.hooks is an inline object (not an array of paths)
  if (manifest.hooks && !Array.isArray(manifest.hooks) && typeof manifest.hooks === 'object') {
    checkHookData(manifest.hooks);
  }

  // Inspect all referenced hook files as well as default hooks/hooks.json
  const hookFiles = getPluginHookFiles(pluginDir);
  for (const hookFile of hookFiles) {
    if (fs.existsSync(hookFile)) {
      try {
        const hd = JSON.parse(fs.readFileSync(hookFile, 'utf8'));
        const realHooks = hd.hooks || hd;
        checkHookData(realHooks);
      } catch (e) {
        results.push({ severity: 'FAIL', message: `Corrupted hook file in ${path.basename(pluginDir)}` });
      }
    } else {
      results.push({ severity: 'FAIL', message: `Referenced hook file missing: ${path.basename(hookFile)} in ${path.basename(pluginDir)}` });
    }
  }

  const hooksDir = path.join(pluginDir, 'hooks', 'scripts');
  if (fs.existsSync(hooksDir)) {
    for (const f of fs.readdirSync(hooksDir)) {
      results.push(...checkHookSecurity(path.join(hooksDir, f)));
    }
  }

  return results;
}

function checkCredentials(requiredVars) {
  const results = [];
  for (const v of requiredVars) {
    if (process.env[v]) {
      results.push({ name: v, status: 'SET', severity: 'INFO', message: `${v}: SET` });
    } else {
      results.push({ name: v, status: 'MISSING', severity: 'WARN', message: `${v}: MISSING` });
    }
  }
  return results;
}

function checkConfigFreshness(plugins, repoRoot) {
  const results = [];
  
  const repoAgents = path.join(repoRoot, 'AGENTS.md');
  if (!fs.existsSync(repoAgents)) {
    results.push({ severity: 'WARN', message: 'Repo-level AGENTS.md is missing. Run scripts/generate-cross-platform.js' });
  }

  for (const p of plugins) {
    const pDir = path.join(repoRoot, 'plugins', p.name);
    const mPath = path.join(pDir, '.claude-plugin', 'plugin.json');
    if (!fs.existsSync(mPath)) continue;
    const mTime = fs.statSync(mPath).mtimeMs;
    
    const files = [
      path.join(pDir, 'AGENTS.md'),
      path.join(pDir, 'GEMINI.md'),
      path.join(pDir, '.cursor', 'rules', `${p.name}.mdc`)
    ];

    if (p.badges.mcp) {
      files.push(
        path.join(pDir, 'claude-desktop-snippet.json'),
        path.join(pDir, '.cursor', 'mcp.json'),
        path.join(pDir, 'gemini-settings-snippet.json'),
        path.join(pDir, 'windsurf-mcp-snippet.json'),
        path.join(pDir, 'codex-mcp-config.toml')
      );
    }

    for (const f of files) {
      if (!fs.existsSync(f)) {
        results.push({ severity: 'WARN', message: `Missing generated file: ${path.relative(repoRoot, f)}` });
      } else {
        const fTime = fs.statSync(f).mtimeMs;
        if (fTime < mTime) {
          results.push({ severity: 'WARN', message: `Stale generated file: ${path.relative(repoRoot, f)}` });
        }
      }
    }
  }
  return results;
}

function runDoctor({ cwd = process.cwd(), repoRoot = path.resolve(__dirname, '..'), verbose = false, json = false } = {}) {
  let pass_count = 0;
  let warn_count = 0;
  let fail_count = 0;
  
  const checks = [];
  
  const addResult = (res) => {
    if (res.severity === 'FAIL') fail_count++;
    else if (res.severity === 'WARN') warn_count++;
    else pass_count++;
    checks.push(res);
  };

  const addResults = (arr) => arr.forEach(addResult);

  const plugins = discoverPlugins(path.join(repoRoot, 'plugins'));
  
  const providers = detectAll(cwd);
  addResult({ severity: 'INFO', message: `Detected providers: ${providers.map(p => p.name).join(', ') || 'None'}` });
  addResults(checkProviderConfigs(providers, cwd));
  
  addResults(checkMcpCommands(plugins));

  for (const p of plugins) {
    const pDir = path.join(repoRoot, 'plugins', p.name);
    addResults(checkHookSchema(pDir));
    if (p.mcpParseError) {
      addResult({ severity: 'FAIL', message: `Corrupted .mcp.json in ${p.name}: ${p.mcpParseError}` });
    }
  }

  // Diagnose installed copied plugins from detected provider directories (both user and project scopes)
  for (const provider of providers) {
    const targetDirs = new Set([
      provider.getTargetDir(cwd, 'user'),
      provider.getTargetDir(cwd, 'project')
    ]);
    for (const targetDir of targetDirs) {
      if (!fs.existsSync(targetDir)) continue;
      try {
        const entries = fs.readdirSync(targetDir);
        for (const entry of entries) {
          const pDir = path.join(targetDir, entry);
          try {
            const st = fs.lstatSync(pDir);
            if (st.isDirectory() && !st.isSymbolicLink() && !hasItemLevelSymlinks(pDir)) {
              addResults(checkHookSchema(pDir));
              const mcpPath = path.join(pDir, '.mcp.json');
              if (fs.existsSync(mcpPath)) {
                try {
                  const parsed = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
                  if (parsed.mcpServers) {
                    addResults(checkMcpCommands([{ mcpServers: parsed.mcpServers }]));
                  }
                } catch (e) {
                  addResult({ severity: 'FAIL', message: `Corrupted .mcp.json in ${entry} (${provider.id}): ${e.message}` });
                }
              }
            }
          } catch {}
        }
      } catch {}
    }
  }
  
  const requiredVars = ['CLOUDFLARE_API_TOKEN', 'GITHUB_TOKEN', 'NOTION_API_KEY', 'DATABASE_URL', 'NEON_API_KEY'];
  addResults(checkCredentials(requiredVars));
  
  addResults(checkConfigFreshness(plugins, repoRoot));

  return { pass_count, warn_count, fail_count, checks };
}

function hasItemLevelSymlinks(dir) {
  try {
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const p = path.join(dir, entry);
      try {
        if (fs.lstatSync(p).isSymbolicLink()) return true;
      } catch {}
    }
  } catch {}
  return false;
}

function validateProviderConfigStructure(parsed, configLabel) {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return `${configLabel} must be a JSON object`;
  }
  if (parsed.mcpServers !== undefined) {
    if (typeof parsed.mcpServers !== 'object' || parsed.mcpServers === null || Array.isArray(parsed.mcpServers)) {
      return `'mcpServers' in ${configLabel} must be an object`;
    }
    for (const [srvName, srvConf] of Object.entries(parsed.mcpServers)) {
      if (typeof srvConf !== 'object' || srvConf === null || Array.isArray(srvConf)) {
        return `MCP server '${srvName}' in ${configLabel} must be an object`;
      }
      if (!srvConf.command && !srvConf.url) {
        return `MCP server '${srvName}' in ${configLabel} must specify a 'command' or 'url'`;
      }
      if (srvConf.command !== undefined && (typeof srvConf.command !== 'string' || srvConf.command.trim() === '')) {
        return `'command' in MCP server '${srvName}' (${configLabel}) must be a non-empty string`;
      }
      if (srvConf.url !== undefined && (typeof srvConf.url !== 'string' || srvConf.url.trim() === '')) {
        return `'url' in MCP server '${srvName}' (${configLabel}) must be a non-empty string`;
      }
      if (srvConf.args !== undefined && (!Array.isArray(srvConf.args) || !srvConf.args.every(a => typeof a === 'string'))) {
        return `'args' in MCP server '${srvName}' (${configLabel}) must be an array of strings`;
      }
      if (srvConf.env !== undefined && (typeof srvConf.env !== 'object' || srvConf.env === null || Array.isArray(srvConf.env))) {
        return `'env' in MCP server '${srvName}' (${configLabel}) must be an object`;
      }
    }
  }
  if (parsed._agenthaus_mcp !== undefined) {
    if (typeof parsed._agenthaus_mcp !== 'object' || parsed._agenthaus_mcp === null || Array.isArray(parsed._agenthaus_mcp)) {
      return `'_agenthaus_mcp' in ${configLabel} must be an object`;
    }
    for (const [pluginName, keys] of Object.entries(parsed._agenthaus_mcp)) {
      if (!Array.isArray(keys)) {
        return `Ownership entry for '${pluginName}' in '_agenthaus_mcp' must be an array of keys`;
      }
    }
  }
  return null;
}

function checkProviderConfigs(providers, cwd = process.cwd(), home = os.homedir()) {
  const results = [];

  for (const provider of providers) {
    if (provider.id === 'antigravity') {
      const candidates = new Set([
        path.join(home, '.gemini', 'settings.json'),
        path.join(cwd, '.gemini', 'settings.json')
      ]);
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
            const structErr = validateProviderConfigStructure(parsed, 'Gemini settings');
            if (structErr) {
              results.push({ severity: 'FAIL', message: `Malformed Gemini settings at ${p}: ${structErr}` });
            } else {
              results.push({ severity: 'PASS', message: `Gemini settings valid (${p})` });
            }
          } catch (err) {
            results.push({ severity: 'FAIL', message: `Malformed Gemini settings at ${p}: ${err.message}` });
          }
        }
      }
    } else if (provider.id === 'cursor') {
      const candidates = new Set([
        path.join(home, '.cursor', 'mcp.json'),
        path.join(cwd, '.cursor', 'mcp.json')
      ]);
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
            const structErr = validateProviderConfigStructure(parsed, 'Cursor MCP config');
            if (structErr) {
              results.push({ severity: 'FAIL', message: `Malformed Cursor MCP config at ${p}: ${structErr}` });
            } else {
              results.push({ severity: 'PASS', message: `Cursor MCP config valid (${p})` });
            }
          } catch (err) {
            results.push({ severity: 'FAIL', message: `Malformed Cursor MCP config at ${p}: ${err.message}` });
          }
        }
      }
    } else if (provider.id === 'windsurf') {
      // Windsurf adapter exclusively reads and writes ~/.codeium/windsurf/mcp_config.json
      const candidates = new Set([
        path.join(home, '.codeium', 'windsurf', 'mcp_config.json')
      ]);
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
            const structErr = validateProviderConfigStructure(parsed, 'Windsurf MCP config');
            if (structErr) {
              results.push({ severity: 'FAIL', message: `Malformed Windsurf MCP config at ${p}: ${structErr}` });
            } else {
              results.push({ severity: 'PASS', message: `Windsurf MCP config valid (${p})` });
            }
          } catch (err) {
            results.push({ severity: 'FAIL', message: `Malformed Windsurf MCP config at ${p}: ${err.message}` });
          }
        }
      }
    } else if (provider.id === 'claude') {
      const candidates = new Set([
        path.join(home, '.claude', 'settings.json'),
        path.join(home, '.claude.json'),
        path.join(cwd, '.claude', 'settings.json'),
        path.join(cwd, '.claude.json')
      ]);
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
            const structErr = validateProviderConfigStructure(parsed, 'Claude config');
            if (structErr) {
              results.push({ severity: 'FAIL', message: `Malformed Claude config at ${p}: ${structErr}` });
            } else {
              results.push({ severity: 'PASS', message: `Claude config valid (${p})` });
            }
          } catch (err) {
            results.push({ severity: 'FAIL', message: `Malformed Claude config at ${p}: ${err.message}` });
          }
        }
      }
    }
  }

  return results;
}

module.exports = {
  isCommandAccessible,
  checkMcpCommands,
  checkHookSecurity,
  checkHookSchema,
  checkCredentials,
  checkConfigFreshness,
  checkProviderConfigs,
  hasItemLevelSymlinks,
  runDoctor
};
