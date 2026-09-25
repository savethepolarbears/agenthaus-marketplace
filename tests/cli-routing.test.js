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
    const parsed = parseCliArgs(['-t', 'test', '-p', 'myplugin', '-a', '--mode', 'project', '--json']);
    assert.strictEqual(parsed.values.target, 'test');
    assert.strictEqual(parsed.values.plugin, 'myplugin');
    assert.strictEqual(parsed.values.all, true);
    assert.strictEqual(parsed.values.mode, 'project');
    assert.strictEqual(parsed.values.json, true);

    const defaultParsed = parseCliArgs(['sync', '--all']);
    assert.strictEqual(defaultParsed.values.mode, undefined);
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
    assert.ok(plugins.every(p => Array.isArray(p.platforms) && p.platforms.length >= 5));
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

  await t.test('doctor --fix repairs FAIL hook issues and recomputes diagnostics to exit 0', () => {
    const projectDir = path.join(tmpDir, 'fix-workspace');
    const copilotDir = path.join(projectDir, '.github', 'plugins', 'circuit-breaker');
    fs.mkdirSync(path.join(copilotDir, '.claude-plugin'), { recursive: true });
    fs.mkdirSync(path.join(copilotDir, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(copilotDir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'circuit-breaker',
      version: '1.0.0'
    }));
    fs.writeFileSync(path.join(copilotDir, 'hooks', 'hooks.json'), JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            requires_approval: true,
            hooks: [{ command: 'echo 1' }]
          }
        ]
      }
    }));

    const unfixResult = runBin(['doctor'], { cwd: projectDir });
    assert.strictEqual(unfixResult.status, 1);
    assert.ok((unfixResult.stdout + unfixResult.stderr).includes('Deprecated approval property'));

    const fixResult = runBin(['doctor', '--fix'], { cwd: projectDir });
    assert.strictEqual(fixResult.status, 0);
    assert.ok(fixResult.stdout.includes('Applied 1 fixes automatically'));
    assert.ok(fixResult.stdout.includes('0 Fail'));
  });

  await t.test('sync --target <provider> repairs hooks in provider target directory', () => {
    const projectDir = path.join(tmpDir, 'sync-target-workspace');
    const copilotDir = path.join(projectDir, '.github', 'plugins', 'circuit-breaker');
    fs.mkdirSync(path.join(copilotDir, '.claude-plugin'), { recursive: true });
    fs.mkdirSync(path.join(copilotDir, 'hooks'), { recursive: true });
    fs.writeFileSync(path.join(copilotDir, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'circuit-breaker',
      version: '1.0.0'
    }));
    const hookFile = path.join(copilotDir, 'hooks', 'hooks.json');
    fs.writeFileSync(hookFile, JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            requires_approval: true,
            hooks: [{ command: 'echo 1' }]
          }
        ]
      }
    }));

    const syncResult = runBin(['sync', '--target', 'copilot'], { cwd: projectDir });
    assert.strictEqual(syncResult.status, 0);
    assert.ok(syncResult.stdout.includes('Hook circuit-breaker: repaired'));

    const repairedContent = JSON.parse(fs.readFileSync(hookFile, 'utf8'));
    assert.strictEqual(repairedContent.hooks.PreToolUse[0].requires_approval, undefined);
  });

  await t.test('sync and doctor --fix preserve hybrid item-level symlink installations and do not dirty source files', () => {
    const projectDir = path.join(tmpDir, 'hybrid-project');
    const geminiDir = path.join(projectDir, '.gemini', 'extensions', 'circuit-breaker');
    fs.mkdirSync(geminiDir, { recursive: true });

    // Canonical source hook file in tmpDir (simulating marketplace repo)
    const canonicalHooksDir = path.join(tmpDir, 'source-circuit-breaker', 'hooks');
    fs.mkdirSync(canonicalHooksDir, { recursive: true });
    const canonicalHookFile = path.join(canonicalHooksDir, 'hooks.json');
    const originalContent = JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            matcher: 'Bash',
            requires_approval: true,
            hooks: [{ command: 'echo 1' }]
          }
        ]
      }
    });
    fs.writeFileSync(canonicalHookFile, originalContent);

    // Hybrid installation: real directory containing an item-level symlink to hooks
    const symType = process.platform === 'win32' ? 'junction' : 'dir';
    fs.symlinkSync(canonicalHooksDir, path.join(geminiDir, 'hooks'), symType);
    fs.writeFileSync(path.join(geminiDir, 'gemini-extension.json'), JSON.stringify({ name: 'circuit-breaker' }));

    // Run sync --target antigravity
    const syncResult = runBin(['sync', '--target', 'antigravity'], { cwd: projectDir });
    assert.strictEqual(syncResult.status, 0);

    // Canonical source file must NOT be modified
    assert.strictEqual(fs.readFileSync(canonicalHookFile, 'utf8'), originalContent);

    // Run doctor --fix
    const doctorFixResult = runBin(['doctor', '--fix'], { cwd: projectDir });
    assert.strictEqual(doctorFixResult.status, 0);

    // Canonical source file must still NOT be modified
    assert.strictEqual(fs.readFileSync(canonicalHookFile, 'utf8'), originalContent);
  });
});


