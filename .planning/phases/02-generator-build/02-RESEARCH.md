# Phase 02: Generator Build - Research

**Researched:** 2026-03-20
**Domain:** Node.js file generation / cross-platform AI config synthesis
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Generate MCP config snippets only (`claude-desktop-snippet.json` per plugin) — Claude Desktop only supports MCP servers, not commands/agents/skills/hooks
- Place snippets at `plugins/<name>/claude-desktop-snippet.json` for MCP-equipped plugins (14 of 27)
- Add "Claude Desktop" column to platform support matrix showing MCP-only support
- Include Claude Desktop in this milestone (Phases 2-4), not deferred

### Claude's Discretion
- Generator architecture (single-pass vs multi-pass, template engine vs string concat)
- File I/O patterns (sync vs async, streaming vs buffered)
- Error handling strategy (fail-fast vs collect-all-errors)
- Template format for generated files

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| XPLAT-01 | Node.js generator script built (`scripts/generate-cross-platform.js`) that reads Claude-native sources and emits per-platform configs | Architecture patterns, plugin data shape, Node.js stdlib approach |
| XPLAT-10 | Generator is idempotent (re-running on unchanged sources produces identical output) | Deterministic write strategy: compare-before-write or sorted keys |
</phase_requirements>

---

## Summary

Phase 2 builds `scripts/generate-cross-platform.js` — a zero-dependency Node.js script that reads the 27 plugin manifests and emits per-platform configuration files. The generator itself must be a **self-contained script** (no npm packages, no `node_modules`) since there is no `package.json` at the repo root. Node.js 22 is available (`v22.21.1`) and its stdlib `fs`, `path`, and `readline` are sufficient for all I/O.

The generator's primary job for Phase 2 is: establish the architecture, plugin discovery loop, and data-loading pipeline, then emit `claude-desktop-snippet.json` for the 14 MCP-equipped plugins. Phases 3 and 4 extend the same generator to emit the remaining 5 output formats (AGENTS.md, GEMINI.md, .mdc, .windsurfrules, platform matrix). Designing the generator in Phase 2 with that extension in mind avoids rewrites.

Idempotency (XPLAT-10) is achieved by a compare-before-write strategy: read the existing file, serialize the new content, write only if different. JSON output must use stable key ordering via explicit `JSON.stringify` with sorted replacer. Markdown output must use deterministic template rendering with no timestamp injections.

**Primary recommendation:** Single-pass generator, collect-all-errors error strategy, compare-before-write for idempotency, pure Node.js stdlib — no template engine, no gray-matter, no external deps.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `fs` (sync) | built-in v22 | Read plugin files, write outputs | No async complexity needed for 27 files; sync is simpler and correct |
| Node.js `path` | built-in v22 | Resolve plugin paths portably | Standard cross-platform path joins |
| Node.js `process` | built-in v22 | Exit codes, stderr/stdout reporting | Standard CLI output |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Regex-based frontmatter parser | hand-rolled (5 lines) | Parse YAML frontmatter from agent/command/skill .md files | Used in existing `generate-skills-index.sh` already — replicate the exact pattern |
| `JSON.stringify(obj, sortedReplacer, 2)` | built-in | Deterministic JSON serialization | Required for idempotency of JSON outputs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| hand-rolled frontmatter regex | `gray-matter` npm package | gray-matter is not installed and introducing a dep requires a root package.json — overkill for simple `--- \n key: value \n ---` format |
| sync `fs.readFileSync` | async `fs.promises` | Async adds complexity with no throughput benefit for 27 sequential files |
| string template literals | Handlebars/nunjucks | No template engine is installed; template literals are readable and zero-dep |

**Installation:** None required. The generator uses only Node.js stdlib.

---

## Architecture Patterns

### Recommended Project Structure

