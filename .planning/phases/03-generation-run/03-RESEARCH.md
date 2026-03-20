# Phase 3: Generation Run - Research

**Researched:** 2026-03-20
**Domain:** Cross-platform config generation (AGENTS.md, GEMINI.md, Cursor .mdc, MCP snippets, skills_index.json)
**Confidence:** HIGH

## Summary

Phase 3 is a pure extension of the Phase 2 generator. The architecture is already proven: zero-dependency CommonJS Node.js, `writeIfChanged()` for idempotency, `transformEnvVars()` stub ready for Cursor, `generateAll()` loop designed to add renderers without touching `main()`. The planner adds four renderer functions and one post-run data mutation (skills_index.json), then extends the bash validation script.

Canonical source of truth for all generated formats is `plugin.json` (manifest) + `.mcp.json` (MCP overrides). Both are already loaded by `loadPlugin()`. No new source files need to be read — the generator already has everything it needs.

The key risk is the AGENTS.md byte budget (2 KiB per plugin, 6 KiB repo-level). Plugin descriptions and capability tables must stay terse. A byte-count gate inside the renderer — not a post-hoc check — is the cleanest enforcement mechanism.

**Primary recommendation:** Add four renderer functions to `generate-cross-platform.js` in a single wave, then add `platforms` field injection to skills_index.json, then extend the validation script. Run generator against all 27 plugins and commit output.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation choices are at Claude's discretion — this is a generator extension phase building on the proven Phase 2 architecture. Key constraints from requirements:

