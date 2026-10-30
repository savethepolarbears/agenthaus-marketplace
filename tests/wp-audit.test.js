const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const config = require('../plugins/wp-cli-fleet/hooks/hooks.json');
const command = config.hooks.PostToolUse[0].hooks[0].command;

const skipWin = { skip: process.platform === 'win32' };

test('WP audit records execution without command arguments or secret values', skipWin, t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-audit-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const result = spawnSync('bash', ['-c', command], {
        input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'wp user update admin --user_pass=FAKE_TEST_SECRET' } }),
        encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir }
    });
    assert.equal(result.status, 0, result.stderr);
    const log = fs.readFileSync(path.join(dir, 'wp-cli-audit.log'), 'utf8');
    assert.match(log, /^\[\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ\] WP-CLI tool executed\n$/);
    assert.doesNotMatch(log, /FAKE_TEST_SECRET|user_pass|admin|user update/);
});

test('unrelated Bash calls do not create a WP audit log', skipWin, t => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-audit-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const result = spawnSync('bash', ['-c', command], {
        input: JSON.stringify({ tool_input: { command: 'git status' } }),
        encoding: 'utf8', env: { ...process.env, CLAUDE_PROJECT_DIR: dir }
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.existsSync(path.join(dir, 'wp-cli-audit.log')), false);
});