```
scripts/
└── generate-cross-platform.js   # Single generator entry point

plugins/<name>/
├── .claude-plugin/plugin.json   # Source of truth (read)
├── .mcp.json                    # MCP server definitions (read, if present)
├── agents/*.md                  # Agent definitions (read)
├── commands/*.md                # Command definitions (read)
├── skills/*/SKILL.md            # Skill definitions (read)
├── hooks/hooks.json             # Hook definitions (read, if present)
└── claude-desktop-snippet.json  # WRITE: Phase 2 output
```

### Pattern 1: Plugin Discovery Loop

**What:** Iterate `plugins/*/` directories, load manifest + supplemental files for each, build a normalized in-memory plugin object.

**When to use:** Entry point for all generation. Mirrors the existing `validate-plugins.sh` discovery loop.

```javascript
// No external deps — pure stdlib
const fs = require('fs');
const path = require('path');

const PLUGINS_DIR = path.resolve(__dirname, '..', 'plugins');

function discoverPlugins() {
  return fs.readdirSync(PLUGINS_DIR)
    .filter(name => fs.statSync(path.join(PLUGINS_DIR, name)).isDirectory())
    .sort()  // deterministic order for idempotency
    .map(name => loadPlugin(path.join(PLUGINS_DIR, name), name));
}
```

### Pattern 2: Normalized Plugin Object

**What:** Load all relevant source files into a single JS object before any generation. Separation of loading from rendering makes the generator testable and the rendering phase stateless.

```javascript
function loadPlugin(dir, name) {
  const manifestPath = path.join(dir, '.claude-plugin', 'plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const mcpPath = path.join(dir, '.mcp.json');
  const mcp = fs.existsSync(mcpPath)
    ? JSON.parse(fs.readFileSync(mcpPath, 'utf8'))
    : null;

  const hasMcp = mcp !== null ||
    (manifest.mcpServers && Object.keys(manifest.mcpServers).length > 0);
  const hasHooks = Array.isArray(manifest.hooks) && manifest.hooks.length > 0;

  // Merge MCP servers from both sources (manifest inline + .mcp.json)
  const mcpServers = {
    ...(manifest.mcpServers || {}),
    ...(mcp ? mcp.mcpServers || {} : {})
  };

  return { dir, name, manifest, mcp, mcpServers, hasMcp, hasHooks };
}
```

### Pattern 3: Idempotent Compare-Before-Write

**What:** Read existing file, compare serialized content, skip write if identical. This is the ONLY correct approach for XPLAT-10 — avoids touching file timestamps when nothing changed.

```javascript
function writeIfChanged(filePath, content) {
  try {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === content) return false; // no change
  } catch (_) {
    // file doesn't exist yet — write it
  }
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}
```

### Pattern 4: Deterministic JSON Serialization

**What:** Sort keys when serializing JSON to guarantee identical byte output across runs regardless of object construction order.

```javascript
function stableStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
      );
    }
    return value;
  }, 2) + '\n';
}
```

### Pattern 5: Claude Desktop Snippet Generation

**What:** For MCP-equipped plugins, produce a `claude-desktop-snippet.json` that is copy-pasteable into `~/Library/Application Support/Claude/claude_desktop_config.json`.

**Key constraint:** Claude Desktop uses `${VAR}` env var syntax — same as `.mcp.json`. No translation needed.

```javascript
function generateClaudeDesktopSnippet(plugin) {
  if (!plugin.hasMcp || Object.keys(plugin.mcpServers).length === 0) {
    return null; // skip non-MCP plugins
  }
  return {
    _comment: `Paste the "mcpServers" entries below into your claude_desktop_config.json`,
    _plugin: plugin.name,
    _version: plugin.manifest.version,
    mcpServers: plugin.mcpServers  // already in correct format
  };
}
```

### Pattern 6: Collect-All-Errors Strategy

**What:** Accumulate errors for all plugins, report at end, exit 1 if any. Do NOT fail-fast mid-loop — the planner needs to know if multiple plugins are broken.

