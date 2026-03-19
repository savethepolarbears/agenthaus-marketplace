# AGENTS.md

This file provides guidance to AI coding assistants working in this repository.

**Note:** CLAUDE.md, .clinerules, .cursorrules, .windsurfrules, .replit.md, and .idx/airules.md are symlinks to this AGENTS.md file. GEMINI.md and .github/copilot-instructions.md are standalone files with platform-specific guidance.

## AgentHaus Marketplace

A marketplace of 27 production-ready plugins for Claude Code and Claude Cowork. Plugins provide commands, agents, skills, hooks, and MCP server integrations that extend AI assistant capabilities.

**Repository:** <https://github.com/savethepolarbears/agenthaus-marketplace>

## Architecture

```text
agenthaus-marketplace/
├── agenthaus-web/          # Next.js 16 storefront (React 19, Tailwind 4, Neon Postgres)
├── plugins/                # 27 production plugins
│   ├── social-media/       # Content: Twitter, LinkedIn, Instagram, Facebook posts
│   ├── github-integration/ # DevOps: GitHub issues & PRs via MCP
│   ├── cloudflare-platform/# Cloud: Workers, KV storage, AI Gateway
│   ├── vercel-deploy/      # Deployment: Vercel projects & deployments
│   ├── devops-flow/        # Infra: Cloudflare + GitHub + Slack workflows
│   ├── notion-workspace/   # Knowledge: Notion pages via MCP
│   ├── context7-docs/      # Docs: Hallucination-free library docs
│   ├── knowledge-synapse/  # RAG: Context7 + Notion + Google Drive
│   ├── clickup-tasks/      # Productivity: ClickUp task management
│   ├── task-commander/     # Productivity: ClickUp + Slack + Gmail + Calendar
│   ├── playwright-testing/ # QA: E2E browser tests with agent
│   ├── qa-droid/           # Testing: Automated tests + notifications
│   ├── neon-db/            # Database: Serverless Postgres via MCP
│   ├── data-core/          # Database: Advanced Postgres with migrations
│   ├── ux-ui/              # UX: UI/UX audits, accessibility, Tailwind CSS
│   ├── agent-handoff/      # Orchestration: Blackboard protocol task handoff
│   ├── circuit-breaker/    # Safety: Deploy gates, test checks, budget guards
│   ├── agent-memory/       # Memory: Persistent recall via Neon Postgres
│   ├── shadow-mode/        # Training: Review queue for agent actions
│   ├── fleet-commander/    # Orchestration: Agent session monitoring
│   ├── plugin-auditor/     # Security: Plugin code security scanner
│   ├── openclaw-bridge/    # Integration: OpenClaw format conversion
│   ├── marketplace-cli/    # Utility: Plugin management CLI
│   ├── seo-geo-rag/        # SEO: SEO + GEO + RAG optimization
│   ├── gog-workspace/      # Productivity: Google Workspace integration
│   ├── apple-photos/       # Media: Apple Photos management via osxphotos
│   ├── wp-cli-fleet/       # DevOps: WordPress fleet management via WP-CLI
│   └── apple-workflows/    # Productivity: Apple Notes, Reminders, Shortcuts via MCP
├── schemas/                # JSON schemas for validation
├── scripts/                # Validation and utility scripts
├── reports/                # All project reports and documentation
├── .env.example            # Required environment variables
├── CONTRIBUTING.md         # Plugin development guide
└── README.md               # Project overview
```

## Build & Commands

### Web Application (agenthaus-web/)

```bash
cd agenthaus-web && npm install     # Install dependencies
npm run dev                         # Start Next.js dev server
npm run build                       # Production build
npm run start                       # Start production server
npm run lint                        # Run Next.js linter (ESLint)
```

**Important:** The web app requires `DATABASE_URL` environment variable pointing to a Neon Postgres connection string.

### Plugin Installation (for end users)

```bash
# Install entire marketplace
/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace

# Install individual plugin
/plugin install <plugin-id>
```

### Plugin Development

No build step for plugins. They are Markdown/JSON configurations consumed directly by Claude Code. See CONTRIBUTING.md for the full development guide.

