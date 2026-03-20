# Concerns & Technical Debt

> Generated: 2026-03-20 | Source: GSD Map-Codebase (sequential)

## High Priority

### No Test Suite
- **Impact:** No automated regression testing for the web storefront
- **Risk:** Refactoring or feature additions can break existing functionality silently
- **Files:** No test files exist outside `node_modules/`
- **Recommendation:** Add Vitest + React Testing Library for component/API route tests

### No ESLint Configuration
- **Impact:** Only TypeScript type-checking catches errors; no style or pattern enforcement
- **Risk:** Inconsistent code patterns, missed best-practice violations
- **Recommendation:** Add ESLint flat config with Next.js recommended rules

### In-Memory Rate Limiter Not Production-Ready
- **Impact:** Rate limiting resets on cold starts; no shared state across serverless instances
- **File:** `src/lib/rate-limit.ts` (has TODO comment acknowledging this)
- **Risk:** Rate limiting ineffective in serverless/edge deployment; Map can grow unbounded
- **Recommendation:** Migrate to Upstash Redis (`@upstash/ratelimit`) for edge-compatible rate limiting

## Medium Priority

### Static Plugin Data Drift
- **Impact:** `plugins-static.ts` has 23 plugins; `marketplace.json` has 27 entries
- **Missing from static fallback:** seo-geo-rag, gog-workspace, apple-photos, wp-cli-fleet
- **Risk:** These 4 plugins won't appear on the storefront when running without a database
- **Recommendation:** Auto-generate `plugins-static.ts` from `marketplace.json` + individual `plugin.json` files

### Marketplace Plugin Count Mismatch
- **Impact:** `marketplace.json` metadata says "25 production-ready plugins" but lists 27 entries; homepage copy says "23 production-ready plugins"
- **Files:** `.claude-plugin/marketplace.json` metadata.description, `src/app/page.tsx` line 144
- **Risk:** Confusing/misleading for users
- **Recommendation:** Update all copy to match actual count (27)

### CSP Uses `unsafe-inline`
- **Impact:** `script-src 'self' 'unsafe-inline'` in middleware CSP
- **File:** `src/middleware.ts`
- **Risk:** Potential XSS vector if user input reaches script evaluation
- **Recommendation:** Use nonce-based CSP if possible; at minimum remove `unsafe-eval` if present

### Middleware Not Migrated to proxy.ts
- **Impact:** Next.js 16 renamed `middleware.ts` to `proxy.ts`
- **File:** `src/middleware.ts` still uses old name
- **Risk:** May work but inconsistent with Next.js 16 conventions
- **Recommendation:** Rename to `proxy.ts` when upgrading to fully leverage Node.js runtime

### Duplicate Null Check in Plugin Detail Route
- **Impact:** `src/app/api/plugins/[slug]/route.ts` checks `rows.length === 0` twice (lines 80 and 87)
- **Risk:** Dead code — second check never reached
- **Recommendation:** Remove duplicate check

## Low Priority

### No CI/CD Pipeline
- **Impact:** No automated checks on pull requests
- **Risk:** Broken code can be merged without detection
- **Recommendation:** Add GitHub Actions for lint + type-check + plugin validation

### `unstable_cache` API
- **Impact:** Using `unstable_cache` from `next/cache` — API may change
- **Files:** `src/app/page.tsx`, `src/app/api/plugins/[slug]/route.ts`
- **Risk:** May break on Next.js upgrade
- **Recommendation:** Monitor Next.js 16 stable cache API; migrate when available

### Skills Index May Drift
- **File:** `skills_index.json` (43 KB) at repo root
- **Impact:** If plugins are added/removed without regenerating, the index becomes stale
- **Risk:** Cross-platform skill discovery returns outdated results
- **Recommendation:** Add index regeneration to validation script or pre-commit hook

### Memory Bank Drift Risk
- **Files:** `.agent/memory-bank/architecture.md`, `api-contracts.md`, `decision-log.md`
- **Impact:** These docs may fall out of sync with actual codebase
- **Recommendation:** Run `architecture-mapper` skill periodically or after significant changes

### `.DS_Store` in `.github/`
- **File:** `.github/.DS_Store` tracked in repository
- **Risk:** Unnecessary noise in git history
- **Recommendation:** Add `**/.DS_Store` to `.gitignore` and remove from tracking
