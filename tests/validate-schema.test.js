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

  test('counts Unicode code points rather than UTF-16 code units for minLength', () => {
    // 5 emojis = 10 UTF-16 code units, but only 5 Unicode code points
    // schema minLength for description is 10
    const invalidEmojis = {
      name: 'test-plugin',
      version: '1.0.0',
      description: '🚀🔥🌟🎉✨'
    };
    const errors = validateValue(invalidEmojis, schema);
    assert.ok(errors.length > 0);
    assert.ok(errors.some(e => e.includes('string length 5 is less than minLength 10')));

    // 10 emojis = 20 UTF-16 code units, exactly 10 Unicode code points
    const validEmojis = {
      name: 'test-plugin',
      version: '1.0.0',
      description: '🚀🔥🌟🎉✨🚀🔥🌟🎉✨'
    };
    const validErrors = validateValue(validEmojis, schema);
    assert.deepStrictEqual(validErrors, []);
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

  test('isValidEmail validates RFC 5322 and Draft-07 email grammar strictly', () => {
    const { isValidEmail } = require('../scripts/validate-schema.js');
    assert.strictEqual(isValidEmail('user@example.com'), true);
    assert.strictEqual(isValidEmail('user.name+tag@sub.domain.co.uk'), true);
    assert.strictEqual(isValidEmail('first.last@example.org'), true);

    // Single-label domains (e.g. localhost, mailserver)
    assert.strictEqual(isValidEmail('user@localhost'), true);
    assert.strictEqual(isValidEmail('admin@mailserver'), true);

    // RFC 5322 dot-atom domains (atext characters including _, !, etc.)
    assert.strictEqual(isValidEmail('user@foo_bar'), true);
    assert.strictEqual(isValidEmail('user@foo!bar'), true);
    assert.strictEqual(isValidEmail('user@sub_domain.example_org.com'), true);

    // Quoted local parts
    assert.strictEqual(isValidEmail('"John Doe"@example.com'), true);
    assert.strictEqual(isValidEmail('"john..doe"@example.com'), true);
    assert.strictEqual(isValidEmail('"foo@bar"@example.com'), true);
    assert.strictEqual(isValidEmail('"foo\\"bar"@example.com'), true);
    assert.strictEqual(isValidEmail('"foo\r\n bar"@example.com'), true);
    assert.strictEqual(isValidEmail('" foo bar "@example.com'), true);
    assert.strictEqual(isValidEmail('"foo\nbar"@example.com'), false);
    assert.strictEqual(isValidEmail('"foo\r\nbar"@example.com'), false);

    // RFC 5322 CFWS around local parts and domains
    assert.strictEqual(isValidEmail('"foo" @example.com'), true);
    assert.strictEqual(isValidEmail('"foo" @ example.com'), true);
    assert.strictEqual(isValidEmail('"foo"@ example.com'), true);
    assert.strictEqual(isValidEmail('"foo" (comment) @example.com'), true);
    assert.strictEqual(isValidEmail('"foo" @ [127.0.0.1]'), true);
    assert.strictEqual(isValidEmail('user @ example.com'), true);
    assert.strictEqual(isValidEmail('user @ [127.0.0.1]'), true);
    assert.strictEqual(isValidEmail('user(nested (comment))@example.com'), true);
    assert.strictEqual(isValidEmail('user(escaped \\(paren\\))@example.com'), true);
    assert.strictEqual(isValidEmail('user(foo\r\n bar)@example.com'), true);
    assert.strictEqual(isValidEmail('user(\n)@example.com'), false);
    assert.strictEqual(isValidEmail('user(\r)@example.com'), false);
    assert.strictEqual(isValidEmail('user(\0)@example.com'), false);
    assert.strictEqual(isValidEmail('user(foo\r\nbar)@example.com'), false);
    assert.strictEqual(isValidEmail('user(unclosed@example.com'), false);

    // RFC 5322 Section 4.4 obs-local-part and obs-domain syntax
    assert.strictEqual(isValidEmail('user."tag"@example.com'), true);
    assert.strictEqual(isValidEmail('"user".tag@example.com'), true);
    assert.strictEqual(isValidEmail('"first"."last"@example.com'), true);
    assert.strictEqual(isValidEmail('user."tag".more@example.com'), true);
    assert.strictEqual(isValidEmail('user."foo bar"@example.com'), true);
    assert.strictEqual(isValidEmail('user . "tag" @ example.com'), true);
    assert.strictEqual(isValidEmail('user . "tag" @ example . com'), true);
    assert.strictEqual(isValidEmail('user.."tag"@example.com'), false);
    assert.strictEqual(isValidEmail('user."tag".@example.com'), false);
    assert.strictEqual(isValidEmail('."tag"@example.com'), false);

    // Domain literals (IPv4 and IPv6)
    assert.strictEqual(isValidEmail('user@[127.0.0.1]'), true);
    assert.strictEqual(isValidEmail('user@[IPv6:2001:db8::1]'), true);
    assert.strictEqual(isValidEmail('user@[IPv6:::1]'), true);
    assert.strictEqual(isValidEmail('user@[2001:db8::1]'), true);
    // RFC 5322 addresses without transport-specific SMTP length limits
    assert.strictEqual(isValidEmail('a'.repeat(65) + '@example.com'), true);
    assert.strictEqual(isValidEmail('"' + 'a'.repeat(65) + '"@example.com'), true);
    assert.strictEqual(isValidEmail('user@' + 'a'.repeat(255)), true);
    assert.strictEqual(isValidEmail('a'.repeat(65) + '@' + 'b'.repeat(200) + '.com'), true);

    // Invalid dot-atoms in unquoted local-part
    assert.strictEqual(isValidEmail('.user@example.com'), false);
    assert.strictEqual(isValidEmail('user.@example.com'), false);
    assert.strictEqual(isValidEmail('user..name@example.com'), false);

    // Invalid domain dots
    assert.strictEqual(isValidEmail('user@.example.com'), false);
    assert.strictEqual(isValidEmail('user@example.com.'), false);
    assert.strictEqual(isValidEmail('user@example..com'), false);

    // RFC 5322 Section 3.4.1 domain literals: *([FWS] dtext) [FWS]
    assert.strictEqual(isValidEmail('user@[1:value]'), true);
    assert.strictEqual(isValidEmail('user@[tag:value]'), true);
    assert.strictEqual(isValidEmail('user@[custom-tag:value]'), true);
    assert.strictEqual(isValidEmail('user@[tag1:my-val]'), true);
    assert.strictEqual(isValidEmail('user@[1tag:value]'), true);
    assert.strictEqual(isValidEmail('user@[-tag:value]'), true);
    assert.strictEqual(isValidEmail('user@[tag-:value]'), true);
    assert.strictEqual(isValidEmail('user@[foo]'), true);
    assert.strictEqual(isValidEmail('user@[foo-bar]'), true);
    assert.strictEqual(isValidEmail('user@[sub.domain]'), true);
    assert.strictEqual(isValidEmail('user@[:::]'), true);
    assert.strictEqual(isValidEmail('user@[127.0.0.999]'), true);
    assert.strictEqual(isValidEmail('user@[foo bar]'), true);
    assert.strictEqual(isValidEmail('user@[ foo bar ]'), true);
    assert.strictEqual(isValidEmail('user@[foo \r\n bar]'), true);
    assert.strictEqual(isValidEmail('user@[]'), true);
    assert.strictEqual(isValidEmail('user@[   ]'), true);

    // RFC 5322 Section 4.4 quoted pairs in domain literals (obs-dtext = quoted-pair)
    assert.strictEqual(isValidEmail('user@[foo\\]bar]'), true);
    assert.strictEqual(isValidEmail('user@[foo\\[bar]'), true);
    assert.strictEqual(isValidEmail('user@[foo\\\\bar]'), true);
    assert.strictEqual(isValidEmail('user@[foo\\bar]'), true);
    assert.strictEqual(isValidEmail('user@[foo\\ bar]'), true);
    assert.strictEqual(isValidEmail('user@[foo\\]bar] (comment)'), true);
    assert.strictEqual(isValidEmail('user@[foo\\\x01bar]'), true);
    assert.strictEqual(isValidEmail('"foo\\\x01bar"@example.com'), true);
    assert.strictEqual(isValidEmail('user(comment\\\x01)@example.com'), true);

    // Invalid domain literals (unclosed, trailing garbage, unescaped brackets, or invalid control characters)
    assert.strictEqual(isValidEmail('user@[foo\\]'), false);
    assert.strictEqual(isValidEmail('user@[foo[bar]]'), false);
    assert.strictEqual(isValidEmail('user@[foo\nbar]'), false);
    assert.strictEqual(isValidEmail('user@[unclosed'), false);
    assert.strictEqual(isValidEmail('user@[closed]extra'), false);

    // Invalid quoted strings
    assert.strictEqual(isValidEmail('"unclosed@example.com'), false);
    assert.strictEqual(isValidEmail('"quoted"extra@example.com'), false);
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

    // IPvFuture literals (case-insensitive version prefix v/V per RFC 3986)
    assert.strictEqual(isValidRfc3986Uri('http://[v1.example]/'), true);
    assert.strictEqual(isValidRfc3986Uri('http://[V1.example]/'), true);
    assert.strictEqual(isValidRfc3986Uri('http://[v7.a-b-c:123]/'), true);
    assert.strictEqual(isValidRfc3986Uri('http://[VF.sub-delims]/'), true);
    assert.strictEqual(isValidRfc3986Uri('http://[v]/'), false);
    assert.strictEqual(isValidRfc3986Uri('http://[vx.abc]/'), false);
    assert.strictEqual(isValidRfc3986Uri('http://[v1]/'), false);

    // Non-authority paths: path-absolute, path-rootless, empty segments, trailing slashes
    assert.strictEqual(isValidRfc3986Uri('file:/'), true);
    assert.strictEqual(isValidRfc3986Uri('foo:/a/'), true);
    assert.strictEqual(isValidRfc3986Uri('foo:/a//b'), true);
    assert.strictEqual(isValidRfc3986Uri('file:///path/to/file'), true);

    // Malformed authorities and IP-literals
    assert.strictEqual(isValidRfc3986Uri('http://[:::]'), false);
    assert.strictEqual(isValidRfc3986Uri('https://exa[mple.com'), false);
    assert.strictEqual(isValidRfc3986Uri('https://example.com/[]'), false);
    assert.strictEqual(isValidRfc3986Uri('file:/[]'), false);
    assert.strictEqual(isValidRfc3986Uri('foo:/a/[]/b'), false);

    // Scoped IPv6 values are not RFC 3986 literals
    assert.strictEqual(isValidRfc3986Uri('http://[fe80::1%20zone]/'), false);
    assert.strictEqual(isValidRfc3986Uri('http://[fe80::1%eth0]/'), false);

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
