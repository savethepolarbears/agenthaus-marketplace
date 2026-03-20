# Test Coverage Analysis

**Date:** 2026-03-20
**Scope:** Full codebase (agenthaus-web + plugins + validation scripts)

## Current State

### Test Files (3 total, ~201 lines)

| File | Tests | Framework |
|------|-------|-----------|
| `agenthaus-web/scripts/test-validation.ts` | `sanitizeQuery()`, `escapeLikeString()` (16 cases) | Manual Node.js |
| `agenthaus-web/scripts/test-rate-limit.ts` | Basic rate limiting (3 scenarios) | Manual Node.js |
| `agenthaus-web/scripts/test-rate-limit-robustness.ts` | Memory cleanup, attacker state preservation | Manual Node.js |

### Validation Scripts

| Script | What It Checks |
|--------|----------------|
| `scripts/validate-plugins.sh` (427 lines) | Plugin JSON structure, file references, hook security patterns, marketplace.json |
| `scripts/generate-skills-index.sh` (94 lines) | Skills index consistency |

### What's Missing

- **No test framework** (no Jest, Vitest, or React Testing Library installed)
- **No `npm test` script** in package.json
- **No CI/CD pipeline** (no GitHub Actions)
- **No test coverage reporting**

## Coverage by Area

| Area | Files | Lines | Tested | Coverage |
|------|-------|-------|--------|----------|
| API routes | 3 | ~238 | 0% | None |
| Lib/utilities | 5 | ~970 | ~15% | Partial (validation.ts, rate-limit.ts only) |
| React components | 7 | ~720 | 0% | None |
| Pages | 3 | ~588 | 0% | None |
| Middleware | 1 | ~30 | 0% | None |
| Plugin validation | 27 plugins | N/A | Structural only | Partial |

**Estimated overall coverage: ~5-10%**

---

## Recommended Improvements (Priority Order)

### 1. HIGH: Set Up Test Infrastructure

**Why:** No test framework exists. All current tests are manual scripts with hand-rolled assertions. There's no `npm test` command, no CI, and no coverage tracking.

**What to do:**
- Install Vitest + React Testing Library + @testing-library/jest-dom
- Add `test`, `test:watch`, and `test:coverage` scripts to package.json
- Migrate the 3 existing test scripts into proper Vitest test files
- Add a GitHub Actions workflow to run tests on PR

### 2. HIGH: API Route Tests

**Why:** The 3 API routes handle database queries, user input, rate limiting, and CSRF protection — all with zero test coverage. These are the most security-sensitive code paths.

**What to test:**

**`GET /api/plugins`** — the search endpoint:
- Query parameter validation (valid/invalid category, search, tag values)
- SQL injection prevention (malicious search strings)
- Rate limiting enforcement (60 req/min threshold)
- Fallback behavior when database is unavailable (503 response)
- Response shape and status codes

**`GET /api/plugins/[slug]`** — plugin detail:
- Valid slug returns plugin with capabilities and env_vars
- Invalid/nonexistent slug returns 404
- Slug validation rejects malicious input
- Static data fallback when DB is down

**`POST /api/plugins/[slug]/share`** — share counter:
- CSRF protection (missing/invalid Origin header → 403)
- Rate limiting (10 req/min threshold)
- Share count increment returns updated count
- Nonexistent plugin returns 404

### 3. HIGH: Validation & Security Utility Tests

**Why:** `validation.ts` and `rate-limit.ts` have basic tests, but they're manual scripts. Important edge cases are untested.

**What to add:**
- `isValidSlug()`: boundary cases (empty string, 101 chars, unicode, special chars)
- `sanitizeQuery()`: full Unicode control character range, combining characters
- `escapeLikeString()`: nested escape sequences, empty strings
- `pluginSearchSchema` / `slugSchema`: Zod schema rejection of bad input
- `RateLimiter`: concurrent access patterns, FIFO eviction at 10,000 entries, window reset timing
- `getIp()`: X-Forwarded-For parsing with multiple IPs, spoofing resistance

### 4. MEDIUM: Plugin Validation Schema Gaps

**Why:** Plugin validation only checks JSON structure and file existence. It doesn't validate the *content* of referenced files.

**What to add:**
- Schema for `marketplace.json` (currently validated with ad-hoc bash checks)
- YAML frontmatter validation for commands, agents, and skills (.md files)
- Environment variable cross-reference (declared vars vs `.env.example`)
- Cross-plugin conflict detection (duplicate command names, agent names)
- MCP config validation (`.mcp.json` server entries have required fields)

### 5. MEDIUM: React Component Tests

**Why:** 7 client components with interactive behavior (search, filtering, clipboard, keyboard shortcuts) have no tests.

**Priority components:**

**`plugin-grid.tsx`** (most complex):
- Search filtering produces correct results
- Category filter pills toggle correctly
- Keyboard shortcuts work ("/" focuses search, ESC clears/blurs)
- URL sync updates query params without page reload
- Empty state renders when no plugins match
- Debouncing works (doesn't filter on every keystroke)

**`share-button.tsx`**:
- Calls native share API when available
- Falls back to clipboard when share unavailable/cancelled
- Increments share count via API on success
- Shows loading/copied states

**`plugin-card.tsx`**:
- Renders all plugin metadata (name, description, version, install count)
- Icon fallback works when icon not in map
- Memoization prevents unnecessary re-renders

### 6. MEDIUM: Middleware & Security Header Tests

**Why:** The middleware sets Content-Security-Policy and Permissions-Policy headers. A regression here silently degrades security.

**What to test:**
- CSP header is present and well-formed on all routes
- Permissions-Policy disables camera, microphone, geolocation
- Headers from `next.config.mjs` (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Matcher excludes static assets correctly

### 7. LOW: Page-Level Integration Tests

**Why:** Server components with data fetching, metadata generation, and JSON-LD structured data are untested.

**What to test:**
- Homepage renders plugin grid with correct data
- Plugin detail page renders capabilities grouped by type
- JSON-LD structured data is valid and contains correct values
- Dynamic metadata (title, description, OG tags) matches plugin data
- Static params generation covers all 23 plugins
- Fallback to static data when DB unavailable

### 8. LOW: Hook Security Scanner Improvements

**Why:** The current bash-based scanner checks for obvious patterns (`eval`, unquoted `$TOOL_INPUT`, backticks) but misses subtler injection vectors.

**What to add:**
- Indirect variable expansion (`$VAR` where VAR derives from user input)
- Newline injection in log outputs
- Path traversal in `${CLAUDE_PLUGIN_ROOT}` references
- Validate that `.sh` scripts have correct permissions
- Test the scanner itself with known-bad and known-good hook files

---

## Quick Wins

These can be done immediately with minimal effort:

1. **Install Vitest** and add `npm test` script (~15 min)
2. **Migrate existing 3 test files** to Vitest format (~30 min)
3. **Add API route tests** for input validation and error responses (~2 hours)
4. **Add GitHub Actions workflow** to run tests on PR (~30 min)
5. **Add marketplace.json JSON Schema** to `schemas/` (~1 hour)

## Metrics to Track

Once infrastructure is in place, target these milestones:

| Milestone | Target Coverage |
|-----------|----------------|
| Phase 1: Infrastructure + utility tests | 30% |
| Phase 2: API routes + middleware | 55% |
| Phase 3: Components + pages | 75% |
| Phase 4: Integration + E2E | 85% |
