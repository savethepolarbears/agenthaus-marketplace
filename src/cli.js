'use strict';

const util = require('node:util');
const { discoverPlugins } = require('./catalog.js');
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
      dryRun: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', default: false },
    },
    allowPositionals: true
  });
}

function runCli(rawArgs) {
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

  switch (command) {
    case 'list':
      const plugins = discoverPlugins();
      if (values.json) {
        console.log(JSON.stringify(plugins, null, 2));
      } else {
        console.log(plugins);
      }
      break;
    case 'install':
    case 'update':
    case 'sync':
    case 'doctor':
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
}

function printHelp() {
  console.log(`AgentHaus CLI - v2.0.0

Usage: agenthaus <command> [options]

Commands:
  list       List all available plugins
  install    Install a plugin
  update     Update a plugin
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
  --dryRun                Dry run
  -h, --help              Show help
  --version               Show version
`);
}

module.exports = { parseCliArgs, runCli };
