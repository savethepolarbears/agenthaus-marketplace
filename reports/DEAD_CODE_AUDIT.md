# Dead Code & Obsolete Asset Audit

**Date:** 2026-09-17  
**Repository:** `savethepolarbears/agenthaus-marketplace`  
**Auditor:** Antigravity Autonomous Agent  
**Standard:** Multi-Signal Stack-Aware Dead Code Audit Protocol (`/dead-code-audit`)  

---

## 1. Scope & Execution Constraints

- **Scope:** Repository-wide audit covering all 37 production plugins, shell scripts, Python/Node entry points, MCP configuration files, and Markdown command/skill definitions.
- **Library / Public Distribution Invariant:** Public API definitions, agent skill commands, and exported MCP tools are consumed dynamically by external AI agents (Claude Code, Codex CLI, Gemini CLI, Cursor, Windsurf). Unused exports within skills are treated as public agent capabilities unless verified dead via the two-signal rule.

---

## 2. Repository Fingerprint & Entry Points

| Surface | Language / Framework | Primary Entry Points |
| :--- | :--- | :--- |
| **Marketplace Catalog** | JSON Schema | `.claude-plugin/marketplace.json` (37 registered plugins) |
| **Plugins Core** | Claude Plugin Manifests | `plugins/*/.claude-plugin/plugin.json` (37 plugins) |
| **Agent Commands** | Markdown + Frontmatter | `plugins/*/commands/*.md` (95 executable commands) |
| **Agent Skills** | Markdown + Frontmatter | `plugins/*/skills/*/SKILL.md` (177 skills indexed in `skills_index.json`) |
| **Agent Personas** | Markdown + Frontmatter | `plugins/*/agents/*.md` (38 specialized subagents) |
| **PreToolUse Hooks** | Bash Shell | `plugins/*/hooks/scripts/*.sh` (invoked via Claude hook system) |
| **Automation & CI** | Bash & Node.js | `scripts/*.sh`, `scripts/*.js`, `run_checks.sh`, `.github/workflows/ci.yml` |
| **MCP Servers** | Python, Node.js, PHP | `apple_productivity_mcp/server.py`, `plugins/qa-droid/`, `agentic-wp-cli.php` |

---

## 3. Heuristic & Static Graph Analysis

### A. Skills Index Reconciliation

- Total `SKILL.md` files located on disk: **177**
- Total skills registered in `skills_index.json`: **177**
- Orphan or unindexed skills: **0** (100% matched)

### B. Plugin Registry Reconciliation

- Plugin directories located under `plugins/`: **37**
- Plugins registered in `.claude-plugin/marketplace.json`: **37**
- Orphan plugin directories: **0**
- Phantom marketplace entries: **0**

### C. Hook and Script References

- Shell scripts scanned in `plugins/*/hooks/scripts/`: **6** total (5 registered directly as hook triggers in `hooks.json`, plus 1 operational lifecycle utility referenced in command instructions):
  - `plugins/circuit-breaker/hooks/scripts/budget-guard.sh` (registered in `hooks.json`)
  - `plugins/circuit-breaker/hooks/scripts/block-prod-deploy.sh` (registered in `hooks.json`)
  - `plugins/circuit-breaker/hooks/scripts/require-tests.sh` (registered in `hooks.json`)
  - `plugins/apple-photos/hooks/scripts/export-guard.sh` (registered in `hooks.json`)
  - `plugins/wp-cli-fleet/hooks/scripts/production-guard.sh` (registered in `hooks.json`)
  - `plugins/circuit-breaker/hooks/scripts/reset-counter.sh` (operational lifecycle utility referenced in `commands/configure.md` & `README.md`)

---

## 4. Multi-Signal Triangulation & Candidate Findings

Following the **Two-Signal Rule** (requiring at least two independent signals before labeling code as *Probable Dead*):

| Candidate | Signal 1 (Static Graph) | Signal 2 (Runtime / Lifecycle) | Risk | Status | Action Taken / Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`scrub_history.sh`** | Unreferenced in build, CI, or docs | Dangerous destructive git filter script with push force | High | **Confirmed Dead** | Removed from repository tracking in PR #134; added to `.gitignore`. |
| **`.jules/bolt.md`** | Unreferenced in build or agent configs | Residual task tracking log from prior prototyping | Low | **Confirmed Dead** | Pruned in PR #134. |
| **Legacy `/tmp/circuit-breaker-counter`** | Static path replaced by UID isolation | Never created by updated hook; caused command mismatch | Med | **Confirmed Dead** | Updated `commands/configure.md` and docs to reference `reset-counter.sh` and isolated path. |
| **`agenthaus-web` references in `run_checks.sh`** | Directory absent from open-source repo | Caused local test execution failure | Low | **Resolved** | Wrapped in conditional directory check (`if [ -d "agenthaus-web" ]`). |
| **Obsolete `node_modules` shell scripts in qa-droid** | Playwright postinstall shell scripts | Third-party vendor code | Low | **Preserved / Monitored** | Excluded from plugin hook security counts; monitored at warn-only severity for supply chain safety. |

---

## 5. Summary & Ongoing Guardrails

- **Zero Dead Plugins or Skills:** The repository is certified free of unindexed skills, dangling commands, or unmapped plugin directories.
- **Automated Drift & Dead File Detection:** Any newly orphaned or deleted generated files are now caught during CI via `tests/drift-guard.test.js` and `git status --porcelain --untracked-files=all`.
- **Recommended Next Action:** Use `/dead-code-prune-safely` before retiring any future plugin or deprecated hook script.
