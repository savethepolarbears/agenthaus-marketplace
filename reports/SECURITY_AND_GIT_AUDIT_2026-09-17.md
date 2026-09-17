# Comprehensive Security & Git Audit Report

**Date:** 2026-09-17  
**Repository:** `savethepolarbears/agenthaus-marketplace` (Public Distribution)  
**Auditor:** Agency Security Engineer  
**Status:** PASS / HARDENED (Point-in-time assessment as of commit `716dc11` and follow-up patches on 2026-09-17)

---

## 1. Executive Summary

As a completely public open-source repository containing 37 developer plugins, MCP servers, and hooks for agentic AI platforms (Claude Code, Codex CLI, Gemini CLI, Cursor, Windsurf), this repository requires rigorous defense-in-depth against secret leakage, command injection, supply chain vulnerabilities, and operational hazards.

A systematic audit across Git commit history, configuration files, shell scripts, Python utilities, PHP plugins, and npm dependencies was conducted. All identified security issues, hardening gaps, and potential attack vectors have been remediated and verified.

---

## 2. Git History & Secret Scanning Audit

### Methodology

- Exhaustive regex and entropy search across the entire git commit log (`git log -p -S ...`) for credential patterns:
  - OpenAI / Anthropic / AI API keys (`sk-ant-`, `sk-`, `ghp_`, `gho_`, `github_pat_`)
  - Cloud provider credentials (`AKIA`, `ASIA`, `AIza`, AWS secret access keys)
  - Slack tokens (`xoxb-`, `xoxp-`)
  - Private key headers (`-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----`)
  - Generic bearer tokens, passwords, and connection strings.
- Inspected `.claude-plugin/plugin.json` and `.mcp.json` across all 37 plugins to ensure strict usage of `${ENV_VAR}` interpolation.

### Findings

- **Result:** **0 secrets detected in Git history or tracked files.**
- **Finding Remediated:** The repository contained an obsolete maintenance script `scrub_history.sh` which executed history filtering and forced pushing (`--force --all`). Leaving destructive history-rewriting scripts in a public repository posed a severe operational hazard.
  - **Fix:** Removed `scrub_history.sh` from tracking, added `scrub_*.sh` to `.gitignore`, and added an automated CI check rejecting destructive force-push scripts.


---

## 3. Repository Boundary & Leak Prevention (.gitignore & .env.example)

### Audit & Hardening

The previous `.gitignore` only blocked `.env`, `.env.local`, and `.env.*.local`, leaving `.env.production` or arbitrary environment variants unprotected. Additionally, private keys, certificates, and runtime agent artifacts were unignored.

### Changes Applied

1. **Environment & Secrets:**
   - Broadened rules: `.env` and `.env.*` (strictly preserving `!.env.example`)
   - Cryptographic keys and certificates: `*.pem`, `*.key`, `*.pfx`, `*.p12`, `*.cer`, `*.crt`, `id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519`, `*.keystore`
   - Token & credential dumps: `*credentials*.json`, `*token*.json`, `service-account*.json`, `auth.json`
   - Preserved schemas, mocks, and fixtures from accidental exclusion: `!*schema*.json`, `!*fixture*.json`, `!*mock*.json`
2. **Agent Runtime Artifacts:**
   - `review_queue/`: Shadow-mode command queue directory (prevents accidental commits of intercepted tool invocations)
   - `.shadow-mode-enabled`: Shadow-mode activation flag
   - `.circuit-breaker-config.json`: Local breaker threshold overrides
3. **Environment Template (`.env.example`):**
   - Added documentation for 5 newly integrated plugins requiring external API credentials (`ENCHARGE_API_KEY`, `MARKUPGO_API_KEY`, `NEURONWRITER_API_KEY`, `OUTSCRAPER_API_KEY`, `TEXTFOCUS_API_KEY`). The 6th added plugin, `activepieces`, utilizes local/self-hosted connection configurations and does not require a root API token.

---

## 4. Hook Scripts & Shell Execution Security

### Audit Areas

- Analyzed all hook shell scripts (`plugins/*/hooks/scripts/*.sh`) and utility scripts (`scripts/*.sh`):
  - Insecure temporary files (CWE-377)
  - Unquoted variable expansion and command injection (CWE-78)
  - Path traversal and arbitrary file read/write (CWE-22)

### Remediations Applied

