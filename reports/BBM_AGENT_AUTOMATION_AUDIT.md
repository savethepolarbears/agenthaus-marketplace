# Black Bear Media Agent & Automation Governance Audit

**Date:** 2026-09-17  
**Repository:** `savethepolarbears/agenthaus-marketplace`  
**Auditor:** Antigravity Autonomous Agent  
**Standard:** BBM Agent and Automation Governance Protocol (`/bbm-agent-automation-audit`)  

---

## 1. Executive Summary

This audit evaluates the Black Bear Media agent automation ecosystem hosted within `agenthaus-marketplace`. The repository serves as the central hub for 37 production-grade developer plugins, MCP gateways, security circuit breakers, and cross-platform agent integrations.

The audit verified:

1. **Asset Inventory & Coverage:** Plugin manifests, commands, skills, subagents, and hooks.
2. **Cross-Platform Compatibility:** Verification of configurations generated for Claude Code, Codex CLI, Gemini CLI, Cursor, and Windsurf.
3. **Execution Contracts & Guardrails:** Verification that output contracts, path boundaries, permission gates, and non-destructive policies are enforced.
4. **Agent Trigger Integrity:** Verification of standard YAML frontmatter descriptions and "Use when ..." routing signals across all skills.

---

## 2. Asset Inventory & Coverage Matrix

### Global Asset Counts

- **Production Plugins:** 37
- **Executable Commands (`commands/*.md`):** 95
- **Directory Skills (`skills/*/SKILL.md`):** 177
- **Specialized Subagents (`agents/*.md`):** 38
- **PreToolUse / PostToolUse Hooks:** 6
- **MCP Servers Supported:** 23 plugins expose MCP tools; 14 plugins are command/skill-only.

### Cross-Platform Support Matrix

| Platform | Manifest & Discovery | MCP Tool Access | PreToolUse Hooks | Subagent Delegation | Skills Indexing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Claude Code** | Full (`.claude-plugin/plugin.json`) | Full (`.mcp.json`) | Full (`hooks/hooks.json`) | Full (`agents/*.md`) | Full (`skills/*/SKILL.md`) |
| **Codex CLI** | Full (`codex-mcp-config.toml`) | Full (`codex-mcp-config.toml`) | None (CLI limitation) | Full (via prompt injection) | Full (via skills index) |
| **Gemini CLI** | Full (`gemini-settings-snippet.json`) | Full (via settings snippet) | None | Full (`GEMINI.md`) | Full (`GEMINI.md` context) |
| **Cursor IDE** | Full (`.cursor/rules/*.mdc`) | Full (`.cursor/mcp.json`) | None | Via Composer rules | Via `.mdc` rule prompts |
| **Windsurf IDE** | Full (`windsurf-mcp-snippet.json`) | Full (via Cascade snippet) | None | Via Cascade rules | Via Global instructions |

---

## 3. Execution Contracts & Safety Invariants

### A. Report & Output Contract Compliance

- **Rule:** All agent execution reports, audit artifacts, and persistent documentation must be routed to `reports/`.
- **Status:** **PASS / 100% Compliant**. All audit outputs reside in `reports/`:
  - `reports/SECURITY_AND_GIT_AUDIT_2026-09-17.md`
  - `reports/DEPENDENCY_AUDIT.md`
  - `reports/TECHNICAL_DEBT_INVENTORY.md`
  - `reports/DEAD_CODE_AUDIT.md`
  - `reports/CODE_PERFORMANCE_AUDIT.md`
  - `reports/BBM_AGENT_AUTOMATION_AUDIT.md`

### B. Secret Boundary & Environment Hygiene

- **Rule:** Zero hardcoded API keys; `.env` and credential variants must never be tracked; MCP server configurations must use `${ENV_VAR}` interpolation.
- **Status:** **PASS / 100% Compliant**.
  - All 23 MCP configurations use `${ENV_VAR}` syntax.
  - `.env.example` documents all required keys.
  - Gitleaks automated CI scan continuously verifies zero secrets across all PRs.

### C. Circuit Breaker Safety Verification

- **Rule:** Agent tool budgets, test requirements before commit, and production deployment windows must be protected by circuit breakers.
- **Status:** **PASS / 100% Compliant**.
  - `budget-guard.sh` is hardened with CWE-377 private directory isolation (`mode 0700`, owner verification `[ -O ]`, symlink rejection, graceful exit 0).
  - Canonical `reset-counter.sh` entry point provided and tested.

---

## 4. Governance Alignment & Trigger Evaluation

### Frontmatter Trigger Audit

Every skill file was audited for clear trigger descriptions (`name`, `description`).

- **Sample Verified Triggers:**
  - `plugins/circuit-breaker/skills/safety-guardrails/SKILL.md`: *"Configure and manage pre-built safety guardrails for agent workflows including deploy gates, test requirements, and budget warnings. Use when the user asks to set up deployment safety checks, enforce test requirements before commits..."*
  - `plugins/outscraper/skills/data-scraping/SKILL.md`: *"Scrape business data, Google Maps reviews, and social media contacts using Outscraper. Use when the user asks to scrape Google Maps, extract Google reviews, find local businesses, or enrich company contact details."*
  - `plugins/textfocus/skills/seo-analysis/SKILL.md`: *"Analyze SEO keywords, semantic relevance, competition, and search positioning using TextFocus. Use when the user asks to audit on-page SEO, analyze semantic keywords, evaluate competitor keywords..."*
- **Result:** 177/177 skills contain compliant frontmatter with descriptive trigger boundaries.

---

## 5. Summary Findings & Action Items

| Finding | Severity | Category | Status | Action / Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **CWE-377 Temporary File Collision** | P2 | Security | **Resolved** | Counter storage isolated in user-owned private directory mode 0700 with symlink rejection. |
| **Counter Reset Mismatch** | P2 | Reliability | **Resolved** | Provided canonical `reset-counter.sh` and updated all command documentation. |
| **Generator Drift Untracked False Negative** | P2 | CI/CD | **Resolved** | Hardened `.github/workflows/ci.yml` with `--untracked-files=all` and added regression test. |
| **CI Node Runtime Version** | P3 | Maintenance | **Resolved** | Upgraded CI workflow jobs to Node 24 LTS. |
| **Multi-Package Workspace Standardization** | P3 | Architecture | **Tracked** | Currently isolated to `qa-droid`. Plan pnpm workspaces if JS/TS plugin count grows. |
