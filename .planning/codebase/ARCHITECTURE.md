# Architecture

> Generated: 2026-03-20 | Source: GSD Map-Codebase (sequential)

## System Overview

AgentHaus Marketplace is a dual-layer system:

1. **Plugin Registry** — 27 Markdown/JSON plugins consumed directly by Claude Code/Cowork
2. **Web Storefront** — Next.js 16 application for browsing, discovering, and sharing plugins

```text
┌──────────────────────────────────────────────────────┐
│              Web Storefront (Next.js 16)             │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ Pages    │  │Components │  │  API Routes       │  │
│  │ /        │  │ Navbar    │  │ GET /api/plugins  │  │
│  │ /[slug]  │  │ PluginGrid│  │ GET /api/…/[slug] │  │
│  │          │  │ PluginCard│  │ POST /…/share     │  │
│  └────┬─────┘  └───────────┘  └───────┬──────────┘  │
│       │                               │              │
│  ┌────▼───────────────────────────────▼────────────┐ │
│  │               Data Layer                        │ │
│  │  db.ts (Neon) ──or── plugins-static.ts          │ │
│  │  rate-limit.ts  │  validation.ts (Zod v4)       │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  middleware.ts (CSP + Permissions-Policy)             │
│  next.config.mjs (Security headers + HSTS)           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              Plugin Ecosystem (27 plugins)            │
│  Each: .claude-plugin/plugin.json + commands/         │
│        agents/ + skills/ + hooks/ + .mcp.json         │
│                                                      │
│  Totals: 61 commands, 10 agents, 27 skills,          │
│          5 hook configs, 7 MCP configs                │
│                                                      │
│  Registered in: .claude-plugin/marketplace.json v3.4  │
│  Validated by:  scripts/validate-plugins.sh           │
│  Schema:        schemas/plugin.schema.json            │
│  Index:         skills_index.json (43 KB)             │
└──────────────────────────────────────────────────────┘
```

## Data Flow

### Plugin Discovery (Homepage)
1. Server Component `page.tsx` calls `getPlugins()`
2. If `DATABASE_URL` set → `getCachedPluginsFromDB()` (1h cache via `unstable_cache`)
3. If no DB or query fails → fallback to `STATIC_PLUGINS` array (23 plugins)
4. Strips `capabilities` and `env_vars` from list view (payload optimization)
5. Renders `PluginGrid` with category filtering (client-side via `searchParams`)
6. JSON-LD structured data injected for SEO (`SoftwareApplication` schema)

### Plugin Detail
1. `/plugins/[slug]/page.tsx` renders detail view
2. API route `/api/plugins/[slug]` queries DB with correlated subqueries for capabilities + env_vars
3. Response cached per-slug for 1 hour

### Share Flow
1. `ShareButton` component sends POST to `/api/plugins/[slug]/share`
2. CSRF validation (origin/referer must match host)
3. Rate limited: 10/min per IP
4. Increments `share_count` in DB, returns new count

### Plugin Installation
1. User copies CLI command from storefront
2. `/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace`
3. Claude Code clones repo, validates structure, installs selected plugins

## Key Design Decisions

- **Static fallback:** `plugins-static.ts` provides full plugin catalog when DB is unavailable — makes `npm run build` work without DATABASE_URL
- **Security-first middleware:** CSP computed once at module load (not per-request regex); headers split between config (static) and middleware (dynamic)
- **Dual agent system:** `.agent/` (Antigravity IDE: 4 skills, 4 workflows) for core development; `.agents/skills/` (24 skills) for runtime plugin functionality
- **Marketplace manifest as registry:** `.claude-plugin/marketplace.json` is the canonical list of plugins; `plugins-static.ts` is a derived snapshot for offline use
- **No authentication:** Public storefront, no user accounts — simplifies deployment and security surface

## Component Hierarchy

```text
layout.tsx
└── page.tsx (Server Component)
    ├── Navbar
    ├── CommandCopy (client — copy-to-clipboard)
    └── PluginGrid (client — category filtering + search)
        └── PluginCard × N
            ├── Icons (dynamic Lucide mapping)
            ├── GridCommandCopy
            └── ShareButton
```

## Entry Points

| Entry Point | Type | File |
|------------|------|------|
| Homepage | Page | `src/app/page.tsx` |
| Plugin Detail | Page | `src/app/plugins/[slug]/page.tsx` |
| Plugin List API | Route Handler | `src/app/api/plugins/route.ts` |
| Plugin Detail API | Route Handler | `src/app/api/plugins/[slug]/route.ts` |
| Share API | Route Handler | `src/app/api/plugins/[slug]/share/route.ts` |
| Security Middleware | Middleware | `src/middleware.ts` |
| Plugin Validation | Script | `scripts/validate-plugins.sh` |
| Marketplace Manifest | Config | `.claude-plugin/marketplace.json` |
