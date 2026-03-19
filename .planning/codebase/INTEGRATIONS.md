# External Integrations

> Generated: 2026-03-19 | Source: GSD Map-Codebase

## MCP Servers (14 unique)

| # | Server Package                              | Used By                        |
|---|---------------------------------------------|--------------------------------|
| 1 | @modelcontextprotocol/server-github         | github-integration, devops-flow|
| 2 | @cloudflare/mcp-server-cloudflare           | cloudflare-platform, devops-flow|
| 3 | @modelcontextprotocol/server-vercel         | vercel-deploy                  |
| 4 | @modelcontextprotocol/server-slack          | devops-flow, task-commander    |
| 5 | @modelcontextprotocol/server-notion         | notion-workspace, knowledge-synapse |
| 6 | @modelcontextprotocol/server-context7       | context7-docs                  |
| 7 | @upstash/context7-mcp                       | knowledge-synapse              |
| 8 | @modelcontextprotocol/server-google-drive   | knowledge-synapse              |
| 9 | @taazkareem/clickup-mcp-server              | clickup-tasks, task-commander  |
|10 | @modelcontextprotocol/server-gmail          | task-commander, qa-droid       |
|11 | @modelcontextprotocol/server-google-calendar| task-commander                 |
|12 | @modelcontextprotocol/server-playwright     | playwright-testing             |
|13 | @modelcontextprotocol/server-postgres       | neon-db, data-core             |
|14 | Custom playwright-local                     | qa-droid                       |

## Database Integration

- **Provider:** Neon Serverless Postgres
- **Client:** `@neondatabase/serverless` (tagged-template `neon()` client)
- **Fallback:** Static plugin data when `DATABASE_URL` is unset
- **Schema:** 3 tables — `plugins`, `plugin_capabilities`, `plugin_env_vars`

## API Routes

| Route                          | Method | Purpose                    |
|--------------------------------|--------|----------------------------|
| `/api/plugins`                 | GET    | List all plugins           |
| `/api/plugins/[slug]`          | GET    | Get plugin by slug         |
| `/api/plugins/[slug]/share`    | POST   | Increment share count      |

## External Services

| Service        | Integration Type | Purpose                          |
|----------------|-----------------|----------------------------------|
| GitHub         | MCP + REST API  | Issue/PR management, repo hosting|
| Cloudflare     | MCP server      | Workers, KV, AI Gateway          |
| Vercel         | MCP server      | Deployment management            |
| Slack          | MCP server      | Team notifications               |
| Notion         | MCP server      | Knowledge management             |
| Google Drive   | MCP server      | Document retrieval (RAG)         |
| ClickUp        | MCP server      | Task management                  |
| Gmail          | MCP server      | Email automation                 |
| Google Calendar| MCP server      | Scheduling                       |
| Context7       | MCP server      | Library documentation            |
| Playwright     | MCP server      | Browser testing                  |

## Security Headers (Middleware)

CSP, HSTS, X-Frame-Options, X-XSS-Protection, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy are enforced via `next.config.mjs` and `middleware.ts`.
