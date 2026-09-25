'use strict';

const util = require('node:util');
const path = require('node:path');
const { discoverPlugins, PLUGINS_DIR } = require('./catalog.js');
const { runDoctor } = require('./doctor.js');
const { getProvider, detectAll, getAllProviders } = require('./providers/index.js');
const { installPlugin, uninstallPlugin, updatePlugin, isInstalled } = require('./installer.js');
const { cleanOrphanedCache, cleanStaleTempFiles, healDirectorySymlinks, repairInstalledHooks } = require('./sync.js');
const { pruneStaleOwnership } = require('./providers/mcp-ownership.js');
const ui = require('./ui.js');

function parseCliArgs(rawArgs) {
  return util.parseArgs({
    args: rawArgs,
    options: {
      target: { type: 'string', short: 't' },
      plugin: { type: 'string', short: 'p' },
      all: { type: 'boolean', short: 'a', default: false },
      method: { type: 'string', short: 'm', default: 'symlink' },
      mode: { type: 'string' },
      json: { type: 'boolean', default: false },
      verbose: { type: 'boolean', short: 'v', default: false },
      fix: { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', default: false },
    },
    allowPositionals: true
  });
}

const VALID_MODES = ['user', 'project'];
const VALID_METHODS = ['symlink', 'copy'];

function assertMode(mode) {
  if (mode !== undefined && !VALID_MODES.includes(mode)) {
    throw new Error(`Invalid --mode '${mode}'. Expected one of: ${VALID_MODES.join(', ')}`);
  }
}

async function resolveProviderTarget(target, mode = 'user') {
  assertMode(mode);
  if (!target) {
    if (!process.stdin.isTTY) throw new Error('Missing required --target flag');
    target = await ui.promptSelect('Select target provider:', getAllProviders().map(p => p.id));
  }
  const provider = getProvider(target);
  if (!provider) throw new Error(`Unknown provider: ${target}. Expected one of: ${getAllProviders().map(p => p.id).join(', ')}`);
  return { provider, targetDir: provider.getTargetDir(process.cwd(), mode) };
}

function findPlugin(name) {
  const p = discoverPlugins().find(x => x.name === name);
  if (!p) throw new Error(`Plugin not found: ${name}`);
  return p;
}

async function handleInstall({ target, plugin, all, method, dryRun, mode = 'user' }) {
  if (!VALID_METHODS.includes(method)) {
    throw new Error(`Invalid --method '${method}'. Expected one of: ${VALID_METHODS.join(', ')}`);
  }
  const { provider, targetDir } = await resolveProviderTarget(target, mode);

  if (all) {
    const plugins = discoverPlugins();
    for (const p of plugins) {
      const res = installPlugin(p.path, targetDir, { method, dryRun, provider });
      ui.info(`Plugin ${p.name}: ${res.status}`);
    }
  } else if (plugin) {
    const p = findPlugin(plugin);
    const res = installPlugin(p.path, targetDir, { method, dryRun, provider });
    ui.info(`Plugin ${p.name}: ${res.status}`);
  } else {
    if (!process.stdin.isTTY) throw new Error('Missing required --plugin flag');
    const plugins = discoverPlugins();
    const selected = await ui.promptSelect('Select plugin to install:', plugins.map(p => ({ name: p.name, value: p })));
    const res = installPlugin(selected.path, targetDir, { method, dryRun, provider });
    ui.info(`Plugin ${selected.name}: ${res.status}`);
  }
}

async function handleUpdate({ target, plugin, all, dryRun, mode = 'user' }) {
  const { provider, targetDir } = await resolveProviderTarget(target, mode);

  if (!all && !plugin) {
    if (!process.stdin.isTTY) throw new Error('Missing required --plugin or --all flag');
    const updateAll = await ui.promptConfirm('Update all installed plugins?', true);
    if (updateAll) {
      all = true;
    } else {
      const plugins = discoverPlugins();
      plugin = await ui.promptSelect('Select plugin to update:', plugins.map(p => p.name));
    }
  }

  if (all) {
    const installed = discoverPlugins().filter(p => isInstalled(p.path, targetDir, provider));
    if (installed.length === 0) ui.info(`No installed plugins found for ${provider.name}`);
    for (const p of installed) {
      const res = updatePlugin(p.path, targetDir, { dryRun, provider });
      ui.info(`Plugin ${p.name}: ${res.status} ${res.fromVersion ? `(${res.fromVersion} -> ${res.toVersion})` : ''}`);
    }
  } else if (plugin) {
    const p = findPlugin(plugin);
    const res = updatePlugin(p.path, targetDir, { dryRun, provider });
    ui.info(`Plugin ${p.name}: ${res.status} ${res.fromVersion ? `(${res.fromVersion} -> ${res.toVersion})` : ''}`);
  }
}

async function handleUninstall({ target, plugin, all, dryRun, mode = 'user' }) {
  const { provider, targetDir } = await resolveProviderTarget(target, mode);
  let plugins;
  if (all) {
    plugins = discoverPlugins().filter(p => isInstalled(p.path, targetDir, provider));
  } else if (plugin) {
    plugins = [findPlugin(plugin)];
  } else {
    if (!process.stdin.isTTY) throw new Error('Missing required --plugin or --all flag');
    const installed = discoverPlugins().filter(p => isInstalled(p.path, targetDir, provider));
    if (installed.length === 0) {
      ui.info(`No installed plugins found for ${provider.name}`);
      return;
    }
    plugins = [await ui.promptSelect('Select plugin to uninstall:', installed.map(p => ({ name: p.name, value: p })))];
  }
  for (const p of plugins) {
    const res = uninstallPlugin(targetDir, p.name, { dryRun, provider, sourceDir: p.path });
    ui.info(`Plugin ${p.name}: ${res.status}${res.reason ? ` (${res.reason})` : ''}`);
  }
}

function targetDirsFor(provider, mode) {
  return mode ? [provider.getTargetDir(process.cwd(), mode)] : Array.from(new Set([
    provider.getTargetDir(process.cwd(), 'user'),
    provider.getTargetDir(process.cwd(), 'project')
  ]));
}

function repairProviderHooks(provider, targetDirs, dryRun) {
  const catalogNames = new Set(discoverPlugins().map(p => p.name));
  const repaired = [];
  for (const targetDir of targetDirs) {
    repaired.push(...repairInstalledHooks(targetDir, { catalogNames, repoPluginsDir: PLUGINS_DIR, dryRun }));
  }
  return repaired;
}

function syncProvider(provider, mode, dryRun) {
  const targetDirs = targetDirsFor(provider, mode);
  for (const targetDir of targetDirs) {
    const actions = healDirectorySymlinks(targetDir, PLUGINS_DIR, { dryRun });
    for (const a of actions) ui.info(`Symlink ${provider.name}: ${a.type} ${a.path}`);
  }
  for (const r of repairProviderHooks(provider, targetDirs, dryRun)) {
    ui.info(`Hook ${r.plugin}: repaired ${path.basename(r.hookFile)} (${r.actions.map(x => x.type).join(', ')})`);
  }
  if (typeof provider.getCacheDirs === 'function') {
    for (const cacheDir of provider.getCacheDirs()) {
      for (const a of cleanOrphanedCache(cacheDir, { dryRun })) ui.info(`Cache ${provider.name}: ${a.type} ${a.path}`);
    }
  }
  if (typeof provider.getConfigPaths === 'function') {
    for (const a of cleanStaleTempFiles(provider.getConfigPaths(process.cwd()), { dryRun })) {
      ui.info(`Temp ${provider.name}: ${a.type} ${a.path}`);
    }
  }
}

async function handleSync({ target, all, dryRun, mode }) {
  assertMode(mode);
  if (!target && !all) {
    if (!process.stdin.isTTY) throw new Error('Missing required --target or --all flag');
    all = await ui.promptConfirm('Sync all providers?', true);
  }

  if (all) {
    for (const p of detectAll(process.cwd())) syncProvider(p, mode, dryRun);
    for (const a of pruneStaleOwnership({ dryRun })) ui.info(`State: ${a.type} ${a.path}`);
  } else if (target) {
    const provider = getProvider(target);
    if (!provider) throw new Error(`Unknown provider: ${target}`);
    syncProvider(provider, mode, dryRun);
  }
}

async function runCli(rawArgs) {
  let parsed;
  try {
    parsed = parseCliArgs(rawArgs);
  } catch (err) {
    ui.error(err.message);
    console.error('Run agenthaus --help for usage information.');
    process.exit(1);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    printHelp();
    return;
  }

  if (values.version) {
    console.log('2.0.0');
    return;
  }

  const command = positionals[0];
  const dryRun = values['dry-run'];

  try {
    switch (command) {
      case 'list':
        const plugins = discoverPlugins();
        ui.renderPluginList(plugins, { json: values.json, verbose: values.verbose });
        break;
      case 'doctor':
        let docRes = runDoctor({ verbose: values.verbose, json: values.json });
        if (values.fix) {
          let fixCount = 0;
          for (const p of detectAll(process.cwd())) {
            fixCount += repairProviderHooks(p, targetDirsFor(p), dryRun).length;
          }
          if (!values.json) {
            if (dryRun) {
              ui.info(`Would apply ${fixCount} fixes (dry run)`);
            } else {
              ui.success(`Applied ${fixCount} fixes automatically`);
            }
          }

          if (!dryRun && fixCount > 0) {
            docRes = runDoctor({ verbose: values.verbose, json: values.json });
          }
        }

        if (values.json) {
          console.log(JSON.stringify(docRes, null, 2));
        } else {
          ui.info('Doctor Diagnostics');
          for (const check of docRes.checks) {
            if (check.severity === 'FAIL') ui.error(check.message);
            else if (check.severity === 'WARN') ui.warn(check.message);
            else if (check.severity === 'INFO') ui.info(check.message);
            else ui.success(check.message);
          }
          console.log('');
          ui.info(`Summary: ${docRes.pass_count} Pass, ${docRes.warn_count} Warn, ${docRes.fail_count} Fail`);
        }
        process.exit(docRes.fail_count > 0 ? 1 : 0);
        break;
      case 'install':
        await handleInstall({ target: values.target, plugin: values.plugin, all: values.all, method: values.method, dryRun, mode: values.mode });
        break;
      case 'uninstall':
        await handleUninstall({ target: values.target, plugin: values.plugin, all: values.all, dryRun, mode: values.mode });
        break;
      case 'update':
        await handleUpdate({ target: values.target, plugin: values.plugin, all: values.all, dryRun, mode: values.mode });
        break;
      case 'sync':
        await handleSync({ target: values.target, all: values.all, dryRun, mode: values.mode });
        break;
      default:
        if (command) {
          ui.error(`Unknown command: ${command}`);
        } else {
          ui.error('No command provided.');
        }
        printHelp();
        process.exit(1);
    }
  } catch (err) {
    ui.error(err.message);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`AgentHaus CLI - v2.0.0

Usage: agenthaus <command> [options]

Commands:
  list       List all available plugins
  install    Install a plugin into a provider
  uninstall  Remove a plugin and its MCP registrations from a provider
  update     Update installed plugins
  sync       Heal symlinks, repair hooks, purge stale caches and temp files
  doctor     Run diagnostic engine

Targets: antigravity, claude, codex, copilot, cursor, windsurf

Options:
  -t, --target <target>   Target runtime
  -p, --plugin <plugin>   Plugin name
  -a, --all               All plugins
  -m, --method <method>   Installation method: symlink (default) or copy
  --mode <mode>           Installation scope: user (default) or project
  --json                  Output as JSON
  -v, --verbose           Verbose output
  --fix                   Fix issues automatically
  --dry-run               Dry run
  -h, --help              Show help
  --version               Show version
`);
}

module.exports = { parseCliArgs, runCli };
