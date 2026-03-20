---
phase: 02-generator-build
plan: 01
subsystem: infra
tags: [node, generator, plugins, cross-platform, json, scripts]

# Dependency graph
requires:
  - phase: 01-source-audit
    provides: validated plugin directory structure and confirmed 27 plugins with known .mcp.json patterns
provides:
  - scripts/generate-cross-platform.js with discovery loop, normalized data loading, error aggregation, and stable serialization
  - parseFrontmatter() — regex YAML parser (no external deps)
  - stableStringify() — key-sorted JSON for idempotent output
  - writeIfChanged() — compare-before-write for idempotency
  - loadPlugin() — merges mcpServers from plugin.json and .mcp.json (.mcp.json wins on key conflict)
  - discoverPlugins() — sorted directory scan returning normalized plugin objects
affects: [02-02-renderers, phase-03-output-generation]

# Tech tracking
tech-stack:
  added: []
  patterns: [CommonJS zero-dependency Node.js script, collect-all-errors strategy, key-sorted stable JSON serialization]

key-files:
  created: [scripts/generate-cross-platform.js]
  modified: []

key-decisions:
  - "Zero external dependencies — uses only Node.js stdlib (fs, path)"
  - "CommonJS require() not ES modules — no package.json type:module at repo root"
  - ".mcp.json wins on key conflict when merging mcpServers from both sources"
  - "stableStringify enforced for all JSON output — prevents byte-for-byte inconsistency across runs"
  - "No timestamps injected — pure idempotency; skills_index.json date is the sole exception (Phase 3)"

patterns-established:
  - "Collect-all-errors: iterate all plugins, catch per-plugin, report all at end, exit 1 if any"
  - "Compare-before-write: read existing file first, skip write if content unchanged"
  - "Sorted discovery: always sort plugin dirs before processing for deterministic output"

requirements-completed: [XPLAT-01]

# Metrics
duration: 9min
completed: 2026-03-20
---

# Phase 02 Plan 01: Generator Scaffold Summary

**Zero-dependency Node.js generator scaffold with plugin discovery loop, normalized mcpServers merge, collect-all-errors strategy, and key-sorted stable JSON serialization — discovers all 27 plugins cleanly**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-20T11:27:10Z
- **Completed:** 2026-03-20T11:36:14Z
- **Tasks:** 2
- **Files modified:** 1 (scripts/generate-cross-platform.js — already committed prior to this session)

## Accomplishments
- Generator scaffold created with all five required functions: `parseFrontmatter`, `stableStringify`, `writeIfChanged`, `loadPlugin`, `discoverPlugins`
- Plugin discovery loop correctly finds and sorts all 27 plugin directories deterministically
- mcpServers merge logic handles both inline (plugin.json) and standalone (.mcp.json) sources with .mcp.json winning on key conflict
- Collect-all-errors strategy: per-plugin errors collected and reported together, exit 1 if any
- Validated against all 27 plugins: `validate-plugins.sh` exits 0 with 27 passed, 0 failed, 0 warnings

## Task Commits

Each task was committed atomically:

1. **Task 1: Create generator scaffold with discovery, loading, and utilities** - `9f77e01` (feat)
2. **Task 2: Verify scaffold handles malformed plugin gracefully** - verification-only, no new commit needed

## Files Created/Modified
- `scripts/generate-cross-platform.js` — Generator entry point; exports discoverPlugins, loadPlugin, parseFrontmatter, stableStringify, writeIfChanged

## Decisions Made
- CommonJS (`require`/`module.exports`) over ES modules — no `type:module` in root package.json
- Zero external dependencies — `gray-matter` not installed, `parseFrontmatter` handles all current frontmatter patterns
- `.mcp.json` overrides `plugin.json` inline mcpServers on key conflict (devops-flow has both)
- No timestamps in generated content anywhere — pure idempotency requirement

## Deviations from Plan

None - plan executed exactly as written. The `generate-cross-platform.js` file existed from a prior session commit (`9f77e01`) and matched the plan specification exactly.

## Issues Encountered

None — generator ran cleanly against all 27 plugins on first execution.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Generator scaffold is complete and extension-ready for Phase 02 Plan 02 (renderers)
- All five utility functions are exported via `module.exports` for renderer use
- Plan 02-02 should plug renderers into the `main()` function's generation section
- No blockers

---
*Phase: 02-generator-build*
*Completed: 2026-03-20*
