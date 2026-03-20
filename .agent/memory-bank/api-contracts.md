# API Contracts & Schemas

Reference documentation for data formats used across the marketplace.

## plugin.json Manifest

Every plugin requires `.claude-plugin/plugin.json` with these fields:

```json
{
  "name": "plugin-name",           // Required: kebab-case identifier
  "description": "What it does",   // Required: under 150 chars, action verb start
  "version": "1.0.0",             // Required: semver
  "author": "Author Name",        // Recommended
  "homepage": "https://...",       // Recommended
  "license": "MIT",               // Recommended
  "tags": ["category"],           // Array of category strings
  "commands": ["./commands/cmd.md"],  // Explicit paths, NOT globs
  "agents": ["./agents/agent.md"],
  "skills": ["./skills/name/SKILL.md"],
  "hooks": ["./hooks/hooks.json"],
  "mcpServers": {}                 // Inline MCP server configs
}
```

> **Critical:** Use explicit file paths (`"./commands/deploy.md"`), never glob patterns (`"./commands/*.md"`).

## marketplace.json Registry

Located at `.claude-plugin/marketplace.json`:

```json
{
  "name": "agenthaus-marketplace",
  "owner": { "name": "AgentHaus Team" },
  "metadata": {
    "description": "...",
    "version": "1.0.0",
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "plugin-name",        // Must match plugin.json name
      "source": "./plugins/name",   // Relative path from marketplace.json
      "category": "devops",         // Standard category
      "description": "User-facing"  // Not developer jargon
    }
  ]
}
```

## Command Frontmatter

Every command `.md` file requires YAML frontmatter:

```yaml
---
name: command-name
description: What this command does
---
```

The file/folder name becomes the slash command name.

## Agent Frontmatter

Agent `.md` files require:

```yaml
---
name: agent-name
description: What this agent specializes in
model: sonnet
---
```

## Skill Frontmatter

Every `SKILL.md` requires:

```yaml
---
name: skill-name
description: When and why to use this skill. Include trigger phrases.
---
```

## Hooks Format

Hooks use object format with `hooks` key (NOT flat array):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "tool_name",
        "command": "${CLAUDE_PLUGIN_ROOT}/hooks/script.sh"
      }
    ],
    "PostToolUse": []
  }
}
```

## MCP Server Config

Either inline in plugin.json or in `.mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@scope/server-name"],
      "env": {
        "API_KEY": "${ENV_VAR_NAME}"
      }
    }
  }
}
```

> **Critical:** Always use `${ENV_VAR}` interpolation — never hardcode credentials.

## Environment Variables

See `.env.example` for the complete list. Key variables by plugin are documented in `AGENTS.md` under "Required Environment Variables by Plugin".