1. **`plugins/circuit-breaker/hooks/scripts/budget-guard.sh` & `reset-counter.sh` (CWE-377 Hardened, Atomic Persistence & Parent Validation)**:
   - *Issue:* Static `/tmp/circuit-breaker-counter` or unvalidated UID files in a shared `/tmp` environment exposed the agent to multi-user collisions, symlink hijacking, and write failure crashes under `set -e`. During code review, two additional edge cases were identified: (a) `reset-counter.sh` inspected the child `counter` file for symlinks but did not validate the parent `$STATE_DIR`, allowing a symlinked state directory to redirect deletion to an unrelated user-owned file; (b) in `budget-guard.sh`, an unconditional `chmod 700 "$STATE_DIR"` mutated directory permissions on existing directories, obscuring true permission failures.
   - *Remediation:*
     - Counter storage is strictly isolated in a user-owned private directory with mode `0700` (`STATE_DIR="${TMPDIR:-/tmp}/circuit-breaker-${USER_ID}"`).
     - Counter persistence utilizes atomic replacement via temporary file creation inside `$STATE_DIR` (`counter.tmp.$$`) followed by `mv -f "$temp_file" "$COUNTER_FILE"`, eliminating TOCTOU race windows.
     - Removed mutating `chmod 700` on existing state directories; the hook now verifies owner and write permissions non-mutatively (`[ -d "$STATE_DIR" ] && [ -O "$STATE_DIR" ] && [ -w "$STATE_DIR" ]`) and exits 0 gracefully (warning-only) without modifying permissions on permission denial.
     - `reset-counter.sh` validates the parent directory before child removal (`[ -L "$STATE_DIR" ] || [ ! -d "$STATE_DIR" ] || [ ! -O "$STATE_DIR" ]`), aborting if the state directory is symlinked or alien-owned.
     - Reset script additionally cleans up `.circuit-breaker-config.json` if owned and non-symlinked.
   - *Regression Evidence:*
     - `tests/circuit-breaker.test.js`:
       - `reset-counter.sh does not delete counter when state directory is a symlink`: Asserts sentinel `counter` in symlinked target is preserved intact.
       - `exits 0 with warning-only and unchanged counter on non-writable counter file`: Exercises genuine write denial with a user-owned read-only counter (`mode 0444`), asserting exit 0 and counter remaining `5`.
       - `exits 0 gracefully without loosening permissions when state directory is non-writable (mode 0500)`: Asserts exit 0 and verifies directory permissions remain `0500` without loosening to `0700`.
2. **`scripts/install-plugins.sh` (Filesystem Safety & Directory-Identity Home Guard)**:
   - *Issue:* `uninstall_from()` accepted a target path and executed uninstallation without normalizing the path or checking for root, home, or shallow directory structures. In initial hardening, comparing a canonicalized `target_dir` against uncanonicalized `$HOME` string allowed symlinked home directories to bypass protection and delete matching child directories in the real home.
   - *Remediation:*
     - Canonicalized both the target directory and `$HOME` using `pwd -P`.
     - Added POSIX directory-identity comparison using `[ "$target_dir" -ef "$canonical_home" ]` and `[ "$target_dir" -ef "$HOME" ]`, checking same device and inode numbers across POSIX filesystems to guarantee symlinked home directories cannot bypass uninstall safeguards.
     - Added safety guards rejecting empty targets, root `/`, or paths with fewer than two path segments (`seg_count < 2`).
     - Wrapped script entrypoint in `if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then main "$@"; fi` to allow safe sourcing in automated test suites.
   - *Regression Evidence:*
     - `tests/installer.test.js`:
       - `uninstall_from refuses to uninstall when HOME is a symlink and preserves matching children`: Verifies symlinked home target is rejected with exit code 1 and sentinel child files (`circuit-breaker/KEEP`) remain intact.
       - `uninstall_from refuses to uninstall when target is canonical HOME directory`: Verifies canonical home target rejection.
       - `uninstall_from refuses to uninstall from root or shallow directories`: Verifies root `/` rejection.
3. **`scripts/validate-plugins.sh` & Vendored Script Tradeoff**:
   - *Tradeoff Analysis:* Directly scanning `node_modules` for Claude Code hook conventions produces false positive failures against legitimate third-party tooling (e.g. Playwright browser download scripts). Conversely, completely ignoring `node_modules` eliminates visibility into vendored shell risk.
   - *Resolution:* Plugin-owned hook scripts are validated strictly for hook semantics (`$TOOL_INPUT`, `exit 1`, `eval`, schema properties). Vendored scripts under `node_modules` are scanned at **warn-only** severity specifically for unsafe command execution patterns (`eval`), preserving supply-chain visibility without blocking validation runs.

---

## 5. Dependency & Supply Chain Security

### Scan Results

- Checked `plugins/qa-droid`:
  - `fast-uri`: Upgraded to `3.1.8` (fixes high-severity authority delimiter confusion).
  - `hono`: Upgraded `4.12.16 -> 4.13.8` (Minor bump; fixes CSS injection, JWT validation, cache leakage, IP restriction bypass).
  - `@hono/node-server`: Upgraded `1.19.14 -> 1.19.17` (Upstream adapter update).
  - `ip-address`: Upgraded `10.1.0 -> 10.7.2` (Minor bump; fixes XSS in Address6 methods).
  - `qs`: Upgraded `6.15.1 -> 6.16.0` (Patch bump; fixes DoS in `qs.stringify`).
