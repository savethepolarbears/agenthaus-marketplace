'use strict';

const util = require('node:util');
const path = require('node:path');
const { discoverPlugins, PLUGINS_DIR } = require('./catalog.js');
const { runDoctor } = require('./doctor.js');
const { getProvider, detectAll, getAllProviders } = require('./providers/index.js');
const { installPlugin, uninstallPlugin, updatePlugin, isInstalled, isForeignInstallation } = require('./installer.js');
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
      'strict-integrity': { type: 'boolean', default: false },
      'lock-file': { type: 'string' },
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

async function handleInstall({ target, plugin, all, method, dryRun, mode = 'user', strictIntegrity = false, lockFile }) {
  if (!VALID_METHODS.includes(method)) {
    throw new Error(`Invalid --method '${method}'. Expected one of: ${VALID_METHODS.join(', ')}`);
  }
  const { provider, targetDir } = await resolveProviderTarget(target, mode);

  if (all) {
    const plugins = discoverPlugins();
    if (strictIntegrity) preflightStrictMutation(plugins, provider, targetDir, { method, lockFile });
    for (const p of plugins) {
      const res = installPlugin(p.path, targetDir, { method, dryRun, provider, strictIntegrity, lockFile });
      ui.info(`Plugin ${p.name}: ${res.status}`);
    }
  } else if (plugin) {
    const p = findPlugin(plugin);
    const res = installPlugin(p.path, targetDir, { method, dryRun, provider, strictIntegrity, lockFile });
    ui.info(`Plugin ${p.name}: ${res.status}`);
  } else {
    if (!process.stdin.isTTY) throw new Error('Missing required --plugin flag');
    const plugins = discoverPlugins();
    const selected = await ui.promptSelect('Select plugin to install:', plugins.map(p => ({ name: p.name, value: p })));
    const res = installPlugin(selected.path, targetDir, { method, dryRun, provider, strictIntegrity, lockFile });
    ui.info(`Plugin ${selected.name}: ${res.status}`);
  }
}

async function handleUpdate({ target, plugin, all, dryRun, mode = 'user', strictIntegrity = false, lockFile }) {
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
    if (strictIntegrity) assertStrictProvider(provider);
    const installed = discoverPlugins().filter(p => isInstalled(p.path, targetDir, provider));
    if (strictIntegrity) preflightStrictMutation(installed, provider, targetDir, { lockFile });
    if (installed.length === 0) ui.info(`No installed plugins found for ${provider.name}`);
    for (const p of installed) {
      const res = updatePlugin(p.path, targetDir, { dryRun, provider, strictIntegrity, lockFile });
      ui.info(`Plugin ${p.name}: ${res.status} ${res.fromVersion ? `(${res.fromVersion} -> ${res.toVersion})` : ''}`);
    }
  } else if (plugin) {
    const p = findPlugin(plugin);
    const res = updatePlugin(p.path, targetDir, { dryRun, provider, strictIntegrity, lockFile });
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
  refreshProviderRegistrations(provider, targetDirs, dryRun);
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

function refreshProviderRegistrations(provider, targetDirs, dryRun) {
  if (typeof provider.postInstall !== 'function') return;
  const fs = require('node:fs'), catalog = new Map(discoverPlugins().map(p => [p.name, p]));
  const plans = [];
  for (const targetDir of targetDirs) {
    if (!fs.existsSync(targetDir)) continue;
    for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
      const plugin = catalog.get(entry.name);
      if (!plugin || (!entry.isDirectory() && !entry.isSymbolicLink()) || !isInstalled(plugin.path, targetDir, provider)) continue;
      const installed = path.join(targetDir, entry.name);
      if (isForeignInstallation(installed, plugin.path)) continue;
      if (entry.isSymbolicLink()) {
        try { if (fs.realpathSync(installed) !== fs.realpathSync(plugin.path)) continue; }
        catch { continue; }
      }
      // Whole-directory symlinks need a distinct real source for Antigravity's conversion.
      const source = entry.isSymbolicLink() ? plugin.path : installed;
      if (typeof provider.preflightInstall === 'function') provider.preflightInstall(source, targetDir);
      plans.push({ source, targetDir });
    }
  }
  for (const plan of plans) provider.postInstall(plan.source, plan.targetDir, { dryRun });
}

