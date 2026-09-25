'use strict';

/**
 * Shared MCP server lifecycle for providers that merge plugin servers into a
 * user-owned JSON config (Antigravity/Gemini, Cursor, Windsurf/Devin, Copilot).
 *
 * Ownership is tracked outside provider configs, in ~/.agenthaus/state.json:
 *
 *   { version: 1, mcp: { "<abs config path>": { "<plugin>": { "<sourceKey>": { key, managed } } } } }
 *
 * - `key` is the destination server key written into the provider config.
 * - `managed: false` marks a pre-existing identical user entry the plugin reuses;
 *   it is never deleted by prune or uninstall.
 * Legacy in-config markers (`_agenthaus_mcp`, `_agenthaus_mcp_map`) are imported
 * into the state file and stripped from the config on the next write.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { isPlainObject, readJsonObject, writeJsonAtomic } = require('../fs-utils.js');

const STATE_VERSION = 1;
const LEGACY_OWNERSHIP_KEYS = ['_agenthaus_mcp', '_agenthaus_mcp_map'];

function getStatePath() {
  if (process.env.AGENTHAUS_STATE_FILE) return path.resolve(process.env.AGENTHAUS_STATE_FILE);
  return path.join(os.homedir(), '.agenthaus', 'state.json');
}

/**
 * Stable identity for a config file: realpath of its nearest existing ancestor plus
 * the remaining segments, so /var vs /private/var or a symlinked home map to one key.
 */
function configIdFor(configPath) {
  let cur = path.resolve(configPath);
  const rest = [];
  while (!fs.existsSync(cur)) {
    const parent = path.dirname(cur);
    if (parent === cur) break;
    rest.unshift(path.basename(cur));
    cur = parent;
  }
  try {
    return path.join(fs.realpathSync(cur), ...rest);
  } catch {
    return path.resolve(configPath);
  }
}

function loadState({ dryRun = false } = {}) {
  const state = readJsonObject(getStatePath(), 'AgentHaus state', { dryRun });
  if (!isPlainObject(state.mcp)) state.mcp = {};
  state.version = STATE_VERSION;
  return state;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function sameServerConfig(a, b) {
  return a !== undefined && b !== undefined && canonical(a) === canonical(b);
}

/**
 * Parse a plugin's MCP snippet. Returns { servers, failed }:
 * - servers: object of server configs, or null when the file is absent;
 * - failed: true when the snippet exists but is unusable (callers must then
 *   leave existing registrations untouched).
 */
function readServersSnippet(filePath, label, serversKey = 'mcpServers') {
  if (!fs.existsSync(filePath)) return { servers: null, failed: false };
  const warn = (reason) => {
    console.warn(`[warn] ${label}: ${reason} at ${filePath}. Preserving existing MCP registrations.`);
    return { servers: null, failed: true };
  };
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return warn(`Malformed MCP snippet (${err.message})`);
  }
  if (!isPlainObject(parsed)) return warn('Malformed MCP snippet: expected JSON object');
  if (parsed[serversKey] === undefined) return warn(`Snippet missing '${serversKey}'`);
  if (!isPlainObject(parsed[serversKey])) return warn(`Invalid '${serversKey}': expected JSON object`);
  return { servers: parsed[serversKey], failed: false };
}

/**
 * Replace plugin-root placeholders emitted by the generator with the absolute
 * install location, so servers resolve regardless of the editor's workspace.
 */
function resolvePluginRoot(servers, placeholders, absRoot) {
  if (!servers) return servers;
  const escapedRoot = JSON.stringify(absRoot).slice(1, -1);
  let text = JSON.stringify(servers);
  for (const placeholder of placeholders) {
    text = text.split(placeholder).join(escapedRoot);
  }
  return JSON.parse(text);
}

function importLegacyOwnership(config, records) {
  const hadLegacy = LEGACY_OWNERSHIP_KEYS.some(k => k in config);
  if (!hadLegacy) return false;
  const legacyKeys = isPlainObject(config._agenthaus_mcp) ? config._agenthaus_mcp : {};
  const legacyMap = isPlainObject(config._agenthaus_mcp_map) ? config._agenthaus_mcp_map : {};
  for (const [plugin, keys] of Object.entries(legacyKeys)) {
    if (records[plugin] || !Array.isArray(keys)) continue;
    const pluginMap = isPlainObject(legacyMap[plugin]) ? legacyMap[plugin] : {};
    const record = {};
    for (const [sourceKey, destKey] of Object.entries(pluginMap)) {
      if (typeof destKey === 'string' && keys.includes(destKey)) record[sourceKey] = { key: destKey, managed: true };
    }
    const mappedKeys = new Set(Object.values(record).map(r => r.key));
    for (const destKey of keys) {
      if (typeof destKey === 'string' && !mappedKeys.has(destKey) && !record[destKey]) {
        record[destKey] = { key: destKey, managed: true };
      }
    }
    if (Object.keys(record).length > 0) records[plugin] = record;
  }
  for (const k of LEGACY_OWNERSHIP_KEYS) delete config[k];
  return true;
}

