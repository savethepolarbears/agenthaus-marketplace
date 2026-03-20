# Testing & Quality

> Generated: 2026-03-20 | Source: GSD Map-Codebase (sequential)

## Current State

### Web Application (`agenthaus-web/`)

- **Lint command:** `npm run lint` → `tsc --noEmit` (type-checking only)
- **No test framework configured** — no Jest, Vitest, or Playwright tests exist
- **No ESLint config** — only TypeScript strict mode for quality enforcement
- **No CI/CD pipeline** — no GitHub Actions workflows
- **Test file pattern (when added):** `*.test.ts`, `*.test.tsx`, `*.spec.ts`

### Plugin Validation

- **Script:** `scripts/validate-plugins.sh` (~280 lines)
  - Validates `marketplace.json`: JSON syntax, required fields, duplicate names
  - Validates each plugin: `plugin.json` fields, referenced file existence, JSON syntax
  - Validates `.mcp.json` syntax when present
  - Validates hook format (object with `"hooks"` key, not flat array)
  - Checks for relative paths that should use `${CLAUDE_PLUGIN_ROOT}`
  - MCP consistency: warns if `plugin.json` declares mcpServers but `.mcp.json` missing
  - **Hook security scanner:** Scans `.sh` files for `eval`, unquoted `$TOOL_INPUT`, backtick substitution with user input
  - **Skills index sync check:** Compares `skills_index.json` entry count vs actual files
  - Color-coded output: PASS (green), FAIL (red), WARN (yellow)
  - Exit code 1 on any failure

- **CLI validation:** `claude plugin validate .` for individual plugins
- **Schema:** `schemas/plugin.schema.json` (JSON Schema v7) for manifest validation

### Plugin Installation Validation

- **Script:** `scripts/install-plugins.sh` — handles cloning, structure validation, environment setup

## Quality Tooling

| Tool                | Purpose                        | Status            |
|---------------------|--------------------------------|-------------------|
| TypeScript strict   | Static type checking           | Active            |
| validate-plugins.sh | Plugin structure + security    | Active            |
| plugin.schema.json  | Plugin manifest JSON Schema    | Active            |
| install-plugins.sh  | Plugin installation validation | Active            |
| skills_index.json   | Cross-platform skill discovery | Active            |
| Vitest / Jest       | Unit / integration tests       | Not configured    |
| ESLint              | Code linting rules             | Not configured    |
| Playwright          | E2E browser tests              | Not configured    |
| GitHub Actions      | CI/CD pipeline                 | Not configured    |

## Security Quality Measures

- CSP enforcement via `middleware.ts`
- HSTS + security headers via `next.config.mjs`
- Rate limiting on all API routes (`rate-limit.ts`)
- Input validation + sanitization on API boundaries (`validation.ts` + Zod v4)
- CSRF protection on state-changing endpoints (Origin/Referer check)
- Permissions-Policy restricts camera, microphone, geolocation
- Hook security scanning in validation script (eval, injection patterns)

## Testing Philosophy (from AGENTS.md)

- "When tests fail, fix the code, not the test"
- Tests should be meaningful and test actual functionality
- Each test should have a clear purpose documented in comments
- Failing tests reveal bugs — fix the root cause

## Recommended Additions

1. **Vitest + React Testing Library** for component and API route tests
2. **ESLint flat config** with Next.js recommended rules
3. **GitHub Actions** for lint + type-check + plugin validation on PRs
4. **Playwright** for E2E storefront testing (page loads, plugin cards, search, share)
