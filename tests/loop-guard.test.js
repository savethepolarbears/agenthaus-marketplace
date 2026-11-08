'use strict';
// circuit-breaker loop guard: bounded, opt-in, tamper-disarmed Stop-hook loop.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const scripts = path.resolve(__dirname, '..', 'plugins', 'circuit-breaker', 'hooks', 'scripts');
const hasJq = spawnSync('jq', ['--version']).status === 0;
const skip = { skip: process.platform === 'win32' ? 'bash hooks' : (!hasJq && 'jq not installed') };

function setup(t, config) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'loop-guard-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const project = path.join(dir, 'project');
    fs.mkdirSync(path.join(project, '.agenthaus'), { recursive: true });
    if (config) fs.writeFileSync(path.join(project, '.agenthaus', 'loop.json'), JSON.stringify(config));
    const env = { ...process.env, TMPDIR: dir, CLAUDE_PLUGIN_DATA: path.join(dir, 'data'), CLAUDE_PROJECT_DIR: project };
    const run = (script, input = {}, args = []) => {
        const r = spawnSync('bash', [path.join(scripts, script), ...args], {
            env, cwd: project, encoding: 'utf8',
            input: JSON.stringify({ session_id: 'sess-1', hook_event_name: 'Stop', stop_hook_active: false, ...input }),
        });
        let json = null;
        try { json = r.stdout.trim() ? JSON.parse(r.stdout) : null; } catch { /* not JSON */ }
        return { ...r, json };
    };
    return { project, run };
}

test('no config allows the stop silently', skip, t => {
    const { run } = setup(t, null);
    const r = run('loop-guard.sh');
    assert.equal(r.status, 0);
    assert.equal(r.stdout, '');
});

test('unarmed config is ignored', skip, t => {
    const { run } = setup(t, { completionCommand: 'false', maxIterations: 3 });
    assert.equal(run('loop-guard.sh').stdout, '');
});

test('armed loop blocks until the cap, then stops with a message', skip, t => {
    const { run } = setup(t, { completionCommand: 'test -f done.txt', maxIterations: 2 });
    assert.equal(run('loop-arm.sh').status, 0);
    for (const n of [1, 2]) {
        const r = run('loop-guard.sh');
        assert.equal(r.status, 0);
        assert.equal(r.json.decision, 'block');
        assert.match(r.json.reason, new RegExp(`iteration ${n}/2`));
    }
    const last = run('loop-guard.sh');
    assert.equal(last.json.decision, undefined);
    assert.match(last.json.systemMessage, /stopping after 2/);
});

test('passing completion check allows the stop and clears state', skip, t => {
    const { project, run } = setup(t, { completionCommand: 'test -f done.txt', maxIterations: 5 });
    run('loop-arm.sh');
    assert.equal(run('loop-guard.sh').json.decision, 'block');
    fs.writeFileSync(path.join(project, 'done.txt'), '');
    const r = run('loop-guard.sh');
    assert.equal(r.json.decision, undefined);
    assert.match(r.json.systemMessage, /passed/);
});

test('editing the config disarms it', skip, t => {
    const { project, run } = setup(t, { completionCommand: 'false', maxIterations: 5 });
    run('loop-arm.sh');
    fs.writeFileSync(path.join(project, '.agenthaus', 'loop.json'), JSON.stringify({ completionCommand: 'touch pwned', maxIterations: 5 }));
    assert.equal(run('loop-guard.sh').stdout, '');
    assert.equal(fs.existsSync(path.join(project, 'pwned')), false);
});

test('an identical config armed in another project is not trusted', skip, t => {
    const config = { completionCommand: 'touch ran; false', maxIterations: 5 };
    const a = setup(t, config);
    assert.equal(a.run('loop-arm.sh').status, 0);
    const other = path.join(path.dirname(a.project), 'other');
    fs.mkdirSync(path.join(other, '.agenthaus'), { recursive: true });
    fs.writeFileSync(path.join(other, '.agenthaus', 'loop.json'), JSON.stringify(config));
    const r = spawnSync('bash', [path.join(scripts, 'loop-guard.sh')], {
        cwd: other, encoding: 'utf8',
        env: { ...process.env, TMPDIR: path.dirname(a.project), CLAUDE_PLUGIN_DATA: path.join(path.dirname(a.project), 'data'), CLAUDE_PROJECT_DIR: other },
        input: JSON.stringify({ session_id: 's', hook_event_name: 'Stop', stop_hook_active: false }),
    });
    assert.equal(r.stdout, '');
    assert.equal(fs.existsSync(path.join(other, 'ran')), false);
    assert.equal(a.run('loop-guard.sh').json.decision, 'block', 'still armed in the original project');
});