### Script Consistency

When modifying npm scripts in `agenthaus-web/package.json`, ensure all references are updated in:

- README.md installation instructions
- Any deployment configurations
- CI/CD pipelines (if added)

## Code Style

### TypeScript (agenthaus-web/)

- **Strict mode** enabled in tsconfig.json (`strict: true`, target ES2022)
- **Path aliases:** `@/*` maps to `./src/*`
- **Imports:** Named imports from packages, group by external → internal
- **Components:** React functional components with TypeScript interfaces
- **Formatting:** Double quotes for JSX strings, no semicolons enforcement (project uses semicolons)
- **Naming:** PascalCase for components/interfaces, camelCase for variables/functions, kebab-case for files
- **CSS:** Tailwind CSS utility classes inline, no separate CSS files
- **Icons:** Lucide React library exclusively
- **Types:** Explicit interfaces for component props and data structures (e.g., `interface Plugin { ... }`)
- **Exports:** Default exports for page components, named exports for utilities

### Plugin Files

- **Manifest:** JSON in `.claude-plugin/plugin.json` with name, version, description, author, capabilities, tags
- **Commands:** Markdown with YAML frontmatter (`description` field required; file/folder name becomes command name)
- **Agents:** Markdown with YAML frontmatter (`name`, `description`, `model` fields)
- **Skills:** Markdown in `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description` fields)
- **Hooks:** JSON with `{ "hooks": { "PreToolUse": [...], "PostToolUse": [...] } }` format (object, not array)
- **MCP configs:** JSON in `.mcp.json` with `mcpServers` object; use `${ENV_VAR}` for secrets
- **LSP configs:** JSON in `.lsp.json` for language server protocol integrations
- **Naming:** kebab-case for plugin directories and file names
- **Versioning:** Semantic versioning (semver) for all plugins
- **Path references:** Use `${CLAUDE_PLUGIN_ROOT}` for plugin-local scripts in hooks/MCP configs

### General Rules

- Never hardcode secrets; use environment variables with `${VAR}` syntax in MCP configs
- Comments only when intent is non-obvious
- Favor simple, modular solutions
- Semantic HTML and accessible components in the web app

## Testing

### Web Application

- **Framework:** Next.js built-in linting (`npm run lint`)
- **No test framework configured yet** — when adding tests, use Jest or Vitest with React Testing Library
- **Test file pattern:** `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`

### Plugin Testing

- **Local testing:** Use `claude --plugin-dir ./plugins/your-plugin` to test without installation
- **Built-in validation:** Run `/plugin validate .` or `claude plugin validate .`
- **Repo validation:** Run `bash scripts/validate-plugins.sh` to check all plugins and marketplace
- Verify `.claude-plugin/plugin.json` is valid JSON with required fields
- Verify `.mcp.json` (if present) has valid `mcpServers` configuration
- Test all environment variable references resolve correctly

### Testing Philosophy

- **When tests fail, fix the code, not the test**
- Tests should be meaningful and test actual functionality
- Failing tests reveal bugs — fix the root cause
- Each test should have a clear purpose documented in comments

## Security

- **Never commit** API keys, tokens, or credentials
- **Environment variables** for all secrets (see `.env.example` for full list)
- Use `${ENV_VAR}` interpolation in MCP configs; never inline credentials
- Use `${CLAUDE_PLUGIN_ROOT}` for plugin-local script references in hooks and MCP configs
- `.env` and `.env.local` are in `.gitignore`
- Validate inputs at system boundaries (user input, external APIs)
- Plugin hooks run shell commands — review carefully for injection risks
- Only use MCP servers from trusted providers; Anthropic does not audit third-party MCP servers
- Don't reference files outside plugin directories — plugins are cached, `../` paths won't resolve

### Required Environment Variables by Plugin