- **Regression Prevention:** Transitive dependency fixes were committed to `plugins/qa-droid/package-lock.json` and permanently pinned in `plugins/qa-droid/package.json` under `overrides` to prevent regression upon future `npm install` or `npm ci` invocations.
- **Point-in-Time Status:** `npm audit` reports **0 vulnerabilities** as of 2026-09-17.

---

## 6. Code-Level Security (PHP & Python)

1. **`plugins/wp-cli-fleet/wordpress-plugin/agentic-wp-cli.php`**:
   - Access control enforces `current_user_can('manage_options')`.
   - Secret verification uses timing-attack resistant `hash_equals()`.
   - REST endpoints use strict input sanitization (`sanitize_key()`, `sanitize_text_field()`, `esc_url_raw()`).
   - Mutations are gated behind an explicit whitelist and disabled by default in read-only mode.
   - Zero use of `eval()`, `exec()`, `passthru()`, or `shell_exec()`.
2. **`plugins/wp-cli-fleet/bin/wp_fleet_run.py`**:
   - `subprocess.run(cmd, ...)` is called with an argument list and `shell=False`.

---

## 7. CI/CD Automated Security Pipeline

Added `.github/workflows/ci.yml` and `.github/dependabot.yml` providing automated verification on every PR and push to `main`:

- **Pin by Commit SHA:** All GitHub Actions (`actions/checkout`, `actions/setup-node`, `gitleaks/gitleaks-action`) are pinned to immutable commit SHAs with semantic version comments.
- **Node.js LTS (v24):** Workflows run on Node 24 LTS across validation and dependency auditing jobs.
- **Concurrency & Scheduling:** Implemented workflow concurrency cancellation (`cancel-in-progress: true`) and a scheduled nightly audit (`0 4 * * *`).
- **Plugin & Hook Validation:** Runs `bash scripts/generate-skills-index.sh` followed by `bash scripts/validate-plugins.sh` across all 37 plugins.
- **Unit & Regression Tests:** Automated test suite (`node --test tests/*.test.js`) reporting 15 passing tests across 4 suites, verifying generator discovery, env transformations, circuit breaker CWE-377 isolation, parent symlink defenses, genuine storage write denials, non-mutating directory permissions, symlinked HOME uninstall guards, and drift detection.
- **Drift & Untracked Guard:** Verifies `node scripts/generate-cross-platform.js` produces zero git diff and zero untracked artifacts (`git status --porcelain --untracked-files=all`).
- **Destructive Command Guard:** Scans tracked files for dangerous force-push or branch deletion flags.
- **Dependency Audit:** Runs `npm audit --audit-level=high` on `plugins/qa-droid` with npm cache support.
- **Automated Secret Scanning:** Automated Gitleaks analysis across all commits on every pull request.
- **Dependabot Integration:** Configured `.github/dependabot.yml` for automated weekly updates across npm dependencies and GitHub Actions.

---

## 8. Audit Verification Summary

| Check Category | Tool / Method | Target | Result |
| :--- | :--- | :--- | :--- |
| Secret Scanning | Git log pattern & entropy scan | Full repo history | PASS (0 secrets found) |
| Gitignore Boundaries | Path matching & rule audit | `.gitignore` | PASS (Hardened with schema negations) |
| Destructive Script Audit | Static file review & CI guard | Repo scripts & history | PASS (Removed `scrub_history.sh`, CI guard added) |
| Temp File Security | Private 0700 dir + atomic write + parent symlink check | `budget-guard.sh` & `reset-counter.sh` | PASS (CWE-377 hardened, isolated & regression tested) |
| Counter Reset Integrity | Dedicated `reset-counter.sh` | Circuit Breaker | PASS (Reset path aligned, parent validated & tested) |
| Script Path Traversal | Canonical `pwd -P` + `-ef` home identity check | `install-plugins.sh` | PASS (Protected against root/home/shallow dirs & symlinks) |
| Vendored Shell Scan | Hook validator warn-only check | `node_modules` | PASS (Monitored for `eval`) |
| Dependency Vulnerabilities | `npm audit` + `overrides` | `plugins/qa-droid` | PASS (0 vulnerabilities as of 2026-09-17) |
| Marketplace Validation | `scripts/validate-plugins.sh` | 37 Plugins | PASS (37/37 passed, 0 failures, 0 warnings) |
| Cross-Platform Consistency | `scripts/generate-cross-platform.js` | Cross-platform configs | PASS (Zero drift, AGENTS.md <= 6KiB) |
| CI Pipeline & Hardening | GitHub Actions & Dependabot | `.github/workflows/ci.yml` | PASS (SHA pinned, Node 24, Gitleaks, concurrency) |
