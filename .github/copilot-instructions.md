# GitHub Copilot Instructions

For the complete project guide, see [AGENTS.md](../AGENTS.md).

## AgentHaus Marketplace

A marketplace of 27 production-ready plugins for AI coding assistants. Plugins provide commands, agents, skills, hooks, and MCP server integrations.

## Quick Reference

### Commands

```bash
bash scripts/validate-plugins.sh                   # Validate all plugins
```

### Code Style

- Plugin files are Markdown/JSON with no compilation step
- kebab-case for plugin directories and file names
- No hardcoded secrets; use `${ENV_VAR}` in MCP configs
- Semantic versioning (semver) for all plugins

### Plugin Structure

```text
plugins/<name>/
├── .claude-plugin/plugin.json    # Required manifest
├── commands/*.md                 # Slash commands (YAML frontmatter)
├── agents/*.md                   # Subagent definitions
├── skills/<name>/SKILL.md        # Skill instructions
├── hooks/hooks.json              # Event hooks
├── .mcp.json                     # MCP server configs
└── README.md                     # Documentation
```

### Copilot-Specific Notes

- Plugin files are Markdown/JSON with no compilation step
- When suggesting plugin manifest completions, use explicit file paths (not globs)
- All YAML frontmatter in commands requires `name` and `description` fields
- MCP environment variables use `${VAR_NAME}` interpolation syntax
