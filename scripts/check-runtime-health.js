#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { parseArgs } = require('node:util');
const { captureSource, createWorkflowReceipt, validateWorkflowReceipt } = require('../src/workflow-receipt.js');
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const ARTIFACT = /^(?:AGENTS\.md|GEMINI\.md|skills_index\.json|plugins\/[^/]+\/(?:AGENTS\.md|GEMINI\.md|claude-desktop-snippet\.json|gemini-settings-snippet\.json|windsurf-mcp-snippet\.json|codex-mcp-config\.toml|\.cursor\/mcp\.json|\.cursor\/rules\/[^/]+\.mdc))$/;
function artifactSnapshot(root) {
  const result = {};
  function walk(dir = '') {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (['node_modules', '.git', 'reports', '.planning'].includes(entry.name)) continue;
      const rel = path.posix.join(dir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (ARTIFACT.test(rel)) result[rel] = digest(fs.readFileSync(path.join(root, rel)));
    }
  }
  walk(); return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}
function compareArtifacts(before, after) {
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(p => before[p] !== after[p]).sort();
  return { ok: changed.length === 0, changed };
}
function isolatedEnvironment(source, fixture, epoch) {
  const env = {};
  // Preserve standard home values, but never use them: the isolated doctor shims os.homedir.
  for (const name of ['PATH', 'PATHEXT', 'SystemRoot', 'SYSTEMROOT', 'SystemDrive', 'COMSPEC', 'ComSpec', 'TEMP', 'TMP', 'TMPDIR', 'LANG', 'LC_ALL', 'HOME', 'CODEX_HOME']) {
    if (source[name] !== undefined) env[name] = source[name];
  }
  env.AGENTHAUS_STATE_FILE = path.join(fixture, 'state.json');
  env.XDG_CONFIG_HOME = path.join(fixture, 'xdg');
  env.APPDATA = path.join(fixture, 'appdata');
  env.SOURCE_DATE_EPOCH = String(epoch);
  return env;
}
function classifyDoctor(report) {
  const result = { errors: [], missing_credentials: [], optional_runtimes: [], warnings: [] };
  if (!report || !Array.isArray(report.checks)) { result.errors.push({ code: 'INVALID_DOCTOR_RESPONSE' }); return result; }
  for (const check of report.checks) {
    if (check.status === 'MISSING' && /^[A-Z_][A-Z0-9_]*$/.test(check.name || '')) result.missing_credentials.push({ name: check.name, status: 'missing' });
    else if (check.severity === 'FAIL') result.errors.push({ code: /Mandatory runtime missing/.test(check.message || '') ? 'MANDATORY_RUNTIME_MISSING' : 'DOCTOR_FAILURE' });
    else if (/^(Optional runner missing|MCP command missing):/.test(check.message || '')) result.optional_runtimes.push({ status: 'unavailable' });
    else if (/^(Stale generated file|Missing generated file|Failed to evaluate generated file|Failed to load cross-platform generator)/.test(check.message || '')) result.errors.push({ code: 'GENERATED_CONFIG_INVALID' });
    else if (check.severity === 'WARN') result.warnings.push({ code: 'DOCTOR_WARNING' });
  }
  return result;
}
function auditProviderDocs(root) {
  const plugins = fs.readdirSync(path.join(root, 'plugins')).filter(name => fs.existsSync(path.join(root, 'plugins', name, '.claude-plugin/plugin.json'))).sort();
  const findings = [];
  const patterns = [
    ['OBSOLETE_CODEX_TABLE', /\[mcp\.servers\./i],
    ['OBSOLETE_CODEX_JSON', /\.codex\/mcp\.json/i],
    ['UNIVERSAL_HOOK_CLAIM', /(?:hooks|HITL)[^\n]{0,70}(?:all|every) (?:platform|provider)|(?:all|every) (?:platform|provider)[^\n]{0,70}(?:hooks|HITL)/i]
  ];
  for (const plugin of plugins) {
    const file = path.join(root, 'plugins', plugin, 'README.md');
    if (!fs.existsSync(file)) { findings.push({ plugin, code: 'MISSING_PLUGIN_README' }); continue; }
    const text = fs.readFileSync(file, 'utf8');
    for (const [code, pattern] of patterns) if (pattern.test(text)) findings.push({ plugin, code });
  }
  return { plugins, findings, scope: 'documented contradiction patterns; semantic completeness unverified' };
}
function doctorBootstrap(fixtureHome) {
  // This bootstrap exists only in the disposable fixture. No standard environment variable changes.
  return `require('node:os').homedir = () => ${JSON.stringify(fixtureHome)};\n`;
}
function runHealth({ repoRoot = path.resolve(__dirname, '..'), sourceDateEpoch = String(Math.floor(Date.now() / 1000)) } = {}) {
  if (!/^\d+$/.test(String(sourceDateEpoch)) || !Number.isFinite(Number(sourceDateEpoch)) || Number(sourceDateEpoch) > 253402300799) throw new Error('Invalid SOURCE_DATE_EPOCH');
  const source = captureSource({ repoRoot }), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-health-'));
  const fixture = path.join(temp, 'project'), fixtureHome = path.join(temp, 'home');
  fs.mkdirSync(fixture); fs.mkdirSync(fixtureHome);
  const result = { status: 'fail', commands: [], errors: [], doctor: null, generators: {}, coverage: { plugins: [], artifacts: [], providers: [] } };
  const env = isolatedEnvironment(process.env, temp, sourceDateEpoch);
  function execute(command, args, label) {
    const p = spawnSync(command, args, { cwd: fixture, env, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
    const exit = p.status === null ? 1 : p.status;
    result.commands.push({ command: label, exit });
    if (exit !== 0) result.errors.push({ code: 'COMMAND_FAILED', command: label });
    return p;
  }
  try {
    // Copy the exact reviewed source list. Symlinks become fixture-local regular files.
    for (const file of source.files) {
      const dest = path.join(fixture, file.path); fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(repoRoot, file.path), dest);
    }
    const bootstrap = path.join(temp, 'doctor-bootstrap.cjs'); fs.writeFileSync(bootstrap, doctorBootstrap(fixtureHome));
    const baseline = artifactSnapshot(fixture);
    const baselineIndex = path.join(fixture, 'skills_index.json');
    if (fs.existsSync(baselineIndex)) {
      const existingIndex = JSON.parse(fs.readFileSync(baselineIndex, 'utf8'));
      existingIndex.generated = new Date(Number(sourceDateEpoch) * 1000).toISOString().slice(0, 10);
      baseline['skills_index.json'] = digest(require(path.join(fixture, 'scripts/generate-cross-platform.js')).stableStringify(existingIndex));
    }
    for (let pass = 1; pass <= 2; pass++) {
      execute(process.platform === 'win32' ? 'bash.exe' : 'bash', ['scripts/generate-skills-index.sh'], ['bash', 'scripts/generate-skills-index.sh', `pass=${pass}`]);
      execute(process.execPath, ['scripts/generate-cross-platform.js'], ['node', 'scripts/generate-cross-platform.js', `pass=${pass}`]);
      const current = artifactSnapshot(fixture);
      if (pass === 1) {
        result.generators.first = current;
        result.generators.baseline_drift = compareArtifacts(baseline, current).changed;
      } else {
        const comparison = compareArtifacts(result.generators.first, current);
        result.generators.reproducible = comparison.ok;
        result.generators.changed = comparison.changed;
        result.coverage.artifacts = Object.keys(current);
      }
    }
    if (!result.generators.reproducible) result.errors.push({ code: 'GENERATOR_NONDETERMINISM' });
    if (result.generators.baseline_drift.length) result.errors.push({ code: 'GENERATED_BASELINE_DRIFT', paths: result.generators.baseline_drift });
    const index = JSON.parse(fs.readFileSync(path.join(fixture, 'skills_index.json'), 'utf8'));
    if (new Set(index.entries.map(e => e.id)).size !== index.entries.length || new Set(index.entries.map(e => e.path)).size !== index.entries.length) result.errors.push({ code: 'INDEX_IDENTITY_COLLISION' });
    result.generators.date_policy = { source_date_epoch: String(sourceDateEpoch), generated: index.generated };
    result.coverage.documentation = auditProviderDocs(fixture);
    if (result.coverage.documentation.findings.length) result.errors.push({ code: 'PROVIDER_DOCUMENTATION_CONTRADICTIONS', findings: result.coverage.documentation.findings });
    result.coverage.plugins = fs.readdirSync(path.join(fixture, 'plugins')).filter(name => fs.existsSync(path.join(fixture, 'plugins', name, '.claude-plugin/plugin.json'))).sort();
    // Execute production adapter read-only comparators with isolated paths; never install or launch a provider.
    const adapterCode = `require(${JSON.stringify(bootstrap)});const fs=require('node:fs'),path=require('node:path');const {getAllProviders}=require('./src/providers');const rows=[];for(const p of getAllProviders()){let checked=0;for(const name of fs.readdirSync('plugins')){if(typeof p.isMcpInSync==='function'){p.isMcpInSync(path.resolve('plugins',name),p.getTargetDir(process.cwd(),'project'));checked++;}}rows.push({provider:p.id,comparator_calls:checked,status:checked?'local-read-only-comparator':'external-discovery-unverified'});}console.log(JSON.stringify(rows));`;
    const adapters = execute(process.execPath, ['-e', adapterCode], ['node', 'isolated-provider-comparators']);
    try { result.coverage.providers = JSON.parse(adapters.stdout.trim().split('\n').pop()); } catch { result.errors.push({ code: 'INVALID_ADAPTER_RESPONSE' }); }
    const doctor = execute(process.execPath, ['--require', bootstrap, 'bin/agenthaus.js', 'doctor', '--json'], ['node', 'bin/agenthaus.js', 'doctor', '--json']);
    try { result.doctor = classifyDoctor(JSON.parse(doctor.stdout)); result.errors.push(...result.doctor.errors); } catch { result.errors.push({ code: 'INVALID_DOCTOR_RESPONSE' }); }
    if (JSON.stringify(captureSource({ repoRoot })) !== JSON.stringify(source)) result.errors.push({ code: 'SOURCE_CHANGED_DURING_RUN' });
    result.status = result.errors.length ? 'fail' : 'pass';
    return createWorkflowReceipt({ source, result });
  } finally { fs.rmSync(temp, { recursive: true, force: true, maxRetries: 3 }); }
}
function main(argv = process.argv.slice(2)) {
  const { values } = parseArgs({ args: argv, options: { root: { type: 'string' }, out: { type: 'string' }, verify: { type: 'string' }, 'source-date-epoch': { type: 'string' } } });
  const repoRoot = path.resolve(values.root || path.join(__dirname, '..'));
  if (values.verify) {
    const result = validateWorkflowReceipt(JSON.parse(fs.readFileSync(values.verify, 'utf8')), { repoRoot });
    console.log(JSON.stringify(result)); process.exitCode = result.ok ? 0 : 1; return;
  }
  const receipt = runHealth({ repoRoot, sourceDateEpoch: values['source-date-epoch'] || process.env.SOURCE_DATE_EPOCH || String(Math.floor(Date.now() / 1000)) });
  const out = path.resolve(values.out || path.join(repoRoot, 'reports/runtime-health.json'));
  const allowed = path.resolve(repoRoot, 'reports') + path.sep;
  if (!out.startsWith(allowed)) throw new Error('Health output must be under repository reports/');
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
  console.log(JSON.stringify({ status: receipt.result.status, receipt: path.relative(repoRoot, out), plugins: receipt.result.coverage.plugins.length, errors: receipt.result.errors }));
  process.exitCode = receipt.result.status === 'pass' ? 0 : 1;
}
if (require.main === module) { try { main(); } catch { console.error('Local health check unavailable; no acceptance claimed'); process.exitCode = 1; } }
module.exports = { auditProviderDocs, classifyDoctor, isolatedEnvironment, artifactSnapshot, compareArtifacts, runHealth, main };
