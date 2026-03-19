# Testing & Quality

> Generated: 2026-03-19 | Source: GSD Map-Codebase

## Current State

### Web Application

- **Lint command:** `npm run lint` → `tsc --noEmit` (type-checking only)
- **No test framework configured** — no Jest, Vitest, or Playwright tests exist
- **No ESLint config** — only TypeScript strict mode for quality enforcement
- **Recommended:** Add Vitest + React Testing Library when tests are needed

### Plugin Validation

- **Script:** `scripts/validate-plugins.sh` (8.9 KB) — validates all plugin structures
- **Checks:** JSON syntax, required manifest fields, marketplace.json cross-references
- **CLI validation:** `claude plugin validate .` for individual plugins
- **Schema:** `schemas/plugin.schema.json` (JSON Schema v7) for manifest validation

### Plugin Installation Validation

- **Script:** `scripts/install-plugins.sh` (22.6 KB) — installs and validates plugins
- **Comprehensive:** Handles cloning, directory structure validation, environment setup

## Quality Tooling

| Tool                | Purpose                        | Status            |
|---------------------|--------------------------------|-------------------|
| TypeScript strict   | Static type checking           | ✅ Active         |
| validate-plugins.sh | Plugin structure validation    | ✅ Active         |
| plugin.schema.json  | Plugin manifest JSON Schema    | ✅ Active         |
| install-plugins.sh  | Plugin installation validation | ✅ Active         |
| Vitest / Jest       | Unit / integration tests       | ❌ Not configured |
| ESLint              | Code linting rules             | ❌ Not configured |
| Playwright          | E2E browser tests              | ❌ Not configured |

## Security Quality

- CSP enforcement via middleware
- HSTS, X-Frame-Options, X-XSS-Protection via next.config.mjs
- Rate limiting (`rate-limit.ts`) on API routes
- Input validation (`validation.ts`) on API boundaries
- Permissions-Policy restricts camera, microphone, geolocation

## Testing Philosophy (from AGENTS.md)

- "When tests fail, fix the code, not the test"
- Tests should be meaningful and test actual functionality
- Each test should have a clear purpose documented in comments
- Failing tests reveal bugs — fix the root cause
