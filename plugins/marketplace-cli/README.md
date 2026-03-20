# marketplace-cli

CLI utilities for searching, browsing, and managing AgentHaus marketplace plugins.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | n/a | n/a | n/a | n/a | n/a | n/a |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Prerequisites

No environment variables or API keys required.

## Installation

```bash
/plugin install marketplace-cli
```

## Usage

### Commands

#### `/search`

Search the AgentHaus marketplace for plugins by name, tag, or capability.

```
> /search database

Found 2 plugins:
  neon-db v1.0.0 - Serverless Postgres via MCP
  data-core v1.0.0 - Advanced Postgres with migrations
```

#### `/install`

Install a plugin from the marketplace by ID.

```
> /install social-media

Installing social-media v2.0.0...
Plugin installed successfully.
```

## Configuration

No configuration needed. The CLI reads from the AgentHaus marketplace registry at `/.claude-plugin/marketplace.json`.

## Architecture

Local utility commands that interact with the AgentHaus marketplace registry. No MCP servers, no network calls, no external dependencies. Commands parse the marketplace manifest and manage plugin installation state locally.
