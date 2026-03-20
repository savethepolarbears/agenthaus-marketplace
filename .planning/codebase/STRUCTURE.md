# Directory Structure

> Generated: 2026-03-20 | Source: GSD Map-Codebase (sequential)

## Root Layout

```text
agenthaus-marketplace/
├── agenthaus-web/              # Next.js 16 storefront (v2.0.0)
├── plugins/                    # 27 production plugins (Markdown/JSON)
│   ├── agent-handoff/          # Orchestration: blackboard protocol handoff
│   ├── agent-memory/           # Memory: persistent recall via Neon
│   ├── apple-photos/           # Media: Apple Photos via osxphotos
│   ├── circuit-breaker/        # Safety: deploy gates + budget guards
│   ├── clickup-tasks/          # Productivity: ClickUp MCP
│   ├── cloudflare-platform/    # Cloud: Workers + KV + AI Gateway
│   ├── context7-docs/          # Docs: hallucination-free library docs
│   ├── data-core/              # Database: Postgres with migrations
│   ├── devops-flow/            # DevOps: Cloudflare + GitHub + Slack
│   ├── fleet-commander/        # Orchestration: agent session monitoring
│   ├── github-integration/     # DevOps: GitHub issues & PRs
│   ├── gog-workspace/          # Productivity: Google Workspace
│   ├── knowledge-synapse/      # RAG: Context7 + Notion + Drive
│   ├── marketplace-cli/        # Utility: plugin management CLI
│   ├── neon-db/                # Database: Neon Postgres MCP
│   ├── notion-workspace/       # Knowledge: Notion pages MCP
│   ├── openclaw-bridge/        # Integration: OpenClaw format
│   ├── playwright-testing/     # QA: E2E browser tests
│   ├── plugin-auditor/         # Security: plugin code scanner
│   ├── qa-droid/               # Testing: automated tests + notifications
│   ├── seo-geo-rag/            # SEO: optimization + RAG
│   ├── shadow-mode/            # Training: review queue for actions
│   ├── social-media/           # Content: multi-platform posts
│   ├── task-commander/         # Productivity: ClickUp+Slack+Gmail+Cal
│   ├── ux-ui/                  # UX: UI audits + accessibility
│   ├── vercel-deploy/          # Deployment: Vercel MCP
│   └── wp-cli-fleet/           # DevOps: WordPress fleet management
├── schemas/                    # JSON Schema for validation
│   └── plugin.schema.json      # Plugin manifest schema
├── scripts/                    # Shell scripts
│   ├── validate-plugins.sh     # Validate all plugins + marketplace
│   ├── install-plugins.sh      # Plugin installation script
│   └── generate-skills-index.sh # Generate skills_index.json
├── reports/                    # Project reports and documentation
├── docs/
│   └── agent-identity.md       # Agent identity documentation
├── .agent/                     # Antigravity IDE integration
│   ├── memory-bank/            # Persistent context docs
│   │   ├── architecture.md
│   │   ├── api-contracts.md
│   │   └── decision-log.md
│   ├── skills/                 # 4 development skills
│   │   ├── architecture-mapper/
│   │   ├── create-agent-plugin/
│   │   ├── plugin-qa-validation/
│   │   └── publish-to-marketplace/
│   ├── workflows/              # 4 slash command workflows
│   │   ├── codebase-onboarding.md
│   │   ├── create-plugin.md
│   │   ├── qa-browser-test.md
│   │   └── validate-and-publish.md
│   └── rules/                  # Code quality rules (7 files)
├── .agents/                    # Runtime agent skills
│   └── skills/                 # 24 runtime skills
├── .claude/                    # Claude Code settings
├── .claude-plugin/             # Marketplace registry
│   └── marketplace.json        # v3.4.0, 27 plugin entries
├── .github/
│   └── copilot-instructions.md # GitHub Copilot guidance
├── .jules/                     # Jules CI integration
├── .planning/                  # GSD planning directory
│   └── codebase/               # This directory (7 docs)
├── AGENTS.md                   # AI assistant guidance (canonical)
├── CLAUDE.md                   # Symlink → AGENTS.md
├── GEMINI.md                   # Gemini CLI guidance
├── CONTRIBUTING.md             # Plugin development guide
├── README.md                   # Project overview
├── skills_index.json           # Universal skills index (43 KB)
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
└── run_checks.sh               # Quick check script
```

## Web App (`agenthaus-web/src/`)

