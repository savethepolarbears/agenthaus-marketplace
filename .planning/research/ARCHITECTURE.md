# Architecture Patterns: Cross-Platform Plugin Config Generation

**Domain:** AI coding agent plugin ecosystem — format conversion pipeline
**Researched:** 2026-03-20
**Overall confidence:** HIGH (platform formats verified via official docs and current search; hook limitations confirmed via primary sources)

---

## Recommended Architecture

The conversion pipeline is a **static generation system**: it reads Claude-native plugin sources and writes committed output files. There is no runtime compilation. The generated files live inside each plugin directory and are version-controlled alongside the source they derive from.

```text
SOURCE (canonical)                    GENERATOR                   OUTPUT (committed)
─────────────────────────────────     ─────────────────────────── ──────────────────────────────────
plugins/<name>/
  .claude-plugin/plugin.json    ──┐
  commands/*.md                 ──┤
  agents/*.md                   ──┤──► scripts/generate-cross-platform.js ──► plugins/<name>/
  skills/<name>/SKILL.md        ──┤                                              AGENTS.md
  hooks/hooks.json              ──┤                                              GEMINI.md
  .mcp.json                     ──┘                                              .cursor/rules/<name>.mdc
                                                                                 .windsurfrules  (optional)

                                                                  ──► skills_index.json  (updated)
```

**Claude format stays canonical.** Other formats are derived. If a Claude-native file changes, re-run the generator to refresh outputs. The generator is idempotent.

---

## Platform Format Reference

### Codex CLI — AGENTS.md

**Confidence:** HIGH (official OpenAI Codex documentation)

- Plain Markdown, no special frontmatter.
- Hierarchical: Codex reads one file per directory walking root → CWD, concatenating with blank-line separators. Later (deeper) files override earlier ones.
- A per-plugin `AGENTS.md` inside `plugins/<name>/` will be auto-discovered when Codex operates in that directory.
- 32 KiB cumulative limit across all loaded files.
- **MCP servers:** Not natively configured via AGENTS.md. MCP config belongs in `~/.codex/config.toml` (global) or `codex.toml` (project-level). The AGENTS.md informs *behavior*; a separate codex.toml handles MCP wiring. For plugin-level distribution, document MCP server setup in the AGENTS.md body as a prose instruction block.
- **Skills:** Codex natively reads `skills/<name>/SKILL.md` using the same SKILL.md spec (name + description frontmatter, Markdown body). Skills are loaded on demand — same progressive disclosure pattern as Claude Code. No conversion needed: the existing SKILL.md files are already valid Codex skills.
- **Hooks:** No PreToolUse/PostToolUse equivalent in Codex CLI as of early 2026. Codex fires `TaskStarted`, `TaskComplete`, `TurnAborted` only. Hook logic cannot be translated automatically — must be documented as manual steps or prose warnings in the AGENTS.md.

### Gemini CLI — GEMINI.md

**Confidence:** HIGH (official Gemini CLI docs and github.com/google-gemini/gemini-cli)

