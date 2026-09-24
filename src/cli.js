'use strict';

const util = require('node:util');
const path = require('node:path');
const { discoverPlugins, PLUGINS_DIR } = require('./catalog.js');
const { runDoctor } = require('./doctor.js');
const { getProvider, detectAll, getAllProviders } = require('./providers/index.js');
const { installPlugin, updatePlugin } = require('./installer.js');
const { cleanOrphanedCache, healDirectorySymlinks, repairHookFile } = require('./sync.js');
const fs = require('node:fs');
const os = require('node:os');
const ui = require('./ui.js');

function parseCliArgs(rawArgs) {
  return util.parseArgs({
    args: rawArgs,
    options: {
      target: { type: 'string', short: 't' },
      plugin: { type: 'string', short: 'p' },
      all: { type: 'boolean', short: 'a', default: false },
      method: { type: 'string', short: 'm', default: 'symlink' },
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

async function handleInstall({ target, plugin, all, method, dryRun }) {
  if (!target) {
    if (!process.stdin.isTTY) throw new Error('Missing required --target flag');
    const providers = getAllProviders().map(p => p.id);
    target = await ui.promptSelect('Select target provider:', providers);
  }
  
  const provider = getProvider(target);
  if (!provider) throw new Error(`Unknown provider: ${target}`);
  const targetDir = provider.getTargetDir(process.cwd());

  if (all) {
    const plugins = discoverPlugins();
    for (const p of plugins) {
      const res = installPlugin(p.path, targetDir, { method, dryRun });
      ui.info(`Plugin ${p.name}: ${res.status}`);
    }
  } else if (plugin) {
    const plugins = discoverPlugins();
    const p = plugins.find(x => x.name === plugin);
    if (!p) throw new Error(`Plugin not found: ${plugin}`);
    const res = installPlugin(p.path, targetDir, { method, dryRun });
    ui.info(`Plugin ${p.name}: ${res.status}`);
  } else {
    if (!process.stdin.isTTY) throw new Error('Missing required --plugin flag');
    const plugins = discoverPlugins();
    const selected = await ui.promptSelect('Select plugin to install:', plugins.map(p => ({ name: p.name, value: p })));
    const res = installPlugin(selected.path, targetDir, { method, dryRun });
    ui.info(`Plugin ${selected.name}: ${res.status}`);
  }
}

async function handleUpdate({ target, plugin, all, dryRun }) {
  if (!target) {
    if (!process.stdin.isTTY) throw new Error('Missing required --target flag');
    const providers = getAllProviders().map(p => p.id);
    target = await ui.promptSelect('Select target provider:', providers);
  }

  const provider = getProvider(target);
  if (!provider) throw new Error(`Unknown provider: ${target}`);
  const targetDir = provider.getTargetDir(process.cwd());

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
    const plugins = discoverPlugins();
    for (const p of plugins) {
      const res = updatePlugin(p.path, targetDir, { dryRun });
      ui.info(`Plugin ${p.name}: ${res.status} ${res.fromVersion ? `(${res.fromVersion} -> ${res.toVersion})` : ''}`);
    }
  } else if (plugin) {
    const plugins = discoverPlugins();
    const p = plugins.find(x => x.name === plugin);
    if (!p) throw new Error(`Plugin not found: ${plugin}`);
    const res = updatePlugin(p.path, targetDir, { dryRun });
    ui.info(`Plugin ${p.name}: ${res.status}`);
  }
}

async function handleSync({ target, all, dryRun }) {
  if (!target && !all) {
    if (!process.stdin.isTTY) throw new Error('Missing required --target or --all flag');
    all = await ui.promptConfirm('Sync all providers?', true);
  }

  const repoPluginsDir = PLUGINS_DIR;
  
  if (all) {
    // Sweep Claude cache
    const claudeCache = path.join(os.homedir(), '.claude', 'plugins', 'cache');
    const cacheActions = cleanOrphanedCache(claudeCache, { dryRun });
    for (const a of cacheActions) ui.info(`Cache: ${a.type} ${a.path}`);

    const providers = detectAll(process.cwd());
    const catalogNames = new Set(discoverPlugins().map(p => p.name));
    for (const p of providers) {
      const targetDir = p.getTargetDir(process.cwd());
      const actions = healDirectorySymlinks(targetDir, repoPluginsDir, { dryRun });
      for (const a of actions) ui.info(`Symlink ${p.name}: ${a.type} ${a.path}`);

      // repair hooks scoped to known catalog plugins
      if (fs.existsSync(targetDir)) {
        for (const entry of fs.readdirSync(targetDir)) {
          if (!catalogNames.has(entry)) continue;
          if (fs.lstatSync(path.join(targetDir, entry)).isSymbolicLink()) continue;
          const hookFile = path.join(targetDir, entry, 'hooks', 'hooks.json');
          if (fs.existsSync(hookFile)) {
            const res = repairHookFile(hookFile, { dryRun });
            if (res.repaired) ui.info(`Hook ${entry}: repaired (${res.actions.map(x=>x.type).join(', ')})`);
          }
        }
      }
    }
  } else if (target) {
    const provider = getProvider(target);
    if (!provider) throw new Error(`Unknown provider: ${target}`);
    const targetDir = provider.getTargetDir(process.cwd());
    const actions = healDirectorySymlinks(targetDir, repoPluginsDir, { dryRun });
    for (const a of actions) ui.info(`Symlink ${provider.name}: ${a.type} ${a.path}`);
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
        const docRes = runDoctor({ verbose: values.verbose, json: values.json });
        if (values.fix) {
          // implement fix scoped to catalog plugins
          let fixCount = 0;
          const catalogNames = new Set(discoverPlugins().map(p => p.name));
          const detected = detectAll(process.cwd());
          for (const p of detected) {
            const tDir = p.getTargetDir(process.cwd());
            if (!fs.existsSync(tDir)) continue;
            for (const entry of fs.readdirSync(tDir)) {
              if (!catalogNames.has(entry)) continue;
              if (fs.lstatSync(path.join(tDir, entry)).isSymbolicLink()) continue;
              const hFile = path.join(tDir, entry, 'hooks', 'hooks.json');
              if (fs.existsSync(hFile)) {
                const res = repairHookFile(hFile, { dryRun });
                if (res.repaired) fixCount++;
              }
            }
          }
          if (!values.json) {
            if (dryRun) {
              ui.info(`Would apply ${fixCount} fixes (dry run)`);
            } else {
              ui.success(`Applied ${fixCount} fixes automatically`);
            }
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
        await handleInstall({ target: values.target, plugin: values.plugin, all: values.all, method: values.method, dryRun });
        break;
      case 'update':
        await handleUpdate({ target: values.target, plugin: values.plugin, all: values.all, dryRun });
        break;
      case 'sync':
        await handleSync({ target: values.target, all: values.all, dryRun });
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
  install    Install a plugin (experimental)
  update     Update a plugin (experimental)
  sync       Sync plugins
  doctor     Run diagnostic engine

Options:
  -t, --target <target>   Target runtime
  -p, --plugin <plugin>   Plugin name
  -a, --all               All plugins
  -m, --method <method>   Installation method (default: symlink)
  --json                  Output as JSON
  -v, --verbose           Verbose output
  --fix                   Fix issues automatically
  --dry-run               Dry run
  -h, --help              Show help
  --version               Show version
`);
}

module.exports = { parseCliArgs, runCli };
