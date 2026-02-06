---
name: create-claude-plugin
description: Create a complete Claude Code or Claude Cowork plugin with proper structure, manifest, and marketplace configuration. Triggers on "create plugin", "new claude plugin", "build plugin".
---

# Create Claude Plugin Skill

## Goal

Scaffold a production-ready Claude Code/Cowork plugin following the AgentHaus marketplace standards with all required configuration files, commands, agents, hooks, and MCP integrations.

## Procedure

### Phase 1: Discovery

Ask the user for:

- Plugin name (kebab-case, e.g., `my-awesome-plugin`)
- Brief description of what the plugin does
- Target category: `devops`, `productivity`, `content`, `qa`, `docs`, `cloud`, `database`, `rag`, `knowledge`, `utility`

### Phase 2: Component Planning

Determine which components are needed:

- **Commands**: Slash commands for user interaction (required for most plugins)
- **Agents**: Specialized subagents for complex tasks
- **Skills**: Reusable tool functions
- **Hooks**: Event handlers for lifecycle events (pre-commit, post-tool-use, etc.)
- **MCP Servers**: External tool integrations (GitHub, Notion, Cloudflare, etc.)

### Phase 3: Scaffold Structure

Create the plugin directory structure:

```bash
mkdir -p plugins/<plugin-name>/.claude-plugin
mkdir -p plugins/<plugin-name>/commands
mkdir -p plugins/<plugin-name>/agents
mkdir -p plugins/<plugin-name>/skills
mkdir -p plugins/<plugin-name>/hooks
```

### Phase 4: Create Manifest

Generate `plugins/<plugin-name>/.claude-plugin/plugin.json`:

```json
{
  "name": "<plugin-name>",
  "description": "<description>",
  "version": "1.0.0",
  "commands": ["./commands/*.md"],
  "agents": ["./agents/*.md"],
  "skills": ["./skills/*"],
  "hooks": "./hooks/hooks.json",
  "mcpServers": {}
}
```

### Phase 5: Create Commands

For each slash command, create a markdown file in `commands/`:

```markdown
---
name: <command-name>
description: <what the command does>
---
<Detailed instructions for Claude on how to execute this command>
```

### Phase 6: Configure MCP Servers (if needed)

Add MCP server configurations to the manifest:

```json
"mcpServers": {
  "server-name": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-<name>"],
    "env": {
      "API_KEY": "${ENV_VAR_NAME}"
    }
  }
}
```

### Phase 7: Create README

Generate `plugins/<plugin-name>/README.md`:

- Plugin name and description
- Installation instructions
- Available commands
- Required environment variables
- Usage examples

### Phase 8: Validation

Verify the plugin structure:

- All required files exist
- plugin.json is valid JSON
- Command files have proper YAML frontmatter
- Environment variables are documented

## Output Format

- Complete plugin directory under `plugins/<plugin-name>/`
- Valid `plugin.json` manifest
- At least one command definition
- README.md with installation instructions
- Entry ready for `marketplace.json` registration

## Constraints

- Plugin names MUST be kebab-case
- All commands MUST have YAML frontmatter with `name` and `description`
- MCP server env vars MUST use `${VAR_NAME}` syntax for substitution
- README MUST document all required environment variables
- Plugin MUST be added to `.claude-plugin/marketplace.json` after creation

## Examples

### Example 1: Simple Command Plugin

```text
User: Create a plugin for managing git worktrees
Result: plugins/git-worktree/
├── .claude-plugin/plugin.json
├── commands/
│   ├── create-worktree.md
│   ├── list-worktrees.md
│   └── remove-worktree.md
└── README.md
```

### Example 2: MCP Integration Plugin

```text
User: Create a plugin for Slack notifications
Result: plugins/slack-notify/
├── .claude-plugin/plugin.json
├── commands/
│   └── notify.md
├── agents/
│   └── message-composer.md
└── README.md
(with Slack MCP server configured)
```

## References

- [Plugin Structure](references/plugin-structure.md)
- [Plugin JSON Schema](references/plugin-json-schema.md)
- [Marketplace JSON Schema](references/marketplace-json-schema.md)
