'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { validateEnvelope } = require('./handoff.js');
const { canonical, digest } = require('./safety-policy.js');
const { safeRelative } = require('./unicode-hygiene.js');
const INTERNALS = new WeakMap();
const APPLICATION_ID = 1095254594;
const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS metadata(version INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS tasks(task_id TEXT PRIMARY KEY,correlation_id TEXT NOT NULL,producer TEXT NOT NULL,consumer TEXT NOT NULL,dispatch_json TEXT NOT NULL,dispatch_hash TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN('pending','in_progress','completed','failed')),owner TEXT,fence INTEGER NOT NULL DEFAULT 0 CHECK(fence>=0),lease_until_ms INTEGER,result_json TEXT,result_hash TEXT);
  CREATE TABLE IF NOT EXISTS migrations(plan_id TEXT PRIMARY KEY,source_hash TEXT NOT NULL,backup_dir TEXT NOT NULL);`;
const SCHEMA_QUERY = 'SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name;';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTOR = /^[a-zA-Z0-9_.-]{1,64}:[a-zA-Z0-9_.-]{1,64}:[a-zA-Z0-9_.-]{1,64}$/;
const clock = '(SELECT now_ms FROM operation_clock)';
const text = value => `CAST(X'${Buffer.from(String(value), 'utf8').toString('hex')}' AS TEXT)`;
function error(code) { const e = new Error(`Blackboard: ${code}`); e.code = code; return e; }
function requireActor(value) { if (typeof value !== 'string' || !ACTOR.test(value)) throw error('INVALID_OWNER'); return value; }
function taskId(value) { if (typeof value !== 'string' || !UUID.test(value)) throw error('INVALID_TASK_ID'); return value.toLowerCase(); }
function fenceValue(value) { if (typeof value !== 'string' || !/^[1-9][0-9]{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) throw error('INVALID_FENCE'); return value; }
function leaseValue(value = 60000) { if (!Number.isSafeInteger(value) || value < 100 || value > 86400000) throw error('INVALID_LEASE'); return value; }
function rootAndDatabase({ projectRoot, dbPath }) {
  if (typeof projectRoot !== 'string' || !path.isAbsolute(projectRoot) || typeof dbPath !== 'string' || !path.isAbsolute(dbPath) || /[\x00-\x1f]/.test(dbPath)) throw error('ABSOLUTE_PROJECT_DB_REQUIRED');
  const root = fs.realpathSync(projectRoot), database = path.resolve(dbPath), rel = path.relative(root, database);
  if (!fs.statSync(root).isDirectory() || !rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw error('DB_PATH_ESCAPE');
  let current = root;
  for (const part of rel.split(path.sep)) {
    current = path.join(current, part);
    try { if (fs.lstatSync(current).isSymbolicLink()) throw error('DB_PATH_SYMLINK'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  return { root, database };
}
function adapter(sqliteBinary, timeoutMs = 5000) {
  if (typeof sqliteBinary !== 'string' || !path.isAbsolute(sqliteBinary) || !Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30000) throw error('BACKEND_UNAVAILABLE');
  try { if (!fs.statSync(sqliteBinary).isFile()) throw error('BACKEND_UNAVAILABLE'); } catch { throw error('BACKEND_UNAVAILABLE'); }
  const env = { LANG: 'C', LC_ALL: 'C' };
  if (process.platform === 'win32' && process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;
  const run = (database, sql) => {
    const result = spawnSync(sqliteBinary, ['-batch', '-bail', '-init', os.devNull, '-json', '-cmd', '.timeout 1000', database],
      { input: 'PRAGMA trusted_schema=OFF; ' + sql, encoding: 'utf8', shell: false, env, timeout: timeoutMs, maxBuffer: 2 * 1024 * 1024 });
    if (result.error || result.status !== 0) throw error(result.error?.code === 'ETIMEDOUT' ? 'BACKEND_TIMEOUT' : 'BACKEND_QUERY_FAILED');
    try { return result.stdout.trim() ? JSON.parse(result.stdout) : []; } catch { throw error('BACKEND_OUTPUT_INVALID'); }
  };
  const probe = run(':memory:', "CREATE TABLE probe(n INTEGER); INSERT INTO probe VALUES(0); UPDATE probe SET n=n+1 RETURNING sqlite_version() AS version, json_valid('{}') AS json_ok, unixepoch('subsec') AS clock;")[0];
  const version = probe?.version?.split('.').map(Number);
  if (!version || version.length !== 3 || version.some(n => !Number.isInteger(n)) || version[0] < 3 || (version[0] === 3 && version[1] < 42) || probe.json_ok !== 1 || !Number.isFinite(probe.clock)) throw error('BACKEND_UNSUPPORTED');
  run.capabilities = { available: true, backend: 'sqlite-cli', version: probe.version, minimum_version: '3.42.0', platform: process.platform, process_isolation: false };
  return run;
}
function probeBackend(options = {}) {
  try { return adapter(options.sqliteBinary, options.timeoutMs).capabilities; }
  catch (e) { return { available: false, backend: 'sqlite-cli', reason: e.code || 'BACKEND_UNAVAILABLE', platform: process.platform }; }
}
const columns = "task_id,correlation_id,producer,consumer,dispatch_json,status,owner,CAST(fence AS TEXT) AS fence,lease_until_ms,result_json";
function decoded(row) {
  if (!row) return null;
  const { dispatch_json, result_json, changed, ...rest } = row;
  return { ...rest, dispatch: JSON.parse(dispatch_json), result: result_json ? JSON.parse(result_json) : null };
}
function openBlackboard(options = {}) {
  const { root, database } = rootAndDatabase(options), run = adapter(options.sqliteBinary, options.timeoutMs);
  const directory = path.dirname(database);
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const dirStat = fs.statSync(directory);
  if (process.platform !== 'win32' && ((dirStat.mode & 0o077) || dirStat.uid !== process.getuid())) throw error('PRIVATE_DB_DIRECTORY_REQUIRED');
  if (!fs.existsSync(database)) { try { const fd = fs.openSync(database, 'wx', 0o600); fs.closeSync(fd); } catch (e) { if (e.code !== 'EEXIST') throw e; } }
  const stat = fs.lstatSync(database);
  if (!stat.isFile() || stat.isSymbolicLink() || (process.platform !== 'win32' && ((stat.mode & 0o077) || stat.uid !== process.getuid()))) throw error('PRIVATE_DB_REQUIRED');
  for (const suffix of ['-wal', '-shm', '-journal']) {
    try { const sidecar = fs.lstatSync(database + suffix); if (!sidecar.isFile() || sidecar.isSymbolicLink() || (process.platform !== 'win32' && ((sidecar.mode & 0o077) || sidecar.uid !== process.getuid()))) throw error('UNSAFE_DB_SIDECAR'); }
    catch (e) { if (e.code !== 'ENOENT') throw e; }
  }
  const sql = statement => run(database, `PRAGMA foreign_keys=ON; PRAGMA synchronous=FULL; ${statement}`);
  const transaction = statement => sql(`BEGIN IMMEDIATE; CREATE TEMP TABLE operation_clock(now_ms INTEGER); INSERT INTO operation_clock VALUES(CAST(ROUND(unixepoch('subsec')*1000) AS INTEGER)); ${statement} COMMIT;`);
  const tables = run(database, "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  const expectedSchema = run(':memory:', SCHEMA_SQL + SCHEMA_QUERY);
  if (tables.length) {
    const application = run(database, 'PRAGMA application_id;')[0]?.application_id;
    if (application !== APPLICATION_ID || tables.map(t => t.name).join(',') !== 'metadata,migrations,tasks') throw error('UNRECOGNIZED_DB');
    if (canonical(run(database, SCHEMA_QUERY)) !== canonical(expectedSchema)) throw error('UNRECOGNIZED_DB_SCHEMA');
    const prior = run(database, 'SELECT version FROM metadata;');
    if (prior.length !== 1 || prior[0].version !== 1) throw error('UNSUPPORTED_DB_VERSION');
  }
  run(database, 'PRAGMA journal_mode=WAL;');
  transaction(`PRAGMA application_id=${APPLICATION_ID}; ${SCHEMA_SQL} INSERT INTO metadata SELECT 1 WHERE NOT EXISTS(SELECT 1 FROM metadata); SELECT version FROM metadata;`);
  if (canonical(run(database, SCHEMA_QUERY)) !== canonical(expectedSchema)) throw error('UNRECOGNIZED_DB_SCHEMA');
  const versions = sql('SELECT version FROM metadata;');
  if (versions.length !== 1 || versions[0].version !== 1) throw error('UNSUPPORTED_DB_VERSION');
  const read = ({ taskId: id }) => { const row = sql(`SELECT ${columns} FROM tasks WHERE task_id=${text(taskId(id))};`)[0]; return row ? { ok: true, task: decoded(row) } : { ok: false, reason: 'NOT_FOUND' }; };
  const selection = id => `SELECT changes() AS changed,${columns} FROM tasks WHERE task_id=${text(id)};`;
  const outcome = (rows, reason) => rows[0]?.changed === 1 ? { ok: true, status: rows[0].status, ...decoded(rows[0]) } : { ok: false, reason: rows[0]?.status === 'completed' || rows[0]?.status === 'failed' ? 'DUPLICATE_RESULT' : rows.length ? reason : 'NOT_FOUND' };
  const enqueueSQL = envelope => `INSERT INTO tasks(task_id,correlation_id,producer,consumer,dispatch_json,dispatch_hash,status) VALUES(${text(envelope.task_id)},${text(envelope.correlation_id)},${text(envelope.producer)},${text(envelope.consumer)},${text(canonical(envelope))},${text(digest(envelope))},'pending') ON CONFLICT(task_id) DO NOTHING;`;
  function pending(envelope) { const valid = validateEnvelope(envelope, { projectRoot: root }); if (valid.kind !== 'task' || valid.status !== 'pending') throw error('PENDING_TASK_REQUIRED'); return valid; }
  function ownership(params) {
    const id = taskId(params.taskId), owner = requireActor(params.owner), fence = fenceValue(params.fence);
    return { id, owner, fence, where: `task_id=${text(id)} AND status='in_progress' AND consumer=${text(owner)} AND owner=${text(owner)} AND fence=${fence} AND lease_until_ms>${clock}` };
  }
  function finish(params, status) {
    const own = ownership(params), result = validateEnvelope(params.resultEnvelope, { projectRoot: root });
    if (result.kind !== 'result' || result.status !== status || result.task_id !== own.id || result.producer !== own.owner) return { ok: false, reason: 'IDENTITY_MISMATCH' };
    return outcome(transaction(`UPDATE tasks SET status=${text(status)},result_json=${text(canonical(result))},result_hash=${text(digest(result))},lease_until_ms=NULL WHERE ${own.where} AND correlation_id=${text(result.correlation_id)} AND producer=${text(result.consumer)} AND json_extract(dispatch_json,'$.created_at')<=${text(result.created_at)}; ${selection(own.id)}`), 'STALE_LEASE');
  }
  const board = {
    enqueue(envelope) {
      const valid = pending(envelope), rows = transaction(enqueueSQL(valid) + ` SELECT changes() AS changed,dispatch_hash FROM tasks WHERE task_id=${text(valid.task_id)};`);
      return rows[0]?.changed === 1 ? { ok: true, status: 'enqueued', task_id: valid.task_id } : rows[0]?.dispatch_hash === digest(valid) ? { ok: true, status: 'already_enqueued', task_id: valid.task_id } : { ok: false, reason: 'CONFLICT' };
    },
    claim({ taskId: id, owner, leaseMs }) {
      id = taskId(id); owner = requireActor(owner); leaseMs = leaseValue(leaseMs);
      const current = read({ taskId: id });
      if (current.ok) validateEnvelope(current.task.dispatch, { projectRoot: root });
      return outcome(transaction(`UPDATE tasks SET status='in_progress',owner=${text(owner)},fence=fence+1,lease_until_ms=${clock}+${leaseMs} WHERE task_id=${text(id)} AND consumer=${text(owner)} AND fence<9223372036854775807 AND (status='pending' OR (status='in_progress' AND lease_until_ms<=${clock})); ${selection(id)}`), 'LEASE_HELD');
    },
    heartbeat(params) { const own = ownership(params), leaseMs = leaseValue(params.leaseMs); return outcome(transaction(`UPDATE tasks SET lease_until_ms=${clock}+${leaseMs} WHERE ${own.where}; ${selection(own.id)}`), 'STALE_LEASE'); },
    complete(params) { return finish(params, 'completed'); }, fail(params) { return finish(params, 'failed'); }, read,
    list({ limit = 100, cursor, status } = {}) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw error('INVALID_PAGE');
      if (status !== undefined && !['pending','in_progress','completed','failed'].includes(status)) throw error('INVALID_STATUS');
      const after = cursor === undefined ? '' : taskId(cursor);
      const rows = sql(`SELECT ${columns} FROM tasks WHERE task_id>${text(after)}${status ? ' AND status=' + text(status) : ''} ORDER BY task_id LIMIT ${limit + 1};`);
      return { ok: true, tasks: rows.slice(0, limit).map(decoded), next_cursor: rows.length > limit ? rows[limit - 1].task_id : null };
    }
  };
  INTERNALS.set(board, {
    migration(plan, backupDir) {
      const existing = sql(`SELECT backup_dir FROM migrations WHERE plan_id=${text(plan.plan_id)};`)[0];
      if (existing) return { ok: true, status: 'already_applied', backup_dir: existing.backup_dir };
      const inserts = plan.imports.map(pending).map(enqueueSQL).join(' ');
      const guard = `CREATE TEMP TABLE migration_guard(ok INTEGER CHECK(ok=1)); INSERT INTO migration_guard SELECT CASE WHEN EXISTS(SELECT 1 FROM tasks WHERE task_id IN(${plan.imports.length ? plan.imports.map(e => text(e.task_id)).join(',') : "''"})) THEN 0 ELSE 1 END;`;
      try { transaction(`${guard} ${inserts} INSERT INTO migrations VALUES(${text(plan.plan_id)},${text(plan.source_hash)},${text(backupDir)});`); }
      catch (e) {
        const applied = sql(`SELECT backup_dir FROM migrations WHERE plan_id=${text(plan.plan_id)};`)[0];
        if (applied) return { ok: true, status: 'already_applied', backup_dir: applied.backup_dir };
        throw e;
      }
      return { ok: true, status: 'applied', imported: plan.imports.length, backup_dir: backupDir };
    },
    backup(destination) { rootAndDatabase({ projectRoot: root, dbPath: destination }); sql(`VACUUM INTO ${text(destination)};`); fs.chmodSync(destination, 0o600); if (run(destination, 'PRAGMA quick_check;')[0]?.quick_check !== 'ok') throw error('BACKUP_READBACK_FAILED'); },
    migrationRead(id) { return sql(`SELECT backup_dir FROM migrations WHERE plan_id=${text(id)};`)[0]; }
  });
  return board;
}
function legacyUuid(value) { const h = digest(value); return `${h.slice(0,8)}-${h.slice(8,12)}-8${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`; }
function readLegacy(root, relative) {
  if (!safeRelative(relative)) throw error('INVALID_LEGACY_FILE');
  const file = path.join(root, relative), stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024 || !fs.realpathSync(file).startsWith(root + path.sep)) throw error('INVALID_LEGACY_FILE');
  const fd = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0));
  try {
    const before = fs.fstatSync(fd);
    if (before.ino !== stat.ino || before.dev !== stat.dev || before.size > 1024 * 1024) throw error('LEGACY_SOURCE_CHANGED');
    const bytes = Buffer.alloc(before.size + 1); let count = 0, n;
    while (count < bytes.length && (n = fs.readSync(fd, bytes, count, bytes.length - count, null))) count += n;
    if (count !== before.size || fs.fstatSync(fd).mtimeMs !== before.mtimeMs) throw error('LEGACY_SOURCE_CHANGED');
    return bytes.subarray(0, count);
  } finally { fs.closeSync(fd); }
}
function planLegacyMigration(options = {}) {
  const { root, database } = rootAndDatabase(options), mapping = options.actorMapping;
  if (!mapping || Object.keys(mapping).sort().join(',') !== 'consumer,producer') throw error('INVALID_ACTOR_MAPPING');
  requireActor(mapping?.producer); requireActor(mapping?.consumer);
  const sources = [], imports = [], conflicts = [], seen = new Set(); let totalBytes = 0;
  for (const directory of ['inbox', 'active', 'completed']) {
    const base = path.join(root, '.context', directory);
    if (!fs.existsSync(base)) continue;
    if (fs.lstatSync(base).isSymbolicLink()) throw error('LEGACY_PATH_ESCAPE');
    for (const entry of fs.readdirSync(base, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
      if (!entry.isFile() || !entry.name.endsWith('.json') || sources.length >= 1000) throw error('INVALID_LEGACY_FILE');
      const relative = `.context/${directory}/${entry.name}`, bytes = readLegacy(root, relative);
      totalBytes += bytes.length;
      if (totalBytes > 16 * 1024 * 1024) throw error('MIGRATION_SIZE_LIMIT');
      let task; try { task = JSON.parse(bytes); } catch { throw error('INVALID_LEGACY_JSON'); }
      const keys = ['task_id','requirements','status','assigned_to','created_at','completed_at','result','priority','retries','max_retries'];
      if (!task || Object.keys(task).sort().join(',') !== keys.sort().join(',') || typeof task.task_id !== 'string' || !task.task_id ||
          typeof task.requirements !== 'string' || !task.requirements.trim() || !['pending','in_progress','completed','failed'].includes(task.status) ||
          !Number.isInteger(task.retries) || task.retries < 0 || !Number.isInteger(task.max_retries) || task.max_retries < task.retries || !['low','normal','high'].includes(task.priority) ||
          !(task.assigned_to === null || (typeof task.assigned_to === 'string' && task.assigned_to.length > 0 && task.assigned_to.length <= 256)) ||
          !(task.result === null || typeof task.result === 'string') ||
          typeof task.created_at !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(task.created_at) || !Number.isFinite(Date.parse(task.created_at)) || new Date(task.created_at).toISOString() !== task.created_at ||
          !((['pending','in_progress'].includes(task.status) && task.completed_at === null) || (['completed','failed'].includes(task.status) && typeof task.completed_at === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(task.completed_at) && Number.isFinite(Date.parse(task.completed_at)) && new Date(task.completed_at).toISOString() === task.completed_at && task.completed_at >= task.created_at))) throw error('INVALID_LEGACY_SCHEMA');
      const legacyIdentity = UUID.test(task.task_id) ? task.task_id.toLowerCase() : task.task_id;
      if (seen.has(legacyIdentity)) throw error('LEGACY_ID_CONFLICT'); seen.add(legacyIdentity);
      if ((directory === 'inbox') !== (task.status === 'pending') || (directory === 'active') !== (task.status === 'in_progress')) throw error('LEGACY_STATUS_CONFLICT');
      const source = { path: relative, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), legacy_id: task.task_id, status: task.status };
      sources.push(source);
      if (task.status === 'in_progress') conflicts.push({ legacy_id: task.task_id, reason: 'ACTIVE_OWNER_REQUIRES_RESOLUTION' });
      if (['pending','in_progress'].includes(task.status)) {
        const envelope = { schema_version: 1, kind: 'task', task_id: legacyUuid({ root, legacy: legacyIdentity }), correlation_id: legacyUuid({ root, correlation: legacyIdentity }), producer: mapping.producer, consumer: mapping.consumer,
          created_at: task.created_at, status: 'pending', input: { requirements: task.requirements, provenance: 'legacy-import-unverified' }, output: null, evidence: [] };
        imports.push(validateEnvelope(envelope, { projectRoot: root }));
      }
    }
  }
  const content = { version: 1, project_root: root, db_path: database, actor_mapping: mapping, sources, imports, conflicts, source_hash: digest(sources) };
  return { ...content, plan_id: digest(content) };
}
function applyLegacyMigration(options = {}) {
  if (options.legacyOwnerStopped !== true) throw error('LEGACY_OWNER_STOP_CONFIRMATION_REQUIRED');
  const plan = options.plan, current = planLegacyMigration({ ...options, actorMapping: plan?.actor_mapping });
  if (!plan || canonical(current) !== canonical(plan)) throw error('LEGACY_SOURCE_CHANGED');
  for (const conflict of plan.conflicts) if (options.resolutions?.[conflict.legacy_id] !== 'requeue') throw error('LEGACY_CONFLICT_RESOLUTION_REQUIRED');
  const board = openBlackboard(options), internals = INTERNALS.get(board), existing = internals.migrationRead(plan.plan_id);
  if (existing) return { ok: true, status: 'already_applied', backup_dir: existing.backup_dir };
  const backup = path.join(path.dirname(options.dbPath), 'backups', plan.plan_id + '-' + crypto.randomUUID());
  rootAndDatabase({ projectRoot: options.projectRoot, dbPath: backup });
  fs.mkdirSync(backup, { recursive: true, mode: 0o700 });
  for (const source of plan.sources) {
    const bytes = readLegacy(plan.project_root, source.path);
    if (crypto.createHash('sha256').update(bytes).digest('hex') !== source.sha256) throw error('LEGACY_SOURCE_CHANGED');
    const dest = path.join(backup, 'legacy', source.path); fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
    fs.writeFileSync(dest, bytes, { flag: 'wx', mode: 0o600 });
    if (crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex') !== source.sha256) throw error('BACKUP_READBACK_FAILED');
  }
  internals.backup(path.join(backup, 'before.db'));
  if (canonical(planLegacyMigration({ ...options, actorMapping: plan.actor_mapping })) !== canonical(plan)) throw error('LEGACY_SOURCE_CHANGED');
  const receipt = internals.migration(plan, backup);
  if (!internals.migrationRead(plan.plan_id)) throw error('MIGRATION_READBACK_FAILED');
  return receipt;
}
module.exports = { openBlackboard, probeBackend, planLegacyMigration, applyLegacyMigration };
