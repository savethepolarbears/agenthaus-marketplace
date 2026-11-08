/**
 * Guards the gog-based plugins against gogcli command drift.
 *
 * Every `gog ...` invocation shown in a code span or fenced code block is
 * resolved against tests/fixtures/gogcli-commands.json (a snapshot of
 * gogcli's generated docs/commands reference; regenerate it with
 * scripts/snapshot-gogcli.js). The test fails when a documented invocation
 * names a subcommand or flag that gogcli does not have, or passes the wrong
 * number of positional arguments.
 *
 * It also checks that the hook's guard table (hooks/guarded-commands.json)
 * matches the snapshot, and runs gog-workspace's hooks (hooks/scripts/
 * gog-guard.py): PreToolUse must ask before every send, share and delete
 * subcommand, however the command is written, and PostToolUse must log
 * only gog commands.
 */
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT = require('./fixtures/gogcli-commands.json');
const SCANNED_PLUGINS = ['gog-workspace', 'task-commander', 'qa-droid', 'knowledge-synapse'];

// ---------------------------------------------------------------- snapshot --

/** children[parentKey] = Map(nameOrAlias -> canonical segment name) */
function buildTree(commands) {
  const children = new Map();
  for (const [key, cmd] of Object.entries(commands)) {
    const segs = key ? key.split(' ') : [];
    if (!segs.length) continue;
    const parent = segs.slice(0, -1).join(' ');
    const name = segs[segs.length - 1];
    if (!children.has(parent)) children.set(parent, new Map());
    const map = children.get(parent);
    map.set(name, name);
    for (const alias of cmd.aliases) if (!map.has(alias)) map.set(alias, name);
  }
  return children;
}
const TREE = buildTree(SNAPSHOT.commands);

// ------------------------------------------------------------- extraction --

/** Shell-ish tokenizer: keeps quoted strings together, stops at operators. */
function tokenize(cmd) {
  const tokens = [];
  let cur = '';
  let quote = null;
  let started = false;
  let afterQuote = false;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
        afterQuote = true;
      } else cur += ch;
      continue;
    }
    if (ch === '#' && afterQuote) break; // comment glued to a quoted arg: 'x'# note
    afterQuote = false;
    if (ch === "'" || ch === '"') {
      quote = ch;
      started = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (started) tokens.push(cur);
      cur = '';
      started = false;
      continue;
    }
    if (ch === '#' && !started) break; // comment
    if ('|;&>)'.includes(ch) && !started) break; // pipeline, redirect, chain
    cur += ch;
    started = true;
  }
  if (started) tokens.push(cur);
  return tokens;
}

