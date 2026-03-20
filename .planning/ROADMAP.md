# Roadmap: AgentHaus Cross-Platform Plugin Ecosystem

## Overview

27 Claude Code-native plugins exist and work. This milestone makes them work on Codex CLI, Gemini CLI, Cursor, and Windsurf too. The path is: audit and fix all plugin sources until they are trustworthy, build a Node.js generator that reads those sources and emits per-platform config files, run the generator and validate all 27 plugins worth of output, then write the documentation that tells users what they get on each platform. The generator cannot produce correct output from broken sources — Phase 1 is the critical path bottleneck for everything that follows.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Source Audit** - Fix all 27 plugins until sources are trustworthy input for the generator
- [x] **Phase 2: Generator Build** - Build the idempotent Node.js cross-platform config generator (completed 2026-03-20)
- [x] **Phase 3: Generation Run** - Execute generator, validate all output, commit per-platform configs for all 27 plugins (completed 2026-03-20)
- [ ] **Phase 4: Documentation Refresh** - Update README, CONTRIBUTING.md, and plugins-static.ts with cross-platform guidance

## Phase Details

### Phase 1: Source Audit
**Goal**: All 27 plugins have correct, spec-compliant source files that will produce accurate cross-platform output when fed into the generator
**Depends on**: Nothing (first phase)
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03, AUDIT-04, AUDIT-05, AUDIT-06, AUDIT-07, INFRA-01
**Success Criteria** (what must be TRUE):
  1. Running `bash scripts/validate-plugins.sh` produces zero errors across all 27 plugins
  2. Every SKILL.md has YAML frontmatter with `name` (≤64 chars), single-line `description` (≤1024 chars, contains "Use when...")
  3. No agent file references `claude-3-7-sonnet-20250219` — all use the `sonnet` alias
  4. CLAUDE.md is a real file with Claude-specific content, not a symlink to AGENTS.md
  5. skills_index.json entry count matches the actual count of SKILL.md files in the repo
**Plans**: 2 plans
- [x] 01-01-PLAN.md — Fix CLAUDE.md symlinks and agent model references
- [x] 01-02-PLAN.md — Audit SKILL.md metadata and enforce validation

### Phase 2: Generator Build
**Goal**: A working, idempotent `scripts/generate-cross-platform.js` that reads Claude-native plugin sources and emits correct per-platform config files for all 27 plugins
**Depends on**: Phase 1
**Requirements**: XPLAT-01, XPLAT-10
**Success Criteria** (what must be TRUE):
  1. Running `node scripts/generate-cross-platform.js` completes without errors against all 27 plugins
  2. Running the generator twice on unchanged sources produces identical output both times (idempotency verified by diff)
  3. Generated AGENTS.md files for MCP-dependent plugins contain a visible Platform Limitations section stating Codex CLI cannot use MCP tools
  4. Generated Cursor .mdc files use `${env:VAR}` syntax for env vars (not `${VAR}`)
**Plans**: 2 plans
- [ ] 02-01-PLAN.md — Generator scaffold: plugin discovery, data loading, error handling, serialization utilities
- [ ] 02-02-PLAN.md — Claude Desktop snippet renderer + idempotency verification (XPLAT-10)

### Phase 3: Generation Run
**Goal**: All 27 plugins have committed per-platform config files (AGENTS.md, GEMINI.md, .cursor/rules/*.mdc) that accurately reflect each plugin's capabilities and limitations on each target platform
**Depends on**: Phase 2
**Requirements**: XPLAT-02, XPLAT-03, XPLAT-04, XPLAT-05, XPLAT-06, XPLAT-07, XPLAT-08, XPLAT-09, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):
  1. Every plugin directory contains AGENTS.md, GEMINI.md, and at least one .cursor/rules/*.mdc file
  2. Every plugin's AGENTS.md is under 2 KiB and the repo-level AGENTS.md is under 6 KiB
  3. Hook-dependent plugins (circuit-breaker, shadow-mode, agent-handoff, social-media, gog-workspace, wp-cli-fleet) have a hook limitation notice in all three generated formats
  4. skills_index.json contains a `platforms` field for each skill listing which platforms support it
  5. The extended validate-plugins.sh catches AGENTS.md byte count violations and malformed .mdc frontmatter
**Plans**: 2 plans
- [ ] 03-01-PLAN.md — Extend generator with AGENTS.md, GEMINI.md, Cursor .mdc, MCP snippet renderers, skills_index platforms injection
- [ ] 03-02-PLAN.md — Run generator against all 27 plugins, extend validate-plugins.sh, commit output

### Phase 4: Documentation Refresh
**Goal**: Users on any supported platform can read the README and know exactly how to install a plugin and what features they get
**Depends on**: Phase 3
**Requirements**: DOCS-01, DOCS-02, DOCS-03, DOCS-04
**Success Criteria** (what must be TRUE):
  1. README.md contains a per-platform installation section with concrete commands for Claude Code, Codex CLI, Gemini CLI, Cursor, and Windsurf
  2. CONTRIBUTING.md explains how to run the generator and what files it produces, so a contributor can regenerate cross-platform configs after editing a plugin
  3. The storefront static fallback (plugins-static.ts) includes all 27 plugins (seo-geo-rag, gog-workspace, apple-photos, wp-cli-fleet no longer missing)
  4. Each plugin's README has a platform support table showing which features (commands, agents, skills, MCP, hooks) work on each platform
**Plans**: 3 plans
- [ ] 04-01-PLAN.md — README per-platform installation section + CONTRIBUTING.md generator guide
- [ ] 04-02-PLAN.md — plugins-static.ts: add 4 missing plugins and 2 new category entries
- [ ] 04-03-PLAN.md — Per-plugin README platform support tables (all 27 plugins)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Source Audit | 2/2 | Complete | 2026-03-20 |
| 2. Generator Build | 2/2 | Complete   | 2026-03-20 |
| 3. Generation Run | 2/2 | Complete   | 2026-03-20 |
| 4. Documentation Refresh | 0/3 | Not started | - |
