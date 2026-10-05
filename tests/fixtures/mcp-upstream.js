'use strict';
const fs = require('node:fs');
const readline = require('node:readline');
readline.createInterface({ input: process.stdin }).on('line', line => {
  const m = JSON.parse(line);
  if (process.env.CALL_LOG) fs.appendFileSync(process.env.CALL_LOG, JSON.stringify(m) + '\n');
  if (!Object.hasOwn(m, 'id')) return;
  if (m.method === 'initialize') {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: { protocolVersion: m.params.protocolVersion,
      capabilities: { tools: {} }, serverInfo: { name: 'fixture', version: '1.0' } } }) + '\n');
  } else if (m.method === 'tools/list') {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: { tools: [{ name: 'read', inputSchema: { type: 'object' } }] } }) + '\n');
  } else if (m.method === 'tools/call' && m.params.name === 'hang') {
    // Timeout fixture.
  } else if (m.method === 'tools/call' && m.params.name === 'error') {
    process.stderr.write('CANARY_SECRET\n');
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, error: { code: -32042, message: 'CANARY_SECRET', data: 'CANARY_SECRET' } }) + '\n');
  } else {
    process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: m.id, result: { content: [{ type: 'text', text: 'fixture result' }] } }) + '\n');
  }
});
