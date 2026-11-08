'use strict';
// Regression tests for validate-plugins.sh check 11 (component lint): agent,
// command, hook and MCP mistakes that load without error but never work.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const definitions = fs.readFileSync(path.join(root, 'scripts/validate-plugins.sh'), 'utf8').split('\n# Main\n')[0];
const skip = { skip: process.platform === 'win32' ? 'bash validator' : false };

function plugin(t, files) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'component-lint-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const write = (name, value) => {
        const target = path.join(dir, name);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value));
    };
    write('scripts/validate-schema.js', fs.readFileSync(path.join(root, 'scripts/validate-schema.js'), 'utf8'));
    write('schemas/plugin.schema.json', fs.readFileSync(path.join(root, 'schemas/plugin.schema.json'), 'utf8'));
    write('plugins/sample/.claude-plugin/plugin.json', { name: 'sample', version: '1.0.0', description: 'Lint fixture' });
    write('plugins/sample/README.md', 'Fixture');
    for (const [name, value] of Object.entries(files)) write('plugins/sample/' + name, value);
    write('scripts/run.sh', definitions + '\nvalidate_plugin "$PLUGINS_DIR/sample"\nif [[ "$fail_count" -gt 0 ]]; then exit 1; fi\n');
    return spawnSync('bash', [path.join(dir, 'scripts/run.sh')], { cwd: dir, encoding: 'utf8' });
}

const agent = fm => `---\nname: a\ndescription: Use when testing.\n${fm}\n---\nBody\n`;

test('clean components pass the lint', skip, t => {
    const r = plugin(t, {
        'agents/a.md': agent('model: sonnet\ntools: Read, Grep'),
        'commands/c.md': '---\ndescription: d\nargument-hint: "<x>"\n---\nUse $ARGUMENTS\n',
        'hooks/hooks.json': { hooks: { PreToolUse: [{ matcher: 'mcp__.*__delete$', hooks: [{ type: 'command', command: 'exit 0', timeout: 5 }] }] } },
        '.mcp.json': { mcpServers: { x: { command: 'npx', args: ['-y', 'pkg@1.0.0'] } } },
    });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /pass component lint/);
});

test('retired model and allowed-tools on an agent fail', skip, t => {
    const r = plugin(t, { 'agents/a.md': agent('model: claude-3-7-sonnet\nallowed-tools: Read') });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /retired model/);
    assert.match(r.stdout, /not 'allowed-tools'/);
});

test('Server:tool names in command allowed-tools fail', skip, t => {
    const r = plugin(t, { 'commands/c.md': '---\ndescription: d\nallowed-tools: VistaSocial:schedulePost\n---\nx\n' });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /mcp__<server>__<tool>/);
});

test('command-name matchers and phantom env vars in hooks fail', skip, t => {
    const r = plugin(t, { 'hooks/hooks.json': { hooks: { PostToolUse: [{ matcher: 'sample:(a|b)', hooks: [{ type: 'command', command: 'echo "$TOOL_NAME"', timeout: 5 }] }] } } });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /targets a command name/);
    assert.match(r.stdout, /\$TOOL_NAME/);
});

test('npx without -y fails and python warns', skip, t => {
    const r = plugin(t, { '.mcp.json': { mcpServers: { a: { command: 'npx', args: ['pkg'] }, b: { command: 'python', args: ['-m', 'x'] } } } });
    assert.equal(r.status, 1);
    assert.match(r.stdout, /npx without -y/);
    assert.match(r.stdout, /use python3/);
});
