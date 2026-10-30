'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const definitions = fs.readFileSync(path.join(root, 'scripts/validate-plugins.sh'), 'utf8').split('\n# Main\n')[0];
function fixture(t) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'catalog-integrity-'));
    t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
    const write = (name, value) => { const target = path.join(dir, name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, typeof value === 'string' ? value : JSON.stringify(value)); };
    write('scripts/validate-schema.js', fs.readFileSync(path.join(root, 'scripts/validate-schema.js'), 'utf8'));
    for (const name of ['plugin.schema.json', 'skills-index.schema.json']) {
        const source = path.join(root, 'schemas', name);
        if (fs.existsSync(source)) write('schemas/' + name, fs.readFileSync(source, 'utf8'));
    }
    const entries = ['command', 'skill'].map(type => ({ id: `sample:${type}:shared`, legacy_id: 'sample:shared', plugin: 'sample', type, name: 'shared', path: type === 'command' ? 'plugins/sample/commands/shared.md' : 'plugins/sample/skills/shared/SKILL.md' }));
    for (const entry of entries) write(entry.path, '---\nname: shared\ndescription: Use when testing catalog identity.\n---\nTest.\n');
    const index = { $schema: 'https://github.com/savethepolarbears/agenthaus-marketplace/schemas/skills-index.schema.json', version: '2.0.0', generated: '2026-10-24', description: 'Test index', entries };
    write('skills_index.json', index);
    function run(functionCall) {
        write('scripts/run.sh', definitions + '\n' + functionCall + '\nif [[ "$fail_count" -gt 0 ]]; then exit 1; fi\n');
        return spawnSync('bash', [path.join(dir, 'scripts/run.sh')], { cwd: dir, encoding: 'utf8' });
    }
    return { dir, write, index, run };
}
function expectFailure(result) { assert.equal(result.status, 1, result.stdout + result.stderr); }

test('index rejects duplicate component IDs despite matching entry counts', t => {
    const f = fixture(t); f.index.entries[1].id = f.index.entries[0].id; f.write('skills_index.json', f.index);
    expectFailure(f.run('validate_skills_index'));
});
test('index requires the generated inventory file', t => {
    const f = fixture(t); fs.unlinkSync(path.join(f.dir, 'skills_index.json'));
    expectFailure(f.run('validate_skills_index'));
});
test('index rejects duplicate target paths despite distinct IDs', t => {
    const f = fixture(t); f.index.entries[1].path = f.index.entries[0].path; f.write('skills_index.json', f.index);
    expectFailure(f.run('validate_skills_index'));
});
test('index rejects equal-count paths pointing outside the actual component inventory', t => {
    const f = fixture(t); f.index.entries[1].path = 'plugins/sample/skills/missing/SKILL.md'; f.write('skills_index.json', f.index);
    expectFailure(f.run('validate_skills_index'));
});
test('index rejects a single missing component instead of tolerating five', t => {
    const f = fixture(t); f.index.entries.pop(); f.write('skills_index.json', f.index);
    expectFailure(f.run('validate_skills_index'));
});
test('index rejects mismatched component metadata', t => {
    const f = fixture(t); f.index.entries[1].type = 'command'; f.write('skills_index.json', f.index);
    expectFailure(f.run('validate_skills_index'));
});
test('index rejects malformed entries and a missing schema', t => {
    const f = fixture(t); f.index.entries[1] = {}; f.write('skills_index.json', f.index);
    expectFailure(f.run('validate_skills_index'));
    f.write('skills_index.json', { ...f.index, entries: [] });
    fs.rmSync(path.join(f.dir, 'schemas/skills-index.schema.json'), { force: true });
    expectFailure(f.run('validate_skills_index'));
});
test('valid typed index retains compatible legacy identities', t => {
    const f = fixture(t); const result = f.run('validate_skills_index'); assert.equal(result.status, 0, result.stdout + result.stderr);
});
test('generator produces unique typed IDs and preserves legacy IDs across component types', t => {
    const f = fixture(t); f.write('scripts/generate-skills-index.sh', fs.readFileSync(path.join(root, 'scripts/generate-skills-index.sh'), 'utf8'));
    fs.unlinkSync(path.join(f.dir, 'skills_index.json'));
    const outside = path.join(f.dir, 'outside'); fs.mkdirSync(outside);
    const result = spawnSync('bash', [path.join(f.dir, 'scripts/generate-skills-index.sh')], { cwd: outside, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const generated = JSON.parse(fs.readFileSync(path.join(f.dir, 'skills_index.json'), 'utf8'));
    assert.equal(generated.entries.length, 2);
    assert.equal(new Set(generated.entries.map(e => e.id)).size, 2);
    assert.deepEqual(new Set(generated.entries.map(e => e.legacy_id)), new Set(['sample:shared']));
});
function mcpFixture(t, inline, external) {
    const f = fixture(t);
    f.write('plugins/sample/.claude-plugin/plugin.json', { name: 'sample', version: '1.0.0', description: 'Sample plugin fixture', mcpServers: inline });
    f.write('plugins/sample/.mcp.json', { mcpServers: external });
    f.write('plugins/sample/README.md', 'Fixture');
    return f.run('validate_plugin "$PLUGINS_DIR/sample"');
}
test('MCP rejects conflicting symbolic credential references', t => {
    expectFailure(mcpFixture(t, { sample: { command: 'node', env: { TOKEN: '${OLD_TOKEN}' } } }, { sample: { command: 'node', env: { TOKEN: '${TOKEN}' } } }));
});
test('MCP rejects local script args rooted in the caller directory', t => {
    const servers = { sample: { command: 'node', args: ['node_modules/example/index.js'] } };
    expectFailure(mcpFixture(t, servers, servers));
});
test('MCP rejects malformed remote transport', t => {
    expectFailure(mcpFixture(t, './.mcp.json', { sample: { type: 'http' } }));
});
test('MCP accepts matching rooted local script definitions', t => {
    const servers = { sample: { command: 'node', args: ['${CLAUDE_PLUGIN_ROOT}/index.js'], env: { TOKEN: '${TOKEN}' } } };
    const result = mcpFixture(t, servers, servers); assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('Outscraper source routes pin the official published package in both plugins', () => {
    for (const name of ['outscraper', 'seo-content-suite']) {
        const plugin = path.join(root, 'plugins', name);
        const config = JSON.parse(fs.readFileSync(path.join(plugin, '.mcp.json'), 'utf8'));
        const server = config.mcpServers.outscraper;
        assert.equal(server.command, 'npx', name);
        assert.deepEqual(server.args, ['-y', 'outscraper-mcp@0.2.5'], name);
        assert.deepEqual(server.env, { OUTSCRAPER_API_KEY: '${OUTSCRAPER_API_KEY}' }, name);
        const manifest = JSON.parse(fs.readFileSync(path.join(plugin, '.claude-plugin/plugin.json'), 'utf8'));
        if (manifest.mcpServers && typeof manifest.mcpServers === 'object') {
            assert.deepEqual(manifest.mcpServers.outscraper, server, name);
        }
        for (const output of ['claude-desktop-snippet.json', 'gemini-settings-snippet.json', 'windsurf-mcp-snippet.json', '.cursor/mcp.json', 'codex-mcp-config.toml']) {
            const content = fs.readFileSync(path.join(plugin, output), 'utf8');
            assert.match(content, /outscraper-mcp@0\.2\.5/, `${name}/${output}`);
            assert.doesNotMatch(content, /@outscraper\/mcp-server/, `${name}/${output}`);
        }
    }
});
