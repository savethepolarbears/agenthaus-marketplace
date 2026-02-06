# Plugin Manifest Schema Reference

The `plugin.json` file is the required manifest for all Claude Code plugins.

## Location

```text
plugin-name/.claude-plugin/plugin.json
```

## Schema

```json
{
  "$schema": "https://anthropic.com/claude-code/plugin.schema.json",
  "name": "string (required)",
  "description": "string (required)",
  "version": "string (required, semver)",
  "commands": "string | string[] (optional)",
  "agents": "string | string[] (optional)",
  "skills": "string | string[] (optional)",
  "hooks": "string (optional)",
  "mcpServers": "object (optional)"
}
```

## Field Descriptions

### Required Fields

| Field         | Type   | Description                          |
| ------------- | ------ | ------------------------------------ |
| `name`        | string | Plugin identifier in kebab-case     |
| `description` | string | Brief description of functionality  |
| `version`     | string | Semantic version (e.g., "1.0.0")    |

### Optional Fields

| Field        | Type         | Description                      |
| ------------ | ------------ | -------------------------------- |
| `commands`   | string/array | Path(s) to command definitions   |
| `agents`     | string/array | Path(s) to agent definitions     |
| `skills`     | string/array | Path(s) to skill directories     |
| `hooks`      | string       | Path to hooks.json configuration |
| `mcpServers` | object       | MCP server configurations        |

## Path Formats

Paths can be specified as:

- Single path: `"./commands/deploy.md"`
- Glob pattern: `"./commands/*.md"`
- Array of paths: `["./commands/deploy.md", "./commands/test.md"]`
- Array of directories: `["./agents", "./specialized-agents"]`

## MCP Server Configuration

```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx | node | python",
      "args": ["array", "of", "arguments"],
      "env": {
        "ENV_VAR": "${PLACEHOLDER}"
      }
    }
  }
}
```

### Environment Variable Placeholders

Use `${VAR_NAME}` syntax for environment variable substitution:

- `${GITHUB_TOKEN}` → User's GitHub token
- `${NOTION_API_KEY}` → User's Notion API key
- `${OPENAI_API_KEY}` → User's OpenAI API key

## Complete Example

```json
{
  "name": "devops-flow",
  "description": "Integrated DevOps workflow with CI/CD, deployments, and notifications.",
  "version": "1.0.0",
  "commands": [
    "./commands/deploy.md",
    "./commands/rollback.md",
    "./commands/status.md"
  ],
  "agents": "./agents",
  "skills": [
    "./skills/deployment-checker",
    "./skills/log-analyzer"
  ],
  "hooks": "./hooks/hooks.json",
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_TOKEN}"
      }
    }
  }
}
```

## Common MCP Servers

| Server       | NPX Package                             | Required Env Var       |
| ------------ | --------------------------------------- | ---------------------- |
| GitHub       | `@modelcontextprotocol/server-github`   | `GITHUB_TOKEN`         |
| Notion       | `@modelcontextprotocol/server-notion`   | `NOTION_API_KEY`       |
| Slack        | `@anthropic/mcp-server-slack`           | `SLACK_TOKEN`          |
| Postgres     | `@modelcontextprotocol/server-postgres` | `DATABASE_URL`         |
| Cloudflare   | `@anthropic/mcp-server-cloudflare`      | `CLOUDFLARE_API_TOKEN` |
| Google Drive | `@anthropic/mcp-server-gdrive`          | `GOOGLE_CREDENTIALS`   |
