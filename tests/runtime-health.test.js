'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { classifyDoctor, isolatedEnvironment, artifactSnapshot, compareArtifacts, runHealth } = require('../scripts/check-runtime-health.js');
test('optional absent credentials remain missing evidence while real errors fail', () => {
  const result = classifyDoctor({ checks: [
    { name: 'GITHUB_TOKEN', status: 'MISSING', severity: 'WARN', message: 'GITHUB_TOKEN: MISSING' },
    { severity: 'WARN', message: 'Optional runner missing: uv' },
    { severity: 'FAIL', message: 'Mandatory runtime missing: node' },
    { severity: 'WARN', message: 'Stale generated file: plugins/sample/.cursor/mcp.json' }
  ] });
  assert.equal(result.missing_credentials.length, 1); assert.equal(result.errors.length, 2);
  assert.equal(result.optional_runtimes.length, 1);
});
test('isolation strips credentials without repurposing standard home variables', () => {
  const env = isolatedEnvironment({ PATH: '/safe', HOME: '/real-home', CODEX_HOME: '/real-codex', GITHUB_TOKEN: 'FAKE_SECRET', NODE_OPTIONS: '--require=unsafe.js', AGENTHAUS_STATE_FILE: '/real-state' }, '/fixture', '1761264000');
  assert.equal(env.HOME, '/real-home'); assert.equal(env.CODEX_HOME, '/real-codex');
  assert.equal(env.GITHUB_TOKEN, undefined); assert.equal(env.NODE_OPTIONS, undefined);
  assert.equal(env.AGENTHAUS_STATE_FILE, path.join('/fixture', 'state.json'));
});
test('artifact comparisons detect changed tracked content and path-set changes', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-artifacts-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'plugins/a'), { recursive: true }); fs.writeFileSync(path.join(dir, 'plugins/a/codex-mcp-config.toml'), 'original');
  const before = artifactSnapshot(dir); fs.writeFileSync(path.join(dir, 'plugins/a/codex-mcp-config.toml'), 'changed');
  assert.equal(compareArtifacts(before, artifactSnapshot(dir)).ok, false);
  fs.unlinkSync(path.join(dir, 'plugins/a/codex-mcp-config.toml'));
  assert.equal(compareArtifacts(before, artifactSnapshot(dir)).ok, false);
});
test('real health runner generates twice in isolation without changing source instructions or homes', { timeout: 30000, skip: process.platform === 'win32' }, () => {
  const root = path.resolve(__dirname, '..'), home = process.env.HOME, codexHome = process.env.CODEX_HOME;
  const before = fs.readFileSync(path.join(root, 'AGENTS.md'));
  const result = runHealth({ repoRoot: root, sourceDateEpoch: '1761264000' });
  assert.equal(result.result.generators.reproducible, true);
  assert.equal(result.result.coverage.plugins.length, fs.readdirSync(path.join(root, 'plugins')).filter(n => fs.existsSync(path.join(root, 'plugins', n, '.claude-plugin/plugin.json'))).length);
  assert.deepEqual(fs.readFileSync(path.join(root, 'AGENTS.md')), before);
  assert.equal(process.env.HOME, home); assert.equal(process.env.CODEX_HOME, codexHome);
  assert.equal(result.evidence, 'local'); assert.equal(result.external_evidence.provider_acceptance, 'unknown');
  assert.ok(!JSON.stringify(result).includes('FAKE_SECRET'));
});
test('provider documentation audit dynamically covers plugins and rejects obsolete transport claims', t => {
  const { auditProviderDocs } = require('../scripts/check-runtime-health.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-docs-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, 'plugins/sample/.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'plugins/sample/.claude-plugin/plugin.json'), '{}');
  fs.writeFileSync(path.join(dir, 'plugins/sample/README.md'), 'Use [mcp.servers.sample] for Codex. Hooks work on every provider.');
  const result = auditProviderDocs(dir);
  assert.deepEqual(result.plugins, ['sample']); assert.equal(result.findings.length, 2);
});
