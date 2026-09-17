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
- **Finding Remediated:** The repository contained an obsolete maintenance script `scrub_history.sh` which executed `git filter-repo` and `git push origin --force --all`. Leaving destructive history-rewriting scripts in a public repository posed a severe operational hazard.
  - **Fix:** Removed `scrub_history.sh` from tracking, added `scrub_*.sh` to `.gitignore`, and added an automated CI check rejecting destructive `git push --force` scripts.

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

1. **`plugins/circuit-breaker/hooks/scripts/budget-guard.sh` & `reset-counter.sh` (CWE-377 Closed & Reset Aligned)**:
   - *Issue:* Static `/tmp/circuit-breaker-counter` or unvalidated UID files in a shared `/tmp` environment exposed the agent to multi-user collisions, symlink hijacking, and write failure crashes under `set -e`. Additionally, `configure.md` previously referenced the legacy path during reset.
   - *Remediation:* Counter storage is strictly isolated inside a private directory with mode `0700` (`STATE_DIR="${TMPDIR:-/tmp}/circuit-breaker-${USER_ID}"`). Both directory and counter file are verified for current-user ownership (`[ -O ]`), verified not to be symlinks (`[ -L ]`), and protected by `chmod 700`. Any storage failure (e.g. alien-owned path, permission denied) causes the hook to gracefully exit 0 (warning-only, never blocks). A canonical `reset-counter.sh` script was created and documented across `configure.md`, `SKILL.md`, and `README.md` to safely clear the counter and reset the session budget to 1.
2. **`scripts/install-plugins.sh`**:
   - *Issue:* `uninstall_from()` accepted a target path and executed `rm -rf "$dst"` without normalizing the path or checking for root, home, or shallow directory structures.
   - *Remediation:* Applied strict path canonicalization (`target_dir="$(cd "$raw_target" 2>/dev/null && pwd -P)"`) and added safety guards rejecting empty targets, root `/`, `$HOME`, or paths with fewer than two path segments.
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
- **Unit & Regression Tests:** Automated test suite (`node --test tests/*.test.js`) verifying generator discovery, env transformations, circuit breaker CWE-377 isolation, symlink defenses, counter reset mechanics, and drift detection.
- **Drift & Untracked Guard:** Verifies `node scripts/generate-cross-platform.js` produces zero git diff and zero untracked artifacts (`git status --porcelain --untracked-files=all`).
- **Destructive Command Guard:** Scans tracked files for dangerous `git push --force` or `-f` flags.
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
| Temp File Security | Private 0700 dir + symlink check | `budget-guard.sh` | PASS (CWE-377 closed, isolated & tested) |
| Counter Reset Integrity | Dedicated `reset-counter.sh` | Circuit Breaker | PASS (Reset path aligned and tested) |
| Script Path Traversal | Canonical `pwd -P` + segment check | `install-plugins.sh` | PASS (Protected against root/home/shallow dirs) |
| Vendored Shell Scan | Hook validator warn-only check | `node_modules` | PASS (Monitored for `eval`) |
| Dependency Vulnerabilities | `npm audit` + `overrides` | `plugins/qa-droid` | PASS (0 vulnerabilities as of 2026-09-17) |
| Marketplace Validation | `scripts/validate-plugins.sh` | 37 Plugins | PASS (37/37 passed, 0 failures, 0 warnings) |
| Cross-Platform Consistency | `scripts/generate-cross-platform.js` | Cross-platform configs | PASS (Zero drift, AGENTS.md <= 6KiB) |
| CI Pipeline & Hardening | GitHub Actions & Dependabot | `.github/workflows/ci.yml` | PASS (SHA pinned, Node 24, Gitleaks, concurrency) |
