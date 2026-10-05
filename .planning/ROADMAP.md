# Roadmap: v2.1 — The Modular Agentic Runtime

## Overview

Approved 2026-10-05. Preserve Claude-native manifests, CommonJS CLI conventions, external MCP ownership, and provider lifecycle invariants. v2.0 is incomplete: its guard, handoff and integrity requirements move here with original Phase 6–8 ownership. New features continue at Phase 9. Phase 5 summaries exist but final verification is missing; BASE-01 renews that baseline in 06-01 before guard work.

## Phases

- [ ] **Phase 6: Universal Runtime Guard — v2.0 Gap Closure** — Accept the existing CLI baseline and enforce fail-closed approvals at an MCP boundary.
- [ ] **Phase 7: Typed Handoffs & MemPalace — v2.0 Gap Closure** — Provide validated handoff envelopes and a local, reproducible coordination reference flow.
- [ ] **Phase 8: Integrity & Documentation — v2.0 Gap Closure** — Close legacy CI, generation, and documentation gaps with reproducible receipts.
- [ ] **Phase 9: Compatible Skill & Security Metadata** — Define standards-compatible metadata without breaking Claude plugin manifests.
- [ ] **Phase 10: Progressive Disclosure & Skill Read** — Generate deterministic lean discovery and safely retrieve full skills on demand.
- [ ] **Phase 11: Unicode Hygiene & Integrity Lock** — Detect deceptive source content and verify deterministic plugin tree integrity before mutation.
- [ ] **Phase 12: Typed Hook Contracts & Execution Boundaries** — Standardize hook outcomes while enforcing honest execution and environment boundaries.
- [ ] **Phase 13: Atomic Blackboard Coordination** — Prevent duplicate task execution with atomic leases and fenced completion.
- [ ] **Phase 14: Provider Structural Editing & Runtime Proof** — Preserve user configurations while proving the supported transport and lifecycle matrix.

## Phase Details

### Phase 6: Universal Runtime Guard — v2.0 Gap Closure

**Goal:** Accept the existing CLI baseline and enforce fail-closed approvals at an MCP boundary.
**Depends on:** Existing Phase 5 implementation; baseline acceptance renewed in 06-01
**Requirements:** BASE-01, GUARD-01, GUARD-02, GUARD-03, GUARD-04
**Success Criteria:**

1. Existing CLI behavior is exercised and legacy Phase 5 verification is renewed without treating summaries as acceptance.
2. A denied tool call never reaches a local fixture upstream; an authorized call reaches it exactly once.
3. Malformed policies, receipt replay, wrong request/policy/identity, expiry, and unavailable approval all fail closed.
4. Five plugin integrations declare their execution owner; direct tools outside the proxy remain explicitly unprotected.

**Plans:** 2 gap-closure plans
- [ ] 06-01-PLAN.md — tracer and core contract
- [ ] 06-02-PLAN.md — integration and adversarial coverage

### Phase 7: Typed Handoffs & MemPalace — v2.0 Gap Closure

**Goal:** Provide validated handoff envelopes and a local, reproducible coordination reference flow.
**Depends on:** Phase 6
**Requirements:** MEM-01, MEM-02, MEM-03, MEM-04
**Success Criteria:**

1. Invalid envelopes and mismatched correlation or artifact digests stop the reference chain.
2. All 37 discovered plugins have an explicit memory integration status; generated guidance is on demand.
3. MemPalace unavailable/disabled cases preserve native-state fallback and perform no palace writes.
4. Offline reference execution passes without credentials or external publication; live acceptance remains separate.

**Plans:** 2 gap-closure plans
- [ ] 07-01-PLAN.md — tracer and core contract
- [ ] 07-02-PLAN.md — integration and adversarial coverage

### Phase 8: Integrity & Documentation — v2.0 Gap Closure

**Goal:** Close legacy CI, generation, and documentation gaps with reproducible receipts.
**Depends on:** Phase 6, Phase 7
**Requirements:** INFRA-01, INFRA-02, INFRA-03
**Success Criteria:**

1. CI runs isolated health checks without modifying the runner user profile or requiring vendor credentials.
2. Two generation passes and existing drift tests produce identical outputs for all discovered plugins.
3. Documentation lists supported paths, execution owners, approval limits, and fixture versus live evidence.
4. Legacy requirement mapping is complete and evidence records exact source HEAD and scoped policy hashes.

**Plans:** 2 gap-closure plans
- [ ] 08-01-PLAN.md — tracer and core contract
- [ ] 08-02-PLAN.md — integration and adversarial coverage

### Phase 9: Compatible Skill & Security Metadata

**Goal:** Define standards-compatible metadata without breaking Claude plugin manifests.
**Depends on:** Phase 8
**Requirements:** META-01, META-02, META-03
**Success Criteria:**