```text
src/
├── app/
│   ├── api/
│   │   └── plugins/
│   │       ├── route.ts              # GET /api/plugins (list, search, filter)
│   │       └── [slug]/
│   │           ├── route.ts          # GET /api/plugins/:slug (detail)
│   │           └── share/
│   │               └── route.ts      # POST /api/plugins/:slug/share
│   ├── plugins/
│   │   └── [slug]/
│   │       └── page.tsx              # Plugin detail page (SSR)
│   ├── globals.css                   # Tailwind v4 import
│   ├── layout.tsx                    # Root layout (metadata, fonts)
│   └── page.tsx                      # Homepage (SSR with DB fallback)
├── components/                       # 7 components, 720 lines total
│   ├── command-copy.tsx              # CLI command copy widget (64 lines)
│   ├── grid-command-copy.tsx         # Grid-mode copy widget (50 lines)
│   ├── icons.tsx                     # Icon mapping component (54 lines)
│   ├── navbar.tsx                    # Top navigation bar (54 lines)
│   ├── plugin-card.tsx              # Plugin card component (76 lines)
│   ├── plugin-grid.tsx             # Plugin grid with filtering (307 lines)
│   └── share-button.tsx            # Social share button (115 lines)
├── lib/                             # Shared utilities
│   ├── db.ts                       # Neon database client (7 lines)
│   ├── icons.ts                    # Icon name → Lucide component map
│   ├── plugins-static.ts          # Static plugin data (532 lines, 23 plugins)
│   ├── rate-limit.ts              # Request rate limiting (148 lines)
│   └── validation.ts             # Input validation + Zod schemas (59 lines)
└── middleware.ts                   # CSP + Permissions-Policy (53 lines)
```

## Plugin Anatomy (Typical)

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json          # Manifest: name, version, description, author,
│                            # homepage, license, tags[], commands[], agents[],
│                            # skills[], hooks[], mcpServers{}
├── .mcp.json                # MCP server configs (7 of 27 plugins have this)
├── commands/                # Slash commands (Markdown + YAML frontmatter)
│   └── *.md                 # File/folder name becomes command name
├── agents/                  # Subagent definitions (Markdown + YAML frontmatter)
│   └── *.md                 # name, description, model in frontmatter
├── skills/                  # SKILL.md files
│   └── <skill-name>/
│       └── SKILL.md         # name, description in YAML frontmatter
├── hooks/                   # Event hooks (JSON object format)
│   └── hooks.json           # { "hooks": { "PreToolUse": [...] } }
└── README.md                # Plugin documentation
```

## Plugin Capability Counts

| Plugin | Commands | Agents | Skills | Hooks | MCP |
|--------|----------|--------|--------|-------|-----|
| social-media | 5 | 2 | 1 | 1 | — |
| gog-workspace | 12 | 2 | 1 | 1 | — |
| apple-photos | 10 | 2 | 1 | — | — |
| wp-cli-fleet | 6 | 2 | 1 | 1 | — |
| marketplace-cli | 5 | — | 1 | — | — |
| agent-handoff | 3 | — | 1 | 1 | — |
| agent-memory | 3 | — | 1 | — | yes |
| fleet-commander | 3 | 1 | 1 | — | — |
| shadow-mode | 3 | — | 1 | 1 | — |
| seo-geo-rag | 3 | — | 1 | — | — |
| cloudflare-platform | 2 | — | 1 | — | — |
| github-integration | 2 | — | 1 | — | — |
| notion-workspace | 2 | — | 1 | — | — |
| openclaw-bridge | 2 | — | 1 | — | — |
| circuit-breaker | 1 | — | 1 | 1 | — |
| context7-docs | 1 | — | 1 | — | — |
| devops-flow | 1 | — | 1 | — | yes |
| neon-db | 1 | — | 1 | — | — |
| plugin-auditor | 1 | 1 | 1 | — | — |
| task-commander | 1 | — | 1 | — | yes |
| ux-ui | 1 | 1 | 1 | — | — |
| vercel-deploy | 1 | — | 1 | — | — |
| clickup-tasks | — | — | 1 | — | yes |
| data-core | — | — | 1 | — | yes |
| knowledge-synapse | — | — | 1 | — | yes |
| playwright-testing | — | 1 | 1 | — | — |
| qa-droid | — | 1 | 1 | — | yes |
| **Totals** | **61** | **10** | **27** | **5** | **7** |
