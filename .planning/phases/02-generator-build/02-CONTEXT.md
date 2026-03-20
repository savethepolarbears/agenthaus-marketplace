# Phase 2: Generator Build - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Build `scripts/generate-cross-platform.js` — a Node.js script that reads Claude Code-native plugin sources (plugin.json, agents/, skills/, hooks/, .mcp.json) and emits per-platform config files for 6 target platforms: Codex CLI (AGENTS.md), Gemini CLI (GEMINI.md), Cursor (.cursor/rules/*.mdc), Windsurf (.windsurfrules), Claude Desktop (claude-desktop-snippet.json), and platform capability matrix updates.

</domain>

<decisions>
## Implementation Decisions

### Claude Desktop Integration
- Generate MCP config snippets only (`claude-desktop-snippet.json` per plugin) — Claude Desktop only supports MCP servers, not commands/agents/skills/hooks
- Place snippets at `plugins/<name>/claude-desktop-snippet.json` for MCP-equipped plugins (14 of 27)
- Add "Claude Desktop" column to platform support matrix showing MCP-only support
- Include in this milestone (Phases 2-4), not deferred

### Claude's Discretion
- Generator architecture (single-pass vs multi-pass, template engine vs string concat)
- File I/O patterns (sync vs async, streaming vs buffered)
- Error handling strategy (fail-fast vs collect-all-errors)
- Template format for generated files

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/validate-plugins.sh` — plugin discovery loop pattern (iterates all 27 plugins)
- `.mcp.json` files in 14 plugins — source data for Claude Desktop snippets
- `skills_index.json` — existing index format to extend with `platforms` field
- `plugins/*/plugin.json` — manifest with capabilities, tags, env vars

### Established Patterns
- Shell scripts in `scripts/` for tooling
- JSON configs throughout (plugin.json, .mcp.json, hooks.json)
- YAML frontmatter in Markdown files (agents, skills, commands)
- `${ENV_VAR}` interpolation in MCP configs
- kebab-case for file/directory names

### Integration Points
- Generator reads from: `plugins/*/` (all plugin directories)
- Generator writes to: each plugin directory (per-platform files)
- Generator updates: `skills_index.json` (platforms field)
- Validation: `scripts/validate-plugins.sh` will need Phase 3 extensions

</code_context>

<specifics>
## Specific Ideas

- Claude Desktop uses `claude_desktop_config.json` at `~/Library/Application Support/Claude/` (macOS) — snippets should be copy-pasteable into that file
- `.mcp.json` env var syntax `${VAR}` needs no translation for Claude Desktop (same format)
- Cursor uses `${env:VAR}` syntax (different from Claude/Desktop `${VAR}`)
- AGENTS.md must stay under 2 KiB per plugin, 6 KiB repo-level

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>
