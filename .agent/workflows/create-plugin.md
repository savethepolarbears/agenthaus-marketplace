---
description: Create a complete Claude Code/Cowork plugin for the AgentHaus marketplace
---

# Create Plugin Workflow

Follow these steps to create a production-ready Claude plugin.

// turbo-all

## Phase 1: Discovery

1. Define plugin requirements:
   - Plugin name (kebab-case): ___
   - Brief description: ___
   - Target category: devops | productivity | content | qa | docs | cloud | database | rag | knowledge | utility

## Phase 2: Component Planning

1. Determine required components:
   - [ ] Commands (slash commands for user interaction)
   - [ ] Agents (specialized subagents for complex tasks)
   - [ ] Skills (reusable tool functions)
   - [ ] Hooks (lifecycle event handlers)
   - [ ] MCP Servers (external tool integrations)

## Phase 3: Create Directory Structure

1. Create plugin folder:

```bash
mkdir -p plugins/<plugin-name>/.claude-plugin
mkdir -p plugins/<plugin-name>/commands
mkdir -p plugins/<plugin-name>/agents
mkdir -p plugins/<plugin-name>/skills
mkdir -p plugins/<plugin-name>/hooks
touch plugins/<plugin-name>/README.md
```

## Phase 4: Create Plugin Manifest

1. Create `plugins/<plugin-name>/.claude-plugin/plugin.json`:

```bash
cat > plugins/<plugin-name>/.claude-plugin/plugin.json << 'EOF'
{
  "name": "<plugin-name>",
  "description": "<description>",
  "version": "1.0.0",
  "commands": ["./commands/*.md"]
}
EOF
```

## Phase 5: Create Commands

1. Create at least one command in `commands/`:

```bash
cat > plugins/<plugin-name>/commands/<command>.md << 'EOF'
---
name: <command-name>
description: <what the command does>
---
<Instructions for Claude on how to execute this command>
EOF
```

## Phase 6: Configure MCP (Optional)

1. If using external tools, add MCP configuration to plugin.json:
   - Add `mcpServers` object with server configurations
   - Use `${VAR_NAME}` syntax for environment variable placeholders
   - Document required env vars in README

## Phase 7: Create README

1. Create comprehensive README.md:
   - Plugin name and description
   - Installation instructions
   - Available commands with examples
   - Required environment variables
   - Usage examples

## Phase 8: Register with Marketplace

1. Add to `.claude-plugin/marketplace.json`:

```bash
# Edit .claude-plugin/marketplace.json
# Add new entry to plugins array:
# {
#   "name": "<plugin-name>",
#   "source": "./plugins/<plugin-name>",
#   "category": "<category>",
#   "description": "<user-facing description>"
# }
```

## Phase 9: Validation

1. Verify plugin structure:

```bash
# Check all files exist
ls -la plugins/<plugin-name>/
cat plugins/<plugin-name>/.claude-plugin/plugin.json | jq .

# Validate marketplace.json
cat .claude-plugin/marketplace.json | jq .
```

## Phase 10: Commit

1. Commit the new plugin:

```bash
git add plugins/<plugin-name>/ .claude-plugin/marketplace.json
git commit -m "feat(marketplace): add <plugin-name> plugin"
```
