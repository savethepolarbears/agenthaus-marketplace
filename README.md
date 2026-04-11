# AgentHaus Marketplace - Developer Tools for Agentic AI

> A comprehensive marketplace of **31 production-ready developer tools and Claude Cowork plugins** for agentic AI ecosystems. Discover, install, and build powerful workflows across Claude Code marketplaces and other AI coding assistants.

[![Version](https://img.shields.io/badge/version-3.4.0-blue.svg)](./CHANGELOG.md)
[![Plugins](https://img.shields.io/badge/plugins-31-green.svg)](#available-plugins)
[![Platforms](https://img.shields.io/badge/platforms-6-blue.svg)](#installation)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

## Installation

> **Tip:** Each plugin's README includes a **Platform Support** table showing exactly which features (commands, skills, MCP, hooks) are available on your platform.

### Claude Code (recommended)

```bash
# Add the full marketplace
/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace

# Or install a single plugin
/plugin install social-media@AgentHaus
```

Requires Claude Code 1.0.33+. Gives full access: commands, agents, skills, hooks, and MCP servers.

### Codex CLI

Codex CLI supports prose context files (AGENTS.md) but not MCP servers or hooks.

1. Copy the plugin's AGENTS.md to your project root:

   ```bash
   cp plugins/neon-db/AGENTS.md ./AGENTS.md
   ```

2. Codex reads AGENTS.md automatically on session start.

**Note:** MCP-dependent plugins (neon-db, github-integration, cloudflare-platform, etc.) will document their tools in AGENTS.md but cannot execute them — Codex CLI has no MCP runtime. Hook-dependent plugins list their hooks as prose guidance only.

### Gemini CLI

Gemini CLI reads GEMINI.md context files and supports MCP servers via `~/.gemini/settings.json`.

1. Copy the plugin's GEMINI.md to your project root:

   ```bash
   cp plugins/neon-db/GEMINI.md ./GEMINI.md
   ```

2. For MCP plugins, merge the snippet into your Gemini settings:

   ```bash
   # View the snippet
   cat plugins/neon-db/gemini-settings-snippet.json
   # Manually merge mcpServers block into ~/.gemini/settings.json
   ```

3. Set required environment variables (see each plugin's README).

### Cursor

Cursor reads `.cursor/rules/*.mdc` files and supports MCP servers via `.cursor/mcp.json`.

1. Copy the plugin's Cursor rules to your project:

   ```bash
   cp -r plugins/neon-db/.cursor/rules/ ./.cursor/rules/
   ```

2. For MCP plugins, merge the MCP config:

   ```bash
   # View the snippet
   cat plugins/neon-db/.cursor/mcp.json
   # Manually merge mcpServers into your project's .cursor/mcp.json
   ```

3. Cursor uses `${env:VAR}` syntax for environment variable references in MCP configs.

### Windsurf

Windsurf reads `.windsurfrules` context files from the project root.

1. Copy the plugin's AGENTS.md as `.windsurfrules`:

   ```bash
   cp plugins/neon-db/AGENTS.md ./.windsurfrules
   ```

2. For MCP plugins, configure servers in Windsurf's global MCP settings (Windsurf → Preferences → MCP).

**Note:** Hooks are not supported on Windsurf.

### Claude Desktop

Claude Desktop supports MCP servers configured in `claude_desktop_config.json`. Context files are not applicable.

1. Locate your config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
2. Merge the plugin's snippet:

   ```bash
   cat plugins/neon-db/claude-desktop-snippet.json
   ```

   Copy the `mcpServers` entries into your existing config's `mcpServers` object.
3. Restart Claude Desktop to load the new MCP servers.

**Note:** Only MCP plugins provide functionality in Claude Desktop. 14 plugins include `claude-desktop-snippet.json`.

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
| **wp-cli-fleet**        | Manage WordPress sites at scale via WP-CLI                     |

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
| **gog-workspace**  | Google Workspace (Drive, Docs, Sheets, Calendar) |

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

### SEO & Optimization

| Plugin          | Description                                         |
| --------------- | --------------------------------------------------- |
| **seo-geo-rag** | SEO + GEO + RAG optimization for AI-era search      |
| **toprank**     | Portable SEO workflows from nowork-studio/toprank   |

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

### Media

| Plugin           | Description                                      |
| ---------------- | ------------------------------------------------ |
| **apple-photos** | Manage Apple Photos albums, search, and export   |

## Architecture

AgentHaus plugins use five capability types:

- **Commands** — Slash commands (`/plugin:command`) defined as Markdown with YAML frontmatter
- **Agents** — Subagents with dedicated models for specialized tasks
- **Skills** — Multi-step workflow instructions that Claude invokes based on context
- **Hooks** — Event-driven shell commands triggered by `PreToolUse`/`PostToolUse` events
- **MCP Servers** — Model Context Protocol servers providing tool access to external services

### Agentic Discoverability & Engine SEO

AgentHaus plugins are built for maximum discoverability by AI agents. By utilizing standardized `SKILL.md` structures and comprehensive `plugin.json` manifests, these tools are highly indexed within Claude Code marketplaces and agentic AI search paths. Claude specifically pre-loads only the metadata at startup to optimize token usage, pulling in the full `SKILL.md` execution instructions only when contextually relevant.

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

## Validation

Run the plugin validation script to check all 27 plugins:

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