/**
 * Reconcile one plugin's servers into a provider config.
 * `servers === null` means "no snippet": nothing is written unless the plugin
 * previously registered servers here (which are then pruned).
 * Returns { changed, keys } where keys maps source key -> destination key.
 */
function syncPluginServers({ configPath, pluginName, servers, label, serversKey = 'mcpServers', dryRun = false }) {
  const config = readJsonObject(configPath, label, { dryRun });
  const state = loadState({ dryRun });
  const configId = configIdFor(configPath);
  const records = isPlainObject(state.mcp[configId]) ? { ...state.mcp[configId] } : {};
  const migrated = importLegacyOwnership(config, records);
  const previous = isPlainObject(records[pluginName]) ? records[pluginName] : {};

  if (servers === null && Object.keys(previous).length === 0 && !migrated) {
    return { changed: false, keys: {} };
  }
  if (config[serversKey] !== undefined && !isPlainObject(config[serversKey])) {
    throw new Error(`'${serversKey}' in ${label} at ${configPath} must be an object. Aborting to preserve existing configuration.`);
  }

  const entries = { ...(config[serversKey] || {}) };
  const entriesBefore = JSON.stringify(entries);

  // destination key -> managed flag held by other plugins (false if any owner reused a user entry)
  const otherOwnerManaged = new Map();
  for (const [plugin, record] of Object.entries(records)) {
    if (plugin === pluginName || !isPlainObject(record)) continue;
    for (const r of Object.values(record)) {
      if (!r || typeof r.key !== 'string') continue;
      otherOwnerManaged.set(r.key, (otherOwnerManaged.get(r.key) ?? true) && r.managed !== false);
    }
  }
  const keysOwnedByOthers = new Set(otherOwnerManaged.keys());
  const previousByKey = new Map(Object.values(previous).map(r => [r.key, r]));
  const isOurManagedKey = (key) => {
    const r = previousByKey.get(key);
    return Boolean(r && r.managed) && !keysOwnedByOthers.has(key);
  };
  // Provenance travels with the destination: an entry agenthaus created stays managed,
  // a pre-existing user entry stays unmanaged no matter how many plugins share it.
  const managedFlagFor = (key) => {
    if (otherOwnerManaged.has(key)) return otherOwnerManaged.get(key);
    return Boolean(previousByKey.get(key)?.managed);
  };

  const claimed = new Set();
  const next = {};

  for (const [sourceKey, srvConfig] of Object.entries(servers || {})) {
    let assignment = null;
    const prior = previous[sourceKey];

    if (prior && !claimed.has(prior.key)) {
      if (sameServerConfig(entries[prior.key], srvConfig)) {
        assignment = { key: prior.key, managed: managedFlagFor(prior.key) };
      } else if (isOurManagedKey(prior.key)) {
        assignment = { key: prior.key, managed: true };
      }
    }

    if (!assignment && !claimed.has(sourceKey)) {
      if (entries[sourceKey] === undefined) {
        assignment = { key: sourceKey, managed: true };
      } else if (sameServerConfig(entries[sourceKey], srvConfig)) {
        assignment = { key: sourceKey, managed: managedFlagFor(sourceKey) };
      } else if (isOurManagedKey(sourceKey)) {
        assignment = { key: sourceKey, managed: true };
      }
    }

    if (!assignment) {
      const baseKey = `${pluginName}-${sourceKey}`;
      for (let n = 1; !assignment; n++) {
        const candidate = n === 1 ? baseKey : `${baseKey}-${n}`;
        if (claimed.has(candidate)) continue;
        if (entries[candidate] === undefined || isOurManagedKey(candidate)) {
          assignment = { key: candidate, managed: true };
        } else if (sameServerConfig(entries[candidate], srvConfig)) {
          assignment = { key: candidate, managed: managedFlagFor(candidate) };
        }
      }
      if (!prior || prior.key !== assignment.key) {
        console.log(`[warn] ${label}: MCP server '${sourceKey}' conflicts with an existing entry; registered as '${assignment.key}' for ${pluginName}`);
      }
    }

    entries[assignment.key] = srvConfig;
    claimed.add(assignment.key);
    next[sourceKey] = assignment;
  }

  for (const oldRecord of Object.values(previous)) {
    if (!claimed.has(oldRecord.key) && oldRecord.managed && !keysOwnedByOthers.has(oldRecord.key)) {
      delete entries[oldRecord.key];
    }
  }

  if (Object.keys(next).length > 0) records[pluginName] = next;
  else delete records[pluginName];

  if (Object.keys(entries).length > 0) config[serversKey] = entries;
  else delete config[serversKey];

  const configChanged = migrated || JSON.stringify(entries) !== entriesBefore;
  const stateChanged = migrated || canonical(previous) !== canonical(next);

  if (!dryRun) {
    if (configChanged) writeJsonAtomic(configPath, config);
    if (stateChanged) {
      if (Object.keys(records).length > 0) state.mcp[configId] = records;
      else delete state.mcp[configId];
      writeJsonAtomic(getStatePath(), state);
    }
  }

  return {
    changed: configChanged || stateChanged,
    keys: Object.fromEntries(Object.entries(next).map(([s, a]) => [s, a.key]))
  };
}

