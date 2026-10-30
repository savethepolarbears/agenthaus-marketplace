'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn, spawnSync } = require('node:child_process');
const { openBlackboard, probeBackend, planLegacyMigration, applyLegacyMigration } = require('../src/blackboard.js');
const sqliteBinary = process.env.AGENTHAUS_SQLITE_BINARY || '/usr/bin/sqlite3';
// Gate fixtures on an independent installed-binary probe, never on the API under test.
const prerequisite = path.isAbsolute(sqliteBinary) ? spawnSync(sqliteBinary, ['-batch', '-bail', '-init', os.devNull, '-json', ':memory:'], {
  input: "SELECT sqlite_version() AS version, unixepoch('subsec') AS clock;", encoding: 'utf8', timeout: 5000, env: { LANG: 'C', LC_ALL: 'C' }
}) : { status: 1, stdout: '' };
let supported = false;
try { const p = JSON.parse(prerequisite.stdout)[0], v = p.version.split('.').map(Number); supported = prerequisite.status === 0 && (v[0] > 3 || (v[0] === 3 && v[1] >= 42)) && Number.isFinite(p.clock); } catch {}
function fixture(t) {
  const projectRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'blackboard-')));
  t.after(() => fs.rmSync(projectRoot, { recursive: true, force: true }));
  const options = { projectRoot, dbPath: path.join(projectRoot, '.agenthaus/blackboard/state.db'), sqliteBinary };
  const task = { schema_version: 1, kind: 'task', task_id: crypto.randomUUID(), correlation_id: crypto.randomUUID(), producer: 'node:fixture:dispatch',
    consumer: 'node:fixture:worker', created_at: new Date().toISOString(), status: 'pending', input: { requirements: 'fixture' }, output: null, evidence: [] };
  fs.writeFileSync(path.join(projectRoot, 'result.txt'), 'fixture');
  const result = owner => ({ ...task, kind: 'result', status: 'completed', producer: owner, consumer: task.producer, input: null, output: { fixture: true },
    created_at: new Date().toISOString(), evidence: [{ artifact_path: 'result.txt', sha256: crypto.createHash('sha256').update('fixture').digest('hex') }] });
  return { ...options, options, task, result };
}
test('missing or relative backend fails closed before state creation', t => {
  const f = fixture(t);
  for (const binary of ['sqlite3', path.join(f.projectRoot, 'absent')]) assert.throws(() => openBlackboard({ ...f.options, sqliteBinary: binary }));
  assert.equal(fs.existsSync(path.dirname(f.dbPath)), false);
});
test('backend capability probing is explicit and never initializes project state', { skip: !supported }, t => {
  const f = fixture(t);
  assert.equal(probeBackend({ sqliteBinary }).available, true);
  assert.equal(probeBackend({ sqliteBinary: 'sqlite3' }).available, false);
  assert.equal(fs.existsSync(path.dirname(f.dbPath)), false);
});
test('an unrelated SQLite database is rejected without adding blackboard tables', { skip: !supported }, t => {
  const f = fixture(t); fs.mkdirSync(path.dirname(f.dbPath), { recursive: true, mode: 0o700 });
  spawnSync(sqliteBinary, ['-batch', '-init', os.devNull, f.dbPath], { input: 'CREATE TABLE metadata(version INTEGER);INSERT INTO metadata VALUES(1);CREATE TABLE unrelated(value TEXT);' });
  fs.chmodSync(f.dbPath, 0o600);
  assert.throws(() => openBlackboard(f.options), /UNRECOGNIZED|VERSION/);
  const result = spawnSync(sqliteBinary, ['-batch', '-json', '-init', os.devNull, f.dbPath], { input: "SELECT name FROM sqlite_master WHERE name='tasks';", encoding: 'utf8' });
  assert.equal(result.stdout.trim(), '');
});
test('unexpected trigger, view, index or altered DDL rejects on reopen before mutations', { skip: !supported }, t => {
  for (const statement of [
    'CREATE TRIGGER unexpected AFTER INSERT ON tasks BEGIN UPDATE metadata SET version=2; END;',
    'CREATE VIEW unexpected AS SELECT * FROM tasks;',
    'CREATE INDEX unexpected ON tasks(status);',
    'ALTER TABLE tasks ADD COLUMN unexpected TEXT;'
  ]) {
    const f = fixture(t); openBlackboard(f.options);
    const added = spawnSync(sqliteBinary, ['-batch', '-init', os.devNull, f.dbPath], { input: statement, encoding: 'utf8' });
    assert.equal(added.status, 0, added.stderr);
    assert.throws(() => openBlackboard(f.options), /SCHEMA|UNRECOGNIZED/);
    const rows = spawnSync(sqliteBinary, ['-batch', '-json', '-init', os.devNull, f.dbPath], { input: 'SELECT version FROM metadata;', encoding: 'utf8' });
    assert.deepEqual(JSON.parse(rows.stdout), [{ version: 1 }]);
  }
});
test('default lease, fenced completion and durable duplicate rejection', { skip: !supported }, t => {
  const f = fixture(t), board = openBlackboard(f.options);
  assert.equal(board.enqueue(f.task).ok, true);
  assert.equal(board.enqueue(f.task).status, 'already_enqueued');
  assert.equal(board.claim({ taskId: f.task.task_id, owner: 'node:fixture:attacker' }).ok, false);
  const lease = board.claim({ taskId: f.task.task_id, owner: f.task.consumer });
  assert.equal(lease.ok, true); assert.equal(lease.fence, '1');
  assert.ok(lease.lease_until_ms > Date.now() + 58000);
  assert.equal(board.heartbeat({ taskId: f.task.task_id, owner: lease.owner, fence: lease.fence }).fence, '1');
  const params = { taskId: f.task.task_id, owner: lease.owner, fence: lease.fence, resultEnvelope: f.result(lease.owner) };
  assert.equal(board.complete(params).ok, true);
  assert.equal(openBlackboard(f.options).complete(params).reason, 'DUPLICATE_RESULT');
  assert.equal(board.read({ taskId: f.task.task_id }).task.status, 'completed');
});
test('claim rechecks input evidence and completion rejects a result older than dispatch', { skip: !supported }, t => {
  const f = fixture(t), board = openBlackboard(f.options);
  f.task.evidence = f.result('node:fixture:worker').evidence;
  board.enqueue(f.task);
  fs.writeFileSync(path.join(f.projectRoot, 'result.txt'), 'tampered');
  assert.throws(() => board.claim({ taskId: f.task.task_id, owner: f.task.consumer }), /digest/i);
  fs.writeFileSync(path.join(f.projectRoot, 'result.txt'), 'fixture');
  const lease = board.claim({ taskId: f.task.task_id, owner: f.task.consumer });
  const result = { ...f.result(lease.owner), created_at: '2020-01-01T00:00:00.000Z' };
  assert.equal(board.complete({ taskId: f.task.task_id, owner: lease.owner, fence: lease.fence, resultEnvelope: result }).ok, false);
  assert.equal(board.read({ taskId: f.task.task_id }).task.status, 'in_progress');
});
test('expired owners cannot heartbeat or complete; reclaim increases fencing', { skip: !supported }, async t => {
  const f = fixture(t), board = openBlackboard(f.options); board.enqueue(f.task);
  const first = board.claim({ taskId: f.task.task_id, owner: f.task.consumer, leaseMs: 150 });
  await new Promise(resolve => setTimeout(resolve, 220));
  assert.equal(board.heartbeat({ taskId: f.task.task_id, owner: first.owner, fence: first.fence }).ok, false);
  assert.equal(board.complete({ taskId: f.task.task_id, owner: first.owner, fence: first.fence, resultEnvelope: f.result(first.owner) }).ok, false);
  assert.equal(openBlackboard(f.options).claim({ taskId: f.task.task_id, owner: 'node:fixture:attacker' }).ok, false);
  const second = openBlackboard(f.options).claim({ taskId: f.task.task_id, owner: f.task.consumer });
  assert.equal(second.fence, '2');
  assert.equal(board.heartbeat({ taskId: f.task.task_id, owner: first.owner, fence: first.fence }).reason, 'STALE_LEASE');
  assert.equal(board.complete({ taskId: f.task.task_id, owner: second.owner, fence: second.fence, resultEnvelope: f.result(second.owner) }).ok, true);
});
test('real competing Node processes acquire exactly one lease', { skip: !supported, timeout: 15000 }, async t => {
  const f = fixture(t); openBlackboard(f.options).enqueue(f.task);
  const code = 'const b=require(process.argv[1]).openBlackboard(JSON.parse(process.argv[2]));console.log(JSON.stringify(b.claim(JSON.parse(process.argv[3]))));';
  const claim = owner => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['-e', code, require.resolve('../src/blackboard.js'), JSON.stringify(f.options), JSON.stringify({ taskId: f.task.task_id, owner })]);
    let out = ''; child.stdout.on('data', b => { out += b; }); child.on('error', reject); child.on('exit', code => code === 0 ? resolve(JSON.parse(out)) : reject(Error('child failed')));
  });
  const results = await Promise.all([claim(f.task.consumer), claim(f.task.consumer)]);
  assert.equal(results.filter(r => r.ok).length, 1);
  assert.equal(results.find(r => r.ok).fence, '1');
});
test('fencing remains exact above JavaScript safe integers and never wraps', { skip: !supported }, t => {
  const f = fixture(t), board = openBlackboard(f.options); board.enqueue(f.task);
  spawnSync(sqliteBinary, ['-batch', '-init', os.devNull, f.dbPath], { input: 'UPDATE tasks SET fence=9007199254740991;' });
  assert.equal(board.claim({ taskId: f.task.task_id, owner: 'node:fixture:worker' }).fence, '9007199254740992');
  spawnSync(sqliteBinary, ['-batch', '-init', os.devNull, f.dbPath], { input: "UPDATE tasks SET status='pending',fence=9223372036854775807;" });
  assert.equal(board.claim({ taskId: f.task.task_id, owner: 'node:fixture:worker' }).ok, false);
  assert.equal(board.read({ taskId: f.task.task_id }).task.fence, '9223372036854775807');
});
test('SIGKILL of a proven uncommitted writer rolls back and restart preserves queued task', { skip: !supported || process.platform === 'win32', timeout: 15000 }, async t => {
  const f = fixture(t), board = openBlackboard(f.options); board.enqueue(f.task);
  const holder = spawn(sqliteBinary, ['-batch', '-bail', '-init', os.devNull, f.dbPath]);
  t.after(() => holder.kill());
  holder.stdin.write("BEGIN IMMEDIATE; UPDATE tasks SET status='failed';\n");
  let locked = false;
  for (let i = 0; i < 30 && !locked; i++) {
    await new Promise(resolve => setTimeout(resolve, 15));
    const result = spawnSync(sqliteBinary, ['-batch', '-bail', '-init', os.devNull, '-cmd', '.timeout 1', f.dbPath], { input: 'BEGIN IMMEDIATE; ROLLBACK;', encoding: 'utf8' });
    locked = result.status !== 0;
  }
  assert.equal(locked, true);
  const exit = new Promise(resolve => holder.once('exit', resolve)); holder.kill('SIGKILL'); await exit;
  assert.equal(openBlackboard(f.options).read({ taskId: f.task.task_id }).task.status, 'pending');
});
test('a killed Node owner leaves a persisted lease that can be reclaimed only after expiry', { skip: !supported || process.platform === 'win32', timeout: 15000 }, async t => {
  const f = fixture(t); openBlackboard(f.options).enqueue(f.task);
  const code = 'const b=require(process.argv[1]).openBlackboard(JSON.parse(process.argv[2]));console.log(JSON.stringify(b.claim({taskId:process.argv[3],owner:"node:fixture:worker",leaseMs:300})));setInterval(()=>{},1000);';
  const child = spawn(process.execPath, ['-e', code, require.resolve('../src/blackboard.js'), JSON.stringify(f.options), f.task.task_id]);
  t.after(() => child.kill());
  let text = '';
  const lease = await new Promise((resolve, reject) => { child.on('error', reject); child.once('exit', () => { if (!text.includes('\n')) reject(Error('owner exited before claim')); }); child.stdout.on('data', bytes => { text += bytes; if (text.includes('\n')) resolve(JSON.parse(text)); }); });
  assert.equal(lease.ok, true);
  const exit = new Promise(resolve => child.once('exit', resolve)); child.kill('SIGKILL'); await exit;
  const reopened = openBlackboard(f.options);
  assert.equal(reopened.read({ taskId: f.task.task_id }).task.status, 'in_progress');
  await new Promise(resolve => setTimeout(resolve, 350));
  const reclaimed = reopened.claim({ taskId: f.task.task_id, owner: f.task.consumer });
  assert.equal(reclaimed.fence, '2');
  assert.equal(reopened.complete({ taskId: f.task.task_id, owner: lease.owner, fence: lease.fence, resultEnvelope: f.result(lease.owner) }).ok, false);
});
test('failure is fenced, terminal and independently observable after restart', { skip: !supported }, t => {
  const f = fixture(t), board = openBlackboard(f.options); board.enqueue(f.task);
  const lease = board.claim({ taskId: f.task.task_id, owner: 'node:fixture:worker' });
  const resultEnvelope = { ...f.result(lease.owner), status: 'failed', output: { error: 'fixture failure' }, evidence: [] };
  assert.equal(board.fail({ taskId: f.task.task_id, owner: lease.owner, fence: lease.fence, resultEnvelope }).ok, true);
  assert.equal(openBlackboard(f.options).read({ taskId: f.task.task_id }).task.status, 'failed');
  assert.equal(board.claim({ taskId: f.task.task_id, owner: 'node:fixture:worker' }).ok, false);
});
test('payload SQL text is data and the real backend receives a trusted init and restricted environment', { skip: !supported || process.platform === 'win32' }, t => {
  const f = fixture(t), board = openBlackboard(f.options);
  const attack = "x'); DROP TABLE tasks; --\n.shell echo unsafe\n";
  f.task.input.requirements = attack;
  assert.equal(board.enqueue(f.task).ok, true);
  assert.equal(board.read({ taskId: f.task.task_id }).task.dispatch.input.requirements, attack);
  const marker = path.join(f.projectRoot, 'backend-args.json'), wrapper = path.join(f.projectRoot, 'sqlite-wrapper');
  fs.writeFileSync(wrapper, `#!${process.execPath}\nconst fs=require('node:fs');fs.writeFileSync(${JSON.stringify(marker)},JSON.stringify({args:process.argv.slice(2),environment:Object.keys(process.env)}));const r=require('node:child_process').spawnSync(${JSON.stringify(sqliteBinary)},process.argv.slice(2),{input:fs.readFileSync(0),encoding:'utf8',env:process.env});process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');process.exitCode=r.status??1;`, { mode: 0o700 });
  assert.equal(openBlackboard({ ...f.options, sqliteBinary: wrapper }).read({ taskId: f.task.task_id }).ok, true);
  const observed = JSON.parse(fs.readFileSync(marker, 'utf8'));
  assert.equal(observed.args[observed.args.indexOf('-init') + 1], os.devNull);
  // macOS may inject this platform bookkeeping value when launching Node.
  assert.ok(observed.environment.every(name => ['LANG', 'LC_ALL', '__CF_USER_TEXT_ENCODING'].includes(name)));
  assert.equal(observed.environment.includes('HOME'), false);
  assert.equal(observed.environment.includes('NODE_OPTIONS'), false);
});
test('legacy dry-run is write-free, migration backed up and repeated apply idempotent', { skip: !supported }, t => {
  const f = fixture(t), inbox = path.join(f.projectRoot, '.context/inbox'); fs.mkdirSync(inbox, { recursive: true });
  const legacy = { task_id: 'old-task', requirements: 'legacy fixture', status: 'pending', assigned_to: null, created_at: f.task.created_at, completed_at: null, result: null, priority: 'normal', retries: 0, max_retries: 3 };
  fs.writeFileSync(path.join(inbox, 'old-task.json'), JSON.stringify(legacy));
  const actorMapping = { producer: 'node:fixture:dispatch', consumer: 'node:fixture:worker' };
  const plan = planLegacyMigration({ ...f.options, actorMapping });
  assert.equal(fs.existsSync(path.dirname(f.dbPath)), false);
  assert.deepEqual(planLegacyMigration({ ...f.options, actorMapping }), plan);
  assert.throws(() => applyLegacyMigration({ ...f.options, plan, resolutions: {}, legacyOwnerStopped: 'true' }), /owner/i);
  assert.equal(fs.existsSync(f.dbPath), false);
  const applied = applyLegacyMigration({ ...f.options, plan, resolutions: {}, legacyOwnerStopped: true });
  assert.equal(applied.status, 'applied'); assert.equal(fs.existsSync(applied.backup_dir), true);
  assert.equal(fs.readFileSync(path.join(applied.backup_dir, 'legacy/.context/inbox/old-task.json'), 'utf8'), JSON.stringify(legacy));
  assert.equal(applyLegacyMigration({ ...f.options, plan, resolutions: {}, legacyOwnerStopped: true }).status, 'already_applied');
  assert.equal(openBlackboard(f.options).list({}).tasks.length, 1);
});
test('legacy conflicting active ownership and changed source reject before task import', { skip: !supported }, t => {
  const f = fixture(t), active = path.join(f.projectRoot, '.context/active'); fs.mkdirSync(active, { recursive: true });
  const file = path.join(active, 'one.json');
  fs.writeFileSync(file, JSON.stringify({ task_id: 'one', requirements: 'legacy', status: 'in_progress', assigned_to: 'old', created_at: f.task.created_at, completed_at: null, result: null, priority: 'normal', retries: 0, max_retries: 3 }));
  const plan = planLegacyMigration({ ...f.options, actorMapping: { producer: 'node:fixture:dispatch', consumer: 'node:fixture:worker' } });
  assert.throws(() => applyLegacyMigration({ ...f.options, plan, resolutions: {}, legacyOwnerStopped: true }), /conflict|resolution/i);
  assert.equal(fs.existsSync(f.dbPath), false);
  fs.appendFileSync(file, ' ');
  assert.throws(() => applyLegacyMigration({ ...f.options, plan, resolutions: { one: 'requeue' }, legacyOwnerStopped: true }), /changed/i);
});
test('legacy UUID case variants cannot import the same logical identity twice', t => {
  const f = fixture(t), inbox = path.join(f.projectRoot, '.context/inbox'); fs.mkdirSync(inbox, { recursive: true });
  const id = crypto.randomUUID();
  for (const [name, task_id] of [['one', id], ['two', id.toUpperCase()]]) fs.writeFileSync(path.join(inbox, name + '.json'), JSON.stringify({
    task_id, requirements: 'fixture', status: 'pending', assigned_to: null, created_at: f.task.created_at, completed_at: null, result: null, priority: 'normal', retries: 0, max_retries: 3
  }));
  assert.throws(() => planLegacyMigration({ ...f.options, actorMapping: { producer: f.task.producer, consumer: f.task.consumer } }), /CONFLICT/);
  assert.equal(fs.existsSync(f.dbPath), false);
});
test('migration inventory has a bounded aggregate byte budget', t => {
  const f = fixture(t), inbox = path.join(f.projectRoot, '.context/inbox'); fs.mkdirSync(inbox, { recursive: true });
  for (let i = 0; i < 20; i++) fs.writeFileSync(path.join(inbox, i + '.json'), JSON.stringify({
    task_id: 'old-' + i, requirements: 'x'.repeat(900000), status: 'pending', assigned_to: null, created_at: f.task.created_at,
    completed_at: null, result: null, priority: 'normal', retries: 0, max_retries: 3
  }));
  assert.throws(() => planLegacyMigration({ ...f.options, actorMapping: { producer: f.task.producer, consumer: f.task.consumer } }), /SIZE_LIMIT/);
  assert.equal(fs.existsSync(f.dbPath), false);
});
