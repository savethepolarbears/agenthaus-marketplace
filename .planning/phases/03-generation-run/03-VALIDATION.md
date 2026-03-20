---
phase: 03
slug: generation-run
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | bash (validate-plugins.sh) + node (generator self-test) |
| **Config file** | `scripts/validate-plugins.sh` |
| **Quick run command** | `node scripts/generate-cross-platform.js` |
| **Full suite command** | `bash scripts/validate-plugins.sh` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** `node scripts/generate-cross-platform.js`
- **After every plan wave:** `bash scripts/validate-plugins.sh`
- **Before `/gsd:verify-work`:** All 27 plugins validated, 0 failures
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | XPLAT-02,03,04,05,06,07,08 | smoke | `node scripts/generate-cross-platform.js` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | XPLAT-09 | smoke | `python3 -c "import json; print(all('platforms' in e for e in json.load(open('skills_index.json'))['entries']))"` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | INFRA-02,INFRA-03 | automated | `bash scripts/validate-plugins.sh` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | ALL | integration | `bash scripts/validate-plugins.sh && node scripts/generate-cross-platform.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Two new validate functions in `scripts/validate-plugins.sh` — AGENTS.md byte count, .mdc frontmatter
- [ ] Generator smoke counts (exit code 0) — covers XPLAT-02 through XPLAT-09

*Created by plan tasks in Wave 1 and Wave 2.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Platform limitation notice readability | XPLAT-06, XPLAT-07 | Content quality | Read AGENTS.md for circuit-breaker (hooks) and github-integration (MCP) — verify limitation text is clear |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
