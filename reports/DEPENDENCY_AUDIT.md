# Dependency Audit Report

## Summary

A repository-wide dependency analysis was conducted, identifying and addressing security vulnerabilities within the `plugins/qa-droid` package. The updates were initially performed using `npm audit fix` and permanently secured via `overrides` in `plugins/qa-droid/package.json` to prevent dependency regressions during subsequent installations. No other dependencies were broadly upgraded per user directives, and existing package managers and lockfile formats were strictly preserved.

*Point-in-time certification date: 2026-09-17 (initial fix in commit `42eb31c`, overrides pinned in commit `716dc11` and follow-up).*

## Dependency Upgrades

| Ecosystem | Package | Scope | From | To | Class | Reason | Migration |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| npm | `fast-uri` | `plugins/qa-droid` | `3.1.1` | `3.1.8` | Patch | High severity security fix (host confusion via percent-encoded authority delimiters) | None required |
| npm | `hono` | `plugins/qa-droid` | `4.12.16` | `4.13.8` | Minor | High severity security fixes (CSS Declaration Injection, JWT validation, cache leakage, IP restriction bypass) | None required |
| npm | `@hono/node-server` | `plugins/qa-droid` | `1.19.14` | `1.19.17` | Patch | Upstream adapter update for hono runtime | None required |
| npm | `ip-address` | `plugins/qa-droid` | `10.1.0` | `10.7.2` | Minor | Moderate severity security fix (XSS in Address6 HTML-emitting methods) | None required |
| npm | `qs` | `plugins/qa-droid` | `6.15.1` | `6.16.0` | Patch | Moderate severity security fix (Remotely triggerable DoS via `qs.stringify`) | None required |

## Validation and Regression Safeguards

1. **Lockfile & Overrides**: Transitive dependencies were locked via `npm audit fix` in `plugins/qa-droid/package-lock.json` and reinforced with an `overrides` block in `package.json` so fresh `npm ci` or `npm install` runs do not reintroduce legacy transitive versions.
2. **Point-in-Time Status**: As of 2026-09-17, `npm audit` reports **0 vulnerabilities** (0 high, 0 moderate, 0 low).
3. **Automated Ongoing Verification**: Pair with `.github/dependabot.yml` and scheduled nightly GitHub Actions CI audit to detect newly published advisories continuously without breaking daily PR development.
