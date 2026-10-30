'use strict';
// AgentHaus declarations are inspection data. This module grants no authority.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const {validateValue} = require('../scripts/validate-schema.js');
const schema = require('../schemas/agenthaus-metadata.schema.json');
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function fail(label, message) { throw new Error(`${label}: ${message}`); }
function name(value, label) {
  if (typeof value !== 'string' || value.length > 64 || !NAME.test(value)) fail(label, 'expected 1-64 lowercase ASCII letters/digits with single internal hyphens');
  return value;
}
function confined(root, candidate) {
  const base = fs.realpathSync(root), resolved = fs.realpathSync(candidate), rel = path.relative(base, resolved);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) fail(candidate, 'path escapes containment root');
  return resolved;
}
function readBounded(root, file, limit) {
  const resolved = confined(root, file);
  const fd = fs.openSync(resolved, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > limit) fail(file, `file must be regular and at most ${limit} bytes (size limit)`);
    const buffer = Buffer.alloc(limit + 1);
    let count = 0, read;
    while (count < buffer.length && (read = fs.readSync(fd, buffer, count, buffer.length - count, null))) count += read;
    if (count > limit) fail(file, `file exceeds ${limit} byte limit`);
    const again = confined(root, file), current = fs.statSync(again);
    if (again !== resolved || current.ino !== stat.ino || current.dev !== stat.dev) fail(file, 'file changed during read');
    const text = buffer.subarray(0, count).toString('utf8');
    if (!Buffer.from(text).equals(buffer.subarray(0, count))) fail(file, 'invalid UTF-8');
    return text;
  } finally { fs.closeSync(fd); }
}
function scalar(raw, label) {
  let value = raw.trim();
  if (value.startsWith('"')) {
    const match = /^("(?:[^"\\]|\\.)*")(?:\s+#.*)?$/.exec(value);
    if (!match) fail(label, 'unsupported quoted YAML scalar; use a JSON-compatible quoted string');
    try { value = JSON.parse(match[1]); } catch { fail(label, 'invalid quoted scalar'); }
  } else if (value.startsWith("'")) {
    const match = /^'((?:[^']|'')*)'(?:\s+#.*)?$/.exec(value);
    if (!match) fail(label, 'invalid single-quoted scalar');
    value = match[1].replace(/''/g, "'");
  } else {
    value = value.replace(/\s+#.*$/, '').trim();
    if (!value || /^[\[\]{}&*!>|%@`]/.test(value) || /:\s/.test(value) || /^(?:null|true|false|~|[-+]?(?:0x[0-9a-f_]+|0o[0-7_]+|0b[01_]+|(?:[0-9][0-9_]*(?:\.[0-9_]*)?|\.[0-9_]+)(?:e[-+]?[0-9_]+)?|\.(?:inf|nan)))$/i.test(value)) fail(label, 'unsupported YAML scalar; quote the string explicitly');
  }
  if (typeof value !== 'string' || !value.trim() || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) fail(label, 'expected a nonempty string without control characters');
  return value;
}
function parseFrontmatter(text, label = 'SKILL.md') {
  if (!text.startsWith('---\n') && !text.startsWith('---\r\n')) fail(label, 'missing opening YAML frontmatter delimiter');
  const lines = text.split(/\r?\n/), result = {}, seen = new Set();
  let metadata = false, ended = false, bytes = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i], where = `${label}:${i + 1}`;
    bytes += Buffer.byteLength(line) + 1;
    if (bytes > 16384) fail(where, 'frontmatter exceeds 16384 byte limit');
    if (line === '---') { ended = true; break; }
    if (/\t/.test(line)) fail(where, 'tabs are unsupported in YAML indentation');
    if (!line.trim() || /^\s*#/.test(line)) continue;
    if (/^  /.test(line)) {
      if (!metadata) fail(where, 'unsupported nested YAML; only metadata string maps are supported');
      const pair = /^  ([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
      if (!pair || ['__proto__','constructor','prototype'].includes(pair[1])) fail(where, 'unsupported metadata key or nesting');
      if (own(result.metadata, pair[1])) fail(where, 'duplicate metadata key');
      result.metadata[pair[1]] = scalar(pair[2], where);
      continue;
    }
    metadata = false;
    const pair = /^([a-z][a-z-]*):\s*(.*)$/.exec(line);
    if (!pair || !['name','description','license','compatibility','allowed-tools','metadata'].includes(pair[1])) fail(where, 'unsupported frontmatter key or YAML syntax');
    if (seen.has(pair[1])) fail(where, 'duplicate frontmatter key');
    seen.add(pair[1]);
    if (pair[1] === 'metadata') {
      if (pair[2].trim()) fail(where, 'metadata must be an indented string map');
      metadata = true; result.metadata = {};
    } else result[pair[1]] = scalar(pair[2], where);
  }
  if (!ended) fail(label, 'missing closing YAML frontmatter delimiter');
  name(result.name, label);
  if (typeof result.description !== 'string' || [...result.description].length > 1024) fail(label, 'description must contain 1-1024 characters');
  if (result.compatibility && [...result.compatibility].length > 500) fail(label, 'compatibility must contain 1-500 characters');
  return result;
}
function validateSkillFile(skillPath, pluginRoot) {
  const fields = parseFrontmatter(readBounded(pluginRoot, skillPath, 1024 * 1024), skillPath);
  if (fields.name !== path.basename(path.dirname(skillPath))) fail(skillPath, 'skill name must match its parent directory');
  return fields;
}
function pluginIdentity(pluginRoot) {
  const manifestPath = path.join(pluginRoot, '.claude-plugin', 'plugin.json');
  let manifest;
  try { manifest = JSON.parse(readBounded(pluginRoot, manifestPath, 65536)); } catch (e) { fail(manifestPath, `invalid plugin identity (${e.code || 'metadata error'})`); }
  if (!manifest || typeof manifest !== 'object') fail(manifestPath, 'invalid plugin manifest');
  name(manifest.name, manifestPath);
  if (manifest.name !== path.basename(pluginRoot)) fail(manifestPath, 'manifest name does not match selected plugin directory');
  return manifest.name;
}
function readSidecar(pluginRoot) {
  const plugin = pluginIdentity(pluginRoot), file = path.join(pluginRoot, 'agenthaus.json');
  try { fs.lstatSync(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  let data;
  try { data = JSON.parse(readBounded(pluginRoot, file, 65536)); } catch (e) { if (e instanceof SyntaxError) fail(file, 'invalid sidecar JSON'); throw e; }
  // Do not return schema diagnostics containing raw values: malformed declarations
  // could contain accidentally pasted credentials. Report field paths only.
  if (validateValue(data, schema).length) fail(file, 'invalid sidecar fields or schema version; check agenthaus-metadata.schema.json (values omitted)');
  if (data.schema_version !== 1) fail(file, 'unsupported sidecar schema version');
  if (data.plugin !== plugin) fail(file, 'sidecar plugin identity mismatch');
  const validatePermissions = (permissions, label) => {
    if (!permissions) return;
    for (const key of ['tools','hosts','environment']) if (permissions[key]) {
      const values = permissions[key];
      if (values.length > 128 || new Set(values).size !== values.length) fail(label, 'permission lists must be bounded and unique');
      for (const value of values) {
        if (value.length > 253 || /\s|[\x00-\x1f]/.test(value)) fail(label, 'invalid permission token (value omitted)');
        if (key === 'environment' && !/^[A-Z_][A-Z0-9_]*$/.test(value)) fail(label, 'environment requires variable names only (values omitted)');
        if (key === 'tools' && !/^[A-Za-z0-9_.:-]+$/.test(value)) fail(label, 'tools require exact identifiers, not shell expressions');
        if (key === 'hosts' && !(net.isIP(value) || /^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/.test(value))) fail(label, 'hosts require exact lowercase hostnames/IPs without schemes, ports or credentials');
      }
    }
  };
  validatePermissions(data.permissions, file);
  const aliases = new Set();
  for (const [skill, item] of Object.entries(data.skills || {})) {
    name(skill, file);
    validateSkillFile(path.join(pluginRoot,'skills',skill,'SKILL.md'), pluginRoot);
    validatePermissions(item.permissions, file);
    if ((item.aliases || []).length > 32 || (item.triggers || []).length > 64) fail(file, 'skill metadata list limit exceeded');
    for (const alias of item.aliases || []) {
      name(alias, file);
      if (alias === skill || aliases.has(alias) || fs.existsSync(path.join(pluginRoot,'skills',alias))) fail(file, 'ambiguous or duplicate skill alias');
      aliases.add(alias);
    }
  }
  return data;
}
function listSkills(pluginsDir, {plugins} = {}) {
  const selected = plugins === undefined ? fs.readdirSync(pluginsDir).filter(n => !n.startsWith('.') && fs.statSync(path.join(pluginsDir,n)).isDirectory()) : plugins;
  if (!Array.isArray(selected) || new Set(selected).size !== selected.length) fail('plugins', 'selection must contain unique plugin names');
  const result = [];
  for (const plugin of [...selected].sort()) {
    name(plugin, 'plugin selection');
    const logicalRoot = path.join(path.resolve(pluginsDir), plugin), pluginRoot = fs.realpathSync(logicalRoot);
    pluginIdentity(logicalRoot);
    const sidecar = readSidecar(logicalRoot), base = path.join(pluginRoot,'skills');
    if (!fs.existsSync(base)) continue;
    confined(pluginRoot,base);
    for (const skill of fs.readdirSync(base).sort()) {
      name(skill, base);
      const directory = path.join(base,skill);
      if (!fs.statSync(directory).isDirectory()) continue;
      confined(pluginRoot,directory);
      const skillPath = path.join(directory,'SKILL.md');
      const fields = validateSkillFile(skillPath,pluginRoot);
      const descriptor = {id:`${plugin}:skill:${fields.name}`,plugin,name:fields.name,directory,pluginRoot,skillPath,path:`skills/${skill}/SKILL.md`,description:fields.description,aliases:sidecar?.skills?.[skill]?.aliases || [],triggers:sidecar?.skills?.[skill]?.triggers || []};
      if (fields['allowed-tools']) descriptor.allowedTools = fields['allowed-tools'];
      if (fields.metadata) descriptor.metadata = fields.metadata;
      result.push(descriptor);
    }
  }
  return result;
}
function inspectPermissions(pluginRoot, {skill} = {}) {
  const plugin = pluginIdentity(pluginRoot), sidecar = readSidecar(pluginRoot);
  if (skill !== undefined) { name(skill,'skill selection'); validateSkillFile(path.join(pluginRoot,'skills',skill,'SKILL.md'),pluginRoot); }
  const sources = [sidecar?.permissions, skill === undefined ? null : sidecar?.skills?.[skill]?.permissions].filter(Boolean);
  const requested = {tools:null,hosts:null,environment:null,security:null};
  for (const source of sources) {
    for (const key of ['tools','hosts','environment']) if (own(source,key)) requested[key] = [...new Set([...(requested[key] || []),...source[key]])].sort();
    if (source.security) requested.security = {requires_approval: Boolean(requested.security?.requires_approval || source.security.requires_approval)};
  }
  return {plugin,skill:skill ?? null,declaration_status:sources.length ? 'declared' : 'undeclared',enforcement_status:'not_enforced',requested};
}
module.exports = {listSkills,enumerateSkills:listSkills,parseFrontmatter,validateSkillFile,readSidecar,inspectPermissions};
