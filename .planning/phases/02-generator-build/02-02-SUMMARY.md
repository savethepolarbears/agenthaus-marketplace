---
phase: 02-generator-build
plan: "02"
subsystem: generator
tags: [generator, cross-platform, claude-desktop, idempotency, mcp]
dependency_graph:
  requires: [02-01]
  provides: [claude-desktop-snippet.json for all 14 MCP plugins]
  affects: [Phase 03 Cursor renderer]
tech_stack:
  added: []
  patterns: [renderClaudeDesktop, transformEnvVars stub, generateAll loop, writeIfChanged idempotency]
key_files:
  created:
    - plugins/agent-memory/claude-desktop-snippet.json
    - plugins/clickup-tasks/claude-desktop-snippet.json
    - plugins/cloudflare-platform/claude-desktop-snippet.json
    - plugins/context7-docs/claude-desktop-snippet.json
    - plugins/data-core/claude-desktop-snippet.json
    - plugins/devops-flow/claude-desktop-snippet.json
    - plugins/github-integration/claude-desktop-snippet.json
    - plugins/knowledge-synapse/claude-desktop-snippet.json
    - plugins/neon-db/claude-desktop-snippet.json
    - plugins/notion-workspace/claude-desktop-snippet.json
    - plugins/playwright-testing/claude-desktop-snippet.json
    - plugins/qa-droid/claude-desktop-snippet.json
    - plugins/task-commander/claude-desktop-snippet.json
    - plugins/vercel-deploy/claude-desktop-snippet.json
  modified:
    - scripts/generate-cross-platform.js
decisions:
  - "renderClaudeDesktop emits ${VAR} syntax unchanged — Claude Desktop is native ${VAR}, no translation needed"
  - "transformEnvVars() stubbed now so Phase 3 Cursor renderer has a ready architecture hook — cursor branch replaces ${VAR} with ${env:VAR} via regex"
  - "generateAll() loop design allows Phase 3 to add renderCursor(plugin) calls without changing main()"
  - "devops-flow inline mcpServers (no .mcp.json) renders correctly — loadPlugin() merge from plan 02-01 handles this"
metrics:
  duration: ~22 min
  completed: "2026-03-20T11:59:33Z"
  tasks: 2
  files_modified: 15
---

# Phase 02 Plan 02: Claude Desktop Snippet Renderer Summary

Generator extended with Claude Desktop renderer and idempotency-proven write pipeline, emitting `claude-desktop-snippet.json` for all 14 MCP-equipped plugins using alphabetically-stable JSON serialization via `stableStringify`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Claude Desktop renderer and transformEnvVars stub | 46796f1 | scripts/generate-cross-platform.js |
| 2 | Prove idempotency and emit 14 snippets | a59f503 | 14 x plugins/*/claude-desktop-snippet.json |

## What Was Built

Three new functions added to `scripts/generate-cross-platform.js`:

- `transformEnvVars(obj, format)` — stub for per-platform env var syntax translation; `claude`/`claude-desktop` pass through unchanged; `cursor` branch transforms `${VAR}` to `${env:VAR}` via regex (Phase 3 will activate this path)
- `renderClaudeDesktop(plugin)` — returns `null` for non-MCP plugins; for MCP plugins wraps `mcpServers` with `_comment`, `_plugin`, `_version` metadata and runs through `stableStringify`
- `generateAll(plugins, errors)` — unified renderer loop; returns `{ written, skipped }` counts; Phase 3 adds `renderCursor()` calls here without touching `main()`

`main()` updated to call `generateAll()` and report the three-way summary (written / unchanged / no MCP).

Exports updated: `generateAll`, `renderClaudeDesktop`, `transformEnvVars` added to module.exports.

## Verification Results

```
node scripts/generate-cross-platform.js   # run 1: 14 written, 13 skipped (no MCP), 0 errors
node scripts/generate-cross-platform.js   # run 2: 14 unchanged, 0 written, 0 errors
git diff --exit-code -- plugins/*/claude-desktop-snippet.json  # exit 0 (IDEMPOTENCY PASS)
bash scripts/validate-plugins.sh          # 27/27 PASS, 0 failed, 0 warnings
test ! -f plugins/circuit-breaker/claude-desktop-snippet.json  # PASS
```

## Snippet Format

```json
{
  "_comment": "Paste the \"mcpServers\" entries below into your claude_desktop_config.json",
  "_plugin": "github-integration",
  "_version": "1.0.0",
  "mcpServers": {
    "github": {
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "command": "npx",
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

Keys are alphabetically sorted (stableStringify). Files end with `\n` (POSIX-compliant). `${VAR}` syntax is native to Claude Desktop — no translation applied.

## MCP Plugin Coverage

| Plugin | MCP Source | Snippet |
|--------|-----------|---------|
| agent-memory | .mcp.json | written |
| clickup-tasks | .mcp.json | written |
| cloudflare-platform | .mcp.json | written |
| context7-docs | .mcp.json | written |
| data-core | .mcp.json | written |
| devops-flow | plugin.json inline | written |
| github-integration | .mcp.json | written |
| knowledge-synapse | .mcp.json | written |
| neon-db | .mcp.json | written |
| notion-workspace | .mcp.json | written |
| playwright-testing | .mcp.json | written |
| qa-droid | .mcp.json | written |
| task-commander | .mcp.json | written |
| vercel-deploy | .mcp.json | written |

13 non-MCP plugins correctly skipped (no snippet emitted).

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All created files confirmed on disk. All task commits confirmed in git history.

| Item | Status |
|------|--------|
| plugins/github-integration/claude-desktop-snippet.json | FOUND |
| plugins/devops-flow/claude-desktop-snippet.json | FOUND |
| plugins/agent-memory/claude-desktop-snippet.json | FOUND |
| scripts/generate-cross-platform.js | FOUND |
| .planning/phases/02-generator-build/02-02-SUMMARY.md | FOUND |
| commit 46796f1 (Task 1) | FOUND |
| commit a59f503 (Task 2) | FOUND |