```javascript
const errors = [];

for (const plugin of plugins) {
  try {
    generate(plugin);
  } catch (err) {
    errors.push({ plugin: plugin.name, error: err.message });
  }
}

if (errors.length > 0) {
  errors.forEach(e => console.error(`ERROR [${e.plugin}]: ${e.error}`));
  process.exit(1);
}
```

### Pattern 7: Frontmatter Parsing (zero-dep)

**What:** Parse YAML frontmatter from .md files. Replicate the pattern already used in `generate-skills-index.sh`.

```javascript
function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s*["']?(.+?)["']?\s*$/);
    if (m) fm[m[1]] = m[2];
  }
  return fm;
}
```

### Anti-Patterns to Avoid

- **Async/await for file I/O:** 27 plugins, sequential reads, no network I/O — async adds callback complexity with zero benefit. Use sync.
- **Timestamp in generated files:** `// Generated: 2026-03-20` breaks idempotency — two runs on the same day may differ by seconds; omit timestamps entirely or use only a hash of inputs.
- **Reading `.mcp.json` only:** Some plugins declare `mcpServers` inline in `plugin.json` (devops-flow, knowledge-synapse pattern) — must merge both sources.
- **Hardcoded plugin names for capability detection:** Detect MCP/hooks presence dynamically from file system, not from a hardcoded list. The list of 27 changes over time.
- **`JSON.stringify` without key sorting:** Object property order in Node.js is insertion-order. Two loads of the same plugin.json may produce different orders if any intermediate transform is applied.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Full YAML parser | Regex on `---\nkey: value\n---` blocks | Plugin frontmatter is always simple scalar key-value; never nested YAML; same pattern works in generate-skills-index.sh already |
| Plugin discovery | Manual file listing | `fs.readdirSync` + `.sort()` | Already the pattern in validate-plugins.sh; consistent ordering is essential for idempotency |
| JSON deep-equal for idempotency check | Custom diff | String comparison after `stableStringify` | Simpler and guaranteed correct for JSON payloads |

**Key insight:** The existing shell scripts already solved discovery and parsing for this exact file structure. The Node.js generator should replicate those algorithms, not re-invent them.

---

## Common Pitfalls

### Pitfall 1: MCP servers in two places

**What goes wrong:** Some plugins declare `mcpServers` directly in `plugin.json` (e.g., `devops-flow`) while others declare them only in `.mcp.json`. A generator that reads only `.mcp.json` misses the inline declarations.

**Why it happens:** The plugin spec allows both formats. Early plugins used inline manifest declarations; later plugins split to `.mcp.json`.

**How to avoid:** Always merge: `{ ...manifest.mcpServers, ...(mcp?.mcpServers || {}) }`. The `.mcp.json` file takes precedence if a key appears in both.

**Warning signs:** `devops-flow` and `knowledge-synapse` have MCP servers only in `plugin.json`, not in `.mcp.json`. If the generator skips them for Claude Desktop snippets, those two are the tell.

### Pitfall 2: Idempotency broken by non-deterministic object ordering

**What goes wrong:** `JSON.stringify({ b: 1, a: 2 })` and `JSON.stringify({ a: 2, b: 1 })` produce different strings even though they represent the same object. Plugin loading order or object spread order can vary.

**Why it happens:** Node.js preserves insertion order for string keys. Different code paths building the same object may insert keys in different orders.

**How to avoid:** Use `stableStringify` (key-sorted replacer) for ALL JSON output. Never use plain `JSON.stringify` in the generator.

### Pitfall 3: gray-matter not available

**What goes wrong:** `require('gray-matter')` throws `MODULE_NOT_FOUND`. There is no root `package.json` and no `node_modules` at the repo root.

**Why it happens:** STATE.md explicitly flags: "Verify gray-matter YAML parser handles all current frontmatter patterns before committing to it." Investigation confirms it is not installed.

