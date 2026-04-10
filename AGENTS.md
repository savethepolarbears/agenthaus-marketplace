# AgentHaus Marketplace

A highly discoverable marketplace of 30 production-ready developer tools for agentic AI ecosystems, targeting Claude Code and Claude Cowork plugins. Plugins provide commands, agents, skills, hooks, and MCP server integrations that extend AI assistant workflows.

**Platform configs:** This file (`AGENTS.md`) is the canonical source for AI agents. `CLAUDE.md` and `GEMINI.md` are symlinked to this file.

## Repository Map & Architecture

```text
agenthaus-marketplace/
├── plugins/                # 30 production plugins (e.g. social-media, notion-workspace, qa-droid)
├── schemas/                # JSON schemas for validation
├── scripts/                # Validation and utility scripts
├── reports/                # ALL project reports and documentation go here
├── .env.example            # Required environment variables
├── CONTRIBUTING.md         # Plugin development guide
└── README.md               # Project overview
```

## Build & Core Commands

```bash
bash scripts/validate-plugins.sh         # Validate all plugins and marketplace
bash scripts/generate-skills-index.sh    # Re-generate the skills index when skills are added/removed
bash scripts/install-plugins.sh          # Interactively install plugins
bash scripts/generate-cross-platform.js  # Generate MCP and hooks files
```

## Tech Stack & Conventions

- **Validation:** Zod 4.3.6
- **Package Manager:** npm (v11+) or pnpm (v10+). No root `package.json` exists; run PM commands in subdirectories where appropriate.
- **Manifest:** JSON in `.claude-plugin/plugin.json` (name, version, description). Use explicit paths, not globs.
- **Commands & Agents:** Markdown with YAML frontmatter. `description` field required.
- **Skills:** Markdown in `skills/<name>/SKILL.md` with YAML frontmatter.
- **Hooks:** JSON with `{ "hooks": { "PreToolUse": [...], "PostToolUse": [...] } }` format (object, not array).
- **MCP Configs:** JSON in `.mcp.json`.
- **LSP Configs:** JSON in `.lsp.json`.
- **Naming:** kebab-case for plugin directories and file names.

## Agent Boundaries & Guidelines

- **Never commit** API keys, tokens, or credentials. Use `.env` and `.env.local` (which are gitignored).
- **Environment variables:** Use `${ENV_VAR}` interpolation in MCP configs; never inline credentials.
- **Path references:** Use `${CLAUDE_PLUGIN_ROOT}` for plugin-local scripts in hooks and MCP configs. Plugins are cached, so `../` won't resolve.
- **Security:** Plugin hooks run shell commands — review carefully for injection risks. Only use trusted MCP servers. Validate inputs at system boundaries.
- **Files:** Temp files go in `temp/` or `tmp/` and must not be committed. ALL output reports go to `reports/` (e.g., `TEST_RESULTS_2026-02-06.md`).
- **PRs:** All plugins must pass validation (`bash scripts/validate-plugins.sh`). Do not modify global `.json` files unless instructed.
- **Development:** Favor simple, modular solutions. Fix the code, not the test. Failing tests reveal bugs — fix the root cause.

## Platform Support

| Platform | MCP | Hooks | Commands/Agents | Skills |
|----------|-----|-------|-----------------|--------|
| Claude Code | full | full | full | full |
| Codex CLI | none | none | partial | full |
| Gemini CLI | via gemini-settings | none | partial | full |
| Cursor | via .cursor/mcp.json | none | partial | full |
| Windsurf | global config | none | partial | full |

## Gemini Context Caching

When working with Gemini, use context caching to retain the full plugin catalog and `marketplace.json` across turns. Use `@include` patterns to pull in relevant plugin manifests (e.g., `@plugins/<plugin-name>/.claude-plugin/plugin.json`).

## Antigravity IDE Integration (Memory Bank)

Before starting large tasks, read `.agent/memory-bank/` for persistent project context:
- `architecture.md` — Repo structure, plugin anatomy
- `api-contracts.md` — Schema specs for manifests
- `decision-log.md` — Architectural decisions (ADRs)

Update these docs when making significant changes. For non-trivial tasks, plan before executing and get user approval.

## Agent Delegation & Parallel Execution

Use specialized agents when available. When performing multiple independent operations (like searching patterns, reading files, grep operations), send all tool calls in a single message for parallel execution (3-5x faster). Sequential execution is only for when the output of one call is needed for the next.

## Required Environment Variables

Check `.env.example`. Key examples:
- `cloudflare-platform` / `devops-flow`: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- `github-integration`: `GITHUB_TOKEN`
- `notion-workspace`: `NOTION_API_KEY`
- `neon-db` / `data-core`: `DATABASE_URL`, `NEON_API_KEY`
