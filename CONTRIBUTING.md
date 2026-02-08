# Contributing to AgentHaus

Thank you for your interest in contributing to AgentHaus! This guide will help you create plugins that integrate seamlessly with Claude Code and Cowork.

## Plugin Structure

Each plugin should follow this directory structure:

```text
plugins/your-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required: Plugin manifest
├── .mcp.json                 # Optional: MCP server configs
├── commands/                 # Optional: Custom slash commands
│   └── your-command.md
├── agents/                   # Optional: Subagent definitions
│   └── your-agent.md
├── skills/                   # Optional: Skill instructions
│   └── your-skill/
│       └── SKILL.md
├── hooks/                    # Optional: Event hooks
│   └── hooks.json
└── README.md                 # Required: Plugin documentation
```

## Plugin Manifest

Create `.claude-plugin/plugin.json` following the [JSON schema](./schemas/plugin.schema.json):

```json
{
  "name": "your-plugin",
  "version": "1.0.0",
  "description": "Brief description of your plugin",
  "author": "Your Name",
  "homepage": "https://github.com/savethepolarbears/agenthaus-marketplace",
  "license": "MIT",
  "tags": ["category1", "category2"],
  "commands": ["./commands/your-command.md"],
  "agents": ["./agents/your-agent.md"],
  "skills": ["./skills/your-skill/SKILL.md"],
  "hooks": ["./hooks/hooks.json"]
}
```

### Required Fields

| Field         | Type   | Description                            |
| ------------- | ------ | -------------------------------------- |
| `name`        | string | Kebab-case plugin identifier           |
| `version`     | string | Semantic version (e.g., `1.0.0`)       |
| `description` | string | Human-readable description (10+ chars) |

### Recommended Fields

| Field      | Type     | Description                          |
| ---------- | -------- | ------------------------------------ |
| `author`   | string   | Author name or organization          |
| `homepage` | string   | URL to plugin or marketplace repo    |
| `license`  | string   | License identifier (e.g., `MIT`)     |
| `tags`     | string[] | Category tags for discoverability    |

### Capability Arrays

Only include arrays for capabilities your plugin provides:

- `commands` — Relative paths to command Markdown files
- `agents` — Relative paths to agent Markdown files
- `skills` — Relative paths to skill Markdown files
- `hooks` — Relative paths to hook JSON files
- `mcpServers` — Inline MCP server configurations (object)

## MCP Configuration

If your plugin uses MCP servers, add them inline in `plugin.json` and create a standalone `.mcp.json`:

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

Use `${ENV_VAR}` syntax for environment variables. Never hardcode secrets.

## Commands

Create custom slash commands in `commands/`:

```markdown
---
name: your-command
description: What this command does
---

Instructions for Claude when the user runs /your-plugin:your-command.

Use $ARGUMENTS to reference user input.
```

## Agents

Define subagents in `agents/`:

```markdown
---
name: your-agent
description: What this agent does
model: sonnet
---

System prompt for the agent.
```

Available models: `sonnet`, `haiku`, `claude-3-7-sonnet-20250219`.

## Hooks

Define event hooks in `hooks/hooks.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "your-pattern",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'hook output'"
          }
        ]
      }
    ]
  }
}
```

Event types: `PreToolUse` (can block), `PostToolUse` (logging/side effects).

## Validation

Run the validation script before submitting:

```bash
bash scripts/validate-plugins.sh
```

This checks:

- Valid JSON for plugin.json and .mcp.json
- Required fields present (name, version, description)
- All referenced files exist
- README.md present

Your plugin must also conform to `schemas/plugin.schema.json`.

## Best Practices

1. **Never hardcode secrets** — Use `${ENV_VAR}` interpolation
2. **Include clear documentation** — README with examples and env var table
3. **Add meaningful tags** — Help users find your plugin
4. **Test thoroughly** — Verify commands, agents, and MCP configs work
5. **Follow semantic versioning** — For plugin versions
6. **Review hooks carefully** — Shell commands are an injection surface

## Submitting Your Plugin

1. Fork this repository at <https://github.com/savethepolarbears/agenthaus-marketplace>
2. Create your plugin under `plugins/`
3. Run `bash scripts/validate-plugins.sh` to verify
4. Add an entry to `.claude-plugin/marketplace.json`
5. Submit a pull request with:
   - Description of the plugin
   - Required environment variables
   - Example usage

## CI/CD

Pull requests automatically run:

- Plugin validation (all plugins checked)
- Web storefront lint and build

See `.github/workflows/validate.yml` for details.

## Questions?

Open an issue or reach out to the AgentHaus team.