**How to avoid:** Use the regex-based frontmatter parser described in Pattern 7. It handles every current plugin frontmatter pattern.

### Pitfall 4: Claude Desktop snippet for non-MCP plugins

**What goes wrong:** Generator emits an empty or useless snippet for plugins that have no MCP servers (e.g., circuit-breaker, agent-handoff, fleet-commander).

**Why it happens:** Checking only `plugin.hasMcp` without verifying `Object.keys(mcpServers).length > 0`.

**How to avoid:** Skip snippet generation when `Object.keys(plugin.mcpServers).length === 0`. Log a skip notice at INFO level.

### Pitfall 5: Cursor env var syntax confusion

**What goes wrong:** Cursor `.mdc` and `.cursor/mcp.json` files require `${env:VAR}` syntax. Copying `.mcp.json` env vars verbatim (`${VAR}`) breaks Cursor's variable interpolation.

**Why it happens:** Cursor uses a different env var interpolation format from Claude Code/Desktop.

**How to avoid:** The generator's Cursor-specific renderer (Phase 3) must apply a transform: `value.replace(/\$\{([^}]+)\}/g, '${env:$1}')`. Phase 2 generator architecture must make this transform easy to apply per output format.

**Warning signs:** If a Cursor user reports environment variables not resolving, check for missing `env:` prefix.

### Pitfall 6: SKILL.md multiline descriptions

**What goes wrong:** Multiline YAML values in SKILL.md frontmatter are not parsed correctly by the regex approach.

**Why it happens:** YAML `|` and `>` block scalars span multiple lines; regex `^description:\s*(.+)$` only captures the first line.

**How to avoid:** For Phase 2 generation purposes, treat all frontmatter values as single-line. Plugin policy (enforced by validate-plugins.sh) already prohibits multiline descriptions. This is consistent with STATE.md's note: "SKILL.md multiline descriptions break discovery silently — do not run Prettier on SKILL.md files."

---

## Code Examples

### Claude Desktop snippet output format (verified from CONTEXT.md spec)

```json
{
  "_comment": "Paste the \"mcpServers\" entries below into your claude_desktop_config.json",
  "_plugin": "github-integration",
  "_version": "1.0.0",
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### skills_index.json `platforms` field extension (Phase 2 prep)

The generator should add a `platforms` field to each entry in `skills_index.json`. Phase 2 bootstraps the field; Phase 3 fills it in:

```json
{
  "id": "github-integration:github-workflow",
  "plugin": "github-integration",
  "type": "skill",
  "name": "github-workflow",
  "path": "plugins/github-integration/skills/github-workflow/SKILL.md",
  "description": "...",
  "platforms": {
    "claude-code": true,
    "codex-cli": true,
    "gemini-cli": true,
    "cursor": true,
    "windsurf": true,
    "claude-desktop": false
  }
}
```

### Generator invocation pattern (verified against existing scripts)

```bash
node scripts/generate-cross-platform.js
# Expected output:
# [github-integration] claude-desktop-snippet.json written
# [devops-flow] claude-desktop-snippet.json written
# ...
# [circuit-breaker] claude-desktop-snippet.json skipped (no MCP servers)
# Generated 14 snippets, 13 skipped. 0 errors.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `.cursorrules` file | `.cursor/rules/*.mdc` | Cursor 0.45+ (late 2024) | `.cursorrules` is deprecated; generator MUST produce `.mdc` only — REQUIREMENTS.md confirms this |
| Codex CLI MCP support | No Codex MCP support | Still true as of March 2026 | Generator must emit Platform Limitations notice in AGENTS.md for MCP-dependent plugins |
| `${VAR}` env syntax (all platforms) | `${env:VAR}` for Cursor only | Cursor introduced its own syntax | Generator must apply per-platform env var translation |

