'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { detectAll } = require('./providers/index.js');
const { discoverPlugins } = require('./catalog.js');

function isCommandAccessible(command) {
  if (path.isAbsolute(command)) {
    try {
      fs.accessSync(command, fs.constants.X_OK);
      return { accessible: true, path: command };
    } catch {
      return { accessible: false, path: null };
    }
  }

  const paths = (process.env.PATH || '').split(path.delimiter);
  for (const p of paths) {
    if (!p) continue;
    const fullPath = path.join(p, command);
    try {
      fs.accessSync(fullPath, fs.constants.X_OK);
      return { accessible: true, path: fullPath };
    } catch {}
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
    for (const group of ['PreToolUse', 'PostToolUse']) {
      if (hooks[group]) {
        if (Array.isArray(hooks[group])) {
          if (hooks[group].length === 0) {
            results.push({ severity: 'WARN', message: `Empty hooks array in ${path.basename(pluginDir)}` });
          }
          for (const h of hooks[group]) {
            if (h.matcher === '*') {
              results.push({ severity: 'INFO', message: `Wildcard matcher '*' in ${path.basename(pluginDir)} (matches all tools)` });
            }
          }
        }
      }
    }
  };

  const hooks = manifest.hooks || {};
  checkHookData(hooks);

  const realHookFile = path.join(pluginDir, 'hooks', 'hooks.json');
  if (fs.existsSync(realHookFile)) {
    try {
      const hd = JSON.parse(fs.readFileSync(realHookFile, 'utf8'));
      const realHooks = hd.hooks || hd;
      checkHookData(realHooks);
    } catch (e) {
      results.push({ severity: 'FAIL', message: `Corrupted hook file in ${path.basename(pluginDir)}` });
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
      results.push({ name: v, status: 'SET', severity: 'INFO' });
    } else {
      results.push({ name: v, status: 'MISSING', severity: 'WARN' });
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
  
  addResults(checkMcpCommands(plugins));

  for (const p of plugins) {
    const pDir = path.join(repoRoot, 'plugins', p.name);
    addResults(checkHookSchema(pDir));
    if (p.mcpParseError) {
      addResult({ severity: 'FAIL', message: `Corrupted .mcp.json in ${p.name}: ${p.mcpParseError}` });
    }
  }
  
  const requiredVars = ['CLOUDFLARE_API_TOKEN', 'GITHUB_TOKEN', 'NOTION_API_KEY', 'DATABASE_URL', 'NEON_API_KEY'];
  addResults(checkCredentials(requiredVars));
  
  addResults(checkConfigFreshness(plugins, repoRoot));

  return { pass_count, warn_count, fail_count, checks };
}

module.exports = {
  isCommandAccessible,
  checkMcpCommands,
  checkHookSecurity,
  checkHookSchema,
  checkCredentials,
  checkConfigFreshness,
  runDoctor
};
