# Architecture

> Generated: 2026-03-19 | Source: GSD Map-Codebase

## System Overview

AgentHaus Marketplace is a dual-layer system:

1. **Plugin Registry** — 27 Markdown/JSON plugins consumed directly by Claude Code/Cowork
2. **Web Storefront** — Next.js 16 application for browsing, discovering, and sharing plugins

```text
┌──────────────────────────────────────────────────┐
│              Web Storefront (Next.js 16)         │
│  ┌─────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ Pages   │  │Components│  │  API Routes      │ │
│  │ /       │  │ NavBar   │  │ /api/plugins     │ │
│  │ /[slug] │  │ PluginGrid  │ /api/plugins/[s] │ │
│  │         │  │ PluginCard│  │ /api/.../share   │ │
│  └────┬────┘  └──────────┘  └────────┬─────────┘ │
│       │                              │            │
│  ┌────▼──────────────────────────────▼──────────┐ │
│  │              Data Layer                      │ │
│  │  db.ts (Neon) ──or── plugins-static.ts       │ │
│  │  rate-limit.ts  │  validation.ts             │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  middleware.ts (CSP + Permissions-Policy)          │
│  next.config.mjs (Security headers + HSTS)        │
└──────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────┐
│              Plugin Ecosystem (27 plugins)        │
│  Each: .claude-plugin/plugin.json + commands/     │
│        agents/ + skills/ + hooks/ + README.md     │
│                                                   │
│  Registered in: .claude-plugin/marketplace.json   │
│  Validated by:  scripts/validate-plugins.sh       │
│  Schema:        schemas/plugin.schema.json        │
└──────────────────────────────────────────────────┘
```

## Data Flow

1. **Plugin Discovery:** User visits storefront → page fetches from Neon DB (or static fallback) → renders plugin cards
2. **Plugin Detail:** `/plugins/[slug]` → API route queries DB by slug → returns capabilities, env vars, metadata
3. **Share:** POST to `/api/plugins/[slug]/share` → increments `share_count` in DB
4. **Installation:** User copies CLI command → `scripts/install-plugins.sh` clones + validates + installs

## Key Design Decisions

- **Static fallback:** `plugins-static.ts` provides full plugin catalog when DB is unavailable (development/offline mode)
- **No plugin.json in plugin dirs:** Plugin metadata lives centrally in `marketplace.json` and `plugins-static.ts`, not per-plugin directories
- **Dual agent system:** `.agent/` (4 skills, 4 workflows) for core development workflow; `.agents/` (24 skills) for runtime plugin functionality
- **Security-first middleware:** CSP computed once at module load, security headers split between config and middleware
