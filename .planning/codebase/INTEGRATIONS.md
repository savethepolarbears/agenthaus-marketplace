# External Integrations

> Generated: 2026-03-20 | Source: GSD Map-Codebase (sequential)

## MCP Servers (14 unique across plugins)

| # | Server Package                              | Used By                            |
|---|---------------------------------------------|------------------------------------|
| 1 | @modelcontextprotocol/server-github         | github-integration, devops-flow    |
| 2 | @cloudflare/mcp-server-cloudflare           | cloudflare-platform, devops-flow   |
| 3 | @modelcontextprotocol/server-vercel         | vercel-deploy                      |
| 4 | @modelcontextprotocol/server-slack          | devops-flow, task-commander        |
| 5 | @modelcontextprotocol/server-notion         | notion-workspace, knowledge-synapse|
| 6 | @modelcontextprotocol/server-context7       | context7-docs                      |
| 7 | @upstash/context7-mcp                       | knowledge-synapse                  |
| 8 | @modelcontextprotocol/server-google-drive   | knowledge-synapse                  |
| 9 | @taazkareem/clickup-mcp-server              | clickup-tasks, task-commander      |
|10 | @modelcontextprotocol/server-gmail          | task-commander, qa-droid           |
|11 | @modelcontextprotocol/server-google-calendar| task-commander                     |
|12 | @modelcontextprotocol/server-playwright     | playwright-testing                 |
|13 | @modelcontextprotocol/server-postgres       | neon-db, data-core                 |
|14 | Custom playwright-local                     | qa-droid                           |

Plugins with `.mcp.json` files: agent-memory, clickup-tasks, data-core, devops-flow, knowledge-synapse, qa-droid, task-commander (7 total).

## Database Integration

- **Provider:** Neon Serverless Postgres
- **Client:** `@neondatabase/serverless` — tagged-template `neon()` client (`src/lib/db.ts`)
- **Fallback:** `STATIC_PLUGINS` array in `src/lib/plugins-static.ts` (23 plugins hardcoded)
- **Caching:** `unstable_cache` with 1-hour TTL, tag-based invalidation (`plugins`, `plugin-${slug}`)
- **Schema:** 3 tables — `plugins`, `plugin_capabilities`, `plugin_env_vars`
- **Query optimization:** Correlated subqueries instead of LEFT JOIN + GROUP BY; GIN index on tags

## API Routes

| Route                          | Method | Purpose                    | Auth        | Rate Limit     |
|--------------------------------|--------|----------------------------|-------------|----------------|
| `/api/plugins`                 | GET    | List/search plugins        | None        | 60/min per IP  |
| `/api/plugins/[slug]`          | GET    | Get plugin detail          | None        | 60/min per IP  |
| `/api/plugins/[slug]/share`    | POST   | Increment share count      | CSRF check  | 10/min per IP  |

### Rate Limiting (`src/lib/rate-limit.ts`)
- In-memory fixed-window counter per IP
- `RateLimiter` class with configurable limit and window
- Two instances: `searchLimiter` (60/min) and `rateLimiter` (10/min)
- Auto-cleanup when map exceeds 10K entries
- Returns 429 with `Retry-After`, `X-RateLimit-*` headers
- **TODO:** Migrate to Upstash Redis for serverless/edge compatibility

### Input Validation (`src/lib/validation.ts`)
- Zod v4 schemas for query params and slugs
- `sanitizeQuery()` strips control chars (prevents null byte injection)
- `escapeLikeString()` escapes LIKE wildcards (prevents ReDoS)
- `isValidSlug()` regex validation: `^[a-z0-9-]+$`
- Max input length: 100 characters

## Security Headers

### Middleware (`src/middleware.ts`)
- Content-Security-Policy: `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `frame-ancestors 'none'`
- Permissions-Policy: camera=(), microphone=(), geolocation=()
- CSP string computed once at module load (not per request)

### Next.js Config (`next.config.mjs`)
- Strict-Transport-Security (HSTS): 2-year max-age, includeSubDomains, preload
- X-XSS-Protection: 1; mode=block
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-DNS-Prefetch-Control: on

### Share Endpoint CSRF Protection
- Validates `Origin`/`Referer` header matches request `Host`
- Rejects requests without origin header

## External Services

| Service        | Integration Type | Purpose                          |
|----------------|-----------------|----------------------------------|
| GitHub         | MCP + hosting   | Repo hosting, issue/PR management|
| Cloudflare     | MCP server      | Workers, KV, AI Gateway          |
| Vercel         | MCP + deploy    | Deployment target                |
| Slack          | MCP server      | Team notifications               |
| Notion         | MCP server      | Knowledge management             |
| Google Drive   | MCP server      | Document retrieval (RAG)         |
| ClickUp        | MCP server      | Task management                  |
| Gmail          | MCP server      | Email automation                 |
| Google Calendar| MCP server      | Scheduling                       |
| Context7       | MCP server      | Library documentation            |
| Playwright     | MCP server      | Browser testing                  |
| Neon           | SDK             | Serverless Postgres              |

## Authentication

No user authentication system. The web storefront is public.
All secrets are environment variables passed via MCP config `${ENV_VAR}` interpolation.
