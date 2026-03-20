# AgentHaus Marketplace — Cross-Platform Plugin Ecosystem

## What This Is

A marketplace of 27 production-ready plugins for AI coding agents. Currently Claude Code-native, this milestone makes every plugin work across Claude Code, Codex CLI (OpenAI), Gemini CLI (Google), and Cursor/Windsurf — with audited quality, complete skill implementations, and cross-platform config generation. The existing Next.js 16 storefront and Neon Postgres database remain unchanged.

## Core Value

Every plugin works reliably on every supported AI coding agent — cross-platform compatibility is the foundation everything else builds on.

## Requirements

### Validated

- ✓ 27 plugins with Claude Code-native format (commands, agents, skills, hooks, MCP) — existing
- ✓ Next.js 16 storefront with Neon Postgres and static fallback — existing
- ✓ Plugin validation script (`scripts/validate-plugins.sh`) — existing
- ✓ Marketplace manifest (`marketplace.json` v3.4.0) — existing
- ✓ Skills index for cross-platform discovery (`skills_index.json`) — existing
- ✓ AGENTS.md / GEMINI.md / copilot-instructions.md repo-level configs — existing

### Active

- [ ] All 27 plugins audited: fix broken configs, missing files, stale references
- [ ] All stub SKILL.md files replaced with real implementations (proper YAML frontmatter, trigger descriptions, body content)
- [ ] Cross-platform configs generated for each plugin: Codex CLI (AGENTS.md), Gemini CLI (GEMINI.md), Cursor (.cursorrules)
- [ ] All skills validated against Anthropic's official SKILL.md spec (name ≤64 chars, description ≤1024 chars, "Use when..." triggers)
- [ ] Plugin-level AGENTS.md files generated per plugin (not just repo-level)
- [ ] Format conversion tooling: Claude plugin format → Codex/Gemini/Cursor equivalents
- [ ] Deep research on latest Claude Code plugin best practices, Codex CLI agent format, Gemini CLI config format, Cursor/Windsurf rules format
- [ ] Documentation refresh: README, CONTRIBUTING.md updated for cross-platform guidance

### Out of Scope

- Interactive CLI tool — deferred to next milestone (focus on plugin quality + cross-platform first)
- npm publishing — premature before cross-platform format is validated
- Web storefront changes — storefront works, no changes needed this milestone
- New plugin creation — fix and polish existing 27, don't add more
- Database schema changes — DB layer is stable

## Context

- Brownfield project: 27 plugins exist but vary in completeness. Some skills are stubs with no real SKILL.md body.
- The `plugins-static.ts` fallback is missing 4 newer plugins (seo-geo-rag, gog-workspace, apple-photos, wp-cli-fleet).
- SKILL.md best practices documented in memory: only `name` and `description` in frontmatter, max 64/1024 chars, "Use when..." triggers in description.
- Cross-platform support partially exists: repo-level AGENTS.md, GEMINI.md, copilot-instructions.md. But no per-plugin cross-platform configs.
- The `skills_index.json` (43 KB) already supports cross-platform discovery via npx.
- 5 plugins have hook configs, 7 have MCP configs, 10 have agents — these need platform-specific translation.

## Constraints

- **Format compatibility**: Each AI platform has different config formats. Must research current specs before generating.
- **No breaking changes**: Existing Claude Code functionality must continue working after cross-platform additions.
- **Plugin structure**: Must maintain `.claude-plugin/plugin.json` as canonical format. Cross-platform configs are generated alongside, not replacing.
- **Skill quality**: Anthropic's official spec is the quality bar. Every SKILL.md must pass validation.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cross-platform as core priority | User wants plugins usable across all major AI coding agents | — Pending |
| Claude format stays canonical | Other formats are generated/derived from Claude-native configs | — Pending |
| Deep research before building | Need current specs for Codex CLI, Gemini CLI, Cursor formats | — Pending |
| CLI tool deferred to next milestone | Focus on plugin quality and cross-platform configs first | — Pending |
| Node.js/TypeScript for future CLI | Matches existing stack, npm publishable | — Pending |

---
*Last updated: 2026-03-20 after initialization*
