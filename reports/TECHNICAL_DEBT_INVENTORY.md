# Technical Debt Inventory & Register

**Date:** 2026-09-17  
**Repository:** `savethepolarbears/agenthaus-marketplace`  
**Scope:** Repository-wide audit covering all 37 plugins, CI/CD workflows, scripts, and multi-agent configurations  

---

## 1. Snapshot Baseline Metrics

| Metric | Measurement | Context & Details |
| :--- | :--- | :--- |
| **Total Lines of Code (LOC)** | 42,815 | Measured across 625 git-tracked files |
| **File Count by Type** | 625 files | 349 Markdown (`.md`), 174 JSON (`.json`), 37 Cursor MDC (`.mdc`), 24 Codex TOML (`.toml`), 11 Shell (`.sh`), 5 JavaScript (`.js`), 4 TypeScript (`.ts`), 4 Python (`.py`), 1 PHP (`.php`), 2 YAML (`.yml`) |
| **Active Production Plugins** | 37 plugins | 100% registered in `.claude-plugin/marketplace.json` and validated |
| **Dependencies** | 2 runtime dependencies | Isolated to `plugins/qa-droid/package.json` (`@modelcontextprotocol/sdk`, `playwright`) with pinned `overrides` |
| **Test Suite Execution Time** | ~270 ms | 10 passing tests across 2 suites (`tests/circuit-breaker.test.js`, `tests/drift-guard.test.js`, `tests/generate-cross-platform.test.js`) |
| **Marketplace Validation Time** | ~4.5 s | Full schema, symlink, hook security, and index verification for 37 plugins |
| **Bundle Footprint** | N/A | Modular developer tooling and plugin distribution (no compiled web bundle in OSS distribution) |

---

## 2. Debt Signal Scans

- **TODOs / FIXMEs / HACKs:** 0 active markers in runtime code. Traces in repository are strictly confined to hash strings in `package-lock.json` and documentation examples.
- **Lint & Type-Check Suppressions:** 0 suppressions detected across all source languages (`eslint-disable`, `@ts-ignore`, `noqa`).
- **Deprecated APIs:** 0 deprecated API usages in runtime scripts. Occurrences of the term "deprecated" are confined to user-facing documentation guidance and SEO analysis advice.

---

## 3. Code Hotspots (Complexity & Churn Analysis)

### Top 10 Largest Source Files

| Rank | File Path | Lines | Size | Language | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `plugins/apple-workflows/mcp/src/apple_productivity_mcp/server.py` | 873 | 28 KB | Python | Monolithic Apple Notes, Reminders, and Contacts MCP server |
| 2 | `scripts/install-plugins.sh` | 800 | 24 KB | Bash | Interactive multi-agent installer across 8+ platforms |
| 3 | `plugins/wp-cli-fleet/wordpress-plugin/agentic-wp-cli.php` | 750 | 28 KB | PHP | Single-file WordPress REST API and security bridge |
| 4 | `scripts/generate-cross-platform.js` | 629 | 24 KB | Node.js | Cross-platform rules, snippets, and config generator |
| 5 | `scripts/validate-plugins.sh` | 513 | 19 KB | Bash | Automated hook security and manifest validation suite |
| 6 | `plugins/qa-droid/package-lock.json` | 1218 | 44 KB | JSON | Dependency lockfile for Playwright & MCP SDK |
| 7 | `.claude-plugin/marketplace.json` | 463 | 14 KB | JSON | Canonical plugin registry catalog |
| 8 | `plugins/wp-cli-fleet/bin/wp_fleet_run.py` | 242 | 8 KB | Python | Multi-site WP-CLI batch execution runner |
| 9 | `plugins/apple-photos/hooks/scripts/export-guard.sh` | 132 | 4 KB | Bash | PreToolUse hook preventing unauthorized media export |
| 10 | `plugins/circuit-breaker/hooks/scripts/budget-guard.sh` | 85 | 3 KB | Bash | CWE-377 hardened tool usage budget tracking hook |

### High-Churn Areas (Trailing 30 Commits)
- **New Plugin Integrations:** `plugins/encharge`, `plugins/markupgo`, `plugins/neuronwriter`, `plugins/notfair-marketing`, `plugins/outscraper`, `plugins/textfocus`.
- **Security & Hardening:** `.github/workflows/ci.yml`, `plugins/circuit-breaker`, `scripts/validate-plugins.sh`, `scripts/install-plugins.sh`.
- **Cross-Platform Synchronization:** Generated `.cursor/`, `GEMINI.md`, `AGENTS.md`, and `codex-mcp-config.toml` outputs.

---

## 4. Classified Technical Debt Register

| ID | Item | Location(s) | Type | Impact | Risk | Effort | Confidence | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TD-01** | **Monolithic Apple MCP Server** | `plugins/apple-workflows/.../server.py` | Complexity / Architecture | Dev Speed | Low | M | High | Decompose `server.py` into separate service modules: `notes.py`, `reminders.py`, `contacts.py`, and `calendar.py`. |
| **TD-02** | **Monolithic Shell Installer** | `scripts/install-plugins.sh` | Complexity | Maintainability | Med | M | High | Modularize into platform-specific sub-scripts (`install-claude.sh`, `install-codex.sh`) sourced by a main dispatcher. |
| **TD-03** | **Single-File WordPress Plugin** | `plugins/wp-cli-fleet/.../agentic-wp-cli.php` | Architecture | Reliability | Med | M | High | Split into class files: `class-auth.php`, `class-routes.php`, and `class-executor.php` using standard PSR-4 autoloading. |
| **TD-04** | **Ununified Node Packaging** | `plugins/qa-droid/package.json` vs root | Tooling | Dev Speed | Low | S | High | qa-droid remains isolated. If more plugins adopt JS/TS, adopt `pnpm` workspaces with unified workspace root. |
| **TD-05** | **Cross-Platform Snippet Duplication** | `plugins/*/{claude-desktop,gemini-settings,windsurf}*` | Redundancy | Storage / Drift | Low | S | High | Generator handles regeneration deterministically; consider `.gitattributes` export-ignore for generated snippets if size increases. |
| **TD-06** | **Shell Hook Regression Framework** | `plugins/*/hooks/scripts/*.sh` | Test Debt | Reliability | Low | M | High | Standardize `node:test` based fixtures (as proven in `tests/circuit-breaker.test.js`) across all security hooks. |

---

## 5. Top 5 High-ROI Remediation Items

1. **Expand `node:test` Fixtures across all PreToolUse Hooks (TD-06)**:  
   *ROI: High.* Following the successful implementation of `tests/circuit-breaker.test.js`, adding automated fixture tests for `export-guard.sh` and `shadow-mode` hooks ensures zero regressions without introducing external test runners.
2. **Decompose `apple_productivity_mcp/server.py` (TD-01)**:  
   *ROI: High.* Separates Mac-specific AppleScript integrations into isolated handlers, preventing cross-domain syntax errors as new Apple frameworks are supported.
3. **Modularize `scripts/install-plugins.sh` (TD-02)**:  
   *ROI: Medium.* Simplifies platform maintenance when new agent CLIs (e.g. Goose, OpenClaw, Codex CLI) update their configuration paths.
4. **Refactor `agentic-wp-cli.php` into Modular Classes (TD-03)**:  
   *ROI: Medium.* Improves static analysis and compatibility testing against future WordPress core releases (WP 6.8+).
5. **Continuous Generator Drift Check in CI (TD-05 / CI)**:  
   *ROI: Immediate.* Fully resolved in PR #135 via `git status --porcelain --untracked-files=all` and Node 24 validation.
