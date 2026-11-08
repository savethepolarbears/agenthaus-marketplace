#!/usr/bin/env node
/**
 * Build tests/fixtures/gogcli-commands.json from gogcli's generated command
 * reference (docs/commands/gog-*.md in https://github.com/openclaw/gogcli).
 *
 * Usage:
 *   git clone --depth 1 https://github.com/openclaw/gogcli /tmp/gogcli
 *   node scripts/snapshot-gogcli.js /tmp/gogcli/docs/commands [--commit <sha>]
 *
 * The snapshot is consumed by tests/gog-cli-drift.test.js, which checks every
 * documented `gog ...` invocation in the gog plugins against it.
 *
 * It also writes plugins/gog-workspace/hooks/guarded-commands.json, the table
 * of send/share/delete commands (with every alias) that the plugin's
 * PreToolUse hook asks about. To rebuild only that table from the committed
 * snapshot:
 *   node scripts/snapshot-gogcli.js --guard-only
 */
'use strict';

const fs = require('fs');
const path = require('path');

function parseUsage(usage) {
  // e.g. "gog calendar (cal) create (add,new) <calendarId> [flags]"
  const tokens = usage.trim().split(/\s+/).slice(1); // drop "gog"
  const segments = [];
  const positionals = [];
  const requiredFlags = [];
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (/^\(.*\)$/.test(tok)) {
      // alias list for the previous segment
      const last = segments[segments.length - 1];
      if (last) last.aliases.push(...tok.slice(1, -1).split(',').filter(Boolean));
      continue;
    }
    if (tok === '[flags]') continue;
    if (tok === '...' || tok === '...]') {
      if (positionals.length) positionals[positionals.length - 1].variadic = true;
      continue;
    }
    let m;
    if ((m = tok.match(/^\[<([^>]+)>$/))) {
      // "[<calendarId> ...]": optional variadic, closed by the "...]" token
      positionals.push({ name: m[1], required: false });
      continue;
    }
    if ((m = tok.match(/^\[<([^>]+)>\]$/))) {
      positionals.push({ name: m[1], required: false });
      continue;
    }
    if ((m = tok.match(/^<([^>]+)>$/))) {
      if (m[1] === 'command') continue; // group placeholder: subcommands are separate entries
      positionals.push({ name: m[1], required: true });
      continue;
    }
    if ((m = tok.match(/^(--[a-z0-9-]+)(=|$)/))) {
      requiredFlags.push(m[1]);
      continue;
    }
    if (/^[a-z][a-z0-9-]*$/.test(tok) && positionals.length === 0) {
      segments.push({ name: tok, aliases: [] });
    }
  }
  return { segments, positionals, requiredFlags };
}

