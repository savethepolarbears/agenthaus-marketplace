# Contributing to AgentHaus

Thank you for your interest in contributing to AgentHaus! This guide will help you create plugins that integrate seamlessly with Claude Code and Cowork.

## Plugin Structure

Each plugin should follow this directory structure:

```
plugins/your-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required: Plugin manifest
├── .mcp.json                 # Optional: MCP server configs
├── commands/                 # Optional: Custom slash commands
│   └── your-command.md
├── agents/                   # Optional: Subagent definitions
│   └── your-agent.md
├── skills/                   # Optional: Skill instructions
│   └── your-skill.md
├── hooks/                    # Optional: Event hooks
│   └── post-deploy.js
└── README.md                 # Required: Plugin documentation
```

## Plugin Manifest

Create `.claude-plugin/plugin.json` with:

```json
{
  "name": "your-plugin",
  "version": "1.0.0",
  "description": "Brief description of your plugin",
  "author": "Your Name",
  "homepage": "https://github.com/your-org/your-plugin",
  "capabilities": ["commands", "agents", "mcp"],
  "tags": ["category1", "category2"]
}
```

## MCP Configuration

If your plugin uses MCP servers, create `.mcp.json`:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "@scope/mcp-server-name"],
      "env": {
        "API_KEY": "${YOUR_API_KEY}"
      }
    }
  }
}
```

Use `${ENV_VAR}` syntax for environment variables.

## Commands

Create custom slash commands in `commands/`:

```markdown
---
name: your-command
description: What this command does
---

# Instructions for Claude

When the user runs /your-command, do the following:
1. Step one
2. Step two
```

## Best Practices

1. **Never hardcode secrets** - Use environment variables
2. **Include clear documentation** - README with examples
3. **Add meaningful descriptions** - Help users understand your plugin
4. **Test thoroughly** - Verify commands and MCP configurations work
5. **Follow semantic versioning** - For plugin versions

## Submitting Your Plugin

1. Fork this repository
2. Create your plugin under `plugins/`
3. Add an entry to `.claude-plugin/marketplace.json`
4. Submit a pull request with:
   - Description of the plugin
   - Required environment variables
   - Example usage

## Questions?

Open an issue or reach out to the AgentHaus team.
