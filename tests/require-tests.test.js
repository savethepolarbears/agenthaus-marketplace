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

test('index-changing commands before the commit are not guessed', skip, t => {
    const { git, run } = repo(t);
    git('add', 'src.js', 'unrelated.test.js');
    const r = run('git reset unrelated.test.js && git commit -m change');
    assert.equal(r.status, 2, 'reset may unstage the test, so the hook fails closed');
    assert.equal(run('git status && git commit -m change').status, 0, 'read-only git commands are ignored');
});

test('push.default=matching counts as updating every branch', skip, t => {
    const { dir, git } = repo(t);
    const remote = path.join(dir, '..', path.basename(dir) + '-remote.git');
    t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
    spawnSync('git', ['init', '-q', '--bare', remote]);
    git('branch', '-M', 'main');
    git('remote', 'add', 'origin', remote);
    git('push', '-q', '-u', 'origin', 'main');
    git('checkout', '-q', '-b', 'feature');
    git('push', '-q', '-u', 'origin', 'feature');
    const ask = c => spawnSync('python3', ['-I', intent, 'push-protected', c], { cwd: dir, encoding: 'utf8' }).stdout.trim();
    assert.equal(ask('git push origin'), 'no');
    assert.equal(ask('git -c push.default=matching push origin'), 'yes');
    assert.equal(ask('git -c remote.origin.push=refs/heads/*:refs/heads/* push'), 'UNKNOWN');
    git('config', 'push.default', 'matching');
    assert.equal(ask('git push'), 'yes', 'configured matching mode is honoured');
    git('config', '--unset', 'push.default');
    git('config', 'remote.origin.push', 'refs/heads/feature:refs/heads/main');
    assert.equal(ask('git push'), 'UNKNOWN', 'configured push refspecs are not guessed');
});

const deploy = path.resolve(__dirname, '..', 'plugins', 'circuit-breaker', 'hooks', 'scripts', 'block-prod-deploy.sh');

test('package-manager deploy scripts are gated outside the window', skip, t => {
    const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-date-'));
    t.after(() => fs.rmSync(bin, { recursive: true, force: true }));
    // Pin the clock to a Saturday so every deploy is outside the window.
    fs.writeFileSync(path.join(bin, 'date'), '#!/bin/sh\ncase "$1" in +%u) echo 6;; +%H) echo 12;; *) exec /bin/date "$@";; esac\n', { mode: 0o755 });
    const run = command => spawnSync('bash', [deploy], {
        cwd: bin, encoding: 'utf8', env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
        input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
    });
    for (const c of ['npm run deploy', 'pnpm run deploy:prod', 'yarn deploy', 'npm run-script release', 'bun run deploy']) {
        assert.equal(run(c).status, 2, c);
    }
    for (const c of ['npm run build', 'yarn add release-it', 'npm test', 'cat deploy-notes.md']) {
        assert.equal(run(c).status, 0, c);
    }
});

test('git push --repo treats every positional as a refspec', skip, t => {
    const { dir, git } = repo(t);
    const remote = path.join(dir, '..', path.basename(dir) + '-remote.git');
    t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
    spawnSync('git', ['init', '-q', '--bare', remote]);
    git('branch', '-M', 'main');
    git('remote', 'add', 'origin', remote);
    git('push', '-q', '-u', 'origin', 'main');
    git('checkout', '-q', '-b', 'feature');
    git('push', '-q', '-u', 'origin', 'feature');
    const ask = c => spawnSync('python3', ['-I', intent, 'push-protected', c], { cwd: dir, encoding: 'utf8' }).stdout.trim();
    assert.equal(ask('git push --repo origin main'), 'yes');
    assert.equal(ask('git push --repo=origin main'), 'yes');
    assert.equal(ask('git push --repo origin feature'), 'no');
});

test('a chained add that records a deletion counts the deleted file', skip, t => {
    const { dir, run } = repo(t);
    fs.rmSync(path.join(dir, 'src.js'));
    assert.equal(run('git add src.js && git commit -m "drop src"').status, 2);
});

test('the commit gate still applies without jq', skip, t => {
    const { dir } = repo(t);
    const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'no-jq-'));
    t.after(() => fs.rmSync(bin, { recursive: true, force: true }));
    for (const tool of ['bash', 'cat', 'dirname', 'grep', 'git', 'python3', 'head']) {
        const where = spawnSync('bash', ['-c', `command -v ${tool}`], { encoding: 'utf8' }).stdout.trim();
        fs.symlinkSync(where, path.join(bin, tool));
    }
    const bash = path.join(bin, 'bash');
    const r = spawnSync(bash, [script], {
        cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: bin },
        input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git commit -am change' } }),
    });
    assert.equal(r.status, 2, r.stderr);
});

