# Technology Stack

> Generated: 2026-03-20 | Source: GSD Map-Codebase (sequential)

## Primary Languages

| Language   | Usage                          | Config            |
|------------|--------------------------------|-------------------|
| TypeScript | Web storefront (agenthaus-web) | `tsconfig.json`   |
| Markdown   | Plugin configs, skills, agents | YAML frontmatter  |
| JSON       | Schemas, manifests, MCP configs| JSON Schema v7    |
| Bash       | Validation/install scripts     | POSIX-compatible  |
| Python 3   | Used by validation script      | JSON parsing only |
| SQL        | Database schema definitions    | PostgreSQL dialect|

## Runtime & Framework

| Component     | Technology         | Version   |
|---------------|--------------------|-----------|
| Framework     | Next.js            | ^16.0.0   |
| UI Library    | React              | ^19.0.0   |
| CSS Framework | Tailwind CSS       | ^4.0.0    |
| Node Target   | ES2022             | —         |
| Module System | ESNext / Bundler   | —         |

## Database

| Component  | Technology                                   | Version |
|------------|----------------------------------------------|---------|
| Provider   | Neon Serverless Postgres                     | —       |
| Client SDK | @neondatabase/serverless                     | ^0.10.0 |
| Schema     | 3 tables: plugins, plugin_capabilities, plugin_env_vars | — |
| Indexes    | GIN on tags, btree on slug/category/plugin_id | — |

## Key Dependencies (`agenthaus-web/package.json` v2.0.0)

| Package                  | Version  | Purpose                 |
|--------------------------|----------|-------------------------|
| next                     | ^16.0.0  | App framework           |
| react / react-dom        | ^19.0.0  | UI rendering            |
| @neondatabase/serverless | ^0.10.0  | Database client         |
| zod                      | ^4.3.6   | Schema validation       |
| lucide-react             | ^0.469.0 | Icon library            |
| clsx                     | ^2.1.1   | Conditional class names |
| tailwindcss              | ^4.0.0   | Utility-first CSS       |
| typescript               | ^5.7.0   | Type checking           |

## DevDependencies

| Package          | Version  | Purpose               |
|------------------|----------|-----------------------|
| @types/node      | ^22.0.0  | Node type definitions |
| @types/react     | ^19.0.0  | React type defs       |
| @types/react-dom | ^19.0.0  | ReactDOM type defs    |
| autoprefixer     | ^10.4.0  | CSS vendor prefixes   |
| postcss          | ^8.4.0   | CSS processing        |
| ts-node          | ^10.9.2  | TypeScript execution  |

## Build Configuration

### TypeScript (`agenthaus-web/tsconfig.json`)
- **Target:** ES2022, **Module:** ESNext, **Resolution:** bundler
- **Strict mode:** enabled
- **Path alias:** `@/*` → `./src/*`
- **JSX:** react-jsx (no React import needed)
- **Incremental compilation:** enabled

### Tailwind CSS 4
- CSS-based configuration via `@import "tailwindcss"` in `src/app/globals.css`
- No `tailwind.config.js` — v4 auto-detects content sources
- No separate PostCSS config file

### Next.js (`next.config.mjs`)
- `poweredByHeader: false`
- Security headers: HSTS, X-XSS-Protection, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, X-DNS-Prefetch-Control
- No experimental features
- Uses `middleware.ts` (not yet migrated to `proxy.ts` for Next.js 16)

## Build & Run Commands

```bash
npm run dev    # next dev
npm run build  # next build
npm run start  # next start
npm run lint   # tsc --noEmit (type-checking only, NOT ESLint)
```

## Environment Variables

| Variable             | Required By                      | Purpose                         |
|----------------------|----------------------------------|---------------------------------|
| DATABASE_URL         | agenthaus-web                    | Neon Postgres connection string |
| NEXT_PUBLIC_API_URL  | agenthaus-web                    | Public API base URL             |
| CLOUDFLARE_API_TOKEN | cloudflare-platform, devops-flow | Cloudflare API access           |
| GITHUB_TOKEN         | github-integration, devops-flow  | GitHub API access               |
| VERCEL_TOKEN         | vercel-deploy                    | Vercel API access               |
| NOTION_API_KEY       | notion-workspace                 | Notion integration              |
| CLICKUP_API_TOKEN    | clickup-tasks                    | ClickUp integration             |
| SLACK_BOT_TOKEN      | devops-flow                      | Slack bot access                |
| NEON_API_KEY         | neon-db, data-core               | Neon platform API               |
| NEON_DATABASE_URL    | agent-memory                     | Agent memory database           |
| GOOGLE_CLIENT_ID     | gog-workspace                    | Google OAuth                    |
| WP_CLI_SSH_KEY       | wp-cli-fleet                     | WordPress SSH access (optional) |

Full list: `.env.example` (33 lines)
