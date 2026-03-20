# Requirements: AgentHaus Cross-Platform Plugin Ecosystem

**Defined:** 2026-03-20
**Core Value:** Every plugin works reliably on every supported AI coding agent

## v1 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Plugin Audit

- [ ] **AUDIT-01**: All 27 plugin.json manifests validated (required fields: name, version, description, author, tags)
- [ ] **AUDIT-02**: All stub SKILL.md files replaced with spec-compliant implementations (YAML frontmatter with name ≤64 chars, description ≤1024 chars with "Use when..." triggers, body content)
- [ ] **AUDIT-03**: Deprecated model references fixed in agent files (claude-3-7-sonnet-20250219 → sonnet alias)
- [ ] **AUDIT-04**: All file references in plugin.json point to existing files
- [ ] **AUDIT-05**: All .mcp.json files validated (valid JSON, mcpServers schema, ${ENV_VAR} interpolation)
- [ ] **AUDIT-06**: All hooks/hooks.json files use object format (not deprecated array format)
- [ ] **AUDIT-07**: skills_index.json regenerated from live sources and validated against actual file count

### Cross-Platform Generation

- [x] **XPLAT-01**: Node.js generator script built (scripts/generate-cross-platform.js) that reads Claude-native sources and emits per-platform configs
- [ ] **XPLAT-02**: Per-plugin AGENTS.md generated for Codex CLI and Windsurf (prose Markdown, under 2 KiB each)
- [ ] **XPLAT-03**: Per-plugin GEMINI.md generated for Gemini CLI (with @include for supplemental content where needed)
- [ ] **XPLAT-04**: Per-plugin .cursor/rules/<name>.mdc generated for Cursor (MDC format with description, globs, alwaysApply frontmatter)
- [ ] **XPLAT-05**: MCP config snippets generated for Gemini (gemini-settings-snippet.json) and Cursor (.cursor/mcp.json with ${env:VAR} syntax)
- [ ] **XPLAT-06**: Platform limitation notices embedded in generated files for hook-dependent plugins (circuit-breaker, shadow-mode, agent-handoff, social-media, gog-workspace, wp-cli-fleet)
- [ ] **XPLAT-07**: Platform limitation notices embedded for MCP-dependent plugins on Codex (devops-flow, knowledge-synapse, data-core, agent-memory, clickup-tasks, task-commander, qa-droid)
- [ ] **XPLAT-08**: Platform capability matrix table generated per plugin (what works on Claude/Codex/Gemini/Cursor/Windsurf)
- [ ] **XPLAT-09**: skills_index.json extended with platforms field for cross-platform discovery
- [ ] **XPLAT-10**: Generator is idempotent (re-running on unchanged sources produces identical output)

### Infrastructure

- [ ] **INFRA-01**: CLAUDE.md symlink decoupled from AGENTS.md (converted to real file with Claude-specific content)
- [ ] **INFRA-02**: Repo-level AGENTS.md kept under 6 KiB for Codex compatibility
- [ ] **INFRA-03**: Validation script (validate-plugins.sh) extended with cross-platform checks (AGENTS.md byte count, .mdc frontmatter validation, file reference resolution)

### Documentation

- [ ] **DOCS-01**: README.md updated with per-platform installation instructions (Claude Code, Codex CLI, Gemini CLI, Cursor, Windsurf)
- [ ] **DOCS-02**: CONTRIBUTING.md updated with generator usage and cross-platform development guide
- [ ] **DOCS-03**: plugins-static.ts updated to include 4 missing plugins (seo-geo-rag, gog-workspace, apple-photos, wp-cli-fleet)
- [ ] **DOCS-04**: Per-plugin README sections document which features are available on which platform

## v2 Requirements

Deferred to future milestone. Tracked but not in current roadmap.

### Interactive CLI

- **CLI-01**: Interactive terminal plugin manager (browse, search, filter by category/tag)
- **CLI-02**: Plugin install/uninstall across platforms
- **CLI-03**: Environment variable configuration wizard
- **CLI-04**: Cross-platform format conversion CLI command

### Extended Platform Support

- **EXT-01**: GitHub Copilot skills support (.github/skills/*.md) — when GA
- **EXT-02**: OpenClaw format bridge
- **EXT-03**: LSP config cross-platform equivalents
- **EXT-04**: npm package publication of CLI tool

### Automation

- **AUTO-01**: GitHub Actions CI for cross-platform validation on PRs
- **AUTO-02**: Automated stale-detection for generated files
- **AUTO-03**: Hook-equivalent prose context for Gemini/Cursor/Windsurf (behavior guidance without enforcement)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Web storefront changes | Storefront works, no changes needed this milestone |
| New plugin creation | Fix and polish existing 27, don't add more |
| Database schema changes | DB layer is stable |
| Runtime hook translation | Hooks are Claude Code-exclusive by design; prose warnings only |
| Codex MCP support | Codex CLI does not implement MCP; document limitation, don't work around |
| GitHub Copilot hooks | Preview/not GA as of March 2026 |
| .cursorrules file generation | Deprecated format since Cursor 0.45+; generate .mdc only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 1 | Pending |
| AUDIT-02 | Phase 1 | Pending |
| AUDIT-03 | Phase 1 | Pending |
| AUDIT-04 | Phase 1 | Pending |
| AUDIT-05 | Phase 1 | Pending |
| AUDIT-06 | Phase 1 | Pending |
| AUDIT-07 | Phase 1 | Pending |
| XPLAT-01 | Phase 2 | Complete |
| XPLAT-02 | Phase 3 | Pending |
| XPLAT-03 | Phase 3 | Pending |
| XPLAT-04 | Phase 3 | Pending |
| XPLAT-05 | Phase 3 | Pending |
| XPLAT-06 | Phase 3 | Pending |
| XPLAT-07 | Phase 3 | Pending |
| XPLAT-08 | Phase 3 | Pending |
| XPLAT-09 | Phase 3 | Pending |
| XPLAT-10 | Phase 2 | Pending |
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 3 | Pending |
| INFRA-03 | Phase 3 | Pending |
| DOCS-01 | Phase 4 | Pending |
| DOCS-02 | Phase 4 | Pending |
| DOCS-03 | Phase 4 | Pending |
| DOCS-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after initial definition*
