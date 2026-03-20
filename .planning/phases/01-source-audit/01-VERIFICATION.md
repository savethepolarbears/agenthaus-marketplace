---
phase: 01-source-audit
verified: 2026-03-20T10:40:45Z
status: passed
score: 4/5 must-haves verified
re_verification: false
gaps:
  - truth: "CLAUDE.md is a real file with Claude-specific content, not a symlink to AGENTS.md"
    status: partial
    reason: "The symlink was replaced with a real file (not a symlink), but the file's content is byte-for-byte identical to AGENTS.md. The header still reads '# AGENTS.md' and the note inside says 'CLAUDE.md...are symlinks to this AGENTS.md file'. Claude-specific content was not written."
    artifacts:
      - path: "CLAUDE.md"
        issue: "Content identical to AGENTS.md (16471 bytes, diff exits 0). INFRA-01 requires Claude-specific content distinct from AGENTS.md."
    missing:
      - "Rewrite CLAUDE.md body with Claude Code-specific guidance: Claude-only features (hooks, MCP config format, /commands), Claude-specific tips, and remove the AGENTS.md header/symlink note"
      - "Remove or update the note 'CLAUDE.md...are symlinks to this AGENTS.md file' — it is now false and misleading"
human_verification:
  - test: "Confirm CLAUDE.md content provides meaningful Claude Code-specific guidance vs AGENTS.md"
    expected: "CLAUDE.md should have content tailored to Claude Code's unique capabilities: hooks format, MCP config syntax, slash command invocation, and any Claude-specific context a human or AI would need that differs from generic agent guidance"
    why_human: "Whether the content is 'Claude-specific enough' is a judgment call on quality and intent, not a binary file check"
---

# Phase 1: Source Audit Verification Report

**Phase Goal:** All 27 plugins have correct, spec-compliant source files that will produce accurate cross-platform output when fed into the generator
**Verified:** 2026-03-20T10:40:45Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | CLAUDE.md is a real file with Claude-specific content, not a symlink to AGENTS.md | PARTIAL | File is not a symlink (`-rw-r--r--`, 16471 bytes). Content is byte-for-byte identical to AGENTS.md — `diff` exits 0. Header reads `# AGENTS.md`. |
| 2 | No agent file references `claude-3-7-sonnet-20250219` | VERIFIED | `grep -rl 'claude-3-7-sonnet-20250219' plugins/*/agents/` returns empty (exit 1 = no matches). Spot-checked `sdet-agent.md` uses `model: sonnet`. |
| 3 | Every SKILL.md has YAML frontmatter with correct name and single-line description containing "Use when..." | VERIFIED | Python audit of all 28 SKILL.md files: 28/28 pass. All have `name`, `description`, and "Use when..." in frontmatter. |
| 4 | Running `bash scripts/validate-plugins.sh` produces zero errors across all 27 plugins | VERIFIED | Output: "27 plugins checked, 27 passed, 0 failed, 0 warnings". Exit 0 confirmed. |
| 5 | skills_index.json entry count matches the actual count of SKILL.md files in the repo | VERIFIED | `find plugins/*/skills -name '*.md' | wc -l` = 28. Index has 110 entries total covering 28 skills, 13 agents, 69 commands. Validate script confirms "entry count (110) matches file count (110)". |

**Score:** 4/5 truths verified (Truth 1 partially satisfied — infrastructure condition met, content condition not met)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `CLAUDE.md` (root) | Real file with Claude-specific content | STUB | Real file confirmed. Content identical to AGENTS.md — no Claude-specific differentiation. |
| `plugins/*/agents/*.md` | Agent files with `model: sonnet` alias | VERIFIED | 0 files use `claude-3-7-sonnet-20250219`. Spot-checked `qa-droid/agents/sdet-agent.md` and `social-media/agents/trend-analyzer.md` — both use `model: sonnet`. |
| `plugins/*/skills/*.md` | 28 SKILL.md files with correct YAML frontmatter | VERIFIED | 28 files found, all pass name/description/"Use when..." checks. |
| `scripts/validate-plugins.sh` | Validation logic including `validate_skills()` | VERIFIED | Function exists at line 356. `validate_skills_index()` at line 397. Both called in main validation loop. |
| `skills_index.json` | Accurate index matching file count | VERIFIED | 110 entries, generated 2026-03-20, count matches physical files. |

---

### Key Link Verification

