# Roadmap: Milestone v2.0 — Unified CLI, Universal Runtime Guard & MemPalace Protocol

## Overview

Milestone v1.0 established the foundational 27-plugin cross-platform ecosystem. Milestone v2.0 expands the now 37-plugin marketplace with an autonomous developer toolchain: a unified zero-dependency CLI with self-healing cache repair, an MCP-level Universal Runtime Guard bringing human-in-the-loop safety to non-hook environments (Antigravity, Codex, Cursor, Copilot, Windsurf), and a standardized Multi-Agent Handoff protocol backed by the MemPalace shared memory hub.

## Phases

- [x] **Phase 5: Unified CLI & Self-Healing Installer** - Build `bin/agenthaus.js` CLI with multi-provider detection, doctor diagnostics, and automated runtime cache self-healing (CLI-01, CLI-02, CLI-03, CLI-04).
- [ ] **Phase 6: Universal Runtime Guard** - Implement the MCP safety interceptor for cross-platform destructive action confirmation and policy enforcement (GUARD-01, GUARD-02, GUARD-03, GUARD-04).
- [ ] **Phase 7: Multi-Agent Handoff & MemPalace Protocol** - Standardize inter-agent task handoffs and integrate the local MemPalace shared memory hub across all 37 plugins (MEM-01, MEM-02, MEM-03, MEM-04).
- [ ] **Phase 8: Cross-Platform Integrity & Documentation Refresh** - Wire CI health gates, verify zero cross-platform drift, and refresh documentation for Antigravity, Codex, Claude, Cursor, and Copilot (INFRA-01, INFRA-02, INFRA-03).

## Phase Details

### Phase 5: Unified CLI & Self-Healing Installer

**Goal**: Build a fast, zero-dependency Node.js CLI executable (`bin/agenthaus.js` / `@agenthaus/cli`) providing interactive discovery, multi-provider installation, doctor diagnostics, and automated runtime cache self-healing.
**Depends on**: Milestone v1.0 completion
**Requirements**: CLI-01, CLI-02, CLI-03, CLI-04
**Success Criteria** (what must be TRUE):

  1. Running `bin/agenthaus.js list` displays all 37 plugins with version, category, and supported platform badges.
  2. Running `bin/agenthaus.js doctor` evaluates provider health, hook schema compliance, and MCP binary accessibility across Antigravity, Claude Code, Codex CLI, Cursor, and Copilot.
  3. Running `bin/agenthaus.js sync --all` automatically detects and purges stale caches and obsolete hook definitions from provider directories without manual intervention.
  4. Plugins can be installed interactively or via `--target <provider>` with symlink and copy support.

**Plans**: 2 plans
**Wave 1**

- [x] 05-01-PLAN.md — Build core CLI architecture, provider resolver, and doctor diagnostics

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 05-02-PLAN.md — Implement self-healing sync engine, cache cleaner, and interactive installer

### Phase 6: Universal Runtime Guard

**Goal**: Implement a cross-platform MCP safety interceptor (`agenthaus-safety-guard`) that provides destructive-action confirmation (HITL) across runtimes lacking native PreToolUse hooks (Antigravity, Codex, Cursor, Copilot, Windsurf).
**Depends on**: Phase 5
**Requirements**: GUARD-01, GUARD-02, GUARD-03, GUARD-04
**Success Criteria** (what must be TRUE):

  1. Destructive tool actions (database drop, reset, deployment, deletion) trigger confirmation prompts on non-hook platforms.
  2. Policy engine supports regex matching, dry-run flags, and configurable bypass thresholds.
  3. Safety policies seamlessly protect `circuit-breaker`, `wp-cli-fleet`, `devops-flow`, `activepieces`, and `shadow-mode`.

**Plans**: 2 plans

- [ ] 06-01-PLAN.md — Design and build MCP Safety Guard interceptor proxy and policy engine
- [ ] 06-02-PLAN.md — Wire safety policies across all destructive-action plugins and test across providers

### Phase 7: Multi-Agent Handoff & MemPalace Protocol

**Goal**: Standardize an inter-agent task handoff schema (`agent-handoff`) and integrate the local MemPalace shared memory hub across all 37 marketplace plugins.
**Depends on**: Phase 5, Phase 6
**Requirements**: MEM-01, MEM-02, MEM-03, MEM-04
**Success Criteria** (what must be TRUE):

  1. `agent-handoff` JSON envelope specification is formally defined, documented, and validated with JSON Schema.
  2. All 37 plugin instructions provide MemPalace integration guidelines using canonical agent identity (`polar-bear:antigravity:agenthaus-marketplace`).
  3. Workflow instructions include `/gsd-mempalace-recall` and `/gsd-mempalace-capture` integration patterns.
  4. A reference pipeline (`seo-content-suite` $\to$ `vistasocial-scheduler` $\to$ `wp-cli-fleet`) executes with verified handoffs and MemPalace receipts.

**Plans**: 2 plans

- [ ] 07-01-PLAN.md — Define agent handoff envelope schema and validator
- [ ] 07-02-PLAN.md — Standardize MemPalace MCP integration and build reference multi-agent pipeline

### Phase 8: Cross-Platform Integrity & Documentation Refresh

**Goal**: Wire CI health gates, verify zero cross-platform drift, and refresh documentation for Antigravity, Codex, Claude, Cursor, and Copilot.
**Depends on**: Phase 5, Phase 6, Phase 7
**Requirements**: INFRA-01, INFRA-02, INFRA-03
**Success Criteria** (what must be TRUE):

  1. GitHub Actions CI runs `agenthaus doctor` and verifies zero cache drift on every PR.
  2. `scripts/generate-cross-platform.js` produces zero drift across all 37 plugins.
  3. README, CONTRIBUTING, and per-plugin docs provide clear setup guides for Antigravity, Codex, Claude, Cursor, and Copilot.

**Plans**: 2 plans

- [ ] 08-01-PLAN.md — Add CI doctor checks, drift guards, and test automation
- [ ] 08-02-PLAN.md — Comprehensive documentation refresh across all platforms and plugins

## Progress

**Execution Order:**
Phases execute in numeric order: 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 5. Unified CLI & Self-Healing Installer | 0/2 | Pending | — |
| 6. Universal Runtime Guard | 0/2 | Pending | — |
| 7. Multi-Agent Handoff & MemPalace Protocol | 0/2 | Pending | — |
| 8. Cross-Platform Integrity & Documentation Refresh | 0/2 | Pending | — |

---
*Roadmap created: 2026-09-24 for Milestone v2.0*
