# Phase 3: Generation Run - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the Phase 2 generator with AGENTS.md, GEMINI.md, and Cursor .mdc renderers. Run against all 27 plugins. Commit generated files. Extend validation script with cross-platform checks. Update skills_index.json with platforms field.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — this is a generator extension phase building on the proven Phase 2 architecture. Key constraints from requirements:

- AGENTS.md: prose Markdown, under 2 KiB per plugin, 6 KiB repo-level
- GEMINI.md: Gemini CLI format with @include for supplemental content
- Cursor .mdc: MDC format with description, globs, alwaysApply frontmatter, `${env:VAR}` syntax for env vars
- Hook-dependent plugins (circuit-breaker, shadow-mode, agent-handoff, social-media, gog-workspace, wp-cli-fleet): limitation notice in all generated formats
- MCP-dependent plugins on Codex: limitation notice (Codex can't use MCP tools)
- Platform capability matrix: table showing what works where per plugin
- skills_index.json: add `platforms` field per skill
- Validation script: extend with AGENTS.md byte count checks, .mdc frontmatter validation
- Claude Desktop snippets already handled in Phase 2

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/generate-cross-platform.js` — Phase 2 scaffold with discovery, loading, `stableStringify()`, `writeIfChanged()`, `transformEnvVars()`, `renderClaudeDesktop()`
- `scripts/validate-plugins.sh` — validation framework with skill/hook/manifest checks
- `skills_index.json` — 110 entries, needs `platforms` field addition
- Each plugin's `plugin.json` — has capabilities, tags, env vars for matrix generation

### Established Patterns
- Renderers return string content, `writeIfChanged()` handles I/O
- `transformEnvVars(str, format)` already stubs cursor format translation
- Zero-dependency CommonJS pattern
- Collect-all-errors strategy

### Integration Points
- Generator writes to each `plugins/<name>/` directory
- Validation script runs post-generation to catch issues
- skills_index.json at repo root

</code_context>

<specifics>
## Specific Ideas

- Hook-dependent plugins list: circuit-breaker, shadow-mode, agent-handoff, social-media, gog-workspace, wp-cli-fleet
- MCP-dependent plugins on Codex: devops-flow, knowledge-synapse, data-core, agent-memory, clickup-tasks, task-commander, qa-droid
- Cursor .mdc frontmatter format: `---\ndescription: ...\nglobs: ...\nalwaysApply: true\n---`
- GEMINI.md needs to reference MCP server setup for applicable plugins
- Platform support: Claude Code (full), Codex CLI (no MCP/hooks), Gemini CLI (no hooks, MCP via gemini-settings), Cursor (no hooks, MCP via .cursor/mcp.json), Windsurf (no hooks, MCP TBD), Claude Desktop (MCP only)

</specifics>

<deferred>
## Deferred Ideas

None — all scope items are from existing requirements

</deferred>