| Plugin | Variables |
| --- | --- |
| cloudflare-platform | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| vercel-deploy | `VERCEL_TOKEN` |
| github-integration | `GITHUB_TOKEN` |
| devops-flow | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `GITHUB_TOKEN`, `SLACK_BOT_TOKEN`, `SLACK_CHANNEL` |
| notion-workspace | `NOTION_API_KEY` |
| knowledge-synapse | `CONTEXT7_KEY`, `NOTION_KEY`, `GOOGLE_DRIVE_TOKEN` |
| clickup-tasks | `CLICKUP_API_TOKEN`, `CLICKUP_TEAM_ID` |
| task-commander | `CLICKUP_KEY`, `SLACK_TOKEN`, `SLACK_CHANNEL`, `GMAIL_CREDS`, `GOOGLE_CALENDAR_TOKEN` |
| qa-droid | `SLACK_TOKEN`, `SLACK_CHANNEL`, `GMAIL_CREDS` |
| neon-db / data-core | `DATABASE_URL`, `NEON_API_KEY` |
| agent-memory | `NEON_DATABASE_URL` |
| gog-workspace | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` |
| wp-cli-fleet | `WP_CLI_SSH_KEY` (optional, for remote sites) |
| apple-workflows | `APPLE_REMINDERS_BACKEND` (optional, default: `remindctl`) |
| agenthaus-web | `DATABASE_URL`, `NEXT_PUBLIC_API_URL` |

## Configuration

### Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in credentials for the plugins you use
3. For the web app: set `DATABASE_URL` to a Neon Postgres connection string

### Tech Stack

- **Web:** Next.js 16.0.0, React 19.0.0, TypeScript 5.7.0, Tailwind CSS 4.0.0
- **Database:** Neon Serverless Postgres (`@neondatabase/serverless`)
- **Icons:** Lucide React 0.469.0
- **Utilities:** clsx 2.1.1
- **Package Manager:** npm

### MCP Servers Used (14 unique)

1. `@modelcontextprotocol/server-github`
2. `@cloudflare/mcp-server-cloudflare`
3. `@modelcontextprotocol/server-vercel`
4. `@modelcontextprotocol/server-slack`
5. `@modelcontextprotocol/server-notion`
6. `@modelcontextprotocol/server-context7`
7. `@upstash/context7-mcp`
8. `@modelcontextprotocol/server-google-drive`
9. `@taazkareem/clickup-mcp-server`
10. `@modelcontextprotocol/server-gmail`
11. `@modelcontextprotocol/server-google-calendar`
12. `@modelcontextprotocol/server-playwright`
13. `@modelcontextprotocol/server-postgres`
14. Custom `playwright-local` (qa-droid)

## Plugin Development Guide

See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete guide. Key points:

### Required Structure

```text
plugins/your-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required: name, version, description
├── .mcp.json                # Optional: MCP server configs
├── commands/                # Optional: Slash commands (Markdown + YAML frontmatter)
├── agents/                  # Optional: Subagent definitions (Markdown + YAML frontmatter)
├── skills/                  # Optional: Skill instructions (skills/<name>/SKILL.md)
├── hooks/                   # Optional: Event hooks (JSON, object format with "hooks" key)
├── .lsp.json                # Optional: LSP server configs
└── README.md                # Required: Plugin documentation
```

### Submission Workflow

1. Fork the repository
2. Create your plugin under `plugins/`
3. Add an entry to `.claude-plugin/marketplace.json`
4. Submit a PR with description, required env vars, and example usage

## Available AI Subagents

These agents are defined within plugins and available when the corresponding plugin is installed:

| Agent | Plugin | Model | Purpose |
| --- | --- | --- | --- |
| content-writer | social-media | sonnet | Generate platform-specific social media content |
| trend-analyzer | social-media | claude-3-7-sonnet | Analyze social media trends and engagement patterns |
| qa-engineer | playwright-testing | sonnet | Design and execute E2E browser test suites |
| sdet-agent | qa-droid | claude-3-7-sonnet | Automated test development with notification workflows |
| ui-expert | ux-ui | sonnet | UI/UX design and accessibility consulting |
| fleet-monitor | fleet-commander | haiku | Background agent session monitoring |
| security-reviewer | plugin-auditor | sonnet | Deep security analysis of plugin code |
| productivity-assistant | apple-workflows | sonnet | Apple Notes, Reminders, and Shortcuts management |
| workflow-automator | apple-workflows | sonnet | Apple Shortcuts automation and workflow chaining |

## Directory Structure & File Organization

### Reports Directory

ALL project reports and documentation should be saved to the `reports/` directory:

```text
reports/
├── PHASE_X_VALIDATION_REPORT.md    # Phase/milestone validation
├── IMPLEMENTATION_SUMMARY_*.md     # Feature implementation summaries
├── TEST_RESULTS_*.md               # Test execution results
├── SECURITY_SCAN_*.md              # Security analysis reports
└── README.md                       # Reports directory guide
```

**Naming:** `[TYPE]_[SCOPE]_[YYYY-MM-DD].md` (e.g., `TEST_RESULTS_2026-02-06.md`)

### Temporary Files

Use `temp/` for debugging scripts, test artifacts, and generated files. Never commit files from `temp/`.

### Claude Code Settings (.claude/)

- **Commit:** `.claude/settings.json`, `.claude/commands/*.md`, `.claude/hooks/*.sh`
- **Ignore:** `.claude/settings.local.json` (personal preferences)

## Agent Delegation & Parallel Execution

When specialized agents are available, use them. When performing multiple independent operations, send all tool calls in a single message for parallel execution (3-5x faster).

**Parallel:** Searching patterns, reading files, grep operations, independent agent delegations.
**Sequential only:** When output of one call is required as input for the next.

## Antigravity IDE Integration

### Memory Bank

Before starting large tasks, read `.agent/memory-bank/` for persistent project context:

- **architecture.md** — Repo structure, plugin anatomy, component relationships, data flow
- **api-contracts.md** — Schema specs for plugin.json, marketplace.json, frontmatter formats
- **decision-log.md** — Architectural decisions and rationale (ADRs)

Update memory bank docs when making significant architectural changes. Use the `/codebase-onboarding` workflow or the `architecture-mapper` skill to refresh them.

### Browser Agent Patterns

Use the built-in Browser Agent for visual QA and research:

- **Storefront QA**: Navigate to `http://localhost:3000`, verify plugin cards render, test responsive layouts at mobile (375px), tablet (768px), and desktop (1920px) widths
- **Screenshot Evidence**: Capture full-page screenshots and save recordings as artifacts in `reports/`
- **Prompt Style**: Give strict, step-by-step instructions with explicit success criteria — the browser agent executes autonomously

Use the `/qa-browser-test` workflow for a structured QA flow.

### Planning Mode

For non-trivial tasks, always plan before executing:

1. **PLANNING** — Research codebase, design approach, produce implementation plan
2. **Review** — Get user approval on the plan
3. **EXECUTION** — Implement the approved design
4. **VERIFICATION** — Test changes, produce walkthrough

If unexpected complexity arises during execution, return to PLANNING.

### Context Engineering

- **Load only what you need** — Use skills for on-demand knowledge rather than reading every file
- **Skills over system prompt** — Complex domain knowledge belongs in `.agent/skills/`, not inline instructions
- **Rules provide guardrails** — `.agent/rules/` are passive constraints injected based on activation mode
- **Workflows for repeatability** — `.agent/workflows/` encode multi-step processes as reusable playbooks
- **Reports directory** — All output reports go to `reports/`, temp files to `/tmp/`

### Available Skills

| Skill | Trigger | Purpose |
| ------- | --------- | --------- |
| `create-agent-plugin` | "create plugin", "new plugin" | Scaffold a production-ready plugin |
| `publish-to-marketplace` | "publish plugin", "add to marketplace" | Register a validated plugin |
| `plugin-qa-validation` | "validate plugin", "plugin QA" | Comprehensive quality assurance |
| `architecture-mapper` | "map architecture", "update memory bank" | Generate/refresh memory bank docs |

### Available Workflows

| Workflow | Command | Purpose |
| ---------- | --------- | --------- |
| Create Plugin | `/create-plugin` | Create a new plugin from scratch |
| Validate & Publish | `/validate-and-publish` | Full validation and marketplace registration |
| QA Browser Test | `/qa-browser-test` | Browser-based storefront verification |
| Codebase Onboarding | `/codebase-onboarding` | Refresh memory bank and session context |
