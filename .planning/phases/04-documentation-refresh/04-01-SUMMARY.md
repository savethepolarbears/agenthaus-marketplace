---
phase: "04"
plan: "01"
subsystem: documentation
tags: [readme, contributing, cross-platform, installation]
dependency_graph:
  requires: []
  provides: [per-platform-installation-docs, cross-platform-contributor-guide]
  affects: [README.md, CONTRIBUTING.md]
tech_stack:
  added: []
  patterns: [per-platform-installation-section, generator-usage-guide]
key_files:
  created: []
  modified:
    - README.md
    - CONTRIBUTING.md
decisions:
  - "Installation section replaces Quick Start — 6-platform coverage is the primary entry point"
  - "Deprecated claude-3-7-sonnet-20250219 removed from agents docs — alias-only policy enforced"
metrics:
  duration: "2 min"
  completed: "2026-03-20T13:08:01Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 04 Plan 01: Documentation Refresh — Installation & Contributing Summary

Per-platform installation section added to README.md covering all 6 supported platforms with copy-paste shell commands; cross-platform contributor guide added to CONTRIBUTING.md documenting generator usage, generated file types, and platform limitation logic.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Add per-platform installation section to README.md | 327f744 | README.md |
| 2 | Add generator usage and cross-platform dev guide to CONTRIBUTING.md | 2c945f2 | CONTRIBUTING.md |

## What Was Built

### README.md

- Replaced single-platform "Quick Start" block with a 6-section "Installation" chapter
- Each platform has a concrete numbered walkthrough with copy-paste shell commands
- Added platforms badge (`platforms-6`) alongside existing version/plugins/license badges
- Updated opening description from "Claude Code" to "Claude Code and other AI coding assistants"
- Platform-specific limitation notes included inline (Codex CLI has no MCP runtime; hooks are Claude Code-exclusive; Windsurf MCP goes to global settings)

### CONTRIBUTING.md

- Added "Cross-Platform Support" section immediately before "Submitting Your Plugin"
- Includes a 6-row generated-files table with file, platform, and purpose columns
- Documents `node scripts/generate-cross-platform.js` as the canonical regeneration command
- Explains idempotency guarantee (byte-for-byte identical on unchanged sources)
- Names the 6 hook-dependent plugins and explains MCP-limited Codex CLI limitation notice logic
- Documents 2 KiB AGENTS.md size budget enforcement
- Removed deprecated pinned model alias `claude-3-7-sonnet-20250219` — replaced with alias-only policy note

## Deviations from Plan

None — plan executed exactly as written.

## Verification

All acceptance criteria confirmed passing:

```
README.md:   Codex CLI, Gemini CLI, claude-desktop-snippet.json, windsurfrules, .cursor/rules, plugin marketplace add — all PASS
CONTRIBUTING.md: Cross-Platform Support section, generator run command, generated file table, hook/MCP limitations, deprecated model removed — all PASS
```

## Self-Check: PASSED

Files exist:
- README.md — FOUND (modified)
- CONTRIBUTING.md — FOUND (modified)

Commits exist:
- 327f744 feat(04-01): add per-platform installation section to README.md
- 2c945f2 docs(04-01): add cross-platform support section to CONTRIBUTING.md
