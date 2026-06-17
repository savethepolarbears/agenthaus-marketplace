const { test } = require('node:test');
const assert = require('node:assert');
const { discoverPlugins, transformEnvVars } = require('../scripts/generate-cross-platform.js');

test('discoverPlugins is exported and functions correctly', () => {
    assert.strictEqual(typeof discoverPlugins, 'function');
    const plugins = discoverPlugins();
    assert.ok(Array.isArray(plugins));
    assert.ok(plugins.length > 0);
});

test('transformEnvVars converts environment variables for cursor platform', () => {
    const input = {
        env: {
            API_KEY: "${API_KEY}",
            OTHER_VAR: "static_value"
        }
    };
    const expected = {
        env: {
            API_KEY: "${env:API_KEY}",
            OTHER_VAR: "static_value"
        }
    };

    const result = transformEnvVars(input, 'cursor');
    assert.deepStrictEqual(result, expected);
});

test('transformEnvVars passes through objects for claude platform', () => {
    const input = {
        env: {
            API_KEY: "${API_KEY}"
        }
    };

    const result = transformEnvVars(input, 'claude');
    assert.deepStrictEqual(result, input);
});