No key links were defined in either plan's `must_haves.key_links` (both were `[]`). No wiring verification applicable for this phase — all artifacts are standalone files.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUDIT-01 | 01-01 | All 27 plugin.json manifests validated (name, version, description, author, tags) | SATISFIED | Python check: 27/27 manifests present and valid. All required fields confirmed. |
| AUDIT-02 | 01-01 | All stub SKILL.md replaced with spec-compliant implementations | SATISFIED | 28/28 SKILL.md files have correct YAML frontmatter. No stubs detected. |
| AUDIT-03 | 01-01 | Deprecated model references fixed (claude-3-7-sonnet-20250219 → sonnet) | SATISFIED | Zero grep matches for old model name in agents/. |
| AUDIT-04 | 01-01 | All file references in plugin.json point to existing files | SATISFIED | 118 file references checked via Python script — 0 dead references. validate-plugins.sh also confirms (27 passed). |
| AUDIT-05 | 01-01 | All .mcp.json files validated (valid JSON, mcpServers schema, ${ENV_VAR} interpolation) | SATISFIED | 14 .mcp.json files all have `mcpServers` key, valid JSON. No hardcoded secrets detected (no `sk-`, `ghp_`, `Bearer `, `eyJ` patterns without `${}`). |
| AUDIT-06 | 01-02 | All hooks/hooks.json files use object format (not deprecated array format) | SATISFIED | 9 hook JSON files checked: all return `"OBJECT"` from `jq type`. None are arrays. |
| AUDIT-07 | 01-02 | skills_index.json regenerated from live sources and validated against actual file count | SATISFIED | Regenerated 2026-03-20, 110 entries. validate-plugins.sh confirms count match. |
| INFRA-01 | 01-01 | CLAUDE.md symlink decoupled from AGENTS.md (converted to real file with Claude-specific content) | BLOCKED | Symlink removed (real file confirmed). Content is byte-for-byte identical to AGENTS.md. The "with Claude-specific content" half of this requirement is not met. `diff CLAUDE.md AGENTS.md` exits 0. |

**Orphaned requirements check:** REQUIREMENTS.md maps AUDIT-01 through AUDIT-07 and INFRA-01 to Phase 1. Both plans claim all 8 IDs. No orphaned requirements.

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `CLAUDE.md` | Content identical to AGENTS.md — header reads `# AGENTS.md`, body note says "CLAUDE.md...are symlinks to this AGENTS.md file" | Warning | Misleading documentation: Claude Code consumers reading CLAUDE.md will see content about symlinks that no longer exist, and receive no Claude-specific guidance |

---

### Human Verification Required

#### 1. CLAUDE.md Content Quality

**Test:** Open `CLAUDE.md` and compare it to `AGENTS.md` side-by-side. Confirm whether the CLAUDE.md content provides Claude Code-specific guidance distinct from generic agent guidance.
**Expected:** CLAUDE.md should contain Claude Code-specific content: hooks configuration syntax, MCP config format (`${ENV_VAR}`), slash command invocation, Claude-specific capabilities, and should not reference "CLAUDE.md...are symlinks to AGENTS.md".
**Why human:** Whether the existing content is "adequate" for the generator's needs is a judgment call. A programmatic check confirms they are identical — but only a human can decide if the identical content is intentionally acceptable or an oversight.

---

### Gaps Summary

One gap blocks full goal achievement: **INFRA-01 content half unmet.**

The SUMMARY for plan 01-01 documents a deliberate decision: "the plugins directory didn't have symlinked CLAUDE.md files or the old claude model name, but root CLAUDE.md was fixed as requested." The plan's stated self-check was only "test -z '$(find plugins -name CLAUDE.md -type l)'" — which passes because there were never any plugin-level CLAUDE.md symlinks to begin with.

The root CLAUDE.md was converted from a symlink to a real file (commit `999445a`), satisfying the infrastructure half of INFRA-01. However, the content was copied verbatim from AGENTS.md without Claude-specific customization. The ROADMAP's Success Criterion #4 for Phase 1 states: "CLAUDE.md is a real file with **Claude-specific content**, not a symlink to AGENTS.md." The content condition is not satisfied.

This gap is low-risk for the generator (Phase 2) because the generator reads per-plugin sources (plugin.json, agents, skills, hooks) — not the root CLAUDE.md. However, it leaves INFRA-01 partially unmet and creates misleading documentation that contradicts the current state (the file claims it is a symlink when it is not).

**All other requirements (AUDIT-01 through AUDIT-07) are fully satisfied.** The validation infrastructure is working correctly, all 27 plugin manifests pass, skills are compliant, hooks use object format, and the skills index is accurate.

---

_Verified: 2026-03-20T10:40:45Z_
_Verifier: Claude (gsd-verifier)_
