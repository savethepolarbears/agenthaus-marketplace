# Phase 4: Documentation Refresh - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Update user-facing documentation so that users on any supported platform (Claude Code, Codex CLI, Gemini CLI, Cursor, Windsurf, Claude Desktop) know how to install plugins and what features they get. Also update the storefront static fallback to include all 27 plugins.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — the requirements are clear and specific:

- README.md: per-platform installation section with concrete commands for all 6 platforms
- CONTRIBUTING.md: explain how to run the generator and what files it produces
- plugins-static.ts: add 4 missing plugins (seo-geo-rag, gog-workspace, apple-photos, wp-cli-fleet)
- Per-plugin READMEs: platform support table showing which features work where

Claude Desktop installation instructions should reference the `claude-desktop-snippet.json` files generated in Phase 2.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Generated AGENTS.md per plugin — contains platform capability matrix
- Generated claude-desktop-snippet.json — 14 MCP plugins have these
- `agenthaus-web/src/data/plugins-static.ts` — storefront static fallback data
- `README.md` — current project overview
- `CONTRIBUTING.md` — plugin development guide

### Established Patterns
- README uses standard Markdown with installation code blocks
- CONTRIBUTING.md has structured sections for plugin development
- plugins-static.ts uses TypeScript interface for Plugin type

### Integration Points
- README.md at repo root
- CONTRIBUTING.md at repo root
- agenthaus-web/src/data/plugins-static.ts (web storefront)
- Each plugin's README.md

</code_context>

<specifics>
## Specific Ideas

- 6 platforms: Claude Code, Codex CLI, Gemini CLI, Cursor, Windsurf, Claude Desktop
- Claude Code: `/plugin marketplace add` command
- Codex CLI: copy AGENTS.md to project root
- Gemini CLI: copy GEMINI.md, configure MCP in gemini-settings
- Cursor: copy .cursor/ directory, install MCP
- Windsurf: copy .windsurfrules, MCP path TBD
- Claude Desktop: merge claude-desktop-snippet.json into ~/Library/Application Support/Claude/claude_desktop_config.json

</specifics>

<deferred>
## Deferred Ideas

None — all scope items from requirements DOCS-01 through DOCS-04

</deferred>