function parseFlags(text) {
  const idx = text.indexOf('## Flags');
  if (idx < 0) return { flags: [], bools: [] };
  const section = text.slice(idx).split(/\n## /)[0];
  const flags = new Set();
  const bools = new Set();
  for (const row of section.split('\n')) {
    if (!row.startsWith('| `')) continue;
    const cells = row.split(' | ');
    const isBool = /`(bool|\*bool|kong\.helpFlag|kong\.VersionFlag)`/.test(cells[1] || '');
    for (const m of cells[0].matchAll(/`(-{1,2}[A-Za-z0-9-]+)`/g)) {
      flags.add(m[1]);
      if (isBool) bools.add(m[1]);
    }
  }
  return { flags: [...flags].sort(), bools: [...bools].sort() };
}

// Command names or aliases that delete, clear or revoke data.
const DESTRUCTIVE_VERBS = new Set([
  'delete', 'del', 'rm', 'remove', 'clear', 'trash', 'unset', 'unshare', 'suspend', 'unsubscribe', 'leave',
  'delete-tab', 'delete-dimension', 'delete-calendar', 'delete-slide', 'delete-question',
  'remove-public', 'update-role',
]);
// Commands that send mail or messages, share data, or redirect mail elsewhere
// (a filter can forward or trash every future match; a vacation responder
// replies to every incoming message).
const SEND_COMMANDS = [
  'send', 'gmail send', 'gmail reply', 'gmail reply-all', 'gmail forward', 'gmail autoreply',
  'gmail drafts send', 'gmail settings forwarding create', 'gmail settings autoforward update',
  'gmail settings delegates add', 'gmail settings filters create',
  'gmail settings vacation update', 'chat messages send', 'chat dm send', 'drive share',
];

/** Build the hook's table: canonical guarded paths plus the alias tree that reaches them. */
function buildGuard(snapshot) {
  const keys = Object.keys(snapshot.commands);
  const guarded = keys
    .filter(
      (k) =>
        k &&
        // canonical name or any alias: `watch stop` is also spelled `watch rm` / `watch delete`
        ([k.split(' ').pop(), ...snapshot.commands[k].aliases].some((v) => DESTRUCTIVE_VERBS.has(v)) ||
          SEND_COMMANDS.includes(k) ||
          // a command spelled `send` by alias: `classroom submissions return` (alias `send`),
          // `gmail settings sendas verify` (alias `resend`, sends a verification email)
          snapshot.commands[k].aliases.some((a) => a === 'send' || a === 'resend')),
    )
    .sort();
  for (const k of SEND_COMMANDS) {
    if (!snapshot.commands[k]) throw new Error(`guarded command "${k}" is not in the gogcli snapshot`);
  }
  const onPath = new Set();
  for (const k of guarded) {
    const segs = k.split(' ');
    for (let i = 1; i <= segs.length; i++) onPath.add(segs.slice(0, i).join(' '));
  }
  // Commands that notify other people only when a flag asks them to (default
  // `none`): guarded when the flag is given any other value.
  const notify = {};
  for (const k of keys) {
    if (!guarded.includes(k) && snapshot.commands[k].flags.includes('--send-updates')) notify[k] = '--send-updates';
  }
  for (const k of Object.keys(notify)) {
    const segs = k.split(' ');
    for (let i = 1; i <= segs.length; i++) onPath.add(segs.slice(0, i).join(' '));
  }
  const tree = {};
  for (const k of [...onPath].sort()) {
    const segs = k.split(' ');
    const parent = segs.slice(0, -1).join(' ');
    const name = segs[segs.length - 1];
    tree[parent] = tree[parent] || {};
    for (const alias of [name, ...snapshot.commands[k].aliases]) {
      if (!(alias in tree[parent])) tree[parent][alias] = name;
    }
  }
  // Boolean flags valid at each node beyond the global ones; any other flag takes a value.
  const boolFlags = {};
  for (const node of [...onPath].sort()) {
    if (snapshot.commands[node].boolFlags.length) boolFlags[node] = snapshot.commands[node].boolFlags;
  }
  return {
    generatedBy: 'node scripts/snapshot-gogcli.js --guard-only',
    gogcliCommit: snapshot.commit,
    globalValueFlags: snapshot.globalFlags.filter((f) => !snapshot.globalBoolFlags.includes(f)),
    globalBoolFlags: snapshot.globalBoolFlags,
    guarded,
    notify,
    tree,
    boolFlags,
  };
}

function writeGuard(snapshot) {
  const dest = path.join(__dirname, '..', 'plugins', 'gog-workspace', 'hooks', 'guarded-commands.json');
  // Top-level keys on their own lines, each value on one line: compact and diffable.
  const guard = buildGuard(snapshot);
  const line = (v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? `{\n${Object.entries(v).map(([k, x]) => `  ${JSON.stringify(k)}: ${JSON.stringify(x)}`).join(',\n')}\n }`
      : JSON.stringify(v);
  const body = Object.entries(guard).map(([k, v]) => ` ${JSON.stringify(k)}: ${line(v)}`).join(',\n');
  fs.writeFileSync(dest, `{\n${body}\n}\n`);
  console.log(`wrote guard table to ${path.relative(process.cwd(), dest)}`);
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--guard-only') {
    writeGuard(require('../tests/fixtures/gogcli-commands.json'));
    return;
  }
  const dir = args[0];
  if (!dir || !fs.existsSync(dir)) {
    console.error('usage: node scripts/snapshot-gogcli.js <gogcli/docs/commands> [--commit <sha>]');
    process.exit(2);
  }
  const ci = args.indexOf('--commit');
  const commit = ci >= 0 ? args[ci + 1] : 'unknown';

  const commands = {};
  for (const file of fs.readdirSync(dir).filter((f) => /^gog.*\.md$/.test(f)).sort()) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    const m = text.match(/```bash\n(gog[^\n]*)\n/);
    if (!m) continue;
    const parsed = parseUsage(m[1]);
    const key = parsed.segments.map((s) => s.name).join(' ');
    const { flags, bools } = parseFlags(text);
    commands[key] = { ...parsed, flags, bools };
  }

  // Flags present on every command are global; store them once.
  const all = Object.values(commands);
  const global = all[0].flags.filter((f) => all.every((c) => c.flags.includes(f)));
  const globalBool = global.filter((f) => all[0].bools.includes(f));
  const out = {
    source: 'https://github.com/openclaw/gogcli/tree/' + commit + '/docs/commands',
    commit,
    regenerate: 'node scripts/snapshot-gogcli.js <gogcli>/docs/commands --commit <sha>',
    globalFlags: global,
    globalBoolFlags: globalBool,
    commands: {},
  };
  for (const [key, c] of Object.entries(commands)) {
    out.commands[key] = {
      aliases: c.segments.length ? c.segments[c.segments.length - 1].aliases : [],
      positionals: c.positionals,
      requiredFlags: c.requiredFlags,
      flags: c.flags.filter((f) => !global.includes(f)),
      boolFlags: c.bools.filter((f) => !global.includes(f)),
    };
  }
  const dest = path.join(__dirname, '..', 'tests', 'fixtures', 'gogcli-commands.json');
  // One command per line keeps the fixture compact and its diffs readable.
  const lines = Object.entries(out.commands).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`);
  const head = { ...out };
  delete head.commands;
  const headJson = JSON.stringify(head, null, 1).replace(/\n}$/, '');
  fs.writeFileSync(dest, `${headJson},\n "commands": {\n${lines.join(',\n')}\n }\n}\n`);
  console.log(`wrote ${Object.keys(out.commands).length} commands to ${path.relative(process.cwd(), dest)}`);
  writeGuard(JSON.parse(fs.readFileSync(dest, 'utf8')));
}

module.exports = { buildGuard };
if (require.main === module) main();
