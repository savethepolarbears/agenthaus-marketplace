'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { discoverPlugins, stableStringify } = require('../src/catalog.js');
// Keep agenthaus ownership state out of the real home directory
process.env.AGENTHAUS_STATE_FILE = require('node:path').join(require('node:fs').mkdtempSync(require('node:path').join(require('node:os').tmpdir(), 'agenthaus-state-')), 'state.json');

test('CLI Catalog', async (t) => {
  const plugins = discoverPlugins();

  await t.test('discovers all 37 plugins in alphabetical order', () => {
    assert.ok(plugins.length >= 37, `Expected at least 37 plugins, got ${plugins.length}`);
    const names = plugins.map(p => p.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    assert.deepStrictEqual(names, sorted, 'Plugins are not in alphabetical order');
  });

  await t.test('circuit-breaker capabilities', () => {
    const cb = plugins.find(p => p.name === 'circuit-breaker');
    assert.ok(cb, 'circuit-breaker plugin not found');
    assert.strictEqual(cb.badges.hooks, true, 'circuit-breaker should have hooks');
    assert.strictEqual(cb.badges.mcp, false, 'circuit-breaker should not have mcp');
  });

  await t.test('neon-db capabilities', () => {
    const neon = plugins.find(p => p.name === 'neon-db');
    assert.ok(neon, 'neon-db plugin not found');
    assert.strictEqual(neon.badges.mcp, true, 'neon-db should have mcp');
  });

  await t.test('populates category from marketplace metadata', () => {
    const cb = plugins.find(p => p.name === 'circuit-breaker');
    assert.ok(cb, 'circuit-breaker should exist');
    assert.strictEqual(cb.category, 'safety');
    const gh = plugins.find(p => p.name === 'github-integration');
    assert.ok(gh, 'github-integration should exist');
    assert.strictEqual(gh.category, 'devops');
  });

  await t.test('populates supported platforms array', () => {
    assert.ok(plugins.every(p => Array.isArray(p.platforms) && p.platforms.length >= 5));
    const cb = plugins.find(p => p.name === 'circuit-breaker');
    assert.ok(cb.platforms.includes('claude'));
    assert.ok(cb.platforms.includes('gemini'));
  });

  await t.test('stableStringify deterministic sorting', () => {
    const obj1 = { b: 1, a: { d: 2, c: 3 } };
    const obj2 = { a: { c: 3, d: 2 }, b: 1 };
    assert.strictEqual(stableStringify(obj1), stableStringify(obj2));
  });
});
