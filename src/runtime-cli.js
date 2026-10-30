'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { parseArgs } = require('node:util');
const { writeJsonAtomic } = require('./fs-utils.js');
const caps = require('./capabilities.js');
const FAMILIES = new Set(['skill', 'capabilities', 'permissions', 'lock', 'unicode', 'hook', 'task']);
const MIGRATION_PLAN_LIMIT = 4 * 1024 * 1024;
const output = value => process.stdout.write(JSON.stringify(value, null, 2) + '\n');
function readLimited(fd, limit) {
  const buffer = Buffer.alloc(limit + 1); let count = 0, read;
  while (count < buffer.length && (read = fs.readSync(fd, buffer, count, buffer.length - count, null))) count += read;
  if (count > limit) throw new Error('Input exceeds bounded size');
  const bytes = buffer.subarray(0, count), text = bytes.toString('utf8');
  if (!Buffer.from(text).equals(bytes)) throw new Error('Input is not valid UTF-8');
  return text;
}
function readTextFile(file, limit) {
  if (!file) throw new Error('Explicit input file required');
  const real = fs.realpathSync(file);
  const fd = fs.openSync(real, fs.constants.O_RDONLY | (fs.constants.O_NONBLOCK || 0) | (fs.constants.O_NOFOLLOW || 0));
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile() || stat.size > limit) throw new Error('Invalid bounded input file');
    return readLimited(fd, Math.min(limit, stat.size));
  } finally { fs.closeSync(fd); }
}
function readJsonFile(file, limit = 65536) {
  const text = readTextFile(file, limit);
  try { return JSON.parse(text); } catch { throw new Error('Invalid JSON input'); }
}
function pluginRoot(value) {
  if (typeof value !== 'string' || !value) throw new Error('An explicit --plugins-dir is required');
  const root = fs.realpathSync(path.resolve(value));
  if (!fs.statSync(root).isDirectory()) throw new Error('Plugin root must be a directory');
  return root;
}
function loadManifest(file) {
  if (typeof file !== 'string' || !file) throw new Error('Explicit --manifest required');
  return caps.validateCapabilities(readJsonFile(file, 16 * 1024 * 1024));
}
async function runRuntimeCli(args) {
  const { values, positionals } = parseArgs({ args, allowPositionals: true, options: {
    'plugins-dir': { type: 'string' }, output: { type: 'string' }, manifest: { type: 'string' },
    limit: { type: 'string' }, cursor: { type: 'string' }, skill: { type: 'string' },
    json: { type: 'boolean' }, help: { type: 'boolean', short: 'h' }, repository: { type: 'boolean' }, input: { type: 'string' },
    root: { type: 'string' }, 'lock-file': { type: 'string' }, exceptions: { type: 'string' }, installed: { type: 'boolean' },
    config: { type: 'string' }, claude: { type: 'boolean' }, db: { type: 'string' }, 'sqlite-binary': { type: 'string' },
    'task-id': { type: 'string' }, owner: { type: 'string' }, fence: { type: 'string' }, 'lease-ms': { type: 'string' },
    envelope: { type: 'string' }, result: { type: 'string' }, mapping: { type: 'string' }, plan: { type: 'string' },
    resolutions: { type: 'string' }, 'dry-run': { type: 'boolean' }, 'legacy-owner-stopped': { type: 'boolean' }
  } });
  const [family, action, identity] = positionals;
  if (values['dry-run'] && !(family === 'task' && action === 'migrate')) throw new Error('--dry-run is supported only for task migrate in these runtime commands; no action was performed');
  if (!values.help && family === 'task') {
    const runtime = require('./blackboard.js');
    if (action === 'capabilities') { output(runtime.probeBackend({ sqliteBinary: values['sqlite-binary'] })); return; }
    if (!values.root || !values.db) throw new Error('Explicit --root and --db required');
    const options = { projectRoot: fs.realpathSync(path.resolve(values.root)), dbPath: path.resolve(values.db), sqliteBinary: values['sqlite-binary'] };
    if (action === 'migrate') {
      if (values['dry-run']) {
        const plan = runtime.planLegacyMigration({ ...options, actorMapping: readJsonFile(values.mapping) });
        if (Buffer.byteLength(JSON.stringify(plan, null, 2) + '\n') > MIGRATION_PLAN_LIMIT) throw new Error('Migration plan exceeds the 4 MiB CLI limit; no preview or runtime state was written');
        if (values.output) {
          const destination = path.resolve(values.output);
          // A preview artifact must never become a database, journal or legacy input.
          for (let ancestor = destination; ; ancestor = path.dirname(ancestor)) {
            try { if (fs.lstatSync(ancestor).isSymbolicLink()) throw new Error('Migration plan output cannot use symlinks'); }
            catch (error) { if (error.code !== 'ENOENT') throw error; }
            if (path.dirname(ancestor) === ancestor) break;
          }
          const comparable = value => value.normalize('NFC').toLowerCase();
          const legacy = comparable(path.join(options.projectRoot, '.context'));
          const candidate = comparable(destination);
          if ([options.dbPath, ...['-wal', '-shm', '-journal'].map(suffix => options.dbPath + suffix)].map(comparable).includes(candidate) || candidate === legacy || candidate.startsWith(legacy + path.sep)) throw new Error('Migration plan output conflicts with runtime state');
          if (fs.existsSync(destination)) throw new Error('Migration plan output already exists');
          writeJsonAtomic(destination, plan, { backup: false });
        }
        output(plan); return;
      }
      if (values['legacy-owner-stopped'] !== true) throw new Error('Explicit --legacy-owner-stopped confirmation required');
      const result = runtime.applyLegacyMigration({ ...options, plan: readJsonFile(values.plan, MIGRATION_PLAN_LIMIT), resolutions: values.resolutions ? readJsonFile(values.resolutions) : {}, legacyOwnerStopped: true });
      output(result); if (!result.ok) process.exitCode = 1; return;
    }
    if (!['enqueue', 'claim', 'heartbeat', 'complete', 'fail', 'read', 'list'].includes(action)) throw new Error('Unknown task action');
    let envelope;
    if (action === 'enqueue') {
      envelope = readJsonFile(values.envelope, 1024 * 1024);
      require('./handoff.js').validateEnvelope(envelope, { projectRoot: options.projectRoot });
      if (envelope.kind !== 'task' || envelope.status !== 'pending') throw new Error('Enqueue requires a pending task envelope');
    } else if (!fs.existsSync(options.dbPath)) throw new Error('Blackboard is not initialized');
    const params = { taskId: values['task-id'], owner: values.owner, fence: values.fence };
    if (values['lease-ms'] !== undefined) params.leaseMs = Number(values['lease-ms']);
    if (action === 'complete' || action === 'fail') params.resultEnvelope = readJsonFile(values.result, 1024 * 1024);
    const board = runtime.openBlackboard(options);
    const result = action === 'enqueue' ? board.enqueue(envelope) : action === 'list' ? board.list({ limit: values.limit === undefined ? 20 : Number(values.limit), cursor: values.cursor }) : board[action](params);
    if (action === 'list' && result.ok) output({ ...result, tasks: result.tasks.map(({ task_id, status, owner, fence, lease_until_ms }) => ({ task_id, status, owner, fence, lease_until_ms })) });
    else output(result);
    if (!result.ok) process.exitCode = 1; return;
  }
  if (!values.help && family === 'hook') {
    const runtime = require('./hook-runtime.js');
    if (action === 'capabilities') { output(runtime.getIsolationCapabilities()); return; }
    if (action !== 'run') throw new Error('Expected hook run or capabilities');
    const config = readJsonFile(values.config);
    let input = '';
    if (values.input) {
      input = readTextFile(values.input, 4 * 1024 * 1024);
    } else if (!process.stdin.isTTY) input = readLimited(0, 4 * 1024 * 1024);
    const result = await runtime.runHook(config, { input });
    if (values.claude) {
      const adapted = runtime.adaptClaudeResult(config.event, result);
      process.stdout.write(adapted.stdout); process.stderr.write(adapted.stderr); process.exitCode = adapted.exitCode;
    } else { output(result); if (result.status !== 'allowed') process.exitCode = 1; }
    return;
  }
  if (!values.help && (family === 'lock' || family === 'unicode')) {
    if (!values.root) throw new Error('Explicit --root required');
    const root = fs.realpathSync(path.resolve(values.root));
    let exceptions = [];
    if (values.exceptions) {
      exceptions = readJsonFile(values.exceptions);
    }
    if (family === 'unicode') {
      const result = require('./unicode-hygiene.js').scanUnicode(root, { exceptions });
      output(result); if (!result.ok) process.exitCode = 1; return;
    }
    const integrity = require('./integrity.js');
    if (action === 'renew') {
      const lock = integrity.renewContentLock(root, { lockFile: values['lock-file'] ? path.resolve(values['lock-file']) : undefined, unicodeExceptions: exceptions });
      output({ ok: true, plugin: lock.plugin, files: lock.files.length, tree_sha256: lock.tree_sha256 }); return;
    }
    if (action && action !== 'verify') throw new Error('Expected lock renew or verify');
    if (values.exceptions) throw new Error('Verification uses reviewed lock exceptions; explicit renewal is required to change them');
    const result = integrity.verifyContentLock(root, values['lock-file'] ? path.resolve(values['lock-file']) : undefined, { installed: values.installed === true });
    output({ ok: result.ok, errors: result.errors, tree_sha256: result.snapshot?.tree_sha256, files: result.snapshot?.files.length });
    if (!result.ok) process.exitCode = 1; return;
  }
  if (values.help) {
    const help = {
      hook: 'agenthaus hook capabilities\nagenthaus hook run --config <trusted-json> [--input <file>] [--claude]\n',
      lock: 'agenthaus lock verify|renew --root <plugin> [--lock-file <file>]\nRenewal is explicit. Verification never changes the lock.\n',
      unicode: 'agenthaus unicode --root <plugin> [--exceptions <reviewed-json>]\n',
      task: 'agenthaus task capabilities --sqlite-binary <absolute-cli>\nagenthaus task enqueue|claim|heartbeat|complete|fail|read|list --root <project> --db <contained-file> --sqlite-binary <absolute-cli> [--envelope <json>] [--task-id <uuid>] [--owner <runtime:project:actor>] [--fence <token>]\nagenthaus task migrate --dry-run --root <project> --db <file> --mapping <json> [--output <plan>]\nagenthaus task migrate --root <project> --db <file> --sqlite-binary <absolute-cli> --plan <json> --legacy-owner-stopped [--resolutions <json>]\n'
    };
    process.stdout.write(help[family] || 'agenthaus skill read <plugin>/<skill> --plugins-dir <root> [--manifest <file>] [--json]\nagenthaus skill validate --plugins-dir <root>\nagenthaus permissions <plugin> --plugins-dir <root> [--skill <name>]\nagenthaus capabilities build|benchmark|instructions --plugins-dir <root> [--output <file>]\nagenthaus capabilities page --manifest <file> [--limit 10] [--cursor <cursor>]\n');
    return;
  }
  if (family === 'permissions') {
    const root = pluginRoot(values['plugins-dir']);
    if (!/^[a-z0-9-]+$/.test(action || '')) throw new Error('Valid plugin identity required');
    const directory = path.join(root, action);
    if (!fs.existsSync(path.join(directory, '.claude-plugin', 'plugin.json'))) throw new Error('Plugin not found');
    output(require('./skill-metadata.js').inspectPermissions(directory, values.skill ? { skill: values.skill } : {})); return;
  }
  if (family === 'skill') {
    const root = pluginRoot(values['plugins-dir']);
    if (action === 'validate') { const skills = require('./skill-metadata.js').listSkills(root); output({ passed: true, skills: skills.length }); return; }
    if (action !== 'read') throw new Error('Expected skill read or validate');
    const manifest = values.manifest ? loadManifest(values.manifest) : caps.buildCapabilities({ pluginsDir: root });
    const skill = caps.readSkill(manifest, identity, { pluginsDir: root });
    if (values.json) output(skill); else process.stdout.write(skill.content); return;
  }
  if (family !== 'capabilities') throw new Error('Unknown runtime command');
  if (action === 'page') {
    const limit = values.limit === undefined ? 10 : Number(values.limit);
    output(caps.pageCapabilities(loadManifest(values.manifest), { limit, cursor: values.cursor })); return;
  }
  const root = pluginRoot(values['plugins-dir']);
  if (action === 'instructions') {
    const source = values.input ? readTextFile(values.input, values.repository ? 6144 : 2048) : '';
    const reference = 'Discover skills with `agenthaus capabilities page --manifest .agenthaus/capabilities.json --limit 5`.\nRead a selected skill using `agenthaus skill read plugin/skill --plugins-dir <explicit-root>`. Permission declarations do not enforce access.';
    const text = caps.updateDiscoveryRegion(source, reference, { maxBytes: values.repository ? 6144 : 2048 });
    // Emit only: applying a provider instruction change is a separate explicit operation.
    process.stdout.write(text); return;
  }
  const manifest = caps.buildCapabilities({ pluginsDir: root });
  if (action === 'benchmark') { output(caps.benchmarkContext(manifest, { pluginsDir: root })); return; }
  if (action !== 'build') throw new Error('Expected capabilities build, page, benchmark or instructions');
  const destination = path.resolve(values.output || '.agenthaus/capabilities.json');
  if (fs.existsSync(destination)) loadManifest(destination); // Preserve unrelated existing content.
  writeJsonAtomic(destination, manifest);
  output({ passed: true, skills: manifest.entries.length, manifest_sha256: manifest.manifest_sha256, output: destination });
}
module.exports = { FAMILIES, runRuntimeCli };
