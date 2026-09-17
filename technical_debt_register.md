# Technical Debt Register

**Date:** 2026-09-17  
**Scope:** Consolidated Technical Debt Register for `savethepolarbears/agenthaus-marketplace`  
**Detailed Report:** See [reports/TECHNICAL_DEBT_INVENTORY.md](reports/TECHNICAL_DEBT_INVENTORY.md)

---

## 1. Baseline Metrics Summary

- **Total Lines of Code (LOC):** 42,815 across 625 files.
- **Languages:** Markdown (349), JSON (174), Cursor MDC (37), Codex TOML (24), Bash Shell (11), JavaScript (5), Python (4), TypeScript (4), PHP (1), YAML (2).
- **Active Production Plugins:** 37 verified production plugins in `plugins/`.
- **Runtime Dependencies:** Pinned in `plugins/qa-droid/package.json` (`@modelcontextprotocol/sdk`, `playwright`, overrides locked).
- **Test / Validation Time:** ~260 ms for Node 24 native tests (`tests/*.test.js`), ~4.5 s for `validate-plugins.sh`.

---

## 2. Debt Signals

- **TODOs / FIXMEs:** 0 active markers in production code.
- **Lint Suppressions:** 0 suppressions (`eslint-disable`, `@ts-ignore`, `noqa`).
- **Deprecated APIs:** 0 active deprecated runtime calls. Documentation references only.

---

## 3. Code Hotspots

1. `plugins/apple-workflows/mcp/src/apple_productivity_mcp/server.py` (873 lines, 28 KB)
2. `scripts/install-plugins.sh` (800 lines, 24 KB)
3. `plugins/wp-cli-fleet/wordpress-plugin/agentic-wp-cli.php` (750 lines, 28 KB)
4. `scripts/generate-cross-platform.js` (629 lines, 24 KB)
5. `scripts/validate-plugins.sh` (513 lines, 19 KB)

---

## 4. Classified Register

| ID | Item | Location | Type | Impact | Risk | Effort | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TD-01** | Monolithic Apple MCP Server | `plugins/apple-workflows/.../server.py` | Architecture | Dev Speed | Low | M | Decompose into `notes.py`, `reminders.py`, `contacts.py`. |
| **TD-02** | Monolithic Installer | `scripts/install-plugins.sh` | Complexity | Maintainability | Med | M | Modularize into platform sub-scripts. |
| **TD-03** | Monolithic WP Plugin | `plugins/wp-cli-fleet/.../agentic-wp-cli.php` | Architecture | Reliability | Med | M | Split into PSR-4 classes (`Auth`, `Routes`, `Executor`). |
| **TD-04** | Node Dependency Isolation | `plugins/qa-droid/package.json` | Tooling | Dev Speed | Low | S | Adopt pnpm workspaces if multi-package footprint grows. |
| **TD-05** | Cross-Platform Generator Output | `scripts/generate-cross-platform.js` | Maintainability | Drift | Low | S | Enforced via CI porcelain untracked check and tests. |
| **TD-06** | Shell Hook Regression Testing | `plugins/*/hooks/scripts/*.sh` | Test Debt | Reliability | Low | M | Expand `node:test` fixtures across remaining hooks. |

---

## 5. Top 5 High-ROI Focus Items

1. **Expand `node:test` Fixtures across all PreToolUse Hooks (TD-06)**: Protect all hooks using native zero-dependency fixtures.
2. **Decompose `apple_productivity_mcp/server.py` (TD-01)**: Isolate AppleScript calls by domain.
3. **Modularize `scripts/install-plugins.sh` (TD-02)**: Improve platform maintenance velocity.
4. **Refactor `agentic-wp-cli.php` (TD-03)**: Class-based modularity for WordPress fleet integration.
5. **Continuous Generator Drift CI Verification (TD-05)**: Closed in PR #135 with porcelain untracked drift guard.
