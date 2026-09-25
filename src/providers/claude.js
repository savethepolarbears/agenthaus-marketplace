'use strict';

/**
 * Claude Code loads plugins only through its marketplace registry
 * (~/.claude/plugins/cache + installed_plugins.json + enabledPlugins); it does not
 * scan ~/.claude/plugins/<name> or a project's .claude/plugins/. Installation is
 * therefore delegated to the official `claude plugin` CLI.
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

function claudeBin() {
  return process.env.AGENTHAUS_CLAUDE_BIN || (process.platform === 'win32' ? 'claude.cmd' : 'claude');
}

function scopeFor(targetDir) {
  return path.resolve(targetDir) === path.resolve(os.homedir(), '.claude', 'plugins') ? 'user' : 'project';
}

function getMarketplace(sourceDir) {
  const repoRoot = path.resolve(sourceDir, '..', '..');
  const manifestPath = path.join(repoRoot, '.claude-plugin', 'marketplace.json');
  let name;
  try {
    name = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).name;
  } catch {}
  if (!name) throw new Error(`Claude Code: no marketplace manifest found at ${manifestPath}`);
  return { name, repoRoot };
}

function manualSteps(pluginId, repoRoot, scope) {
  return `Run inside Claude Code:\n  /plugin marketplace add ${repoRoot}\n  /plugin install ${pluginId}\n` +
         `or from a shell:\n  claude plugin marketplace add "${repoRoot}" --scope ${scope}\n  claude plugin install ${pluginId} --scope ${scope}`;
}

function runClaude(args) {
  const bin = claudeBin();
  const useShell = process.platform === 'win32' && /\.cmd$/i.test(bin);
  const finalArgs = useShell ? args.map(a => JSON.stringify(a)) : args;
  return execFileSync(bin, finalArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], shell: useShell });
}

// `--json` commands print one result object on the last stdout line.
function runClaudeJson(args) {
  let stdout;
  try {
    stdout = runClaude([...args, '--json']);
  } catch (err) {
    if (err.code === 'ENOENT') throw err;
    stdout = String(err.stdout || '');
    if (!stdout.trim()) {
      return { outcome: 'failed', message: String(err.stderr || err.message).trim() };
    }
  }
  const lastLine = stdout.trim().split('\n').pop();
  try {
    return JSON.parse(lastLine);
  } catch {
    return { outcome: 'failed', message: lastLine };
  }
}

function listInstalled() {
  try {
    const parsed = JSON.parse(runClaude(['plugin', 'list', '--json']));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ensureMarketplace({ name, repoRoot }, scope) {
  let configured = [];
  try {
    configured = JSON.parse(runClaude(['plugin', 'marketplace', 'list', '--json']));
  } catch (err) {
    if (err.code === 'ENOENT') throw err;
  }
  if (Array.isArray(configured) && configured.some(m => m.name === name)) return;
  runClaude(['plugin', 'marketplace', 'add', repoRoot, '--scope', scope]);
}

function withCli(pluginId, repoRoot, scope, fn) {
  try {
    return fn();
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Claude Code CLI ('${claudeBin()}') not found on PATH.\n${manualSteps(pluginId, repoRoot, scope)}`);
    }
    throw err;
  }
}

function assertOk(result, pluginId, repoRoot, scope) {
  if (result.outcome === 'ok') return;
  if (result.shownCommand) {
    throw new Error(`Claude Code: ${pluginId} requires confirming a marketplace-declared command. Review and install it manually.\n${manualSteps(pluginId, repoRoot, scope)}`);
  }
  throw new Error(`Claude Code: ${result.message || `failed to process ${pluginId}`}`);
}

// Remove an install left by earlier agenthaus versions that copied or symlinked
// plugins into ~/.claude/plugins/<name>, which Claude Code never loaded.
function removeLegacyInstall(targetDir, sourceDir, dryRun) {
  const legacy = path.join(targetDir, path.basename(sourceDir));
  let st;
  try { st = fs.lstatSync(legacy); } catch { return; }
  let ours = false;
  if (st.isSymbolicLink()) {
    try { ours = fs.realpathSync(legacy) === fs.realpathSync(sourceDir); } catch {}
  } else if (st.isDirectory()) {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(legacy, '.agenthaus-install.json'), 'utf8'));
      ours = meta.managedBy === 'agenthaus' && meta.plugin === path.basename(sourceDir);
    } catch {}
  }
  if (!ours || dryRun) return;
  if (st.isSymbolicLink()) fs.unlinkSync(legacy);
  else fs.rmSync(legacy, { recursive: true, force: true });
  console.log(`[info] Claude Code: removed legacy unloaded install at ${legacy}`);
}

module.exports = {
  id: 'claude',
  name: 'Claude Code',
  detect(cwd) {
    return fs.existsSync(path.join(os.homedir(), '.claude')) ||
           fs.existsSync(path.join(os.homedir(), '.claude.json')) ||
           fs.existsSync(path.join(cwd, '.claude')) ||
           fs.existsSync(path.join(cwd, '.claude.json')) ||
           fs.existsSync(path.join(cwd, '.mcp.json'));
  },
  // Legacy location scanned by sync/doctor for stale agenthaus installs; not a load path.
  getTargetDir(cwd, mode) {
    if (mode === 'project') return path.join(cwd, '.claude', 'plugins');
    return path.join(os.homedir(), '.claude', 'plugins');
  },
  getCacheDirs() {
    return [path.join(os.homedir(), '.claude', 'plugins', 'cache')];
  },
  getConfigPaths(cwd, home = os.homedir()) {
    return [
      path.join(home, '.claude', 'settings.json'),
      path.join(home, '.claude.json'),
      path.join(cwd, '.claude', 'settings.json'),
      path.join(cwd, '.claude.json'),
      path.join(cwd, '.mcp.json')
    ];
  },
  getCapabilities() {
    return { mcp: 'full', hooks: 'full', commands: 'full', skills: 'full' };
  },

  install(sourceDir, targetDir, { dryRun = false } = {}) {
    const marketplace = getMarketplace(sourceDir);
    const scope = scopeFor(targetDir);
    const pluginId = `${path.basename(sourceDir)}@${marketplace.name}`;
    if (dryRun) {
      return { status: 'installed', method: 'claude-cli', path: pluginId, dryRun: true };
    }
    return withCli(pluginId, marketplace.repoRoot, scope, () => {
      ensureMarketplace(marketplace, scope);
      assertOk(runClaudeJson(['plugin', 'install', pluginId, '--scope', scope]), pluginId, marketplace.repoRoot, scope);
      removeLegacyInstall(targetDir, sourceDir, dryRun);
      return { status: 'installed', method: 'claude-cli', path: pluginId };
    });
  },

  uninstall(pluginName, targetDir, { dryRun = false, sourceDir } = {}) {
    const marketplace = getMarketplace(sourceDir);
    const scope = scopeFor(targetDir);
    const pluginId = `${pluginName}@${marketplace.name}`;
    return withCli(pluginId, marketplace.repoRoot, scope, () => {
      if (!this.isInstalled(pluginName, targetDir, { sourceDir })) return { status: 'not_found', path: pluginId };
      if (!dryRun) {
        assertOk(runClaudeJson(['plugin', 'uninstall', pluginId, '--scope', scope]), pluginId, marketplace.repoRoot, scope);
        removeLegacyInstall(targetDir, sourceDir, dryRun);
      }
      return { status: 'removed', path: pluginId };
    });
  },

  update(sourceDir, targetDir, { dryRun = false } = {}) {
    const marketplace = getMarketplace(sourceDir);
    const scope = scopeFor(targetDir);
    const pluginName = path.basename(sourceDir);
    const pluginId = `${pluginName}@${marketplace.name}`;
    return withCli(pluginId, marketplace.repoRoot, scope, () => {
      if (!this.isInstalled(pluginName, targetDir, { sourceDir })) return { status: 'not_found', path: pluginId };
      if (dryRun) return { status: 'updated', path: pluginId, dryRun: true };
      runClaude(['plugin', 'marketplace', 'update', marketplace.name]);
      assertOk(runClaudeJson(['plugin', 'update', pluginId, '--scope', scope]), pluginId, marketplace.repoRoot, scope);
      return { status: 'updated', path: pluginId };
    });
  },

  isInstalled(pluginName, targetDir, { sourceDir } = {}) {
    const marketplace = getMarketplace(sourceDir);
    const scope = scopeFor(targetDir);
    const pluginId = `${pluginName}@${marketplace.name}`;
    return listInstalled().some(p => p.id === pluginId && p.scope === scope);
  }
};