/**
 * Remove a plugin's registrations from a provider config. Never throws:
 * uninstall must not fail because a user config is unreadable.
 */
function removePluginServers({ configPath, pluginName, label, serversKey = 'mcpServers', dryRun = false }) {
  if (!fs.existsSync(configPath)) {
    forgetPlugin(configPath, pluginName, { dryRun });
    return { changed: false, keys: {} };
  }
  try {
    return syncPluginServers({ configPath, pluginName, servers: {}, label, serversKey, dryRun });
  } catch (err) {
    console.warn(`[warn] ${label}: could not update ${configPath} during uninstall: ${err.message}`);
    return { changed: false, keys: {} };
  }
}

function forgetPlugin(configPath, pluginName, { dryRun = false } = {}) {
  let state;
  try { state = loadState({ dryRun }); } catch { return; }
  const configId = configIdFor(configPath);
  if (!isPlainObject(state.mcp[configId]) || !state.mcp[configId][pluginName]) return;
  delete state.mcp[configId][pluginName];
  if (Object.keys(state.mcp[configId]).length === 0) delete state.mcp[configId];
  if (!dryRun) writeJsonAtomic(getStatePath(), state);
}

/** Source key -> destination key for a plugin in a config (state file plus legacy markers). */
function getPluginMapping(configPath, pluginName) {
  const records = {};
  try {
    const state = loadState({ dryRun: true });
    Object.assign(records, state.mcp[configIdFor(configPath)] || {});
  } catch {}
  try {
    const config = readJsonObject(configPath, 'provider config', { dryRun: true });
    importLegacyOwnership(config, records);
  } catch {}
  const record = isPlainObject(records[pluginName]) ? records[pluginName] : {};
  return Object.fromEntries(Object.entries(record).map(([src, r]) => [src, r.key]));
}

/** Destination keys a plugin currently owns in a config. */
function getOwnedKeys(configPath, pluginName) {
  return Object.values(getPluginMapping(configPath, pluginName));
}

/**
 * Drop ownership records whose provider config was deleted or no longer contains
 * the recorded server keys (e.g. the user removed them by hand).
 */
function pruneStaleOwnership({ dryRun = false } = {}) {
  const statePath = getStatePath();
  if (!fs.existsSync(statePath)) return [];
  let state;
  try { state = loadState({ dryRun }); } catch { return []; }
  const actions = [];
  for (const [configId, records] of Object.entries(state.mcp)) {
    let config = null;
    try { config = fs.existsSync(configId) ? readJsonObject(configId, 'provider config', { dryRun: true }) : null; } catch { continue; }
    if (!config) {
      actions.push({ type: 'prune-state', path: configId });
      delete state.mcp[configId];
      continue;
    }
    const present = new Set([...Object.keys(config.mcpServers || {}), ...Object.keys(config.servers || {})]);
    for (const [plugin, record] of Object.entries(records)) {
      for (const [sourceKey, r] of Object.entries(record)) {
        if (!present.has(r.key)) {
          actions.push({ type: 'prune-state', path: `${configId} ${plugin}:${r.key}` });
          delete record[sourceKey];
        }
      }
      if (Object.keys(record).length === 0) delete records[plugin];
    }
    if (Object.keys(records).length === 0) delete state.mcp[configId];
  }
  if (actions.length > 0 && !dryRun) writeJsonAtomic(statePath, state);
  return actions;
}

/** Structural validation of the state file for `doctor`. Returns an error string or null. */
function validateState(state) {
  if (!isPlainObject(state)) return 'state must be a JSON object';
  if (state.mcp === undefined) return null;
  if (!isPlainObject(state.mcp)) return "'mcp' must be an object";
  for (const [configId, records] of Object.entries(state.mcp)) {
    if (!isPlainObject(records)) return `records for '${configId}' must be an object`;
    for (const [plugin, record] of Object.entries(records)) {
      if (!isPlainObject(record)) return `ownership record for '${plugin}' in '${configId}' must be an object`;
      for (const [sourceKey, r] of Object.entries(record)) {
        if (!isPlainObject(r) || typeof r.key !== 'string' || typeof r.managed !== 'boolean') {
          return `entry '${sourceKey}' for '${plugin}' in '${configId}' must be { key: string, managed: boolean }`;
        }
      }
    }
  }
  return null;
}

module.exports = {
  LEGACY_OWNERSHIP_KEYS,
  getStatePath,
  loadState,
  readServersSnippet,
  resolvePluginRoot,
  syncPluginServers,
  removePluginServers,
  getOwnedKeys,
  getPluginMapping,
  pruneStaleOwnership,
  validateState
};
