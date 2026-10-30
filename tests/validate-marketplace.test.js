const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const validator = fs.readFileSync(path.join(__dirname, '../scripts/validate-plugins.sh'), 'utf8');
const definitions = validator.slice(0, validator.indexOf('\n# Main\n'));

function validate(t, marketplace) {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'marketplace-validation-'));
    t.after(() => fs.rmSync(fixture, { recursive: true, force: true }));
    fs.writeFileSync(path.join(fixture, 'marketplace.json'), JSON.stringify(marketplace));
    fs.writeFileSync(path.join(fixture, 'schema.json'), '{}');
    const script = path.join(fixture, 'validate.sh');
    fs.writeFileSync(script, definitions + '\nMARKETPLACE="$FIXTURE/marketplace.json"\nSCHEMA="$FIXTURE/schema.json"\nvalidate_marketplace');
    return spawnSync('bash', [script], {
        encoding: 'utf8', env: { ...process.env, FIXTURE: fixture }
    });
}

const valid = { name: 'fixture', owner: { name: 'Test' }, plugins: [{ name: 'one', source: './plugins/one' }], metadata: {} };
const skipWin = { skip: process.platform === 'win32' };

test('valid marketplace completes validation', skipWin, t => {
    const result = validate(t, valid);
    assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('duplicate names and missing sources fail with original entry indices', skipWin, t => {
    const result = validate(t, { ...valid, plugins: [...valid.plugins, { name: 'one' }, { source: './third' }] });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /duplicate plugin names: one/);
    assert.match(result.stdout, /plugins\[1\] missing source/);
    assert.match(result.stdout, /plugins\[2\] missing name/);
});

test('missing root fields fail validation', skipWin, t => {
    const result = validate(t, { plugins: [] });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /missing or invalid field 'name'/);
    assert.match(result.stdout, /missing or invalid field 'owner'/);
});

test('unexpected plugin entry shape fails closed on jq errors', skipWin, t => {
    const result = validate(t, { ...valid, plugins: [42] });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /required-field validation could not complete/);
});
