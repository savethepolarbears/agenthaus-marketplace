# AgentHaus Marketplace

A discoverable marketplace of 37 developer tools for agentic AI ecosystems, targeting Claude Code and Claude Cowork plugins with cross-platform support for Codex CLI, Gemini CLI, Cursor, and Windsurf.

## Repository Map & Architecture

```text
agenthaus-marketplace/
├── plugins/        # 37 production plugins
├── schemas/        # JSON schemas for validation
├── scripts/        # Validation and utility scripts
├── reports/        # ALL project reports and documentation go here
├── .env.example    # Required environment variables
└── README.md       # Project overview
```

## Build & Core Commands

```bash
bash scripts/validate-plugins.sh         # Validate all plugins and marketplace
bash scripts/generate-skills-index.sh    # Re-generate skills index
bash scripts/install-plugins.sh          # Interactively install plugins
bash scripts/generate-cross-platform.js  # Generate MCP and cross-platform files
```

## Tech Stack & Conventions

- **Validation:** Zod 4.3.6
- **Package Manager:** npm (v11+) / pnpm (v10+). No root `package.json`.
- **Manifest:** JSON in `.claude-plugin/plugin.json` (name, version, description). Explicit paths only.
- **Commands & Agents:** Markdown with YAML frontmatter (`description` required).
- **Skills:** Markdown in `skills/<name>/SKILL.md` with YAML frontmatter.
- **Hooks:** JSON with `{ "hooks": { "PreToolUse": [...], "PostToolUse": [...] } }` format.
- **MCP Configs:** JSON in `.mcp.json`.
- **Naming:** kebab-case for plugin directories and file names.

## Agent Boundaries & Guidelines

- **Never commit** API keys, tokens, or credentials. Use `.env` and `.env.local`.
- **Environment variables:** Use `${ENV_VAR}` in MCP configs; never inline credentials.
- **Path references:** Use `${CLAUDE_PLUGIN_ROOT}` for plugin-local scripts in hooks/MCP configs.
- **Security:** Plugin hooks run shell commands — audit for injection risks. Only trusted MCP servers.
- **Files:** Temp files in `temp/` or `tmp/`. ALL output reports go to `reports/`.
- **PRs:** All plugins must pass `bash scripts/validate-plugins.sh`. Do not edit global `.json` unless instructed.
- **Development:** Modular solutions. Fix root cause, not tests.

## Plugins

| Plugin | Description | MCP | Hooks |
|--------|-------------|-----|-------|
| activepieces | Agent plugin pack for ... | no | no |
| agent-handoff | State-based task hando... | no | no |
| agent-memory | Shared persistent memo... | yes | no |
| apple-photos | Manage Apple Photos li... | no | yes |
| apple-workflows | Manage Apple Notes, Re... | yes | no |
| circuit-breaker | Pre-built safety guard... | no | no |
| clickup-tasks | Manage ClickUp tasks, ... | yes | no |
| cloudflare-platform | Manage Cloudflare Work... | yes | no |
| context7-docs | Fetch up-to-date, hall... | yes | no |
| data-core | Serverless Postgres da... | yes | no |
| devops-flow | Orchestrate Cloudflare... | yes | yes |
| encharge | Encharge.io marketing ... | yes | no |
| fleet-commander | Visualization and cont... | no | no |
| github-integration | Full GitHub management... | yes | no |
| gog-workspace | Google Workspace CLI i... | no | no |
| knowledge-synapse | RAG Agent combining Co... | yes | no |
| marketplace-cli | Utility commands for s... | no | no |
| markupgo | Generate images, PDFs,... | yes | no |
| neon-db | Interact with Neon ser... | yes | no |
| neuronwriter | SEO content analysis a... | yes | no |
| notfair-marketing | Open-source Claude Cod... | yes | no |
| notion-workspace | Interact with your Not... | yes | no |
| openclaw-bridge | Convert AgentHaus plug... | no | no |
| outscraper | Web scraping and data ... | yes | no |
| playwright-testing | End-to-end browser aut... | yes | no |
| plugin-auditor | Audit plugins for secu... | no | no |
| qa-droid | Automated Playwright t... | yes | no |
| seo-content-suite | Unified SEO content pi... | yes | no |
| seo-geo-rag | Six-phase SEO, Generat... | no | no |
| shadow-mode | Agents draft outputs t... | no | no |
| social-media | Generate high-engageme... | no | no |
| task-commander | ClickUp task managemen... | yes | no |
| textfocus | SEO keyword analysis a... | yes | no |
| ux-ui | Polish and improve you... | no | no |
| vercel-deploy | Manage Vercel projects... | yes | no |
| vistasocial-scheduler | Social media schedulin... | yes | no |
| wp-cli-fleet | Agentic WP-CLI and Wor... | no | no |

## Platform Support

| Platform | MCP | Hooks | Commands | Skills |
|----------|-----|-------|----------|--------|
| Claude Code | full | full | full | full |
| Codex CLI | none | none | partial | full |
| Gemini CLI | via gemini-settings | none | partial | full |
| Cursor | via .cursor/mcp.json | none | partial | full |
| Windsurf | global config | none | partial | full |

> Hooks are Claude Code-exclusive. MCP tool access requires platform-specific configuration.

## Gemini Context Caching

Use context caching to retain plugin catalog and `marketplace.json` across turns. Use `@plugins/<name>/.claude-plugin/plugin.json` to pull in manifests.

## Antigravity IDE Integration (Memory Bank)

Read `.agent/memory-bank/` for persistent context before large tasks:
- `architecture.md` — Repo structure, plugin anatomy
- `api-contracts.md` — Schema specs for manifests
- `decision-log.md` — Architectural decisions (ADRs)

Update these docs when making significant changes. For non-trivial tasks, plan before executing and get user approval.

## Agent Delegation & Parallel Execution

Send all independent tool calls in a single turn for parallel execution (3-5x faster). Sequential execution only when output is chained.

## Required Environment Variables

Check `.env.example`: `CLOUDFLARE_API_TOKEN`, `GITHUB_TOKEN`, `NOTION_API_KEY`, `DATABASE_URL`, `NEON_API_KEY`.
