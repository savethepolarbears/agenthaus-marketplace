'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { getAllProviders, detectAll, getProvider } = require('../src/providers/index.js');

test('CLI Providers', async (t) => {
  let tmpDir;
  
  t.beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-test-'));
  });

  t.afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await t.test('getAllProviders returns all 6 providers', () => {
    const providers = getAllProviders();
    assert.strictEqual(providers.length, 6);
    const ids = providers.map(p => p.id).sort();
    assert.deepStrictEqual(ids, ['antigravity', 'claude', 'codex', 'copilot', 'cursor', 'windsurf']);
  });

  await t.test('detects simulated environments', () => {
    // Create markers for copilot and cursor in tmpDir
    fs.mkdirSync(path.join(tmpDir, '.github'));
    fs.mkdirSync(path.join(tmpDir, '.cursor'));

    // Override os.homedir for other providers if we wanted to be strictly isolated, 
    // but we can just rely on cwd checks for cursor and copilot.
    const copilot = getProvider('copilot');
    const cursor = getProvider('cursor');

    assert.ok(copilot.detect(tmpDir));
    assert.ok(cursor.detect(tmpDir));
  });

  await t.test('getTargetDir resolution', () => {
    const cursor = getProvider('cursor');
    const projectDir = cursor.getTargetDir(tmpDir, 'project');
    assert.strictEqual(projectDir, path.join(tmpDir, '.cursor', 'plugins'));
    
    const globalDir = cursor.getTargetDir(tmpDir, 'global');
    assert.strictEqual(globalDir, path.join(os.homedir(), '.cursor', 'plugins'));
  });
});
