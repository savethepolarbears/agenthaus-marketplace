'use strict';
const path = require('node:path');
const fs = require('node:fs');
const { isPlainObject } = require('./fs-utils.js');
const { validateTarget } = require('./approval-receipts.js');
const { canonical } = require('./safety-policy.js');
const STARTUP_ENV = ['NODE_OPTIONS', 'NODE_PATH', 'NODE_V8_COVERAGE', 'LD_PRELOAD', 'LD_LIBRARY_PATH',
  'DYLD_INSERT_LIBRARIES', 'DYLD_LIBRARY_PATH', 'DYLD_FRAMEWORK_PATH', 'DYLD_FALLBACK_LIBRARY_PATH', 'DYLD_FALLBACK_FRAMEWORK_PATH'];

// Opt-in transformation; only reviewed target files are read. Provider ownership stays unchanged.
function guardPlugin(plugin, options) {
  if (!options || !path.isAbsolute(options.policyFile || '') || !path.isAbsolute(options.guardPath || '')) {
    throw new Error('Absolute policy and trusted guard paths required');
  }
  const servers = {}, coverage = [];
  for (const [name, server] of Object.entries(plugin.mcpServers || {})) {
    const supported = isPlainObject(server) && typeof server.command === 'string' && server.command.length > 0 &&
      !server.url && (!server.type || server.type === 'stdio') && (!server.transport || server.transport === 'stdio') &&
      (!server.args || (Array.isArray(server.args) && server.args.every(a => typeof a === 'string')));
    coverage.push({ server: name, status: supported ? 'guarded-stdio' : 'unsupported-transport',
      execution_owner: supported ? 'agenthaus-guard' : 'native-provider', live_verified: false });
    if (!supported) throw new Error(`Unsupported guard transport for ${name}; no partial configuration emitted`);
    const args = [options.guardPath, '--policy', options.policyFile];
    const approval = options.approval;
    let command = server.command;
    if (approval) {
      for (const key of ['public-key', 'receipt-dir', 'receipt-file', 'actor', 'provider']) {
        if (typeof approval[key] !== 'string' || !approval[key]) throw new Error('Incomplete approval configuration');
        args.push('--' + key, approval[key]);
      }
      const targetFile = approval['target-files']?.[name];
      if (typeof targetFile !== 'string' || !path.isAbsolute(targetFile)) throw new Error('Trusted per-server target file required');
      const target = validateTarget(JSON.parse(fs.readFileSync(targetFile, 'utf8')));
      const reviewed = target.launch.command;
      const bareMatch = !path.isAbsolute(command) && path.basename(command) === command && path.basename(reviewed) === command;
      if (target.server !== name || (command !== reviewed && !bareMatch) || canonical(server.args || []) !== canonical(target.launch.args)) {
        throw new Error('Plugin configuration does not match trusted target');
      }
      command = reviewed; // The independently reviewed absolute executable, never a PATH lookup.
      args.push('--target', targetFile);
    }
    args.push('--', command, ...(server.args || []));
    const env = Object.fromEntries(Object.entries(server.env || {}).filter(([key]) => !STARTUP_ENV.includes(key.toUpperCase())));
    // These are interpreted before guard JavaScript starts; reset inherited controls too.
    for (const key of STARTUP_ENV) env[key] = '';
    servers[name] = { ...server, command: process.execPath, args, env };
  }
  return { plugin: { ...plugin, mcpServers: servers }, coverage };
}
module.exports = { guardPlugin };