function assertStrictProvider(provider) {
  if (!provider || !new Set(['cursor', 'codex', 'copilot', 'windsurf']).has(provider.id)) throw new Error('Strict copied registration is unsupported for this provider');
}
function verifyStrictInstalled(directory) {
  const verified = require('./integrity.js').verifyContentLock(directory, undefined, { installed: true });
  if (!verified.ok) throw new Error(`Installed content integrity failed: ${verified.errors[0].code}`);
  return verified.snapshot;
}
function preflightStrictMutation(plugins, provider, targetDir, { method, lockFile }) {
  const fs = require('node:fs'); assertStrictProvider(provider);
  if (method !== undefined && method !== 'copy') throw new Error('Strict installation requires a verified copy');
  for (const plugin of plugins) {
    const source = require('./integrity.js').preflightPlugin(plugin.path, { strictIntegrity: true, lockFile });
    const destination = path.join(targetDir, plugin.name);
    if (typeof provider.preflightInstall === 'function') provider.preflightInstall(plugin.path, targetDir);
    try { fs.lstatSync(destination); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    const installed = verifyStrictInstalled(destination);
    if (method === 'copy' && source.tree_sha256 !== installed.tree_sha256) throw new Error('Strict install source differs from the installed payload; use a reviewed update');
  }
}

function preflightStrictSync(providers, mode, lockFile) {
  const fs = require('node:fs');
  const supported = new Set(['cursor', 'codex', 'copilot', 'windsurf']);
  const catalog = new Map(discoverPlugins().map(p => [p.name, p]));
  const plans = [];
  for (const provider of providers) {
    if (!provider || !supported.has(provider.id)) throw new Error('Strict registration sync is unsupported for this provider');
    for (const targetDir of targetDirsFor(provider, mode)) {
      if (!fs.existsSync(targetDir)) continue;
      for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
        const installed = path.join(targetDir, entry.name);
        if (!entry.isDirectory() || entry.isSymbolicLink() || !catalog.has(entry.name)) throw new Error('Strict sync requires a known copied installation');
        require('./integrity.js').preflightPlugin(catalog.get(entry.name).path, { strictIntegrity: true, lockFile });
        const snapshot = verifyStrictInstalled(installed);
        if (typeof provider.preflightInstall === 'function') provider.preflightInstall(installed, targetDir);
        plans.push({ provider, targetDir, snapshot });
      }
    }
  }
  return plans; // All selected inputs verified before the first provider write.
}

async function handleSync({ target, all, dryRun, mode, strictIntegrity = false, lockFile }) {
  assertMode(mode);
  if (!target && !all) {
    if (!process.stdin.isTTY) throw new Error('Missing required --target or --all flag');
    all = await ui.promptConfirm('Sync all providers?', true);
  }

  if (strictIntegrity) {
    const providers = all ? detectAll(process.cwd()) : [getProvider(target)];
    const plans = preflightStrictSync(providers, mode, lockFile);
    for (const plan of plans) require('./integrity.js').withVerifiedStage(plan.snapshot, stage => plan.provider.postInstall(stage, plan.targetDir, { dryRun }));
    ui.info(`Verified registration sync: ${plans.length} installed plugins`);
    return; // Locked payload repair and generic cleanup are not part of this mode.
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
  if (require('./runtime-cli.js').FAMILIES.has(rawArgs[0])) {
    try { await require('./runtime-cli.js').runRuntimeCli(rawArgs); }
    catch (error) { ui.error(error.message); process.exitCode = 1; }
    return;
  }
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
    const strictIntegrity = values['strict-integrity'];
    const lockFile = values['lock-file'] ? path.resolve(values['lock-file']) : undefined;
    if (strictIntegrity && command === 'doctor' && values.fix) throw new Error('Strict doctor repair is unsupported; use verified registration sync');
    if (strictIntegrity && !['install', 'update', 'sync', 'doctor'].includes(command)) throw new Error('Strict integrity is supported for install, update and sync');
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
        await handleInstall({ target: values.target, plugin: values.plugin, all: values.all, method: values.method, dryRun, mode: values.mode, strictIntegrity, lockFile });
        break;
      case 'uninstall':
        await handleUninstall({ target: values.target, plugin: values.plugin, all: values.all, dryRun, mode: values.mode });
        break;
      case 'update':
        await handleUpdate({ target: values.target, plugin: values.plugin, all: values.all, dryRun, mode: values.mode, strictIntegrity, lockFile });
        break;
      case 'sync':
        await handleSync({ target: values.target, all: values.all, dryRun, mode: values.mode, strictIntegrity, lockFile });
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
  skill      Validate or safely read a selected skill
  capabilities  Build, page and benchmark lean skill discovery
  permissions   Inspect declarations without granting access
  lock       Explicitly renew or verify a reviewed content lock
  unicode    Inspect deceptive Unicode with scoped exceptions
  hook       Run an explicitly configured bounded hook or inspect limits
  task       Coordinate typed local tasks with fenced SQLite leases

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
  --strict-integrity      Verify reviewed locks before install/update/sync
  --lock-file <file>      Explicit lock for source verification
  -h, --help              Show help
  --version               Show version
`);
}

module.exports = { parseCliArgs, runCli };
