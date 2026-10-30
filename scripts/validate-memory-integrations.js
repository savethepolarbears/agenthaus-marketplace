#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { discoverPlugins } = require('../src/catalog.js');
const { buildIntegrationMatrix } = require('../src/memory-integrations.js');
function main() {
  const root = path.resolve(__dirname, '..');
  const declarations = JSON.parse(fs.readFileSync(path.join(root, 'plugins/agent-memory/references/integrations.json'), 'utf8'));
  const matrix = buildIntegrationMatrix(discoverPlugins(path.join(root, 'plugins')), declarations);
  const destination = process.argv[2];
  if (destination) require('../src/fs-utils.js').writeJsonAtomic(path.resolve(destination), matrix, { backup: false });
  process.stdout.write(JSON.stringify({ passed: true, plugins: matrix.entries.length, live_verified: false }) + '\n');
}
if (require.main === module) { try { main(); } catch { process.stderr.write('Memory integration coverage invalid\n'); process.exitCode = 1; } }
module.exports = { main };