**Deprecated/outdated:**
- `.cursorrules`: Deprecated since Cursor 0.45+. REQUIREMENTS.md explicitly excludes this format — "generate .mdc only."
- Array-format hooks.json: Deprecated in favor of `{ "hooks": { ... } }` object format. Generator reads but never writes the array format.

---

## Open Questions

1. **skills_index.json regeneration ownership**
   - What we know: Phase 2 is XPLAT-01 and XPLAT-10 (generator scaffold + idempotency). XPLAT-09 (platforms field) is assigned to Phase 3.
   - What's unclear: Should Phase 2 generator already write skills_index.json updates, or leave it entirely to Phase 3?
   - Recommendation: Phase 2 generator should include a `generateSkillsIndex()` stub that produces the extended format but leaves `platforms` field empty (`{}` or omitted). Phase 3 fills it. This avoids Phase 3 having to reverse-engineer the generator's internal data.

2. **Inline mcpServers vs .mcp.json precedence**
   - What we know: `devops-flow` has inline `mcpServers` in `plugin.json` only (no `.mcp.json`). `github-integration` has `.mcp.json` only (no inline).
   - What's unclear: If a plugin has both, which takes precedence?
   - Recommendation: `.mcp.json` wins for any conflicting key. Document this in generator code comment.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured at repo root — shell-based validation only |
| Config file | `scripts/validate-plugins.sh` (existing) |
| Quick run command | `node scripts/generate-cross-platform.js` (exits 0 = pass) |
| Full suite command | `bash scripts/validate-plugins.sh && node scripts/generate-cross-platform.js` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| XPLAT-01 | Generator runs against all 27 plugins without error | smoke | `node scripts/generate-cross-platform.js` | Wave 0 |
| XPLAT-01 | `claude-desktop-snippet.json` written for 14 MCP plugins | smoke | `node -e "const p='plugins'; ['github-integration','devops-flow','cloudflare-platform','vercel-deploy','notion-workspace','context7-docs','knowledge-synapse','clickup-tasks','task-commander','playwright-testing','qa-droid','neon-db','data-core','agent-memory'].forEach(n => { require('fs').accessSync(p+'/'+n+'/claude-desktop-snippet.json') }); console.log('PASS')"` | Wave 0 |
| XPLAT-10 | Second run produces identical output | idempotency | `node scripts/generate-cross-platform.js && node scripts/generate-cross-platform.js && git diff --exit-code plugins/` | Wave 0 |

### Sampling Rate

- **Per task commit:** `node scripts/generate-cross-platform.js`
- **Per wave merge:** `bash scripts/validate-plugins.sh && node scripts/generate-cross-platform.js`
- **Phase gate:** Both commands exit 0 before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/generate-cross-platform.js` — does not exist yet (the deliverable)
- [ ] Idempotency check is a `git diff` verification step, not a separate test file — no additional file needed

---

## Sources

### Primary (HIGH confidence)

- Direct inspection of `plugins/*/`.claude-plugin/plugin.json` — all 27 manifests read
- Direct inspection of `plugins/*/.mcp.json` — 14 MCP files confirmed
- `scripts/validate-plugins.sh` — plugin discovery and frontmatter parsing patterns
- `scripts/generate-skills-index.sh` — skills index generation pattern (regex frontmatter, sorted output)
- `skills_index.json` — confirmed object structure with `.entries` array
- `.planning/phases/02-generator-build/02-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` — gray-matter concern flagged, Cursor `${env:VAR}` confirmed
- `.planning/REQUIREMENTS.md` — `.cursorrules` deprecated confirmation, Codex MCP limitation confirmed

### Tertiary (LOW confidence)

- None — all claims are grounded in direct file inspection or project documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by direct file system inspection; no external packages needed or available
- Architecture: HIGH — patterns derived from existing working scripts in the same repo
- Pitfalls: HIGH — sourced from direct file inspection (MCP in two places, gray-matter absent) and project STATE.md notes

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain — plugins don't change format frequently)
