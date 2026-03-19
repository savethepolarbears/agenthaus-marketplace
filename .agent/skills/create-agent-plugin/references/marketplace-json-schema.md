# Marketplace Configuration Schema Reference

The `marketplace.json` file defines a collection of plugins for distribution.

## Location

```text
.claude-plugin/marketplace.json
```

## Schema

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "string (required)",
  "version": "string (required)",
  "description": "string (required)",
  "owner": {
    "name": "string (required)",
    "email": "string (optional)",
    "url": "string (optional)"
  },
  "plugins": [
    {
      "name": "string (required)",
      "source": "string (required)",
      "category": "string (required)",
      "description": "string (required)"
    }
  ]
}
```

## Field Descriptions

### Root Fields

| Field         | Type   | Description                        |
| ------------- | ------ | ---------------------------------- |
| `name`        | string | Marketplace name                   |
| `version`     | string | Marketplace version (semver)       |
| `description` | string | Brief description of collection    |
| `owner`       | object | Contact information                |
| `plugins`     | array  | List of available plugins          |

### Plugin Entry Fields

| Field         | Type   | Description                           |
| ------------- | ------ | ------------------------------------- |
| `name`        | string | Plugin identifier (match plugin.json) |
| `source`      | string | Relative path to plugin directory     |
| `category`    | string | Plugin category for filtering         |
| `description` | string | User-facing description               |

## Categories

Standard AgentHaus categories:

| Category       | Description                                |
| -------------- | ------------------------------------------ |
| `devops`       | CI/CD, deployment, infrastructure          |
| `productivity` | Task management, scheduling, notifications |
| `content`      | Content creation, social media, writing    |
| `qa`           | Testing, quality assurance, validation     |
| `docs`         | Documentation, knowledge retrieval         |
| `cloud`        | Cloud platform integrations                |
| `database`     | Database operations, migrations            |
| `rag`          | RAG patterns, knowledge synthesis          |
| `knowledge`    | Note-taking, wikis, knowledge bases        |
| `utility`      | General-purpose tools                      |

## AgentHaus Example

```json
{
  "name": "AgentHaus",
  "version": "2.0.0",
  "description": "A curated marketplace of production-ready Claude plugins.",
  "owner": {
    "name": "AgentHaus Team",
    "email": "support@agenthaus.dev",
    "url": "https://github.com/savethepolarbears/agenthaus-marketplace"
  },
  "plugins": [
    {
      "name": "github-integration",
      "source": "./plugins/github-integration",
      "category": "devops",
      "description": "Manage GitHub issues and PRs through custom commands."
    },
    {
      "name": "notion-workspace",
      "source": "./plugins/notion-workspace",
      "category": "knowledge",
      "description": "Search and update Notion pages via MCP."
    }
  ]
}
```

## CLI Commands

Users interact with marketplaces via:

| Command                                  | Description              |
| ---------------------------------------- | ------------------------ |
| `/plugin marketplace add <URL>`          | Register a marketplace   |
| `/plugin list`                           | List installed plugins   |
| `/plugin install <name>@<marketplace>`   | Install a plugin         |
| `/plugin remove <name>`                  | Uninstall a plugin       |

## Adding a New Plugin

To add a new plugin to the marketplace:

1. Create the plugin under `plugins/<plugin-name>/`
1. Ensure `plugin.json` is valid
1. Add entry to `marketplace.json`:

   ```json
   {
     "name": "my-new-plugin",
     "source": "./plugins/my-new-plugin",
     "category": "utility",
     "description": "Description of what my plugin does."
   }
   ```

1. Update the web storefront if applicable