/** Yield {file, line, text} for every gog invocation inside code. */
function* invocations(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    const snippets = inFence ? [line] : [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    for (const snip of snippets) {
      for (const m of snip.matchAll(/(?:^|&&|\|\||[;|(]|\$\()\s*(gog\s+[a-z-][^;&|]*)/g)) {
        yield { file: path.relative(ROOT, file), line: i + 1, text: m[1].trim(), mention: !inFence };
      }
    }
  }
}

function markdownFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.git')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFiles(full));
    else if (/\.(md|mdc)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// --------------------------------------------------------------- checking --

/** Returns a list of problems for one invocation (empty when valid). */
/**
 * Parse one flag token the way kong does. A single-dash token longer than two
 * characters is a bundle: boolean short flags (`-jv`), optionally ending in a
 * value flag that takes the rest of the token (`-awork@x`) or the next word
 * (`-ja work@x`). Returns { flags, takesNext, unknown }.
 */
function parseFlagToken(tok, known, bools) {
  if (tok.startsWith('--') || tok.length <= 2 || tok.includes('=')) {
    const flag = tok.split('=')[0];
    if (!known.has(flag)) return { flags: [flag], takesNext: false, unknown: flag };
    return { flags: [flag], takesNext: !tok.includes('=') && !bools.has(flag), unknown: null };
  }
  const flags = [];
  for (let k = 1; k < tok.length; k++) {
    const flag = `-${tok[k]}`;
    if (!known.has(flag)) return { flags, takesNext: false, unknown: flag };
    flags.push(flag);
    if (!bools.has(flag)) return { flags, takesNext: k === tok.length - 1, unknown: null };
  }
  return { flags, takesNext: false, unknown: null };
}

function check(text, { mention = false } = {}) {
  const tokens = tokenize(text).slice(1); // drop "gog"
  const problems = [];
  const segs = [];
  let i = 0;
  // Global flags may precede the subcommand path (e.g. `gog --json gmail search`).
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.startsWith('-')) {
      const parsed = parseFlagToken(tok, new Set(SNAPSHOT.globalFlags), new Set(SNAPSHOT.globalBoolFlags));
      if (parsed.unknown) break;
      if (!parsed.takesNext) {
        i++;
        continue;
      }
      const value = tokens[i + 1];
      if (value === undefined || /^--?[A-Za-z]/.test(value)) {
        return [`global flag ${parsed.flags[parsed.flags.length - 1]} needs a value`];
      }
      i += 2;
      continue;
    }
    const map = TREE.get(segs.join(' '));
    const canonical = map && map.get(tok);
    if (!canonical) break;
    segs.push(canonical);
    i++;
  }
  const key = segs.join(' ');
  const cmd = SNAPSHOT.commands[key];
  if (!segs.length || !cmd) {
    return [`unknown gog command "${tokens.slice(0, 2).join(' ')}"`];
  }
  const rest = tokens.slice(i);
  const hasChildren = TREE.has(key);
  const known = new Set([...SNAPSHOT.globalFlags, ...cmd.flags]);
  const bools = new Set([...SNAPSHOT.globalBoolFlags, ...cmd.boolFlags]);

  // An inline code span naming a command with no arguments (`gog contacts search`)
  // is a prose mention; fenced examples are always checked in full.
  if (mention && rest.length === 0) return [];
  if (hasChildren && cmd.positionals.length === 0) {
    if (rest.every((t) => t === '--help' || t === '-h')) return [];
    if (!rest[0].startsWith('-')) return [`"gog ${key}" has no subcommand "${rest[0]}"`];
    return [`"gog ${key}" is a command group; name a subcommand (${[...TREE.get(key).values()].filter((v, n, a) => a.indexOf(v) === n).join(', ')})`];
  }

  const positionals = [];
  const seenFlags = new Set();
  for (let j = 0; j < rest.length; j++) {
    const tok = rest[j];
    if (tok === '...' || tok === '…') continue;
    if (/^--?[A-Za-z]/.test(tok)) {
      const parsed = parseFlagToken(tok, known, bools);
      if (parsed.unknown) problems.push(`"gog ${key}" has no flag ${parsed.unknown}`);
      if (!parsed.takesNext) {
        parsed.flags.forEach((f) => seenFlags.add(f));
        continue;
      }
      const flag = parsed.flags[parsed.flags.length - 1];
      const value = rest[j + 1];
      if (value === undefined || /^--?[A-Za-z]/.test(value)) {
        problems.push(`"gog ${key}" flag ${flag} needs a value`);
        continue;
      }
      parsed.flags.forEach((f) => seenFlags.add(f));
      j++; // consume the flag value
      continue;
    }
    positionals.push(tok);
  }
  for (const flag of cmd.requiredFlags) {
    if (!seenFlags.has(flag)) problems.push(`"gog ${key}" requires ${flag}`);
  }
  const required = cmd.positionals.filter((p) => p.required).length;
  const variadic = cmd.positionals.some((p) => p.variadic);
  if (positionals.length < required) {
    const names = cmd.positionals.map((p) => (p.required ? `<${p.name}>` : `[<${p.name}>]`)).join(' ');
    problems.push(`"gog ${key}" needs ${names}, got ${positionals.length} positional(s)`);
  } else if (!variadic && positionals.length > cmd.positionals.length) {
    problems.push(
      `"gog ${key}" takes ${cmd.positionals.length} positional(s), got ${positionals.length}: ${positionals.join(' ')}`,
    );
  }
  return problems;
}

// ------------------------------------------------------------------ tests --

test('snapshot fixture is well formed', () => {
  assert.match(SNAPSHOT.commit, /^[0-9a-f]{40}$/);
  for (const k of ['gmail send', 'gmail drafts create', 'calendar events', 'calendar create', 'drive download']) {
    assert.ok(SNAPSHOT.commands[k], `snapshot is missing "${k}"`);
  }
});

test('checker accepts current forms and rejects stale ones', () => {
  const ok = [
    "gog calendar events primary --from 2026-03-01 --days 7",
    "gog calendar create primary --summary 'Sync' --from 2026-03-20T14:00:00Z --to 2026-03-20T15:00:00Z",
    "gog gmail drafts create --to a@b.com --subject 'Hi' --body 'Hello'",
    'gog drive download <file_id> --format pdf --out <path>',
    "gog --json gmail search 'is:unread' --max 10",
    "gog -a work@example.com gmail search 'x'",
    "gog gmail trash -q 'older_than:1y' --max 50",
    'gog -jv gmail search x',
    'gog -ja work@example.com gmail search x',
    'gog -awork@example.com gmail search x',
    "gog gmail trash -jq 'older_than:1y'",
  ];
  const bad = [
    'gog calendar list --from 2026-03-01 --to 2026-03-31 --calendar work',
    "gog calendar create 'Sync' --start x --end y",
    "gog gmail draft a@b.com --subject 'Hi' --body 'Hello'",
    'gog drive export <id> --format pdf --out x.pdf',
    "gog gmail send a@b.com --subject 'Hi'",
    'gog forms create',
    'gog auth add',
    'gog drive download',
    'gog drive ls -Z',
    'gog -jZ gmail search x',
    'gog gmail search x -ja',
    'gog forms create --title',
    'gog gmail send --to --subject x',
    'gog --account --json gmail search x',
  ];
  for (const t of ok) assert.deepEqual(check(t), [], t);
  for (const t of bad) assert.notDeepEqual(check(t), [], t);
  // Prose mentions in inline code may name a command without its arguments.
  assert.deepEqual(check('gog contacts search', { mention: true }), []);
});

test('every documented gog invocation matches gogcli', () => {
  const failures = [];
  let count = 0;
  for (const plugin of SCANNED_PLUGINS) {
    for (const file of markdownFiles(path.join(ROOT, 'plugins', plugin))) {
      for (const inv of invocations(file)) {
        count++;
        for (const p of check(inv.text, { mention: inv.mention })) failures.push(`${inv.file}:${inv.line}  ${p}\n    ${inv.text}`);
      }
    }
  }
  assert.ok(count > 50, `expected to find gog invocations, found ${count}`);
  assert.equal(failures.length, 0, `${failures.length} stale gog invocation(s):\n${failures.join('\n')}`);
});

test('hook guard table is generated from the snapshot', () => {
  const { buildGuard } = require('../scripts/snapshot-gogcli.js');
  const committed = require('../plugins/gog-workspace/hooks/guarded-commands.json');
  assert.deepEqual(
    committed,
    buildGuard(SNAPSHOT),
    'plugins/gog-workspace/hooks/guarded-commands.json is stale: run node scripts/snapshot-gogcli.js --guard-only',
  );
});

test('gog-workspace PreToolUse hook asks before send and delete subcommands', (t) => {
  if (spawnSync('python3', ['--version']).status !== 0) {
    t.skip('python3 not installed');
    return;
  }
  const hooks = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/gog-workspace/hooks/hooks.json'), 'utf8'));
  const cmd = hooks.hooks.PreToolUse[0].hooks[0].command;
  const env = { ...process.env, CLAUDE_PLUGIN_ROOT: path.join(ROOT, 'plugins/gog-workspace') };
  const run = (command) =>
    spawnSync('bash', ['-c', cmd], { input: JSON.stringify({ tool_input: { command } }), encoding: 'utf8', env })
      .stdout;

  const asks = [
    'gog gmail send --to a@b.com --subject x --body y',
    'gog send --to a@b.com --subject x',
    'gog mail drafts send d1',
    'gog gmail reply m1 --body ok',
    'gog gmail forward m1 --to a@b.com',
    'gog gmail trash m1',
    'gog gmail batch delete m1 m2',
    'gog drive delete f1',
    'gog drv rm f1',
    'gog drive share f1 --to anyone --role reader',
    'cd /tmp && gog calendar delete primary e1',
    'gog cal rm primary e1',
    'gog tasks delete l1 t1',
    'gog tasks clear l1',
    'gog chat messages send spaces/AAA --text hi',
    'gog chat dm send a@b.com --text hi',
    'gog sheets clear s1 A1:B2',
    'gog sheets delete-tab s1 Old',
    'gog contacts delete people/c1',
    'gog keep delete n1',
    'gog docs delete d1',
    'gog admin users delete a@b.com',
    'gog --account work@x.com gmail send --to a@b.com',
    'gog -j gmail drafts send d1',
    'gog gmail settings forwarding create fwd@x.com',
    'gog docs comments delete d1 c1',
    'GOG_ACCOUNT=w@x.com gog drive share f1 --to anyone --role reader',
    'env GOG_ACCOUNT=x gog gmail send --to a@b.com',
    "bash -c 'gog drive delete f1'",
    '/opt/homebrew/bin/gog drv rm f1',
    'gog gmail --account x send --to a@b.com',
    'x=$(gog chat dm send a@b.com --text hi)',
    'ls\ngog tasks clear l1',
    'gog drive bulk remove-public --parent f1',
    "gog gmail send --to a@b.com --body 'unterminated",
    'if gog drive delete f1; then echo ok; fi',
    '! gog gmail send --to a@b.com',
    'while gog tasks clear l1; do sleep 1; done',
    'timeout 30s gog drive delete f1',
    "bash -lc 'gog drive delete f1'",
    'sudo -u alice gog drive delete f1',
    "ssh host 'gog gmail send --to a@b.com'",
    'xargs -n1 gog drive delete < ids.txt',
    // Deliberately conservative: text that names a guarded command also asks.
    'echo gog gmail send',
    "grep -r 'gog gmail send' docs/",
    '$(command -v gog) drive delete f1',
    '`which gog` gmail send --to a@b.com',
    'G=gog; $G drive delete f1',
    'gog keep --impersonate alice@example.com delete n1',
    'gog gmail --account work@x.com --gmail-no-send send --to a@b.com',
    'gog -awork@example.com drive delete f1',
    'gog -jv drive delete f1',
    'gog -ja work@example.com drive delete f1',
    'gog --made-up-option drive delete f1',
    'g""og drive delete f1',
    'g\\og drive delete f1',
    "'g'og drive delete f1",
    'go$X""g drive delete f1',
    "bash -lc 'g\"\"og gmail send --to a@b.com'",
    'gog classroom courses leave c1',
    'gog class courses unenroll c1',
    'gog drive \\\ndelete f1',
    'gog \\\r\n  gmail send --to a@b.com',
  ];
  const silent = [
    "gog gmail search 'is:unread' --max 10",
    'gog gmail drafts create --to a@b.com --subject x --body y',
    'gog drive download f1 --format pdf --out f.pdf',
    'gog calendar events primary --from 2026-01-01 --days 1',
    'gog chat messages list spaces/AAA',
    'gog gmail drafts reply m1 --body-file draft.txt',
    'gog gmail labels modify t1 --remove INBOX',
    "gog gmail search 'subject:delete newer_than:7d'",
    'gog drive ls --parent root',
    'gog gmail search delete',
    'gog drive search remove',
    "grep -r 'gog gmail search' docs/",
    'echo gog',
  ];
  for (const c of asks) assert.match(run(c), /"permissionDecision": "ask"/, `should ask: ${c}`);
  for (const c of silent) assert.equal(run(c), '', `should not ask: ${c}`);
});

test('gog-workspace PreToolUse hook still asks without python3', (t) => {
  if (process.platform === 'win32') return t.skip('bash hooks');
  const hooks = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/gog-workspace/hooks/hooks.json'), 'utf8'));
  const cmd = hooks.hooks.PreToolUse[0].hooks[0].command;
  const bin = fs.mkdtempSync(path.join(require('os').tmpdir(), 'no-python-'));
  t.after(() => fs.rmSync(bin, { recursive: true, force: true }));
  for (const tool of ['bash', 'cat', 'grep', 'printf']) {
    const where = spawnSync('bash', ['-c', `command -v ${tool}`], { encoding: 'utf8' }).stdout.trim();
    if (where) fs.symlinkSync(where, path.join(bin, tool));
  }
  const run = (command) =>
    spawnSync(path.join(bin, 'bash'), ['-c', cmd], {
      input: JSON.stringify({ tool_input: { command } }),
      encoding: 'utf8',
      env: { PATH: bin, CLAUDE_PLUGIN_ROOT: path.join(ROOT, 'plugins/gog-workspace') },
    }).stdout;
  for (const c of ['gog drive delete f1', 'g""og drive delete f1', 'g\\og gmail send --to a@b.com']) {
    assert.match(run(c), /"permissionDecision": "ask"/, `should ask without python3: ${c}`);
  }
  assert.equal(run('ls -la'), '');
});

test('gog-workspace PostToolUse hook logs gog commands only', (t) => {
  if (spawnSync('python3', ['--version']).status !== 0) {
    t.skip('python3 not installed');
    return;
  }
  const hooks = JSON.parse(fs.readFileSync(path.join(ROOT, 'plugins/gog-workspace/hooks/hooks.json'), 'utf8'));
  const cmd = hooks.hooks.PostToolUse[0].hooks[0].command;
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gog-audit-'));
  const env = { ...process.env, CLAUDE_PLUGIN_ROOT: path.join(ROOT, 'plugins/gog-workspace'), CLAUDE_PROJECT_DIR: dir };
  const run = (command) =>
    spawnSync('bash', ['-c', cmd], { input: JSON.stringify({ tool_input: { command } }), encoding: 'utf8', env });
  run('ls -la');
  run('echo gog');
  run('echo gog gmail search');
  run("grep -r 'gog drive delete' docs/");
  run('GOG_ACCOUNT=x gog gmail search is:unread');
  run('sudo --user root gog drive ls');
  run('timeout --signal TERM 30s gog tasks lists list');
  run('/usr/bin/env gog gmail search x');
  run('/usr/bin/sudo -u root gog drive ls');
  const log = fs.readFileSync(path.join(dir, 'gog_audit.log'), 'utf8').trim().split('\n');
  fs.rmSync(dir, { recursive: true, force: true });
  assert.deepEqual(
    log.map((l) => l.replace(/^\[[^\]]+\] /, '')),
    [
      'gog command executed: gmail search',
      'gog command executed: drive ls',
      'gog command executed: tasks lists',
      'gog command executed: gmail search',
      'gog command executed: drive ls',
    ],
  );
});

module.exports = { check, tokenize };
