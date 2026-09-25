# AgentHaus Marketplace

This file provides guidance to AI coding assistants working in this repository.

**Note:** `CLAUDE.md`, `GEMINI.md`, `.cursorrules`, `.clinerules`, and `.windsurfrules` are symlinks to `AGENTS.md` in this project.

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
| :--- | :--- | :--- | :--- |
| activepieces | Agent plugin... | no | no |
| agent-handoff | State-based ... | no | no |
| agent-memory | Shared persi... | yes | no |
| apple-photos | Manage Apple... | no | yes |
| apple-workflows | Manage Apple... | yes | no |
| circuit-breaker | Pre-built sa... | no | no |
| clickup-tasks | Manage Click... | yes | no |
| cloudflare-platform | Manage Cloud... | yes | no |
| context7-docs | Fetch up-to-... | yes | no |
| data-core | Serverless P... | yes | no |
| devops-flow | Orchestrate ... | yes | yes |
| encharge | Encharge.io ... | yes | no |
| fleet-commander | Visualizatio... | no | no |
| github-integration | Full GitHub ... | yes | no |
| gog-workspace | Google Works... | no | no |
| knowledge-synapse | RAG Agent co... | yes | no |
| marketplace-cli | Utility comm... | no | no |
| markupgo | Generate ima... | yes | no |
| neon-db | Interact wit... | yes | no |
| neuronwriter | SEO content ... | yes | no |
| notfair-marketing | Open-source ... | yes | no |
| notion-workspace | Interact wit... | yes | no |
| openclaw-bridge | Convert Agen... | no | no |
| outscraper | Web scraping... | yes | no |
| playwright-testing | End-to-end b... | yes | no |
| plugin-auditor | Audit plugin... | no | no |
| qa-droid | Automated Pl... | yes | no |
| seo-content-suite | Unified SEO ... | yes | no |
| seo-geo-rag | Six-phase SE... | no | no |
| shadow-mode | Agents draft... | no | no |
| social-media | Generate hig... | no | no |
| task-commander | ClickUp task... | yes | no |
| textfocus | SEO keyword ... | yes | no |
| ux-ui | Polish and i... | no | no |
| vercel-deploy | Manage Verce... | yes | no |
| vistasocial-scheduler | Social media... | yes | no |
| wp-cli-fleet | Agentic WP-C... | no | no |

## Platform Support

| Platform | MCP | Hooks | Commands | Skills |
| :--- | :--- | :--- | :--- | :--- |
| Claude Code | full | full | full | full |
| Codex CLI | none | none | partial | full |
| Gemini CLI | via gemini-settings | none | partial | full |
| Cursor | via .cursor/mcp.json | none | partial | full |
| Windsurf | global config | none | partial | full |

> Hooks are Claude Code-exclusive. MCP tool access requires platform-specific configuration.

## Provider Lifecycle Invariants

1. **Cursor Discovery**: Reads `.cursor/rules/*.mdc` and `.cursor/mcp.json`. `postInstall` mirrors rules and MCP; never rely solely on `.cursor/plugins/`.
2. **MCP Collision Namespacing**: Conflicting server keys are namespaced to `<plugin>-<key>` with `_agenthaus_mcp` ownership tracking so uninstalls never drop shared servers.
3. **Symlink Update Hook Refresh**: In `updatePlugin`, when symlink target matches source (`isSame`), re-run `postInstall` to refresh derived provider files.
4. **Provider-Scoped Sync Coverage**: Provider sync (`sync --target <p>`) executes `repairTargetHooks` on copied plugin dirs.

## Gemini Context Caching

Use context caching to retain plugin catalog and `marketplace.json` across turns. Use `@plugins/<name>/.claude-plugin/plugin.json` to pull in manifests.

## Antigravity IDE Integration (Memory Bank)

Read `.agent/memory-bank/`: `architecture.md`, `api-contracts.md`, `decision-log.md`. Update on significant changes.

## Agent Delegation & Parallel Execution

Send independent tool calls in a single turn for parallel execution (3-5x faster). Sequential execution only when chained.

## Required Environment Variables

Check `.env.example`: `CLOUDFLARE_API_TOKEN`, `GITHUB_TOKEN`, `NOTION_API_KEY`, `DATABASE_URL`, `NEON_API_KEY`.
