# Plugin Development Rules

Rules for creating Claude Code and Cowork plugins within this repository.

## Naming Conventions

- Plugin names: kebab-case only (e.g., `my-plugin-name`)
- Command files: kebab-case.md (e.g., `deploy-app.md`)
- Agent files: kebab-case.md (e.g., `code-reviewer.md`)

## Required Files

Every plugin MUST contain:

1. `.claude-plugin/plugin.json` - Valid manifest with name, description, version
2. `README.md` - Installation instructions and usage examples

## Command Files

All command markdown files MUST have YAML frontmatter:

```yaml
---
name: command-name
description: What this command does
---
```

## MCP Configuration

- Use `${VAR_NAME}` placeholder syntax for environment variables
- Never hardcode API keys or secrets
- Document all required env vars in README
