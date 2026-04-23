# Technical Debt Register

## 1. Snapshot Baseline Metrics
- **LOC:** ~20,000 total lines of code. Primarily Markdown (~12k) and JSON (~4.6k), indicating a documentation/configuration-heavy repository. Shell scripts make up the bulk of logic code (~1.2k).
- **Dependencies:** 2 runtime dependencies found (`@modelcontextprotocol/sdk` and `playwright`) isolated in `plugins/qa-droid/package.json`. No repo-wide dependency management (no root `package.json`).
- **Build/Test Time:** The repo primarily relies on scripts (`run_checks.sh`, `validate-plugins.sh`). Build performance metrics are not applicable in standard web terms as there is no single app compile step.
- **Bundle Size:** N/A for this plugin/scripts repo structure.

## 2. Debt Signals
- **TODOs/FIXMEs:** Very clean! Only trace found is a package-lock hash (`XXX`) and placeholders in a sample git hook (`sendemail-validate.sample`), plus a mention in an agent workflow markdown. No true TODO debt found in the codebase.
- **Lint Suppressions:** None found (`eslint-disable`, `noqa`, `@ts-ignore`).
- **Deprecated APIs:** The term `deprecated` appears only in documentation/guides (e.g., teaching an agent to delete deprecated APIs, or in SEO guidelines). No actual deprecated code was found.

## 3. Hotspots
- **Big Files (Top 5):**
  1. `plugins/qa-droid/package-lock.json` (44 KB)
  2. `plugins/wp-cli-fleet/wordpress-plugin/agentic-wp-cli.php` (28 KB)
  3. `plugins/apple-workflows/mcp/src/apple_productivity_mcp/server.py` (28 KB)
  4. `scripts/install-plugins.sh` (24 KB)
  5. `scripts/validate-plugins.sh` (20 KB)
- **Directories with Most Churn:**
  - `plugins/wp-cli-fleet`
  - `plugins/apple-workflows`
  - `.agents/skills`
  - `plugins/gog-workspace`
  - `plugins/apple-photos`

## 4 & 5. Technical Debt Register (Classified)

| Item | Location(s) | Type | Evidence | Impact | Risk | Effort | Confidence | Recommended Fix |
|---|---|---|---|---|---|---|---|---|
| **Fragmented Dependency Management** | `plugins/qa-droid/package.json` vs Repo | Architecture / Tooling | No root `package.json`, isolated lockfiles. | Dev Speed | Low | L | High | Adopt a monorepo tooling structure (e.g., pnpm workspaces) to manage plugin dependencies collectively. |
| **Monolithic Scripts** | `scripts/install-plugins.sh`, `scripts/validate-plugins.sh` | Complexity | 20KB+ shell scripts which can be hard to test/maintain. | Dev Speed, Reliability | Medium | M | Med | Break down large shell scripts into modular pieces or migrate complex logic to a more robust scripting language like Node/Python. |
| **Missing Test Suite Structure** | Global | Test Debt | The repository relies on `run_checks.sh` which currently fails locally if `agenthaus-web` is missing. | Reliability, Dev Speed | High | L | High | Introduce formal testing frameworks for the `.py`, `.php`, and `.sh` files, decoupled from the excluded web folder. |
| **Large Single-File Backend** | `plugins/apple-workflows/mcp/src/apple_productivity_mcp/server.py` | Complexity | 28KB Python file containing an entire server implementation. | Dev Speed | Low | M | High | Refactor the MCP server into smaller, domain-specific modules. |
| **WordPress Plugin Architecture** | `plugins/wp-cli-fleet/wordpress-plugin/agentic-wp-cli.php` | Complexity | Large monolithic PHP file handling WP-CLI integration. | Reliability | Medium | M | High | Split the WordPress plugin into smaller classes/files following standard WP MVC or domain-driven patterns. |

### Top 5 "High ROI" Items
1. **Fix `run_checks.sh` local failure:** Currently fails because it looks for `agenthaus-web` which is ignored. Fixing this (by making the web check conditional) immediately unblocks local automated checks for contributors.
2. **Monorepo Dependency Setup:** Before more plugins add arbitrary `package.json` files (like `qa-droid`), standardize using `pnpm workspaces`. This prevents dependency hell later.
3. **Refactor `scripts/install-plugins.sh`:** As the largest script running complex setup logic, modularizing it or adding robust error handling will prevent silent deployment failures.
4. **Refactor `apple_productivity_mcp/server.py`:** Python MCP servers are likely to grow. Establishing a modular pattern now prevents this 28KB file from becoming a 100KB unmaintainable monolith.
5. **Formalize Shell Script Testing:** Since shell scripts form the backbone of the repo's logic (1.2k lines), adding `bats` (Bash Automated Testing System) for `validate-plugins.sh` will catch regressions early.
