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

test('commit with a pathspec ignores other staged tests', skip, t => {
    const { git, run } = repo(t);
    git('add', 'unrelated.test.js');
    assert.equal(run('git commit src.js -m source-only').status, 2);
    assert.equal(run('git commit -i src.js -m both').status, 0);
});

test('amend counts the files already in HEAD', skip, t => {
    const { dir, git, run } = repo(t);
    git('add', 'unrelated.test.js');
    git('commit', '-qm', 'with test');
    fs.writeFileSync(path.join(dir, 'src.js'), 'c\n');
    git('add', 'src.js');
    assert.equal(run('git commit --amend --no-edit').status, 0);
});

test('git -C and cd prefixes are followed, unrelated commands pass', skip, t => {
    const { dir, run } = repo(t);
    const parent = path.dirname(dir), name = path.basename(dir);
    const runIn = command => spawnSync('bash', [script], {
        cwd: parent, encoding: 'utf8', input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    });
    assert.equal(runIn(`git -C ${name} commit -am x`).status, 2);
    assert.equal(runIn(`cd ${name} && git commit -am x`).status, 2);
    assert.equal(runIn(`cd ${name} && git add src.js unrelated.test.js && git commit -m x`).status, 0);
    assert.equal(run('echo commit message').status, 0);
    assert.equal(run('git status').status, 0, 'a git command without commit is not gated');
});

test('shell metacharacters in add arguments are not executed', skip, t => {
    const { dir, run } = repo(t);
    run('git add "$(touch pwned)" && git commit -m x');
    assert.equal(fs.existsSync(path.join(dir, 'pwned')), false);
});

const intent = path.resolve(__dirname, '..', 'plugins', 'circuit-breaker', 'hooks', 'scripts', 'git_intent.py');

test('push-protected resolves the effective destination', skip, t => {
    const { dir, git } = repo(t);
    const remote = path.join(dir, '..', path.basename(dir) + '-remote.git');
    t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
    spawnSync('git', ['init', '-q', '--bare', remote]);
    git('branch', '-M', 'main');
    git('remote', 'add', 'origin', remote);
    git('push', '-q', '-u', 'origin', 'main');
    const ask = c => spawnSync('python3', ['-I', intent, 'push-protected', c], { cwd: dir, encoding: 'utf8' }).stdout.trim();
    assert.equal(ask('git push'), 'yes', 'bare push follows the main upstream');
    assert.equal(ask('git push origin'), 'yes');
    assert.equal(ask('git push origin HEAD:main'), 'yes');
    assert.equal(ask('git push --tags'), 'yes');
    git('checkout', '-q', '-b', 'feature');
    git('push', '-q', '-u', 'origin', 'feature');
    assert.equal(ask('git push'), 'no', 'feature upstream is not protected');
    assert.equal(ask('git push origin feature'), 'no');
    assert.equal(ask('git push origin +feature:refs/heads/prod'), 'yes');
    assert.equal(ask('echo git push is mentioned'), 'no');
    git('checkout', '-q', 'main');
    const parent = path.dirname(dir), name = path.basename(dir);
    const askIn = c => spawnSync('python3', ['-I', intent, 'push-protected', c], { cwd: parent, encoding: 'utf8' }).stdout.trim();
    assert.equal(askIn(`git -C ${name} push origin main`), 'yes', 'git -C is followed');
    assert.equal(askIn(`cd ${name} && git push`), 'yes', 'cd is followed');
    assert.equal(askIn(`git --no-pager -C ${name} push`), 'yes');
});