test('disarm-project removes only this project', skip, t => {
    const { run } = setup(t, { completionCommand: 'false', maxIterations: 5 });
    run('loop-arm.sh');
    assert.equal(run('loop-arm.sh', {}, ['--disarm-project']).status, 0);
    assert.equal(run('loop-guard.sh').stdout, '');
});

test('chain=false honours stop_hook_active', skip, t => {
    const { run } = setup(t, { completionCommand: 'false', maxIterations: 5, chain: false });
    run('loop-arm.sh');
    assert.equal(run('loop-guard.sh', { stop_hook_active: true }).stdout, '');
    assert.equal(run('loop-guard.sh').json.decision, 'block');
});

test('maxIterations is clamped to 8', skip, t => {
    const { run } = setup(t, { completionCommand: 'false', maxIterations: 99 });
    run('loop-arm.sh');
    assert.match(run('loop-guard.sh').json.reason, /iteration 1\/8/);
});

test('loop-reset clears the per-session budget', skip, t => {
    const { run } = setup(t, { completionCommand: 'false', maxIterations: 1 });
    run('loop-arm.sh');
    assert.equal(run('loop-guard.sh').json.decision, 'block');
    run('loop-reset.sh', { hook_event_name: 'UserPromptSubmit' });
    assert.equal(run('loop-guard.sh').json.decision, 'block');
});

test('budget guard asks at the per-session threshold', skip, t => {
    const { project, run } = setup(t, null);
    fs.writeFileSync(path.join(project, '.circuit-breaker-config.json'), JSON.stringify({ breakers: { 'budget-guard': { threshold: 2 } } }));
    assert.equal(run('budget-guard.sh', { session_id: 'b1' }).stdout, '');
    const r = run('budget-guard.sh', { session_id: 'b1' });
    assert.equal(r.json.hookSpecificOutput.permissionDecision, 'ask');
    assert.equal(run('budget-guard.sh', { session_id: 'b2' }).stdout, '', 'other sessions keep their own budget');
});

test('timeoutSec is enforced without a timeout binary', { skip: skip.skip || (spawnSync('perl', ['-v']).status !== 0 && 'perl not installed') }, t => {
    const { project, run } = setup(t, { completionCommand: 'sleep 20', maxIterations: 2, timeoutSec: 1 });
    assert.equal(run('loop-arm.sh').status, 0);
    // A PATH that has every tool except timeout/gtimeout, so the perl fallback runs.
    const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'no-timeout-'));
    t.after(() => fs.rmSync(bin, { recursive: true, force: true }));
    for (const dir of process.env.PATH.split(path.delimiter)) {
        let entries = [];
        try { entries = fs.readdirSync(dir); } catch { continue; }
        for (const name of entries) {
            if (name === 'timeout' || name === 'gtimeout' || fs.existsSync(path.join(bin, name))) continue;
            try { fs.symlinkSync(path.join(dir, name), path.join(bin, name)); } catch { /* skip */ }
        }
    }
    const started = Date.now();
    const r = spawnSync(path.join(bin, 'bash'), [path.join(scripts, 'loop-guard.sh')], {
        cwd: project, encoding: 'utf8',
        env: { ...process.env, PATH: bin, TMPDIR: path.dirname(project), CLAUDE_PLUGIN_DATA: path.join(path.dirname(project), 'data'), CLAUDE_PROJECT_DIR: project },
        input: JSON.stringify({ session_id: 'sess-1', hook_event_name: 'Stop', stop_hook_active: false }),
    });
    assert.ok(Date.now() - started < 10000, 'the check was cut off');
    assert.match(JSON.parse(r.stdout).reason, /exit 124/);
});
