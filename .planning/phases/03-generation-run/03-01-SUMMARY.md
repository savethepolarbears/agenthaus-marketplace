---
phase: 03-generation-run
plan: 01
subsystem: generator
tags: [cross-platform, codex, gemini, cursor, windsurf, mcp, skills]
dependency_graph:
  requires: [02-02]
  provides: [03-02]
  affects: [plugins/*/AGENTS.md, plugins/*/GEMINI.md, plugins/*/.cursor/, plugins/*/gemini-settings-snippet.json, AGENTS.md, skills_index.json]
tech_stack:
  added: []
  patterns: [compare-before-write idempotency, Buffer.byteLength byte gates, stableStringify for JSON consistency]
key_files:
  created:
    - plugins/*/AGENTS.md (27 files)
    - plugins/*/GEMINI.md (27 files)
    - plugins/*/.cursor/rules/*.mdc (27 files)
    - plugins/*/.cursor/mcp.json (14 MCP plugins)
    - plugins/*/gemini-settings-snippet.json (14 MCP plugins)
    - AGENTS.md (repo-level, 3114 bytes)
  modified:
    - scripts/generate-cross-platform.js
    - skills_index.json
decisions:
  - "renderAgentsMd uses Buffer.byteLength (not str.length) for the 2 KiB gate — multibyte-safe"
  - "renderRepoAgentsMd pushes to errors[] rather than throwing — keeps generator running even on budget overrun"
  - "injectSkillsPlatforms always assigns all 5 platforms to every entry — skills are Markdown, platform-agnostic"
  - "Both tasks implemented in single file edit — no architectural split needed between Task 1 and Task 2 functions"
metrics:
  duration_min: 15
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_changed: 114
---

# Phase 03 Plan 01: Cross-Platform Renderer Functions Summary

Six renderer functions and a skills_index.json mutator added to `scripts/generate-cross-platform.js`, making the generator capable of emitting all per-platform config files for all 27 plugins in a single idempotent run.

## What Was Built

**renderAgentsMd** — Codex CLI / Windsurf instruction file with 2 KiB byte gate, platform capability matrix table, hook limitation notice, Codex MCP limitation notice, and env vars section.

**renderGeminiMd** — Gemini CLI context file with `@plugins/<name>/README.md` @include reference, optional MCP setup section, and hook notice.

**renderCursorMdc** — Cursor MDC rule file with YAML frontmatter (`description`, `globs`, `alwaysApply`), MCP configuration section, and hook notice.

**renderCursorMcp** — `.cursor/mcp.json` with `${env:VAR}` Cursor syntax via `transformEnvVars(mcpServers, 'cursor')`. MCP plugins only.

**renderGeminiSettingsSnippet** — `gemini-settings-snippet.json` passthrough snippet for Gemini CLI settings. MCP plugins only.

**renderRepoAgentsMd** — Repo-level `AGENTS.md` built from manifest data only (not derived from CLAUDE.md). Plugin table + platform support matrix. 6 KiB byte gate.

**injectSkillsPlatforms** — Mutates `skills_index.json` entries to add `platforms: ['claude-code', 'codex', 'cursor', 'gemini', 'windsurf']` to every entry.

## Verification Results

| Check | Result |
|-------|--------|
| Generator exits 0 | PASS |
| 0 errors on first run | PASS |
| Idempotency (second run = 0 written) | PASS |
| github-integration has all 5 files | PASS |
| marketplace-cli (no MCP) has only AGENTS.md + GEMINI.md | PASS |
| Cursor mcp.json contains `env:` syntax | PASS |
| circuit-breaker/AGENTS.md has hook notice | PASS |
| github-integration/AGENTS.md has Codex CLI notice | PASS |
| Repo AGENTS.md bytes = 3114 (< 6144) | PASS |
| skills_index.json all entries have platforms | PASS |

## Commits

- `b5b8c2c`: feat(03-01): add renderAgentsMd, renderGeminiMd, renderCursorMdc renderers
- `a668ade`: feat(03-01): run generator — emit AGENTS.md, GEMINI.md, .cursor/, gemini-settings-snippet.json

## Deviations from Plan

None — plan executed exactly as written. Both tasks were implemented in a single file edit since they share the same target file; functionally equivalent to two sequential commits.

## Self-Check: PASSED

- `scripts/generate-cross-platform.js` — present and syntax-clean
- `AGENTS.md` — present at repo root, 3114 bytes
- `plugins/github-integration/AGENTS.md` — present
- `plugins/github-integration/.cursor/mcp.json` — present
- `skills_index.json` — platforms field confirmed present in all entries
- Commits b5b8c2c and a668ade — confirmed in git log
