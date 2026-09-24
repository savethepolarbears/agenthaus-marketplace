'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { parseCliArgs } = require('../src/cli.js');

const BIN_PATH = path.resolve(__dirname, '..', 'bin', 'agenthaus.js');

test('CLI Routing and Flag Parsing', async (t) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-routing-'));
  const isolatedEnv = { ...process.env, HOME: tmpDir, USERPROFILE: tmpDir };

  const runBin = (args, opts = {}) => {
    return spawnSync('node', [BIN_PATH, ...args], {
      env: { ...isolatedEnv, ...(opts.env || {}) },
      cwd: opts.cwd || tmpDir,
      encoding: 'utf8',
      ...opts
    });
  };

  t.after(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await t.test('parseCliArgs parses options correctly', () => {
    const parsed = parseCliArgs(['-t', 'test', '-p', 'myplugin', '-a', '--json']);
    assert.strictEqual(parsed.values.target, 'test');
    assert.strictEqual(parsed.values.plugin, 'myplugin');
    assert.strictEqual(parsed.values.all, true);
    assert.strictEqual(parsed.values.json, true);
  });

  await t.test('bin/agenthaus.js --help exits 0 and prints usage', () => {
    const result = runBin(['--help']);
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('Usage: agenthaus'));
  });

  await t.test('bin/agenthaus.js --version exits 0 and prints 2.0.0', () => {
    const result = runBin(['--version']);
    assert.strictEqual(result.status, 0);
    assert.ok(result.stdout.includes('2.0.0'));
  });

  await t.test('bin/agenthaus.js list --json exits 0 and prints valid JSON with category', () => {
    const result = runBin(['list', '--json']);
    assert.strictEqual(result.status, 0);
    let plugins;
    assert.doesNotThrow(() => {
      plugins = JSON.parse(result.stdout);
    }, 'Output should be valid JSON');
    assert.ok(Array.isArray(plugins), 'Output should be an array');
    assert.ok(plugins.length >= 37, `Expected at least 37 plugins, found ${plugins.length}`);
    assert.ok(plugins.every(p => typeof p.category === 'string' && p.category.length > 0));
  });

  await t.test('bin/agenthaus.js unknowncmd exits 1', () => {
    const result = runBin(['unknowncmd']);
    assert.strictEqual(result.status, 1);
  });

  await t.test('install --dry-run -t claude -p circuit-breaker exits 0', () => {
    const result = runBin(['install', '--dry-run', '-t', 'claude', '-p', 'circuit-breaker']);
    assert.strictEqual(result.status, 0);
  });

  await t.test('install without --target in non-TTY mode exits 1', () => {
    const result = runBin(['install']);
    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes('Missing required --target flag'));
  });

  await t.test('update without --plugin or --all in non-TTY mode exits 1', () => {
    const result = runBin(['update', '-t', 'claude']);
    assert.strictEqual(result.status, 1);
    assert.ok(result.stderr.includes('Missing required --plugin or --all flag'));
  });

  await t.test('update --dry-run -t claude --all exits 0', () => {
    const result = runBin(['update', '--dry-run', '-t', 'claude', '--all']);
    assert.strictEqual(result.status, 0);
  });

  await t.test('sync --dry-run --all exits 0', () => {
    const result = runBin(['sync', '--dry-run', '--all']);
    assert.strictEqual(result.status, 0);
  });

  await t.test('doctor --fix exits 0', () => {
    const result = runBin(['doctor', '--fix', '--dry-run']);
    assert.strictEqual(result.status, 0);
  });

  await t.test('doctor text output does not contain undefined for credentials or checks', () => {
    const result = runBin(['doctor']);
    assert.strictEqual(result.stdout.includes('undefined'), false, 'Doctor text output should not contain undefined');
  });
});
