# Comprehensive Security & Git Audit Report

**Date:** 2026-09-17  
**Repository:** `savethepolarbears/agenthaus-marketplace` (Public Distribution)  
**Auditor:** Agency Security Engineer  
**Status:** PASS / HARDENED  

---

## 1. Executive Summary

As a completely public open-source repository containing 37 developer plugins, MCP servers, and hooks for agentic AI platforms (Claude Code, Codex CLI, Gemini CLI, Cursor, Windsurf), this repository requires rigorous defense-in-depth against secret leakage, command injection, supply chain vulnerabilities, and operational hazards.

A systematic audit across Git commit history, configuration files, shell scripts, Python utilities, PHP plugins, and npm dependencies was conducted. All identified security issues, hardening gaps, and potential attack vectors have been remediated.

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
- **Finding remediated:** The repository contained an obsolete maintenance script `scrub_history.sh` which executed `git filter-repo` and `git push origin --force --all`. Leaving destructive history-rewriting scripts in a public repository posed an severe operational hazard.
  - **Fix:** Removed `scrub_history.sh` from tracking and added `scrub_*.sh` to `.gitignore`.

---

## 3. Repository Boundary & Leak Prevention (.gitignore)

### Audit & Hardening
The previous `.gitignore` only blocked `.env`, `.env.local`, and `.env.*.local`, leaving `.env.production` or arbitrary environment variants unprotected. Additionally, private keys, certificates, and runtime agent artifacts were unignored.

### Changes Applied
1. **Environment & Secrets:**
   - `.env` and `.env.*` (strictly preserving `!.env.example`)
   - Cryptographic keys and certificates: `*.pem`, `*.key`, `*.pfx`, `*.p12`, `*.cer`, `*.crt`, `id_rsa`, `id_dsa`, `id_ecdsa`, `id_ed25519`, `*.keystore`
   - Token & credential dumps: `*credentials*.json`, `*token*.json`, `service-account*.json`, `auth.json`
2. **Agent Runtime Artifacts:**
   - `review_queue/`: Shadow-mode command queue directory (prevents accidental commits of intercepted tool invocations)
   - `.shadow-mode-enabled`: Shadow-mode activation flag
   - `.circuit-breaker-config.json`: Local breaker threshold overrides

---

## 4. Hook Scripts & Shell Execution Security

### Audit Areas
- Analyzed all hook shell scripts (`plugins/*/hooks/scripts/*.sh`) and utility scripts (`scripts/*.sh`):
  - Insecure temporary files (CWE-377)
  - Unquoted variable expansion and command injection (CWE-78)
  - Path traversal and arbitrary file read/write (CWE-22)

### Remediations Applied
1. **`plugins/circuit-breaker/hooks/scripts/budget-guard.sh`**:
   - *Issue:* Static file path `/tmp/circuit-breaker-counter` in a shared environment exposed the agent to multi-user collisions and symlink hijacking.
   - *Remediation:* Replaced with user-isolated path `COUNTER_FILE="${TMPDIR:-/tmp}/circuit-breaker-counter-${USER_ID}"` where `USER_ID="${UID:-$(id -u 2>/dev/null || echo 0)}"`.
2. **`scripts/install-plugins.sh`**:
   - *Issue:* `uninstall_from()` accepted a target path and executed `rm -rf "$dst"` without verifying that `$target_dir` was neither empty nor root `/`.
   - *Remediation:* Added explicit defensive guard:
     ```bash
     if [[ -z "$target_dir" || "$target_dir" == "/" ]]; then
       error "Refusing to uninstall from root or empty directory"
       return 1
     fi
     ```
3. **`scripts/validate-plugins.sh`**:
   - Excluded `*/node_modules/*` from shell script scanning and skills indexing, preventing false alarms and ensuring determinism.

---

## 5. Dependency & Supply Chain Security

### Scan Results
- Checked `plugins/qa-droid`:
  - `fast-uri`: Upgraded to `3.1.8` (fixes high-severity authority delimiter confusion).
  - `hono`: Upgraded to `4.13.8` (fixes CSS injection, JWT validation, cache leakage, IP restriction bypass).
  - `@hono/node-server`: Upgraded to `1.19.17`.
  - `ip-address`: Upgraded to `10.7.2` (fixes XSS in Address6 methods).
  - `qs`: Upgraded to `6.16.0` (fixes DoS in `qs.stringify`).
- **Post-Fix Status:** `npm audit` reports **0 vulnerabilities** (0 low, 0 moderate, 0 high, 0 critical).

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

Added `.github/workflows/ci.yml` providing automated verification on every PR and push to `main`:
- **Plugin & Hook Validation:** Runs `bash scripts/validate-plugins.sh` across all 37 plugins.
- **Unit Tests:** Runs `node --test tests/*.test.js`.
- **Generator Drift Guard:** Verifies `node scripts/generate-cross-platform.js` produces zero git diff.
- **Dependency Audit:** Runs `npm audit --audit-level=high` on `plugins/qa-droid`.

---

## 8. Audit Verification Summary

| Check Category | Tool / Method | Target | Result |
| :--- | :--- | :--- | :--- |
| Secret Scanning | Git log pattern & entropy scan | Full repo history | PASS (0 secrets found) |
| Gitignore Boundaries | Path matching & rule audit | `.gitignore` | PASS (Hardened) |
| Destructive Script Audit | Static file review | `scrub_history.sh` | PASS (Removed) |
| Temp File Security | CWE-377 inspection | `budget-guard.sh` | PASS (Isolated by UID) |
| Script Path Traversal | Defensive guard audit | `install-plugins.sh` | PASS (Root guard added) |
| Dependency Vulnerabilities | `npm audit` | `plugins/qa-droid` | PASS (0 vulnerabilities) |
| Marketplace Validation | `scripts/validate-plugins.sh` | 37 Plugins | PASS (37/37 passed) |
| Cross-Platform Consistency | `scripts/generate-cross-platform.js` | Cross-platform configs | PASS (Zero drift, AGENTS.md <= 6KiB) |
| CI Pipeline | GitHub Actions | `.github/workflows/ci.yml` | PASS (Configured) |