test('wildcard and matching refspecs count as protected', skip, t => {
    const { dir, git } = repo(t);
    const remote = path.join(dir, '..', path.basename(dir) + '-remote.git');
    t.after(() => fs.rmSync(remote, { recursive: true, force: true }));
    spawnSync('git', ['init', '-q', '--bare', remote]);
    git('branch', '-M', 'main');
    git('remote', 'add', 'origin', remote);
    git('checkout', '-q', '-b', 'feature');
    const ask = c => spawnSync('python3', ['-I', intent, 'push-protected', c], { cwd: dir, encoding: 'utf8' }).stdout.trim();
    assert.equal(ask("git push origin 'refs/heads/*:refs/heads/*'"), 'yes');
    assert.equal(ask('git push origin :'), 'yes');
    assert.equal(ask('git push origin feature'), 'no');
});

test('git add counts only when joined to the commit by &&', skip, t => {
    const { run } = repo(t);
    assert.equal(run('false && git add unrelated.test.js; git commit -am x').status, 2, 'the add may be skipped');
    assert.equal(run('git add unrelated.test.js || true; git commit -am x').status, 2);
    assert.equal(run('git add unrelated.test.js && git commit -am x').status, 0);
});

test('newlines separate commands', skip, t => {
    const { dir, git, run } = repo(t);
    assert.equal(run('echo hi\ngit commit -am x').status, 2, 'commit on its own line is seen');
    assert.equal(run('git add unrelated.test.js &&\n  git commit -am x').status, 0, 'a newline after && continues the chain');
    git('branch', '-M', 'main');
    const ask = c => spawnSync('python3', ['-I', intent, 'push-protected', c], { cwd: dir, encoding: 'utf8' }).stdout.trim();
    assert.equal(ask('echo done\ngit push origin main'), 'yes');
});

test('git behind wrappers is followed or fails closed', skip, t => {
    const { dir, git, run } = repo(t);
    assert.equal(run('sudo -u root git commit -am x').status, 2, 'sudo is followed');
    assert.equal(run('env FOO=1 git commit -am x').status, 2, 'env is followed');
    assert.equal(run('sh -c "git commit -am x"').status, 2, 'sh -c is unknown, so blocked');
    git('branch', '-M', 'main');
    const ask = c => spawnSync('python3', ['-I', intent, 'push-protected', c], { cwd: dir, encoding: 'utf8' }).stdout.trim();
    assert.equal(ask('env git push origin main'), 'yes');
    assert.equal(ask('timeout 30 git push origin main'), 'yes');
    assert.equal(ask('xargs git push origin'), 'UNKNOWN');
    assert.equal(ask('echo git push is mentioned'), 'no');
});

test('the commit gate fails closed without python3', skip, t => {
    const { dir } = repo(t);
    const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'no-py-'));
    t.after(() => fs.rmSync(bin, { recursive: true, force: true }));
    for (const tool of ['bash', 'cat', 'dirname', 'grep', 'git', 'head', 'jq']) {
        const where = spawnSync('bash', ['-c', `command -v ${tool}`], { encoding: 'utf8' }).stdout.trim();
        if (where) fs.symlinkSync(where, path.join(bin, tool));
    }
    const r = spawnSync(path.join(bin, 'bash'), [script], {
        cwd: dir, encoding: 'utf8', env: { ...process.env, PATH: bin },
        input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git commit -am change' } }),
    });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /python3 is required/);
});

test('git -C applies only to its own invocation', skip, t => {
    const { dir, run } = repo(t);
    const sibling = path.join(dir, 'sibling');
    fs.mkdirSync(sibling);
    const g = (...a) => spawnSync('git', a, { cwd: sibling, encoding: 'utf8' });
    g('init', '-q'); g('config', 'user.email', 't@example.com'); g('config', 'user.name', 't');
    fs.writeFileSync(path.join(sibling, 'x.test.js'), 'x\n');
    g('add', 'x.test.js');
    assert.equal(run('git -C sibling status && git commit -am x').status, 2, 'the commit runs in the original repo');
});

test('git aliases are expanded', skip, t => {
    const { dir, git, run } = repo(t);
    git('config', 'alias.ci', 'commit -a');
    git('config', 'alias.sh', '!git commit');
    assert.equal(run('git ci -m change').status, 2, 'ci expands to commit -a without a test');
    assert.equal(run('git sh -m change').status, 2, 'a shell alias is unknown, so blocked');
    git('branch', '-M', 'main');
    git('config', 'alias.p', 'push origin main');
    const ask = c => spawnSync('python3', ['-I', intent, 'push-protected', c], { cwd: dir, encoding: 'utf8' }).stdout.trim();
    assert.equal(ask('git p'), 'yes');
    assert.equal(run('git checkout -q -b other').status, 0, 'non-commit git commands still pass');
});
