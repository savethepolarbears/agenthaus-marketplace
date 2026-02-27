# AgentHaus Marketplace

> A comprehensive marketplace of **23 production-ready plugins** for [Claude Code](https://code.claude.com/docs/en/plugins).

[![Version](https://img.shields.io/badge/version-3.1.0-blue.svg)](./CHANGELOG.md)
[![Plugins](https://img.shields.io/badge/plugins-23-green.svg)](#available-plugins)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

## Quick Start

```bash
# Add the marketplace to Claude Code
/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace

# Browse available plugins
/plugin install social-media@AgentHaus

# Or install any plugin by name
/plugin install circuit-breaker@AgentHaus
```

> Requires Claude Code 1.0.33+. See the [official plugin docs](https://code.claude.com/docs/en/plugins) for setup help.

## Available Plugins

### Content & Communication

| Plugin           | Description                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **social-media** | Generate high-engagement posts for Twitter, LinkedIn, Instagram, Facebook with trend analysis  |

### DevOps & Infrastructure

| Plugin                  | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| **github-integration**  | Manage GitHub issues and PRs via MCP server                    |
| **cloudflare-platform** | Deploy Workers, manage KV storage, AI Gateway                  |
| **vercel-deploy**       | Manage Vercel projects and deployments                         |
| **devops-flow**         | Integrated Cloudflare + GitHub + Slack workflows with hooks    |

### Knowledge & Documentation

| Plugin                | Description                                      |
| --------------------- | ------------------------------------------------ |
| **notion-workspace**  | Search and update Notion pages via MCP           |
| **context7-docs**     | Fetch hallucination-free library documentation   |
| **knowledge-synapse** | Context7 + Notion + Google Drive RAG system      |

### Productivity

| Plugin             | Description                                      |
| ------------------ | ------------------------------------------------ |
| **clickup-tasks**  | Manage ClickUp tasks, lists, and time tracking   |
| **task-commander** | ClickUp + Slack + Gmail + Calendar integration   |

### Testing & QA

| Plugin                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| **playwright-testing** | E2E browser tests with QA engineer agent         |
| **qa-droid**           | Automated testing with Slack/Gmail notifications |

### Database

| Plugin        | Description                               |
| ------------- | ----------------------------------------- |
| **neon-db**   | Serverless Postgres via MCP               |
| **data-core** | Advanced Neon/Postgres with migrations    |

### UX & Design

| Plugin     | Description                                          |
| ---------- | ---------------------------------------------------- |
| **ux-ui**  | UI/UX audits, accessibility, and Tailwind CSS polish |

### Orchestration

| Plugin               | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| **agent-handoff**    | Blackboard protocol for multi-agent task handoff             |
| **fleet-commander**  | Monitor and control running agent sessions                   |

### Safety & Security

| Plugin              | Description                                               |
| ------------------- | --------------------------------------------------------- |
| **circuit-breaker** | Reusable safety hooks: deploy gates, test checks, budgets |
| **shadow-mode**     | Training mode: agents draft to review queue               |
| **plugin-auditor**  | Security scanner for plugin code and configurations       |

### Memory & Persistence

| Plugin           | Description                                            |
| ---------------- | ------------------------------------------------------ |
| **agent-memory** | Shared persistent memory across agent sessions via DB  |

### Integration

| Plugin              | Description                                        |
| ------------------- | -------------------------------------------------- |
| **openclaw-bridge** | Convert plugins to OpenClaw format, remote control |

### Utilities

| Plugin              | Description                          |
| ------------------- | ------------------------------------ |
| **marketplace-cli** | CLI for managing AgentHaus plugins   |

## Architecture

AgentHaus plugins use five capability types:

- **Commands** — Slash commands (`/plugin:command`) defined as Markdown with YAML frontmatter
- **Agents** — Subagents with dedicated models for specialized tasks
- **Skills** — Multi-step workflow instructions that Claude invokes based on context
- **Hooks** — Event-driven shell commands triggered by `PreToolUse`/`PostToolUse` events
- **MCP Servers** — Model Context Protocol servers providing tool access to external services

### Plugin Directory Structure

```text
plugins/your-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required: name, version, description
├── .mcp.json                 # Optional: MCP server configs
├── commands/                 # Optional: slash commands (Markdown)
├── agents/                   # Optional: subagent definitions (Markdown)
├── skills/                   # Optional: skill instructions (skills/<name>/SKILL.md)
├── hooks/                    # Optional: event hooks (hooks.json)
├── .lsp.json                 # Optional: LSP server configs
└── README.md                 # Required: plugin documentation
```

### Strategic Plugin Categories

**Orchestration** plugins (`agent-handoff`, `fleet-commander`) enable multi-agent workflows where agents dispatch tasks, claim work, and report results through a shared blackboard protocol.

**Safety** plugins (`circuit-breaker`, `shadow-mode`, `plugin-auditor`) provide guardrails: deploy gates that block production pushes outside business hours, training modes that queue actions for human review, and security scanners that audit plugin code.

**Memory** plugins (`agent-memory`) give agents persistent recall across sessions, storing decisions and patterns in a Neon Postgres database.

## Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

See each plugin's README for specific environment variables.

### Team Configuration

Automatically prompt team members to install the marketplace when they trust the project folder by adding to `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "AgentHaus": {
      "source": {
        "source": "github",
        "repo": "savethepolarbears/agenthaus-marketplace"
      }
    }
  }
}
```

## Web Storefront

A Next.js web app is included in `agenthaus-web/`:

```bash
cd agenthaus-web
npm install
npm run dev
```

Features: search, category filtering, plugin detail pages, install count tracking.

## Validation

Run the plugin validation script to check all 23 plugins:

```bash
bash scripts/validate-plugins.sh
```

Or use Claude Code's built-in validation:

```bash
/plugin validate .
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the plugin development guide.

## Resources

- [Claude Code Plugin Docs](https://code.claude.com/docs/en/plugins) — Official plugin creation guide
- [Plugin Marketplaces](https://code.claude.com/docs/en/plugin-marketplaces) — Marketplace distribution guide
- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference) — Complete technical specification
- [MCP Specification](https://spec.modelcontextprotocol.io/) — Model Context Protocol standard

## License

MIT (c) AgentHaus Team