- Plain Markdown. `@file.md` import syntax available for splitting large files.
- Hierarchical: loads `~/.gemini/GEMINI.md` (global), then project-level, then sub-directory files. All concatenated per session.
- A per-plugin `GEMINI.md` inside `plugins/<name>/` is auto-discovered when Gemini operates from that directory.
- **MCP servers:** Configured in `settings.json` under `mcpServers` key — same JSON schema as Claude Code's `.mcp.json` (`command`, `args`, `env`). Env vars auto-expanded. The plugin's `.mcp.json` content can be embedded as a prose code block in the GEMINI.md, with instructions to merge into `~/.gemini/settings.json`. A separate generated `gemini-settings-snippet.json` per plugin provides copy-pasteable config.
- **Skills:** Gemini CLI now supports AGENTS.md natively as an alternative context file name (confirmed by Google's own Android Studio docs and developer forum). SKILL.md files work as-is.
- **Hooks:** No lifecycle hook system. Hook behavior must be documented as prose in the GEMINI.md.

### Cursor — .cursor/rules/\<name>.mdc

**Confidence:** HIGH (cursor.com/docs/context/rules)

- MDC format: YAML frontmatter (`description`, `globs`, `alwaysApply`) + Markdown body.
- `.cursorrules` (legacy single file) still supported but deprecated as of Cursor 0.45+.
- Modern approach: `.cursor/rules/` directory with one `.mdc` per concern.
- `alwaysApply: true` → always injected; `alwaysApply: false` + `globs` → injected only when matching files are in context.
- For a per-plugin rule: generate `.cursor/rules/<plugin-name>.mdc` with `alwaysApply: false` and `globs` scoped to the plugin directory (e.g., `plugins/social-media/**`).
- **MCP servers:** Cursor reads `.cursor/mcp.json` at project root. Same `mcpServers` schema. Generate a merged `.cursor/mcp.json` at repo root from all plugin `.mcp.json` files, or document per-plugin MCP config as a snippet in the `.mdc` body.
- **Skills:** No native SKILL.md support. Embed skill content inline in the `.mdc` body, or reference the SKILL.md path with a note that Cursor does not auto-load it.
- **Hooks:** No equivalent. Document in `.mdc` body as prose constraints ("Before running deploy commands, verify...").

### Windsurf — AGENTS.md (preferred) or .windsurfrules (legacy)

**Confidence:** HIGH (docs.windsurf.com/windsurf/cascade/agents-md)

- Windsurf's Cascade now reads AGENTS.md natively (added March 2026 fix for ignored-AGENTS.md bug).
- Root-level AGENTS.md → always-on rule in system prompt.
- Sub-directory AGENTS.md → auto-generated glob rule applying only when Cascade reads files in that directory.
- A per-plugin `AGENTS.md` inside `plugins/<name>/` works out of the box — Windsurf treats it as a glob-scoped rule for that directory.
- **This means the same AGENTS.md generated for Codex serves Windsurf.** No separate file needed.
- **MCP servers:** Configured via `.windsurf/settings.json` or the global Codeium config — not in AGENTS.md. Same prose-block documentation pattern as GEMINI.md.
- **Hooks:** No equivalent. Document as prose in AGENTS.md.

---

## Component Boundaries

| Component | Responsibility | Input | Output |
|-----------|---------------|-------|--------|
| `scripts/generate-cross-platform.js` | Orchestrator — iterates all 27 plugins, calls format writers | `plugins/*/` directories | Per-plugin platform files |
| `lib/readers/plugin-reader.js` | Reads canonical Claude sources | `.claude-plugin/plugin.json`, `commands/*.md`, `agents/*.md`, `skills/*/SKILL.md`, `hooks/hooks.json`, `.mcp.json` | Normalized plugin data model |
| `lib/writers/agents-md-writer.js` | Renders AGENTS.md (Codex + Windsurf) | Normalized plugin model | `plugins/<name>/AGENTS.md` |
| `lib/writers/gemini-md-writer.js` | Renders GEMINI.md + MCP snippet | Normalized plugin model | `plugins/<name>/GEMINI.md`, `plugins/<name>/gemini-settings-snippet.json` |
| `lib/writers/cursor-mdc-writer.js` | Renders MDC rule file | Normalized plugin model | `plugins/<name>/.cursor/rules/<name>.mdc` |
| `lib/writers/skills-index-writer.js` | Regenerates skills_index.json with platform field | All plugins' normalized models | `skills_index.json` |
| `lib/translators/hook-translator.js` | Translates hooks to prose warnings | `hooks/hooks.json` | Human-readable limitation notices embedded in platform files |
| `lib/translators/mcp-translator.js` | Reformats MCP configs per platform | `.mcp.json` | Embedded snippets or standalone JSON files |

---

## Data Flow: Claude Format to Platform Configs

```
1. READ
   plugin.json           → metadata (name, version, description, tags, mcpServers)
   commands/*.md         → [{ name, description, body, arguments }]
   agents/*.md           → [{ name, description, model, body }]
   skills/*/SKILL.md     → [{ name, description, body }]  (frontmatter parsed)
   hooks/hooks.json      → [{ event, matcher, command }]
   .mcp.json             → { mcpServers: { name: { command, args, env } } }

2. NORMALIZE
   Produce a single JavaScript object per plugin:
   {
     id: "social-media",
     metadata: { name, version, description, tags },
     commands: [...],
     agents: [...],
     skills: [...],
     hooks: [...],          // preserved with "untranslatable" flag where applicable
     mcpServers: { ... }
   }

3. TRANSLATE PER PLATFORM

   → AGENTS.md (Codex + Windsurf)
      Header: plugin name + description
      Commands section: each command as "## /command-name" with description + body
      Agents section: each agent as "## Agent: name" with description + model + body
      Skills section: note that skills/<name>/SKILL.md files are auto-loaded by platform
      Hooks section: "## Lifecycle Hooks" — prose description of what each hook does;
                     note that PreToolUse/PostToolUse are Claude Code-only
      MCP section: code block with .mcp.json content; instructions to merge into platform config

   → GEMINI.md
      Same structure as AGENTS.md with Gemini-specific MCP merge instructions
      @-import syntax used if content exceeds ~200 lines

   → .cursor/rules/<name>.mdc
      Frontmatter: description = plugin description, globs = ["plugins/<name>/**"],
                   alwaysApply = false
      Body: condensed version of AGENTS.md — commands as a reference table,
            agents as bullet list, skills note, hooks as prose constraints,
            MCP as code block with Cursor-specific merge note (.cursor/mcp.json)

   → gemini-settings-snippet.json
      Exact mcpServers block from .mcp.json, ready to merge into ~/.gemini/settings.json

4. WRITE
   Atomic write: generate to temp path, rename on success.
   Skip write if content is identical to existing file (avoid spurious git diffs).

5. UPDATE skills_index.json
   Append "platforms" field to each entry:
   "platforms": ["claude-code", "codex-cli", "gemini-cli", "cursor", "windsurf"]
```

---

## File Layout After Generation

```text
plugins/<name>/
├── .claude-plugin/plugin.json          ← canonical (unchanged)
├── commands/*.md                       ← canonical (unchanged)
├── agents/*.md                         ← canonical (unchanged)
├── skills/<name>/SKILL.md              ← canonical (unchanged, also valid for Codex)
├── hooks/hooks.json                    ← canonical (unchanged)
├── .mcp.json                           ← canonical (unchanged)
├── AGENTS.md                           ← GENERATED: Codex CLI + Windsurf
├── GEMINI.md                           ← GENERATED: Gemini CLI
├── gemini-settings-snippet.json        ← GENERATED: MCP config snippet for Gemini
└── .cursor/
    └── rules/
        └── <name>.mdc                  ← GENERATED: Cursor rule
```

Root-level cross-platform files (already exist, maintained manually):
```text
AGENTS.md                               ← repo-level, maintained manually
GEMINI.md                               ← repo-level, maintained manually
.github/copilot-instructions.md         ← repo-level, maintained manually
.cursorrules                            ← repo-level legacy (keep for now)
.windsurfrules                          ← repo-level legacy (keep for now)
```

---

## Key Architecture Decisions

### Decision 1: Commit generated files, not build-time generation

**Rationale:** Platform tools (Codex CLI, Gemini CLI, Cursor, Windsurf) read files directly from the repo. They do not execute build scripts. If the generated files are not committed, they don't exist for the consuming agent. The OpenAI skills catalog, Gemini CLI docs, and Cursor docs all show committed Markdown configs.

**Consequence:** Generated files must be re-run whenever source changes. A git pre-commit hook or CI check should detect stale generated files (diff `plugin.json` mod time vs. `AGENTS.md` mod time, or hash comparison).

### Decision 2: SKILL.md files need no conversion for Codex or Windsurf

**Rationale:** The SKILL.md format (name + description YAML frontmatter, Markdown body) was originally developed by Anthropic and has been adopted verbatim by Codex CLI and the emerging agentskills.io open standard (confirmed: 30+ platforms adopted it by early 2026, including OpenAI Codex, Gemini CLI, Cursor, Windsurf). The existing `skills/<name>/SKILL.md` files work without modification on all major platforms.

**Consequence:** Phase 1 of the milestone (fix stub SKILL.md files to proper spec) directly unblocks cross-platform compatibility. Fixing skills is the highest-leverage action.

### Decision 3: AGENTS.md serves both Codex CLI and Windsurf

**Rationale:** Windsurf Cascade adopted AGENTS.md natively (confirmed March 2026 changelog). Sub-directory AGENTS.md files are auto-scoped to their containing directory. Generating one AGENTS.md per plugin satisfies both platforms with zero duplication.

**Consequence:** The generator needs only one Markdown template for two platforms.

### Decision 4: Hooks cannot be translated — document, don't convert

**Rationale:** Codex CLI has no PreToolUse/PostToolUse equivalent (confirmed: only TaskStarted, TaskComplete, TurnAborted, with no control-flow response from hook stdout). Gemini CLI, Cursor, and Windsurf have no lifecycle hook system at all. Translating hook shell commands to prose is the only viable cross-platform strategy.

**Consequence:** Plugins that depend heavily on hooks (circuit-breaker, shadow-mode, agent-handoff, social-media, gog-workspace, wp-cli-fleet) will have degraded functionality on non-Claude platforms. The generated files must clearly document this gap. This is an honest limitation, not a bug.

### Decision 5: MCP config is platform-specific, delivered as snippets

**Rationale:** Each platform has its own location for MCP configuration (Claude: `.mcp.json` per plugin; Codex: `codex.toml`; Gemini: `~/.gemini/settings.json`; Cursor: `.cursor/mcp.json`). The `mcpServers` JSON schema is identical across all four. The generator does not merge configs globally — it emits per-plugin snippets that users copy-paste into the appropriate platform config.

**Consequence:** MCP-heavy plugins (devops-flow, knowledge-synapse, task-commander, etc.) require user action beyond installing the plugin. The generated files must include clear, platform-specific MCP setup instructions.

### Decision 6: A single AGENTS.md cannot serve all platforms as a shared file

**Rationale:** While AGENTS.md is a shared format across Codex/Windsurf/Android Studio, Gemini CLI uses GEMINI.md by default (configurable but non-standard to override), and Cursor uses `.mdc` files. A single shared file would satisfy 2 of 4 platforms. The architecture generates platform-specific files to ensure full compatibility and allow platform-optimized content.

**Exception:** The repo-level AGENTS.md (symlink target) legitimately serves Codex, Windsurf, and broadly. The per-plugin AGENTS.md files are the generated artifacts.

---

## skills_index.json Cross-Platform Support

The existing `skills_index.json` already serves as a cross-platform discovery mechanism (referenced via `npx`). Enhancement needed:

```json
{
  "entries": [
    {
      "id": "social-media:social-content",
      "plugin": "social-media",
      "type": "skill",
      "name": "social-content",
      "path": "plugins/social-media/skills/social-content/SKILL.md",
      "description": "...",
      "platforms": ["claude-code", "codex-cli", "gemini-cli", "cursor", "windsurf"],
      "cross_platform_configs": {
        "agents_md": "plugins/social-media/AGENTS.md",
        "gemini_md": "plugins/social-media/GEMINI.md",
        "cursor_mdc": "plugins/social-media/.cursor/rules/social-media.mdc"
      }
    }
  ]
}
```

The `platforms` array reflects what is natively supported. For hooks-dependent plugins, omit the platforms that cannot replicate the hook behavior. The `cross_platform_configs` map lets tooling locate generated files without filesystem walking.

---

## Build Order (Dependency Graph)

```
Phase 1: Fix source quality (no generator dependency)
  ├── Audit all 27 plugin.json files (fix broken paths, stale references)
  ├── Fix stub SKILL.md files (add real frontmatter + body content)
  └── Validate all existing skills against Anthropic spec

Phase 2: Build the generator (depends on Phase 1 source being stable)
  ├── scripts/generate-cross-platform.js (orchestrator)
  ├── lib/readers/plugin-reader.js
  ├── lib/translators/hook-translator.js
  ├── lib/translators/mcp-translator.js
  ├── lib/writers/agents-md-writer.js
  ├── lib/writers/gemini-md-writer.js
  ├── lib/writers/cursor-mdc-writer.js
  └── lib/writers/skills-index-writer.js

Phase 3: Run generator, review output (depends on Phase 2)
  ├── Generate AGENTS.md for all 27 plugins
  ├── Generate GEMINI.md for all 27 plugins
  ├── Generate .cursor/rules/*.mdc for all 27 plugins
  ├── Generate gemini-settings-snippet.json for 7 MCP plugins
  └── Update skills_index.json with platforms + cross_platform_configs fields

Phase 4: Documentation refresh (depends on Phase 3 output existing)
  ├── Update README.md with cross-platform installation per platform
  ├── Update CONTRIBUTING.md with generator usage + regeneration workflow
  └── Update plugins-static.ts to include 4 newer plugins
```

**Critical path:** Phase 1 → Phase 2 → Phase 3 → Phase 4. Phase 1 is the bottleneck. A generator running against stub SKILL.md files produces garbage output. Fix skills first.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Generating at install time
**What:** Running a conversion script when a user installs the plugin, rather than committing generated files.
**Why bad:** Platform tools read static files. They do not execute installation scripts. The generated files would never exist.
**Instead:** Commit generated files. Run generator in CI when source changes.

### Anti-Pattern 2: One mega AGENTS.md at repo root with all 27 plugins
**What:** Concatenate all plugin descriptions into a single repo-level file.
**Why bad:** Codex's 32 KiB cumulative limit. Irrelevant context injected into every session regardless of which plugins are installed. Defeats per-plugin scoping.
**Instead:** Per-plugin AGENTS.md files inside each plugin directory. Codex discovers only the relevant one based on working directory.

### Anti-Pattern 3: Translating hooks as shell commands for other platforms
**What:** Attempt to render `hooks.json` PreToolUse commands into Cursor MDC rules or Gemini GEMINI.md as executable instructions.
**Why bad:** These platforms have no hook execution system. The rendered shell commands would be interpreted as prose, not executed.
**Instead:** Translate hooks to human-readable prose descriptions of the intended behavior, with a clear notice that enforcement only applies on Claude Code.

### Anti-Pattern 4: Global MCP merge at generation time
**What:** Generate a single merged `.cursor/mcp.json` containing all 27 plugins' MCP configs.
**Why bad:** Users install individual plugins, not the entire marketplace. A merged config installs MCP servers for plugins they haven't chosen and may not have credentials for.
**Instead:** Per-plugin MCP snippets. The generator emits `gemini-settings-snippet.json` per plugin; users apply only what they've installed.

---

## Scalability Considerations

| Concern | Now (27 plugins) | At 100 plugins | At 500 plugins |
|---------|-------------------|----------------|----------------|
| Generator runtime | <5 seconds (Node.js, pure file I/O) | <20 seconds | Consider parallelizing per-plugin |
| skills_index.json size | 43 KB (growing) | ~150 KB | Split into paginated index shards |
| Cursor MDC per-plugin | 27 files in `.cursor/rules/` | 100 files — Cursor handles fine | Still fine; Cursor limits are per-file not per-count |
| AGENTS.md per-plugin | Codex 32 KiB limit per directory | Single-plugin file well under limit | Still fine; limit is per-directory not cumulative across all plugins |

---

## Sources

- [AGENTS.md — Custom instructions with Codex](https://developers.openai.com/codex/guides/agents-md) (HIGH confidence)
- [Agent Skills — Codex OpenAI](https://developers.openai.com/codex/skills) (HIGH confidence)
- [AGENTS.md open format — agents.md](https://agents.md/) (MEDIUM confidence)
- [Gemini CLI — GEMINI.md context files](https://geminicli.com/docs/cli/gemini-md/) (HIGH confidence)
- [Gemini CLI — MCP server configuration](https://geminicli.com/docs/tools/mcp-server/) (HIGH confidence)
- [Gemini CLI configuration reference](https://geminicli.com/docs/reference/configuration/) (HIGH confidence)
- [Cursor rules — MDC format](https://cursor.com/docs/context/rules) (HIGH confidence)
- [Windsurf AGENTS.md — Cascade](https://docs.windsurf.com/windsurf/cascade/agents-md) (HIGH confidence)
- [codex-hooks — hook mapping analysis](https://github.com/hatayama/codex-hooks) (MEDIUM confidence — community project, but hook limitations confirmed against official Codex CLI docs)
- [Agent Skills open standard — inference.sh](https://inference.sh/blog/skills/agent-skills-overview) (MEDIUM confidence)
- [Customize Gemini using AGENTS.md — Android Studio](https://developer.android.com/studio/gemini/agent-files) (HIGH confidence — official Google docs confirming AGENTS.md adoption)
