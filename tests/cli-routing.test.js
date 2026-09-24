'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { parseCliArgs } = require('../src/cli.js');

const BIN_PATH = path.resolve(__dirname, '..', 'bin', 'agenthaus.js');

test('CLI Routing and Flag Parsing', async (t) => {
  await t.test('parseCliArgs parses options correctly', () => {
    const parsed = parseCliArgs(['-t', 'test', '-p', 'myplugin', '-a', '--json']);
    assert.strictEqual(parsed.values.target, 'test');
    assert.strictEqual(parsed.values.plugin, 'myplugin');
    assert.strictEqual(parsed.values.all, true);
    assert.strictEqual(parsed.values.json, true);
  });

  await t.test('bin/agenthaus.js --help exits 0 and prints usage', () => {
    const result = spawnSync('node', [BIN_PATH, '--help'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('Usage: agenthaus'));
  });

  await t.test('bin/agenthaus.js --version exits 0 and prints 2.0.0', () => {
    const result = spawnSync('node', [BIN_PATH, '--version'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('2.0.0'));
  });

  await t.test('bin/agenthaus.js list --json exits 0 and prints valid JSON', () => {
    const result = spawnSync('node', [BIN_PATH, 'list', '--json'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
    let plugins;
    assert.doesNotThrow(() => {
      plugins = JSON.parse(result.stdout);
    }, 'Output should be valid JSON');
    assert.ok(Array.isArray(plugins), 'Output should be an array');
    assert.ok(plugins.length >= 37, `Expected at least 37 plugins, found ${plugins.length}`);
  });

  await t.test('bin/agenthaus.js unknowncmd exits 1', () => {
    const result = spawnSync('node', [BIN_PATH, 'unknowncmd'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 1);
  });

  await t.test('install --dry-run -t claude -p circuit-breaker exits 0', () => {
    const result = spawnSync('node', [BIN_PATH, 'install', '--dry-run', '-t', 'claude', '-p', 'circuit-breaker'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
  });

  await t.test('install without --target in non-TTY mode exits 1', () => {
    // spawnSync has no TTY by default unless we pass stdio: 'inherit'
    const result = spawnSync('node', [BIN_PATH, 'install'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes('Missing required --target flag'));
  });

  await t.test('update --dry-run -t claude --all exits 0', () => {
    const result = spawnSync('node', [BIN_PATH, 'update', '--dry-run', '-t', 'claude', '--all'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
  });

  await t.test('sync --dry-run --all exits 0', () => {
    const result = spawnSync('node', [BIN_PATH, 'sync', '--dry-run', '--all'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
  });

  await t.test('doctor --fix exits 0', () => {
    const result = spawnSync('node', [BIN_PATH, 'doctor', '--fix'], { encoding: 'utf8' });
    assert.strictEqual(result.status, 0);
  });
});
