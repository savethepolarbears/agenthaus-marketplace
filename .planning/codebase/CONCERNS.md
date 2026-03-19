# Concerns & Technical Debt

> Generated: 2026-03-19 | Source: GSD Map-Codebase

## High Priority

### No Test Suite

- **Impact:** No automated regression testing for the web storefront
- **Risk:** Refactoring or feature additions can break existing functionality silently
- **Recommendation:** Add Vitest + React Testing Library for component/API route tests

### No ESLint Configuration

- **Impact:** Only TypeScript type-checking catches errors; no style or pattern enforcement
- **Risk:** Inconsistent code patterns, missed best-practice violations
- **Recommendation:** Add ESLint flat config with Next.js recommended rules

### Plugin Metadata Inconsistency

- **Impact:** Plugin directories have `.claude-plugin/` subdirs with manifest skeletons, but `plugin.json` files were not found via search
- **Risk:** `validate-plugins.sh` may report validation errors if manifests are incomplete
- **Recommendation:** Audit all 27 plugin directories for complete `plugin.json` manifests

## Medium Priority

### Static Plugin Data Duplication

- **Impact:** Plugin metadata exists in both `marketplace.json` (27 entries) and `plugins-static.ts` (23 entries) — 4 newer plugins missing from static data
- **Risk:** Data drift between sources; storefront shows stale data without DB
- **Recommendation:** Auto-generate `plugins-static.ts` from `marketplace.json` or use a single source of truth

### Missing Plugins in Static Fallback

- Plugins in `marketplace.json` but not in `plugins-static.ts`:
  - `seo-geo-rag`
  - `gog-workspace`
  - `apple-photos`
  - `wp-cli-fleet`
- These won't appear on the storefront when running without a database

### Security: `unsafe-eval` in CSP

- **Impact:** `script-src 'self' 'unsafe-eval' 'unsafe-inline'` weakens CSP
- **Risk:** Potential XSS vector if user input reaches script evaluation
- **Recommendation:** Remove `unsafe-eval` and `unsafe-inline` if possible; use nonce-based CSP

## Low Priority

### No CI/CD Pipeline

- **Impact:** No automated checks on pull requests
- **Risk:** Broken code can be merged without detection
- **Recommendation:** Add GitHub Actions for lint + type-check + plugin validation

### Large Install Script

- `scripts/install-plugins.sh` is 22.6 KB — complex Bash logic
- Consider refactoring into a Node.js CLI for better error handling and testability

### `.DS_Store` Files in Repository

- Multiple `.DS_Store` files tracked in `plugins/` and `agenthaus-web/`
- Add `**/.DS_Store` to `.gitignore` and clean from history

### Memory Bank Drift Risk

- `.agent/memory-bank/` docs (architecture, api-contracts, decision-log) may fall out of sync with actual codebase
- Consider running `architecture-mapper` skill periodically to refresh
