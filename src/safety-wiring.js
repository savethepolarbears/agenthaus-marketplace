'use strict';
const path = require('node:path');
const { isPlainObject } = require('./fs-utils.js');

// Pure, opt-in transformation. Installation ownership and defaults stay with providers.
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
    if (approval) {
      for (const key of ['public-key', 'receipt-dir', 'receipt-file', 'actor', 'provider']) {
        if (typeof approval[key] !== 'string' || !approval[key]) throw new Error('Incomplete approval configuration');
        args.push('--' + key, approval[key]);
      }
    }
    args.push('--', server.command, ...(server.args || []));
    servers[name] = { ...server, command: process.execPath, args };
  }
  return { plugin: { ...plugin, mcpServers: servers }, coverage };
}
module.exports = { guardPlugin };
