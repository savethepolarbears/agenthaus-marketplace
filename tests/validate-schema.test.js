const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { validateValue } = require('../scripts/validate-schema.js');

describe('Plugin Manifest Schema Validation', () => {
  const schemaPath = path.resolve(__dirname, '../schemas/plugin.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  test('validates all 37 repository plugins against plugin.schema.json', () => {
    const pluginsDir = path.resolve(__dirname, '../plugins');
    const plugins = fs.readdirSync(pluginsDir);

    for (const plugin of plugins) {
      const manifestPath = path.join(pluginsDir, plugin, '.claude-plugin/plugin.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const errors = validateValue(manifest, schema);
        assert.deepStrictEqual(errors, [], `Plugin ${plugin} failed schema validation: ${errors.join('; ')}`);
      }
    }
  });

  test('fails on unexpected properties when additionalProperties is false', () => {
    const invalid = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin description that is long enough',
      category: 'invalid-property'
    };
    const errors = validateValue(invalid, schema);
    assert.ok(errors.length > 0);
    assert.match(errors[0], /unexpected property 'category'/);
  });

  test('fails on missing required properties', () => {
    const invalid = {
      name: 'test-plugin',
      version: '1.0.0'
    };
    const errors = validateValue(invalid, schema);
    assert.ok(errors.some(e => e.includes("missing required property 'description'")));
  });

  test('fails on invalid semver format', () => {
    const invalid = {
      name: 'test-plugin',
      version: '1.0-alpha',
      description: 'A test plugin description that is long enough'
    };
    const errors = validateValue(invalid, schema);
    assert.ok(errors.some(e => e.includes('does not match pattern')));
  });

  test('fails on invalid author email format', () => {
    const invalid = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin description that is long enough',
      author: {
        name: 'Test Author',
        email: 'invalid-email-address'
      }
    };
    const errors = validateValue(invalid, schema);
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.includes('author') || e.includes('email')));
  });

  test('CLI exits 0 on valid manifest and 1 on invalid manifest', () => {
    const scriptPath = path.resolve(__dirname, '../scripts/validate-schema.js');
    const validManifest = path.resolve(__dirname, '../plugins/circuit-breaker/.claude-plugin/plugin.json');

    const output = execFileSync(process.execPath, [scriptPath, validManifest, schemaPath], { encoding: 'utf8' });
    assert.match(output, /VALID/);

    const tmpInvalidPath = path.resolve(__dirname, '../tmp_test_invalid.json');
    try {
      fs.writeFileSync(tmpInvalidPath, JSON.stringify({ name: 'bad' }));
      assert.throws(() => {
        execFileSync(process.execPath, [scriptPath, tmpInvalidPath, schemaPath], { encoding: 'utf8', stdio: 'pipe' });
      });
    } finally {
      if (fs.existsSync(tmpInvalidPath)) fs.unlinkSync(tmpInvalidPath);
    }
  });
});