- AGENTS.md: prose Markdown, under 2 KiB per plugin, 6 KiB repo-level
- GEMINI.md: Gemini CLI format with @include for supplemental content where needed
- Cursor .mdc: MDC format with description, globs, alwaysApply frontmatter, `${env:VAR}` syntax for env vars
- Hook-dependent plugins (circuit-breaker, shadow-mode, agent-handoff, social-media, gog-workspace, wp-cli-fleet): limitation notice in all generated formats
- MCP-dependent plugins on Codex: limitation notice (Codex can't use MCP tools)
- Platform capability matrix: table showing what works where per plugin
- skills_index.json: add `platforms` field per skill
- Validation script: extend with AGENTS.md byte count checks, .mdc frontmatter validation
- Claude Desktop snippets already handled in Phase 2

### Claude's Discretion
All implementation choices (file naming, prose style, table format, error messages, code structure).

### Deferred Ideas (OUT OF SCOPE)
None — all scope items are from existing requirements.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| XPLAT-02 | Per-plugin AGENTS.md generated for Codex CLI and Windsurf (prose Markdown, under 2 KiB each) | Renderer design in Architecture Patterns; byte budget enforcement strategy |
| XPLAT-03 | Per-plugin GEMINI.md generated for Gemini CLI (with @include for supplemental content) | Gemini @include syntax confirmed from existing repo-level GEMINI.md; renderer pattern documented |
| XPLAT-04 | Per-plugin .cursor/rules/<name>.mdc generated for Cursor (MDC format with frontmatter) | MDC frontmatter format confirmed; output path and glob strategy documented |
| XPLAT-05 | MCP config snippets generated for Gemini (gemini-settings-snippet.json) and Cursor (.cursor/mcp.json) | transformEnvVars() already handles ${env:VAR} for Cursor; Gemini passes through ${VAR} unchanged |
| XPLAT-06 | Hook limitation notices in generated files for 6 named hook-dependent plugins | Actual discovery: 8 plugins have hooks; CONTEXT.md names 6; discrepancy documented in Pitfalls |
| XPLAT-07 | MCP limitation notices for MCP-dependent plugins on Codex | 14 plugins confirmed MCP-bearing; full list in Architecture Patterns |
| XPLAT-08 | Platform capability matrix per plugin | Matrix design documented with 6-column layout; source data from loadPlugin() flags |
| XPLAT-09 | skills_index.json extended with platforms field | skills_index.json structure confirmed (.entries[] array); in-place mutation pattern documented |
| INFRA-02 | Repo-level AGENTS.md under 6 KiB | CLAUDE.md is 16 KiB; AGENTS.md is distinct file — generate lean version, not derived from CLAUDE.md |
| INFRA-03 | validate-plugins.sh extended with cross-platform checks | Validation script architecture documented; two new check functions needed |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js (CommonJS) | v18+ | Generator runtime | Already established in Phase 2; zero-dependency constraint |
| `fs`, `path` (stdlib) | built-in | File I/O | No external dependencies allowed |
| bash + python3 | system | Validation script | Already used in validate-plugins.sh |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Buffer.byteLength()` | built-in | UTF-8 byte count for AGENTS.md budget | Inline in renderer before `writeIfChanged()` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `Buffer.byteLength(str, 'utf8')` | `str.length` | `str.length` counts JS chars, not bytes — UTF-8 multi-byte sequences would undercount |

**Installation:** No new packages. Generator stays zero-dependency.

---

## Architecture Patterns

### Generated File Layout (per plugin)

```
plugins/<name>/
├── AGENTS.md                          # XPLAT-02 — Codex CLI + Windsurf
├── GEMINI.md                          # XPLAT-03 — Gemini CLI
├── .cursor/
│   ├── rules/<name>.mdc               # XPLAT-04 — Cursor rule file
│   └── mcp.json                       # XPLAT-05 — Cursor MCP snippet (MCP plugins only)
├── gemini-settings-snippet.json       # XPLAT-05 — Gemini MCP snippet (MCP plugins only)
└── claude-desktop-snippet.json        # Already generated in Phase 2
```

Repo-level generated file:
```
AGENTS.md                              # INFRA-02 — repo-level, under 6 KiB
```

### Plugin Classification (determined at `loadPlugin()` time, no changes needed)

**Hook-dependent plugins (CONTEXT.md canonical list for limitation notices):**
`circuit-breaker`, `shadow-mode`, `agent-handoff`, `social-media`, `gog-workspace`, `wp-cli-fleet`

Note: `apple-photos` and `devops-flow` also have hooks in their plugin.json but are NOT in the CONTEXT.md list. The generator should apply the hook limitation notice to ALL 8 hook-bearing plugins (derive from `plugin.hasHooks`) rather than a hardcoded list, ensuring future plugins are handled automatically.

**MCP-dependent plugins (Codex limitation notice):**
`agent-memory`, `clickup-tasks`, `cloudflare-platform`, `context7-docs`, `data-core`, `devops-flow`, `github-integration`, `knowledge-synapse`, `neon-db`, `notion-workspace`, `playwright-testing`, `qa-droid`, `task-commander`, `vercel-deploy` (14 total — derive from `plugin.hasMcp`)

**Platform capability matrix values (6 platforms):**

| Platform | MCP | Hooks | Commands | Agents | Skills |
|----------|-----|-------|----------|--------|--------|
| Claude Code | full | full | full | full | full |
| Codex CLI | none | none | partial | partial | full |
| Gemini CLI | via gemini-settings | none | partial | partial | full |
| Cursor | via .cursor/mcp.json | none | partial | partial | full |
| Windsurf | TBD (global config) | none | partial | partial | full |
| Claude Desktop | full | none | none | none | none |

"partial" for Commands/Agents means the Markdown content is readable context but slash-command dispatch and subagent spawning are Claude Code-specific features.

### Pattern 1: renderAgentsMd(plugin)

**What:** Emits prose Markdown instruction file for Codex CLI / Windsurf compatibility.
**When to use:** Every plugin unconditionally.
**Byte budget enforcement:** Throw if `Buffer.byteLength(content, 'utf8') > 2048` — fail loudly in the errors array, don't silently truncate.

```javascript
// Source: Phase 2 generator architecture + CONTEXT.md constraints
function renderAgentsMd(plugin) {
  const lines = [];
  lines.push(`# ${plugin.manifest.name}`);
  lines.push('');
  lines.push(plugin.manifest.description || '');
  if (plugin.hasHooks) {
    lines.push('');
    lines.push('> **Platform note:** This plugin uses Claude Code hooks. Hook-based automation is not available on Codex CLI, Windsurf, Gemini CLI, or Cursor. Commands and skills remain usable.');
  }
  if (plugin.hasMcp) {
    lines.push('');
    lines.push('> **Codex CLI note:** This plugin requires MCP server tools. Codex CLI does not implement MCP; configure the MCP server in your platform\'s settings to use this plugin.');
  }
  // capability matrix, env vars, commands list
  const content = lines.join('\n') + '\n';
  const bytes = Buffer.byteLength(content, 'utf8');
  if (bytes > 2048) {
    throw new Error(`AGENTS.md exceeds 2 KiB budget: ${bytes} bytes`);
  }
  return content;
}
```

### Pattern 2: renderGeminiMd(plugin)

**What:** Gemini CLI context file. The existing repo-level GEMINI.md demonstrates the format: plain prose Markdown with `@include` references and a "Gemini-Specific Notes" section.
**Key difference from AGENTS.md:** Can reference `@plugins/<name>/README.md` for progressive disclosure rather than inlining all docs, keeping the file small without a hard byte cap.

```javascript
// Source: existing /GEMINI.md at repo root
function renderGeminiMd(plugin) {
  const lines = [
    `# ${plugin.manifest.name}`,
    '',
    plugin.manifest.description || '',
    '',
    '## Plugin Reference',
    '',
    `@plugins/${plugin.name}/README.md`,
  ];
  if (plugin.hasMcp) {
    lines.push('');
    lines.push('## MCP Setup');
    lines.push('');
    lines.push('Add the MCP server from `gemini-settings-snippet.json` to your Gemini settings.');
  }
  if (plugin.hasHooks) {
    lines.push('');
    lines.push('> **Note:** Hook-based automation requires Claude Code. Hooks are not executed by Gemini CLI.');
  }
  return lines.join('\n') + '\n';
}
```

### Pattern 3: renderCursorMdc(plugin)

**What:** Cursor rule file in MDC (Markdown with YAML frontmatter). Must use `${env:VAR}` syntax for any env references in body text; `description` and `globs` fields in frontmatter.
**Output path:** `plugins/<name>/.cursor/rules/<name>.mdc`

```javascript
// Source: CONTEXT.md specifics + Cursor docs convention
function renderCursorMdc(plugin) {
  const fm = [
    '---',
    `description: ${plugin.manifest.description}`,
    'globs: **/*',
    'alwaysApply: true',
    '---',
  ].join('\n');
  const body = [
    `# ${plugin.manifest.name}`,
    '',
    plugin.manifest.description || '',
  ];
  if (plugin.hasMcp) {
    body.push('');
    body.push('## MCP Configuration');
    body.push('');
    body.push('MCP servers for this plugin are configured in `.cursor/mcp.json`.');
    body.push('Environment variables use `${env:VAR_NAME}` syntax in Cursor.');
  }
  if (plugin.hasHooks) {
    body.push('');
    body.push('> **Note:** This plugin uses Claude Code hooks which are not available in Cursor.');
  }
  return fm + '\n\n' + body.join('\n') + '\n';
}
```

### Pattern 4: renderCursorMcp(plugin) + renderGeminiSettingsSnippet(plugin)

**What:** MCP JSON config snippets for Cursor and Gemini. Both skip plugins with no MCP servers (return null).
**Cursor:** Calls `transformEnvVars(mcpServers, 'cursor')` to convert `${VAR}` → `${env:VAR}`. Output: `.cursor/mcp.json`.
**Gemini:** Passes `${VAR}` through unchanged. Output: `gemini-settings-snippet.json`.

The `transformEnvVars()` function already handles Cursor format (Phase 2 stub is complete). Gemini is the passthrough case already in the function.

### Pattern 5: Repo-Level AGENTS.md (INFRA-02)

**What:** Single repo-level AGENTS.md listing all plugins with one-line descriptions and a capability summary. Must stay under 6 KiB.
**Source:** Iterate `discoverPlugins()`, emit a table row per plugin.
**Byte budget:** `Buffer.byteLength(content, 'utf8') <= 6144` — enforce in generator, not just validation.
**Critical:** Do NOT derive from CLAUDE.md (16 KiB) — write from scratch using only manifest data.

### Pattern 6: skills_index.json platforms field (XPLAT-09)

**What:** Read `skills_index.json`, add `platforms` array to each entry, write back using `stableStringify()`.
**Platform value derivation:** Look up the parent plugin in the discovered plugin list; set capabilities per platform matrix.
**Idempotency:** `writeIfChanged()` handles this — re-running with unchanged plugin data produces identical JSON.

```javascript
// skills_index.json entry structure (confirmed from file):
// { "id", "plugin", "type", "name", "path", "description" }
// Add: "platforms": ["claude-code", "codex", "gemini", "cursor", "windsurf"]
// Reduce platforms if plugin.hasHooks or plugin.hasMcp per the matrix above
```

### Pattern 7: generateAll() Extension

Add all new renderers inside the existing `for (const plugin of plugins)` loop in `generateAll()`. No changes to `main()`. Each renderer follows the same try/catch pattern as `renderClaudeDesktop`.

The skills_index.json update runs AFTER the per-plugin loop since it operates on the full plugin list at once. Add it as a separate step after the loop, still inside `generateAll()`.

### Anti-Patterns to Avoid

- **Hardcoding plugin name lists:** Use `plugin.hasHooks` and `plugin.hasMcp` flags from `loadPlugin()` — they already exist and are discovery-driven.
- **String length for byte counts:** Use `Buffer.byteLength(str, 'utf8')` — emoji or UTF-8 chars in descriptions will miscalculate with `.length`.
- **Writing AGENTS.md content that exceeds budget silently:** Throw into `errors` array so the generator fails loudly with plugin name.
- **Generating `.cursorrules`:** Deprecated since Cursor 0.45+; `.mdc` only.
- **Modifying main():** The Phase 2 design deliberately isolated `main()` from renderer changes.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Byte count | Custom char-walk counter | `Buffer.byteLength(str, 'utf8')` | Handles multi-byte UTF-8 correctly |
| Idempotent writes | Custom compare logic | Existing `writeIfChanged()` | Already tested and correct |
| Env var translation | New regex replacement | Existing `transformEnvVars()` | Cursor stub already correct |
| JSON consistency | `JSON.stringify()` | Existing `stableStringify()` | Key-sorted for byte-for-byte idempotency |
| Plugin discovery | `fs.readdirSync` inline | Existing `discoverPlugins()` | Already handles sort order requirement |

**Key insight:** Every utility needed for Phase 3 was deliberately stubbed in Phase 2. The work is writing the renderer bodies, not infrastructure.

---

## Common Pitfalls

### Pitfall 1: Hook Plugin List Discrepancy
**What goes wrong:** CONTEXT.md names 6 hook-dependent plugins; `discoverPlugins()` finds 8 (`apple-photos` and `devops-flow` are extras). Using a hardcoded list misses new hook additions and creates drift.
**Why it happens:** CONTEXT.md lists only the "canonically hook-dependent" plugins, not all plugins that happen to have hooks.
**How to avoid:** Derive limitation notices from `plugin.hasHooks` (dynamic) rather than a name array (static). Apply the notice to all 8 that have hooks — this is strictly a superset of the CONTEXT.md requirement.
**Warning signs:** Any future plugin with hooks that doesn't get a notice.

### Pitfall 2: AGENTS.md byte budget exceeded silently
**What goes wrong:** Generator completes successfully but AGENTS.md is over 2 KiB, validation fails later.
**Why it happens:** Capability matrix tables + description + env var list can easily push past 2 KiB for complex plugins.
**How to avoid:** Enforce `Buffer.byteLength(content, 'utf8') > 2048` as a thrown error inside `renderAgentsMd()`, not a post-hoc check. The error surfaces in the existing `errors` array and the generator exits non-zero.
**Warning signs:** devops-flow, task-commander, and knowledge-synapse are the highest-risk plugins (most MCP servers + hooks).

### Pitfall 3: Cursor MDC frontmatter description with colons
**What goes wrong:** Plugin descriptions that contain `:` (e.g., "Orchestrate Cloudflare deployments, GitHub PRs, and Slack notifications.") break YAML frontmatter parsing.
**Why it happens:** Unquoted YAML values cannot contain `:` followed by a space.
**How to avoid:** Always wrap description value in double quotes in the frontmatter: `description: "..."`. Escape any inner double-quotes with `\"`.
**Warning signs:** YAML parse errors during validation.

### Pitfall 4: skills_index.json object structure confusion
**What goes wrong:** Generator treats skills_index.json as a flat array, breaks the `.entries[]` wrapper.
**Why it happens:** Name suggests array; actual structure is `{ "$schema", "version", "generated", "description", "entries": [...] }`.
**How to avoid:** Read the file, parse JSON, mutate `data.entries` (the array), re-serialize with `stableStringify()`. Never replace the root object.
**Warning signs:** Validation script warns "skills_index.json is not valid JSON" after generation.

### Pitfall 5: Gemini @include path resolution
**What goes wrong:** `@plugins/<name>/README.md` reference works in repo context but not when plugin is installed standalone.
**Why it happens:** @include paths are relative to the working directory when Gemini CLI runs.
**How to avoid:** Per-plugin GEMINI.md should include the essential content inline (description, quick commands, env vars) and use @include only as supplemental for the README. Don't rely on @include for critical configuration.

### Pitfall 6: Windsurf MCP config path unconfirmed
**What goes wrong:** Generated Windsurf-specific MCP config lands in wrong path; users can't use it.
**Why it happens:** STATE.md explicitly flags: "Windsurf project-scoped MCP config path unconfirmed."
**How to avoid:** Do NOT generate a Windsurf-specific MCP snippet file. Direct users to global config in AGENTS.md with a caveat. XPLAT-05 is scoped to Gemini + Cursor only.

---

## Code Examples

### Validation Script Extension (INFRA-03)

Two new check functions to add to `validate-plugins.sh`:

```bash
# Check 1: AGENTS.md byte count
validate_agents_md() {
  local dir="$1"
  local name; name="$(basename "$dir")"
  local agents_file="$dir/AGENTS.md"
  if [[ -f "$agents_file" ]]; then
    local byte_count
    byte_count="$(wc -c < "$agents_file" | tr -d ' ')"
    if [[ "$byte_count" -gt 2048 ]]; then
      log_fail "${name}/AGENTS.md exceeds 2 KiB (${byte_count} bytes)"
      fail_count=$((fail_count + 1))
    else
      log_pass "${name}/AGENTS.md size OK (${byte_count} bytes)"
    fi
  fi
}

# Check 2: .cursor/rules/*.mdc frontmatter validation
validate_cursor_mdc() {
  local dir="$1"
  local name; name="$(basename "$dir")"
  local rules_dir="$dir/.cursor/rules"
  if [[ -d "$rules_dir" ]]; then
    while IFS= read -r mdc_file; do
      local rel="${mdc_file#$dir/}"
      local has_desc has_globs
      has_desc="$(head -10 "$mdc_file" | grep -c '^description:' || true)"
      has_globs="$(head -10 "$mdc_file" | grep -c '^globs:' || true)"
      if [[ "$has_desc" -eq 0 ]]; then
        log_fail "${name}/${rel}: missing 'description' in frontmatter"
        fail_count=$((fail_count + 1))
      fi
      if [[ "$has_globs" -eq 0 ]]; then
        log_fail "${name}/${rel}: missing 'globs' in frontmatter"
        fail_count=$((fail_count + 1))
      fi
    done < <(find "$rules_dir" -name "*.mdc" -type f 2>/dev/null)
  fi
}
```

Call both functions inside the `for plugin_dir in "$PLUGINS_DIR"/*/` loop alongside existing validators.

Also add a repo-level AGENTS.md byte check after the loop:

```bash
# Repo-level AGENTS.md size check
repo_agents="$ROOT_DIR/AGENTS.md"
if [[ -f "$repo_agents" ]]; then
  bytes="$(wc -c < "$repo_agents" | tr -d ' ')"
  if [[ "$bytes" -gt 6144 ]]; then
    log_fail "Repo-level AGENTS.md exceeds 6 KiB (${bytes} bytes)"
    fail_count=$((fail_count + 1))
  else
    log_pass "Repo-level AGENTS.md size OK (${bytes} bytes)"
  fi
fi
```

### skills_index.json platforms field injection

```javascript
// Source: skills_index.json confirmed structure + platform matrix above
function injectSkillsPlatforms(plugins, errors) {
  const indexPath = path.resolve(__dirname, '..', 'skills_index.json');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (err) {
    errors.push({ plugin: 'skills_index', error: `read failed: ${err.message}` });
    return;
  }
  const pluginMap = Object.fromEntries(plugins.map(p => [p.name, p]));
  for (const entry of (data.entries || [])) {
    const plugin = pluginMap[entry.plugin];
    if (!plugin) continue;
    // Base: all platforms get skills/commands/agents as readable context
    const platforms = ['claude-code', 'gemini', 'cursor', 'windsurf'];
    // Codex: supported unless it's purely hook-driven with no text content
    platforms.push('codex');
    // Sort for stable output
    entry.platforms = platforms.sort();
  }
  data.generated = new Date().toISOString().slice(0, 10);
  writeIfChanged(indexPath, stableStringify(data));
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.cursorrules` flat file | `.cursor/rules/*.mdc` | Cursor 0.45+ | Only generate .mdc; never generate .cursorrules |
| Gemini env vars via `$VAR` | `$VAR` passes through unchanged | Gemini CLI current | No transformation needed for Gemini MCP configs |
| skills_index.json without platforms | Add `platforms[]` per entry | Phase 3 | Cross-platform discovery for IDE integrations |

**Deprecated/outdated:**
- `.cursorrules`: Deprecated since Cursor 0.45. Do not generate. Generate `.cursor/rules/<name>.mdc` only.
- Windsurf project MCP config: Path unconfirmed as of 2026-03-20. Do not generate; document limitation only.

---

## Open Questions

1. **apple-photos and devops-flow hook notices**
   - What we know: Both have `hooks` in plugin.json; neither is in CONTEXT.md's named list of 6
   - What's unclear: Whether the CONTEXT.md list is exhaustive or just examples
   - Recommendation: Apply limitation notice to all plugins where `plugin.hasHooks === true` (superset of requirement). Safer and future-proof.

2. **Windsurf MCP config path**
   - What we know: STATE.md flags as unconfirmed. Windsurf supports MCP but project-scoped config path unclear.
   - What's unclear: Whether `.windsurf/mcp.json` or a global config is the correct path.
   - Recommendation: Do not generate a Windsurf MCP snippet. Add a commented "Windsurf: configure in global MCP settings" note in AGENTS.md. Track for Phase 4 docs update when confirmed.

3. **AGENTS.md 2 KiB budget for complex plugins**
   - What we know: devops-flow (3 MCP servers + hooks), task-commander (4 MCP servers + hooks), and knowledge-synapse (3 MCP servers) are densest plugins.
   - What's unclear: Whether a minimal description + matrix + env vars table fits in 2 KiB for all of them.
   - Recommendation: Write renderer with the byte gate, run generator, and inspect which plugins fail. For those that exceed the budget, strip the capability matrix from AGENTS.md (move it to README only) and rely on the shorter prose form.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | bash (validate-plugins.sh) + node (generator self-test via `process.exitCode`) |
| Config file | `scripts/validate-plugins.sh` |
| Quick run command | `node scripts/generate-cross-platform.js` |
| Full suite command | `bash scripts/validate-plugins.sh` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| XPLAT-02 | AGENTS.md generated for all 27 plugins under 2 KiB | smoke | `find plugins -name AGENTS.md | wc -l` + validate-plugins.sh | ❌ Wave 0 (new validate functions) |
| XPLAT-03 | GEMINI.md generated for all 27 plugins | smoke | `find plugins -name GEMINI.md | wc -l` | ❌ Wave 0 |
| XPLAT-04 | .mdc files in .cursor/rules/ for all 27 plugins | smoke | `find plugins -name "*.mdc" | wc -l` | ❌ Wave 0 |
| XPLAT-05 | gemini-settings-snippet.json for 14 MCP plugins; .cursor/mcp.json for 14 MCP plugins | smoke | `find plugins -name "gemini-settings-snippet.json" | wc -l` | ❌ Wave 0 |
| XPLAT-06 | Hook limitation text present in AGENTS.md for hook plugins | smoke | `grep -l "hooks" plugins/circuit-breaker/AGENTS.md` | ❌ Wave 0 |
| XPLAT-07 | Codex limitation text present in AGENTS.md for MCP plugins | smoke | `grep -l "Codex CLI" plugins/github-integration/AGENTS.md` | ❌ Wave 0 |
| XPLAT-08 | Capability matrix table present in at least one generated format | smoke | `grep -l "Claude Code" plugins/github-integration/AGENTS.md` | ❌ Wave 0 |
| XPLAT-09 | skills_index.json entries have platforms field | smoke | `python3 -c "import json; d=json.load(open('skills_index.json')); print(all('platforms' in e for e in d['entries']))"` | ❌ Wave 0 |
| INFRA-02 | Repo-level AGENTS.md under 6 KiB | automated | `wc -c AGENTS.md` | ❌ Wave 0 |
| INFRA-03 | validate-plugins.sh checks AGENTS.md bytes and .mdc frontmatter | automated | `bash scripts/validate-plugins.sh` | ❌ Wave 0 (extend existing) |

### Sampling Rate
- **Per task commit:** `node scripts/generate-cross-platform.js`
- **Per wave merge:** `bash scripts/validate-plugins.sh`
- **Phase gate:** All 27 plugins validated, 0 failures before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Two new validate functions in `scripts/validate-plugins.sh` — covers XPLAT-02, INFRA-02, INFRA-03, XPLAT-04
- [ ] Generator smoke counts (node invocation exit code 0) — covers XPLAT-02 through XPLAT-09

---

## Sources

### Primary (HIGH confidence)
- `/scripts/generate-cross-platform.js` — full source read; all utility functions confirmed
- `/scripts/validate-plugins.sh` — full source read; extension points confirmed
- `/skills_index.json` — structure confirmed: `{ entries: [...] }` wrapper, not flat array
- `plugins/*/claude-plugin/plugin.json` (circuit-breaker, devops-flow, neon-db, apple-photos) — manifest structures confirmed
- `plugins/*/mcp.json` (github-integration, agent-memory confirmed) — MCP file structure confirmed
- `GEMINI.md` (repo root) — Gemini @include format confirmed from existing file
- `AGENTS.md` (repo root, Phase 1 output) — file exists, 16 KiB; per-plugin generation must stay lean
- `.planning/phases/03-generation-run/03-CONTEXT.md` — all constraints read verbatim
- `.planning/REQUIREMENTS.md` — all 10 requirement IDs confirmed
- `.planning/STATE.md` — Phase 2 architectural decisions confirmed; Windsurf path flagged as unconfirmed

### Secondary (MEDIUM confidence)
- Cursor MDC format (description/globs/alwaysApply frontmatter) — confirmed from CONTEXT.md specifics and Cursor convention; `.cursorrules` deprecation confirmed from REQUIREMENTS.md out-of-scope table
- Gemini CLI `@include` pattern — confirmed from existing repo-level GEMINI.md
- `Buffer.byteLength()` for UTF-8 counting — standard Node.js stdlib, HIGH confidence

### Tertiary (LOW confidence)
- Windsurf project-scoped MCP config path — flagged as unconfirmed in STATE.md; no authoritative source found

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero-dependency, stdlib-only, all confirmed from Phase 2 code
- Architecture: HIGH — all patterns derived from reading existing code, not assumed
- Pitfalls: HIGH — byte budget, YAML escaping, skills_index structure, and Windsurf path all verified from sources or explicitly flagged in STATE.md
- Platform matrix: MEDIUM — Claude Code/Codex/Gemini/Cursor values from REQUIREMENTS.md; Windsurf MCP path unconfirmed

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain; Cursor/Windsurf MCP path may clarify sooner)
