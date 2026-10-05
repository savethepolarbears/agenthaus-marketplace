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
    const invalidEmails = [
      'invalid-email-address',
      '.foo@example.com',
      'foo.@example.com',
      'foo..bar@example.com',
      'foo@.example.com',
      'foo@example.com.'
    ];

    for (const email of invalidEmails) {
      const invalid = {
        name: 'test-plugin',
        version: '1.0.0',
        description: 'A test plugin description that is long enough',
        author: {
          name: 'Test Author',
          email
        }
      };
      const errors = validateValue(invalid, schema);
      assert.ok(errors.length > 0, `Expected failure for email: ${email}`);
      assert.ok(errors.some(e => e.includes('author') || e.includes('email')));
    }
  });

  test('isValidEmail validates RFC 5322 dot-atom grammar strictly', () => {
    const { isValidEmail } = require('../scripts/validate-schema.js');
    assert.strictEqual(isValidEmail('user@example.com'), true);
    assert.strictEqual(isValidEmail('user.name+tag@sub.domain.co.uk'), true);
    assert.strictEqual(isValidEmail('first.last@example.org'), true);

    // Invalid dot-atoms in local-part
    assert.strictEqual(isValidEmail('.user@example.com'), false);
    assert.strictEqual(isValidEmail('user.@example.com'), false);
    assert.strictEqual(isValidEmail('user..name@example.com'), false);

    // Invalid domain dots
    assert.strictEqual(isValidEmail('user@.example.com'), false);
    assert.strictEqual(isValidEmail('user@example.com.'), false);
    assert.strictEqual(isValidEmail('user@example..com'), false);
  });

  test('fails on invalid URI format with RFC semantics', () => {
    const invalidHomepage = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin description that is long enough',
      homepage: 'https://example.com/%'
    };
    const errors = validateValue(invalidHomepage, schema);
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.includes('homepage') && e.includes('RFC-compliant URI')));

    const invalidWhitespace = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin description that is long enough',
      repository: ' https://github.com/example/repo '
    };
    const errorsWs = validateValue(invalidWhitespace, schema);
    assert.ok(errorsWs.length > 0);
    assert.ok(errorsWs.some(e => e.includes('repository') && e.includes('RFC-compliant URI')));

    const invalidAuthority = {
      name: 'test-plugin',
      version: '1.0.0',
      description: 'A test plugin description that is long enough',
      homepage: 'http://[:::]'
    };
    const errorsAuth = validateValue(invalidAuthority, schema);
    assert.ok(errorsAuth.length > 0);
    assert.ok(errorsAuth.some(e => e.includes('homepage') && e.includes('RFC-compliant URI')));
  });

  test('isValidRfc3986Uri validates RFC 3986 URI syntax strictly', () => {
    const { isValidRfc3986Uri } = require('../scripts/validate-schema.js');
    assert.strictEqual(isValidRfc3986Uri('https://example.com'), true);
    assert.strictEqual(isValidRfc3986Uri('https://example.com/path?q=1#frag'), true);
    assert.strictEqual(isValidRfc3986Uri('mailto:user@example.com'), true);
    assert.strictEqual(isValidRfc3986Uri('urn:isbn:0451450523'), true);
    assert.strictEqual(isValidRfc3986Uri('https://example.com/%20encoded'), true);
    assert.strictEqual(isValidRfc3986Uri('http://[::1]:8080/path'), true);
    assert.strictEqual(isValidRfc3986Uri('http://[2001:db8::1]/'), true);
    assert.strictEqual(isValidRfc3986Uri('http://127.0.0.1:3000'), true);

    // Malformed authorities and IP-literals
    assert.strictEqual(isValidRfc3986Uri('http://[:::]'), false);
    assert.strictEqual(isValidRfc3986Uri('https://exa[mple.com'), false);
    assert.strictEqual(isValidRfc3986Uri('https://example.com/[]'), false);

    // Invalid percent encoding, whitespace, unescaped characters, or missing scheme
    assert.strictEqual(isValidRfc3986Uri('https://example.com/%'), false);
    assert.strictEqual(isValidRfc3986Uri('https://example.com/%2'), false);
    assert.strictEqual(isValidRfc3986Uri('https://example.com/%ZZ'), false);
    assert.strictEqual(isValidRfc3986Uri(' https://example.com '), false);
    assert.strictEqual(isValidRfc3986Uri('https://example.com/foo bar'), false);
    assert.strictEqual(isValidRfc3986Uri('not-a-uri'), false);
    assert.strictEqual(isValidRfc3986Uri('://missing-scheme'), false);
    assert.strictEqual(isValidRfc3986Uri('https://example.com/<script>'), false);
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
