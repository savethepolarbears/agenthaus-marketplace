'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { discoverPlugins, stableStringify } = require('../src/catalog.js');

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

  await t.test('stableStringify deterministic sorting', () => {
    const obj1 = { b: 1, a: { d: 2, c: 3 } };
    const obj2 = { a: { c: 3, d: 2 }, b: 1 };
    assert.strictEqual(stableStringify(obj1), stableStringify(obj2));
  });
});