1. All current canonical manifests retain valid explicit string paths and pass existing validation; current official directory-path semantics receive a real-loader compatibility review.
2. All actual skill files are enumerated separately from the 177-entry commands/agents/skills index.
3. Malformed metadata, unsafe paths, and undeclared permissions produce actionable diagnostics.
4. Extensions are clearly AgentHaus metadata; declarations are never represented as runtime enforcement.

**Plans:** Not yet created; research-backed phase boundary defined.

### Phase 10: Progressive Disclosure & Skill Read

**Goal:** Generate deterministic lean discovery and safely retrieve full skills on demand.
**Depends on:** Phase 9
**Requirements:** CTX-01, CTX-02, CTX-03, CTX-04
**Success Criteria:**

1. Two generation passes produce byte-identical manifests; skill bodies are absent from Tier-1 output.
2. Every discovered skill remains reachable through paged discovery and safe read-by-identity.
3. Provider files preserve unmanaged prose and bounded discovery; malformed markers fail without writes.
4. Tokenizer identity, byte counts, baseline, corpus coverage, and routing test outcomes are recorded.

**Plans:** Not yet created; research-backed phase boundary defined.

### Phase 11: Unicode Hygiene & Integrity Lock

**Goal:** Detect deceptive source content and verify deterministic plugin tree integrity before mutation.
**Depends on:** Phase 9, Phase 10
**Requirements:** SEC-01, SEC-02, LOCK-01, LOCK-02, LOCK-03
**Success Criteria:**

1. Bidi, hidden tag, and zero-width attack fixtures fail; allowed multilingual and literal demonstration fixtures pass only with scoped exceptions.
2. Two lock generations are identical and exclusions cannot hide executable plugin payloads.
3. Changed/missing/added payloads and escaping symlinks cause zero provider writes in strict mode.
4. Lock renewal is explicit; normal verification cannot silently bless modified content.

**Plans:** Not yet created; research-backed phase boundary defined.

### Phase 12: Typed Hook Contracts & Execution Boundaries

**Goal:** Standardize hook outcomes while enforcing honest execution and environment boundaries.
**Depends on:** Phase 6, Phase 11
**Requirements:** HOOK-01, HOOK-02, HOOK-03
**Success Criteria:**

1. Claude hook adapters retain documented event-specific behavior; JSON logging cannot accidentally permit a blocked command.
2. Canary secrets do not reach disallowed child environments or appear in logs and error paths.
3. Timeouts terminate the process tree, output is bounded, and malformed hook results fail safely.
4. Isolation capability tests distinguish environment cleaning from real filesystem/network protection.

**Plans:** Not yet created; research-backed phase boundary defined.

### Phase 13: Atomic Blackboard Coordination

**Goal:** Prevent duplicate task execution with atomic leases and fenced completion.
**Depends on:** Phase 7, Phase 12
**Requirements:** COORD-01, COORD-02, COORD-03
**Success Criteria:**

1. Two competing worker processes yield one enabled owner for each logical task.
2. A reclaimed task rejects every write from its expired owner; heartbeat and completion honor the current fencing token.
3. Crash/restart tests preserve task state and prevent duplicate completion acceptance.
4. Legacy migration is idempotent and backup-backed; SQLite versus file locking is decided against tested platform support.

**Plans:** Not yet created; research-backed phase boundary defined.

### Phase 14: Provider Structural Editing & Runtime Proof

**Goal:** Preserve user configurations while proving the supported transport and lifecycle matrix.
**Depends on:** Phase 8, Phase 10, Phase 11, Phase 12, Phase 13
**Requirements:** PROV-01, PROV-02, PROV-03, PROV-04, E2E-01, E2E-02
**Success Criteria:**

1. User-owned/shared server fixtures survive every uninstall order and all existing lifecycle hardening tests pass.
2. TOML edge-case fixtures preserve unrelated values/comments and malformed configurations produce zero writes.
3. Local stdio/HTTP initialization and calls pass for documented compatible paths; unsupported provider cases remain explicit.
4. All existing and new gates pass, with a receipt that cannot turn generated configuration or replayed evidence into live provider acceptance.

**Plans:** Not yet created; research-backed phase boundary defined.

## Progress

| Phase | Plans | Status | Completed |
|---|---|---|---|
| 6 | 0/2 | Planned | — |
| 7 | 0/2 | Planned | — |
| 8 | 0/2 | Planned | — |
| 9 | 0/TBD | Pending planning | — |
| 10 | 0/TBD | Pending planning | — |
| 11 | 0/TBD | Pending planning | — |
| 12 | 0/TBD | Pending planning | — |
| 13 | 0/TBD | Pending planning | — |
| 14 | 0/TBD | Pending planning | — |
