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

function main() {
  const args = process.argv.slice(2);
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
}

main();
