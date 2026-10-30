'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { digest } = require('./safety-policy.js');
const { stableStringify } = require('./catalog.js');
const { isPlainObject } = require('./fs-utils.js');
const MAX_SKILL_BYTES = 1024 * 1024;
function readBounded(file) {
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > MAX_SKILL_BYTES) throw new Error('Invalid bounded skill file');
    const chunks = []; let total = 0;
    while (total <= MAX_SKILL_BYTES) {
      const chunk = Buffer.alloc(Math.min(65536, MAX_SKILL_BYTES + 1 - total));
      const length = fs.readSync(fd, chunk, 0, chunk.length, null);
      if (!length) return Buffer.concat(chunks, total);
      total += length; chunks.push(chunk.subarray(0, length));
    }
    throw new Error('Skill exceeds bounded read size');
  } finally { fs.closeSync(fd); }
}
function buildCapabilities({ pluginsDir } = {}) {
  if (!pluginsDir || !path.isAbsolute(pluginsDir)) throw new Error('Explicit absolute plugin root required');
  const skills = require('./skill-metadata.js').listSkills(pluginsDir);
  const entries = skills.map(s => {
    const bytes = readBounded(s.skillPath);
    return { id: s.id, plugin: s.plugin, name: s.name, description: s.description,
      aliases: [...(s.aliases || [])].sort(), triggers: [...(s.triggers || [s.name])].sort(),
      file: `${s.plugin}/${s.path}`, sha256: require('node:crypto').createHash('sha256').update(bytes).digest('hex') };
  }).sort((a, b) => a.id.localeCompare(b.id));
  const result = { schema_version: 1, source: 'explicit-plugin-root', entries, manifest_sha256: digest(entries) };
  validateCapabilities(result);
  return result;
}
function validateCapabilities(manifest) {
  if (!isPlainObject(manifest) || Object.keys(manifest).sort().join(',') !== 'entries,manifest_sha256,schema_version,source' || manifest.schema_version !== 1 || manifest.source !== 'explicit-plugin-root' || !Array.isArray(manifest.entries) || manifest.entries.length > 10000 || manifest.manifest_sha256 !== digest(manifest.entries)) throw new Error('Invalid capabilities manifest');
  const ids = new Set();
  for (const e of manifest.entries) {
    if (!isPlainObject(e) || Object.keys(e).sort().join(',') !== 'aliases,description,file,id,name,plugin,sha256,triggers' || typeof e.id !== 'string' || ![e.plugin, e.name, e.sha256].every(value => typeof value === 'string') || ![e.plugin, e.name].every(value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) || ids.has(e.id) || !/^[a-z0-9-]+:skill:[a-z0-9-]+$/.test(e.id) || e.id !== `${e.plugin}:skill:${e.name}` || typeof e.description !== 'string' || !e.description.trim() || typeof e.file !== 'string' || e.file !== `${e.plugin}/skills/${e.name}/SKILL.md` || !/^[a-f0-9]{64}$/.test(e.sha256) || ![e.aliases, e.triggers].every(a => Array.isArray(a) && a.every(s => typeof s === 'string' && s.length > 0 && s.length <= 1024))) throw new Error('Invalid skill capability');
    ids.add(e.id);
  }
  return manifest;
}
function pageCapabilities(manifest, { limit = 10, cursor, maxBytes = 8000 } = {}) {
  validateCapabilities(manifest);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Page limit must be an integer from 1 to 100');
  let offset = 0;
  if (cursor !== undefined) {
    if (typeof cursor !== 'string' || cursor.length > 256 || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error('Invalid capability cursor');
    let value; try { value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')); } catch { throw new Error('Invalid capability cursor'); }
    if (!Array.isArray(value) || value.length !== 2 || value[0] !== manifest.manifest_sha256 || !Number.isInteger(value[1]) || value[1] < 0 || value[1] >= manifest.entries.length) throw new Error('Stale or invalid capability cursor');
    offset = value[1];
  }
  if (!Number.isInteger(maxBytes) || maxBytes < 512 || maxBytes > 8000) throw new Error('Discovery page budget must be between 512 and 8000 bytes');
  const result = entries => ({ entries, total: manifest.entries.length, next_cursor: offset + entries.length < manifest.entries.length ? Buffer.from(JSON.stringify([manifest.manifest_sha256, offset + entries.length])).toString('base64url') : null });
  const entries = [];
  for (const candidate of manifest.entries.slice(offset, offset + limit)) {
    if (Buffer.byteLength(JSON.stringify(result([...entries, candidate]), null, 2) + '\n') > maxBytes) {
      if (!entries.length) throw new Error('Single skill capability exceeds discovery page budget');
      break;
    }
    entries.push(candidate);
  }
  return result(entries);
}
function readSkill(manifest, identity, { pluginsDir } = {}) {
  validateCapabilities(manifest);
  if (typeof identity !== 'string' || !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(identity)) throw new Error('Skill identity must be plugin/skill');
  const [plugin, name] = identity.split('/');
  const matches = manifest.entries.filter(e => e.plugin === plugin && (e.name === name || e.aliases.includes(name)));
  if (matches.length !== 1) throw new Error('Missing or ambiguous skill identity');
  const entry = matches[0], current = buildCapabilities({ pluginsDir });
  const active = current.entries.find(e => e.id === entry.id);
  if (!active || stableStringify(active) !== stableStringify(entry)) throw new Error('Skill capability changed; regenerate discovery');
  const root = fs.realpathSync(pluginsDir), real = fs.realpathSync(path.join(root, entry.file));
  const pluginRoot = fs.realpathSync(path.join(root, plugin));
  if (!real.startsWith(pluginRoot + path.sep)) throw new Error('Skill path escaped plugin');
  const bytes = readBounded(real);
  if (require('node:crypto').createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error('Skill changed during read');
  return { id: entry.id, sha256: entry.sha256, content: bytes.toString('utf8') };
}
const START = '<!-- agenthaus:discovery:start -->';
const END = '<!-- agenthaus:discovery:end -->';
function updateDiscoveryRegion(text, reference, { maxBytes = 2048 } = {}) {
  if (typeof text !== 'string' || typeof reference !== 'string' || reference.includes(START) || reference.includes(END)) throw new Error('Invalid discovery region');
  const starts = text.split(START).length - 1, ends = text.split(END).length - 1;
  if (starts !== ends || starts > 1 || (starts && text.indexOf(START) > text.indexOf(END))) throw new Error('Malformed discovery region; no output written');
  const region = `${START}\n${reference}\n${END}`;
  const output = starts ? text.slice(0, text.indexOf(START)) + region + text.slice(text.indexOf(END) + END.length) : text + (text.endsWith('\n') ? '\n' : '\n\n') + region + '\n';
  if (!Number.isInteger(maxBytes) || maxBytes < 1 || Buffer.byteLength(output) > maxBytes) throw new Error('Provider instruction byte limit exceeded');
  return output;
}
function benchmarkContext(manifest, { pluginsDir } = {}) {
  validateCapabilities(manifest);
  const current = buildCapabilities({ pluginsDir });
  const bytes = Buffer.byteLength(stableStringify(manifest));
  let baseline = 0; for (const e of current.entries) baseline += fs.statSync(path.join(pluginsDir, e.file)).size;
  const routing = { covered: 0, missing: 0 };
  for (const entry of current.entries) {
    try { readSkill(manifest, `${entry.plugin}/${entry.name}`, { pluginsDir }); routing.covered++; } catch { routing.missing++; }
  }
  return { tokenizer: 'none', token_estimate_method: 'ceil(utf8_bytes/4)', tier1_bytes: bytes, tier1_estimated_tokens: Math.ceil(bytes / 4), baseline_bytes: baseline, baseline_estimated_tokens: Math.ceil(baseline / 4), paging_required: Math.ceil(bytes / 4) > 2000, routing, corpus: { skills: current.entries.length }, measured_task_savings: null };
}
module.exports = { buildCapabilities, validateCapabilities, pageCapabilities, readSkill, updateDiscoveryRegion, benchmarkContext };
