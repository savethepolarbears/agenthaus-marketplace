'use strict';
// Safety hooks written inline in hooks.json must still decide when jq is not
// installed: they fall back to python3, then to scanning the raw payload.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Resolve the real binary (pyenv/asdf shims are scripts that need tools a
// stripped PATH leaves out).
function realTool(tool) {
    if (tool === 'python3') {
        const r = spawnSync('python3', ['-c', 'import sys; print(sys.executable)'], { encoding: 'utf8' });
        if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
    }
    return spawnSync('bash', ['-c', `command -v ${tool}`], { encoding: 'utf8' }).stdout.trim();
}

const root = path.resolve(__dirname, '..');
const skip = { skip: process.platform === 'win32' ? 'bash hooks' : false };

function commandOf(file, event, index = 0) {
    const data = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    return data.hooks[event][index].hooks[0].command;
}

function binWithout(t, keep) {
    const bin = fs.mkdtempSync(path.join(os.tmpdir(), 'no-jq-hooks-'));
    t.after(() => fs.rmSync(bin, { recursive: true, force: true }));
    for (const tool of keep) {
        const where = realTool(tool);
        if (where) fs.symlinkSync(where, path.join(bin, tool));
    }
    return bin;
}

const cases = [
    ['plugins/apple-photos/hooks/safety-guard.json', 'osxphotos import ~/Pictures/new'],
    ['plugins/gog-workspace/hooks/hooks.json', 'gog gmail send --to a@example.com --subject hi --body x'],
];

for (const withPython of [true, false]) {
    const label = withPython ? 'python3 fallback' : 'raw payload fallback';
    for (const [file, command] of cases) {
        test(`${file} still asks without jq (${label})`, skip, t => {
            const bin = binWithout(t, ['bash', 'cat', 'grep', 'printf', ...(withPython ? ['python3'] : [])]);
            const r = spawnSync(path.join(bin, 'bash'), ['-c', commandOf(file, 'PreToolUse')], {
                encoding: 'utf8', env: { PATH: bin },
                input: JSON.stringify({ tool_name: 'Bash', tool_input: { command } }),
            });
            assert.equal(r.status, 0, r.stderr);
            assert.match(r.stdout, /"permissionDecision": ?"ask"/);
        });
    }
}

test('devops-flow asks before wrangler however it is launched', skip, () => {
    const command = commandOf('plugins/devops-flow/hooks/pre-deploy-confirmation.json', 'PreToolUse', 1);
    const run = c => spawnSync('bash', ['-c', command], { encoding: 'utf8', input: JSON.stringify({ tool_name: 'Bash', tool_input: { command: c } }) }).stdout;
    for (const c of ['npx wrangler deploy', 'wrangler deploy --env prod', 'pnpm dlx wrangler deploy', 'cd app && npx -y wrangler deploy']) {
        assert.match(run(c), /"permissionDecision": ?"ask"/, c);
    }
    for (const c of ['cat wrangler.toml', 'ls', 'npm test']) assert.equal(run(c), '', c);
});
