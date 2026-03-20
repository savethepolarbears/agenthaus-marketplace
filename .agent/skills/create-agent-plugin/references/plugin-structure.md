# Plugin Directory Structure Reference

This document defines the standard directory structure for Claude Code and Claude Cowork plugins.

## Required Structure

```text
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Required: Plugin manifest
├── README.md                # Required: Plugin documentation
└── [components...]          # At least one component required
```

## Optional Components

### Commands (`commands/`)

Slash commands that users invoke directly.

```text
commands/
├── deploy.md
├── test.md
└── analyze.md
```

Each command file uses YAML frontmatter:

```markdown
---
name: deploy
description: Deploy the application to production
---
Instructions for Claude on how to execute this command...
```

### Agents (`agents/`)

Specialized subagents with focused expertise.

```text
agents/
├── code-reviewer.md
├── security-auditor.md
└── test-writer.md
```

Agent files define personality, expertise, and tools:

```markdown
---
name: code-reviewer
description: Expert code reviewer focused on best practices
---
You are a senior code reviewer. When analyzing code:
1. Check for security vulnerabilities
2. Identify performance issues
3. Suggest improvements
```

### Skills (`skills/`)

Reusable tool functions organized in subdirectories.

```text
skills/
├── database-migration/
│   └── SKILL.md
└── api-testing/
    ├── SKILL.md
    └── references/
        └── api-patterns.md
```

### Hooks (`hooks/`)

Event handlers triggered by Claude lifecycle events.

```text
hooks/
└── hooks.json
```

Example `hooks.json`:

```json
{
  "pre-commit": {
    "script": "./scripts/pre-commit.sh",
    "description": "Run linting before commits"
  },
  "post-tool-use": {
    "matcher": "Write",
    "script": "./scripts/format-code.sh"
  }
}
```

### MCP Configuration (`.mcp.json`)

External tool integrations at plugin root.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

## Complete Example

```text
social-media/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── post.md
│   ├── schedule.md
│   └── analytics.md
├── agents/
│   ├── content-writer.md
│   └── trend-analyzer.md
├── skills/
│   └── hashtag-generator/
│       └── SKILL.md
├── hooks/
│   └── hooks.json
├── scripts/
│   └── validate-post.sh
└── README.md
```

## Naming Conventions

| Item          | Convention     | Example              |
| ------------- | -------------- | -------------------- |
| Plugin folder | kebab-case     | `github-integration` |
| Command files | kebab-case.md  | `create-issue.md`    |
| Agent files   | kebab-case.md  | `code-reviewer.md`   |
| Skill folders | kebab-case     | `api-testing`        |
| Hook scripts  | kebab-case.sh  | `pre-commit.sh`      |
