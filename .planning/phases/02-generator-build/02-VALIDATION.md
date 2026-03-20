---
phase: 02
slug: generator-build
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js assert + shell diff |
| **Config file** | none — inline test scripts |
| **Quick run command** | `node scripts/generate-cross-platform.js --dry-run 2>&1` |
| **Full suite command** | `node scripts/generate-cross-platform.js && diff <(node scripts/generate-cross-platform.js --output-dir /tmp/gen1) <(node scripts/generate-cross-platform.js --output-dir /tmp/gen2)` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run generator against 1 test plugin
- **After every plan wave:** Run full generator against all 27 plugins
- **Before `/gsd:verify-work`:** Full suite must be green + idempotency diff clean
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | XPLAT-01 | integration | `node scripts/generate-cross-platform.js` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | XPLAT-10 | diff | `diff` two runs | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/generate-cross-platform.js` — generator entry point (created by plan tasks)

*Existing infrastructure covers all phase requirements after Wave 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Platform Limitations section readability | XPLAT-01 | Content quality check | Read generated AGENTS.md for MCP-dependent plugin, verify limitations section is clear |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
