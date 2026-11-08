'use strict';
// circuit-breaker require-tests: the commit set is exactly what the commit will
// contain; unrelated untracked test files must not satisfy the gate.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const script = path.resolve(__dirname, '..', 'plugins', 'circuit-breaker', 'hooks', 'scripts', 'require-tests.sh');
const ok = spawnSync('jq', ['--version']).status === 0 && spawnSync('python3', ['--version']).status === 0;
const skip = { skip: process.platform === 'win32' ? 'bash hooks' : (!ok && 'jq/python3 not installed') };

function repo(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'require-tests-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const git = (...args) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' });
    git('init', '-q');
    git('config', 'user.email', 't@example.com');
    git('config', 'user.name', 't');
    fs.writeFileSync(path.join(dir, 'src.js'), 'a\n');
    git('add', 'src.js');
    git('commit', '-qm', 'init');
    fs.writeFileSync(path.join(dir, 'src.js'), 'b\n');                 // tracked change
    fs.writeFileSync(path.join(dir, 'unrelated.test.js'), 'x\n');      // untracked test
    const run = command => spawnSync('bash', [script], {
        cwd: dir, encoding: 'utf8', input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    });
    return { dir, git, run };
}

test('commit -a ignores untracked test files', skip, t => {
    const { run } = repo(t);
    assert.equal(run('git commit -am "change"').status, 2);
});

test('chained add of a source file ignores other untracked tests', skip, t => {
    const { run } = repo(t);
    assert.equal(run('git add src.js && git commit -m "change"').status, 2);
});

test('chained add that includes the test file passes', skip, t => {
    const { run } = repo(t);
    assert.equal(run('git add src.js unrelated.test.js && git commit -m "change"').status, 0);
});

test('already staged test file passes', skip, t => {
    const { git, run } = repo(t);
    git('add', 'src.js', 'unrelated.test.js');
    assert.equal(run('git commit -m "change"').status, 0);
});

test('shell metacharacters in add arguments are not executed', skip, t => {
    const { dir, run } = repo(t);
    run('git add "$(touch pwned)" && git commit -m x');
    assert.equal(fs.existsSync(path.join(dir, 'pwned')), false);
});
