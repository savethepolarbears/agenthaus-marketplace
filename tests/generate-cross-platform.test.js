const { test, describe } = require('node:test');
const assert = require('node:assert');
const { discoverPlugins, transformEnvVars } = require('../scripts/generate-cross-platform.js');

describe('Cross-Platform Generator Utilities', () => {
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
});


test('canonical serializer preserves reserved own JSON keys at every depth', () => {
    const { stableStringify } = require('../scripts/generate-cross-platform.js');
    const value = JSON.parse('{"mcpServers":{"__proto__":{"command":"node"},"constructor":{"command":"node"}},"metadata":{"__proto__":{"keep":true}}}');
    assert.deepStrictEqual(JSON.parse(stableStringify(value)), value);
});
for (const transport of ['stdio', 'http']) test(`all JSON renderers preserve reserved ${transport} server identifiers`, () => {
    const generator = require('../scripts/generate-cross-platform.js');
    const server = transport === 'stdio' ? { command: 'node', args: ['fixture.js'] } : { type: 'http', url: 'http://example.invalid/mcp' };
    const servers = Object.fromEntries(['__proto__', 'constructor', 'prototype'].map(key => [key, server]));
    const plugin = { name: 'reserved-fixture', manifest: { version: '1.0.0' }, mcpServers: servers, hasMcp: true, hasHooks: false };
    for (const render of [generator.renderClaudeDesktop, generator.renderCursorMcp, generator.renderGeminiSettingsSnippet, generator.renderWindsurfMcp]) {
        const output = JSON.parse(render(plugin));
        for (const key of Object.keys(servers)) assert.ok(Object.hasOwn(output.mcpServers, key), `${render.name}: ${key}`);
    }
    const gemini = generator.transformEnvVars(servers, 'gemini');
    assert.ok(Object.hasOwn(gemini, '__proto__'));
    assert.equal(Object.getPrototypeOf(gemini), Object.prototype);
    assert.deepStrictEqual(gemini.__proto__, transport === 'http' ? { httpUrl: server.url } : server);
});
