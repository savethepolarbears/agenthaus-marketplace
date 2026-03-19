# Directory Structure

> Generated: 2026-03-19 | Source: GSD Map-Codebase

## Root Layout

```text
agenthaus-marketplace/
├── agenthaus-web/              # Next.js 16 storefront application
├── plugins/                    # 27 production plugins (Markdown/JSON)
├── schemas/                    # JSON Schema for plugin validation
├── scripts/                    # Shell scripts (validate, install)
├── reports/                    # Project reports and documentation
├── .agent/                     # Antigravity IDE integration (dev workflows)
├── .agents/                    # Runtime agent skills (24 skills)
├── .claude/                    # Claude Code settings
├── .claude-plugin/             # Marketplace registry (marketplace.json)
├── .github/                    # GitHub configuration
├── .jules/                     # Jules CI integration
├── AGENTS.md                   # AI assistant guidance (symlinked)
├── CONTRIBUTING.md             # Plugin development guide
├── README.md                   # Project overview
├── .env.example                # Environment variable template
└── .gitignore                  # Git ignore rules
```

## Web App (agenthaus-web/src/)

```text
src/
├── app/
│   ├── api/
│   │   └── plugins/
│   │       ├── route.ts              # GET /api/plugins (list all)
│   │       └── [slug]/
│   │           ├── route.ts          # GET /api/plugins/:slug
│   │           └── share/
│   │               └── route.ts      # POST /api/plugins/:slug/share
│   ├── plugins/
│   │   └── [slug]/
│   │       └── page.tsx              # Plugin detail page
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Homepage
├── components/
│   ├── command-copy.tsx              # CLI command copy widget
│   ├── grid-command-copy.tsx         # Grid-mode copy widget
│   ├── icons.tsx                     # Icon mapping component
│   ├── navbar.tsx                    # Top navigation bar
│   ├── plugin-card.tsx              # Plugin card component
│   ├── plugin-grid.tsx             # Plugin grid with filtering
│   └── share-button.tsx            # Social share button
├── lib/
│   ├── db.ts                       # Neon database client
│   ├── icons.ts                    # Icon name → component mapping
│   ├── plugins-static.ts          # Static plugin data (532 lines)
│   ├── rate-limit.ts              # Request rate limiting
│   ├── schema.sql                 # Database DDL (3 tables, 6 indexes)
│   └── validation.ts             # Input validation utilities
└── middleware.ts                   # CSP + Permissions-Policy
```

## Plugin Anatomy (typical)

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json          # Manifest (name, version, description)
├── commands/                # Slash commands (Markdown + YAML frontmatter)
├── agents/                  # Subagent definitions (optional)
├── skills/                  # SKILL.md files (optional)
├── hooks/                   # Event hooks JSON (optional)
└── README.md                # Plugin documentation
```

## Agent Infrastructure

```text
.agent/                            # Development workflow (Antigravity)
├── memory-bank/
│   ├── architecture.md            # Repo structure docs
│   ├── api-contracts.md           # Schema specifications
│   └── decision-log.md           # ADR log
├── skills/
│   ├── architecture-mapper/       # Codebase analysis
│   ├── create-agent-plugin/       # Plugin scaffolding
│   ├── plugin-qa-validation/      # Quality assurance
│   └── publish-to-marketplace/    # Publishing workflow
├── workflows/
│   ├── codebase-onboarding.md     # Context refresh
│   ├── create-plugin.md           # Plugin creation flow
│   ├── qa-browser-test.md         # Browser QA testing
│   └── validate-and-publish.md    # Validation pipeline
└── rules/                         # Code quality rules

.agents/                           # Runtime skills (24 total)
└── skills/
    ├── agenthaus-to-openclaw/     # Format conversion
    ├── audit-checks/              # Security audit
    ├── blackboard-protocol/       # Multi-agent coordination
    ├── clickup-management/        # Task management
    ├── cloudflare-deploy/         # Edge deployment
    ├── deep-research/             # Research synthesis
    ├── devops-workflow/           # CI/CD pipelines
    ├── doc-lookup/                # Documentation retrieval
    ├── e2e-testing/               # Browser testing
    ├── fleet-management/          # Agent fleet control
    ├── github-workflow/           # GitHub automation
    ├── memory-protocol/           # Persistent memory
    ├── neon-database/             # Database operations
    ├── notion-management/         # Notion integration
    ├── plugin-management/         # Plugin lifecycle
    ├── postgres-operations/       # SQL operations
    ├── qa-automation/             # Test automation
    ├── safety-guardrails/         # Safety checks
    ├── seo-geo-rag-optimizer/     # SEO optimization
    ├── shadow-review/             # Training mode
    ├── social-content/            # Social media
    ├── task-orchestration/        # Task management
    ├── ui-ux-review/              # UX auditing
    └── vercel-deployment/         # Vercel management
```

## File Counts

| Directory         | Files | Subdirs | Notes                            |
|-------------------|-------|---------|----------------------------------|
| agenthaus-web/src | 21    | 7       | All TypeScript/CSS/SQL           |
| plugins/          | —     | 27      | Each is a self-contained plugin  |
| schemas/          | 1     | 0       | plugin.schema.json               |
| scripts/          | 3     | 0       | validate + install + generate    |
| .agent/skills/    | —     | 4       | Development skills               |
| .agent/workflows/ | 4     | 0       | Slash commands                   |
| .agents/skills/   | —     | 24      | Runtime skills                   |
