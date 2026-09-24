#!/usr/bin/env node
'use strict';

const { runCli } = require('../src/cli.js');

try {
  runCli(process.argv.slice(2)).catch(err => {
    console.error(err.message);
    process.exit(1);
  });
} catch (err) {
  console.error('FATAL', err.message);
  process.exit(1);
}
