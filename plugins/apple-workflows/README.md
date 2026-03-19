# Apple Workflows

Manage Apple Notes, Reminders, and Shortcuts with AI agents via a local MCP server on macOS.

## Overview

This plugin provides a complete Apple productivity integration for Claude Code. It bundles a local Python MCP server with 25+ tools across three Apple productivity domains, plus commands, agents, skills, and safety hooks.

| Domain | Backend | Tools |
|--------|---------|-------|
| Notes | `macnotesapp` (Python) | 10 tools: accounts, folders, search, get, create, update, move, delete, create_folder, delete_folder |
| Reminders | `remindctl` or `rem` (CLI) | 12 tools: status, request_access, lists, list, get, add, update, complete, delete, list_create, list_rename, list_delete |
| Shortcuts | Apple `shortcuts` (built-in) | 5 tools: list, run, view, create_new, open |
| Utility | — | 1 tool: system_status |

## Requirements

- **macOS** (this plugin only works on macOS)
- **Python >= 3.11** and **uv** package manager
- **macnotesapp** — `uv tool install --python 3.13 macnotesapp`
- **remindctl** (recommended) — `brew install steipete/tap/remindctl`
- Or **rem** (alternative) — `curl -fsSL https://rem.sidv.dev/install | bash`
- **shortcuts** CLI — built into macOS, no installation needed

## Installation

```bash
# Install the plugin
/plugin install apple-workflows

# Or install from the marketplace
/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace
/plugin install apple-workflows
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APPLE_REMINDERS_BACKEND` | `remindctl` | Which Reminders CLI to use: `remindctl` or `rem` |

## Commands

| Command | Description |
|---------|-------------|
| `/apple-workflows:notes` | Create, search, update, move, and delete Apple Notes |
| `/apple-workflows:reminders` | Manage reminders — add, complete, list, search, organize |
| `/apple-workflows:shortcuts` | List, run, and manage Apple Shortcuts |
| `/apple-workflows:daily-review` | Morning productivity briefing |
| `/apple-workflows:capture` | Quick capture to Notes or Reminders |
| `/apple-workflows:status` | Check Apple CLI backend availability |
| `/apple-workflows:organize` | Organize notes into folders, triage reminders |

## Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `productivity-assistant` | sonnet | General Apple productivity management |
| `workflow-automator` | sonnet | Shortcuts automation and workflow chaining |

## Skills

| Skill | Purpose |
|-------|---------|
| `apple-productivity` | Decision rules for Notes vs Reminders vs Shortcuts |
| `apple-automation` | Shortcuts automation patterns and workflow chaining |

## Usage Examples

```bash
# Check system status
/apple-workflows:status

# Daily productivity review
/apple-workflows:daily-review

# Quick capture
/apple-workflows:capture Buy groceries --reminder --due tomorrow
/apple-workflows:capture Meeting notes from standup --note

# Notes management
/apple-workflows:notes search quarterly planning
/apple-workflows:notes create "Project Ideas" "List of project ideas for Q2"
/apple-workflows:notes move "Project Ideas" --folder Projects

# Reminders management
/apple-workflows:reminders list today
/apple-workflows:reminders add "Review PR #42" --due tomorrow --list Work
/apple-workflows:reminders complete "Review PR #42"

# Shortcuts
/apple-workflows:shortcuts list
/apple-workflows:shortcuts run "Daily Summary"
/apple-workflows:shortcuts run "Process Text" --input "Hello world"
```

## Safety

- Destructive operations (delete notes, delete reminders, delete lists) require explicit `confirm=True` in the MCP server.
- A PreToolUse hook provides an additional safety layer by blocking destructive tool calls that lack confirmation.
- All command invocations are logged to `apple_workflows_audit.log` in the project directory.

## Known Limitations

- **Apple Notes**: Rich formatting, tags, locked notes, deep folder structures, and attachments are less reliable. Plain-text and HTML note body workflows work best.
- **Apple Shortcuts**: Running shortcuts is reliable from CLI. Authoring is not — for creation and editing, the plugin opens the Shortcuts editor for the user to finish visually.
- **Shortcuts with prompts**: Shortcuts that require interactive UI prompts will hang when run from CLI. Design shortcuts without modal prompts for best results.
- **iCloud sync**: Notes and Reminders sync via iCloud. Changes may not appear immediately on other devices.
- **macOS only**: This plugin requires macOS. It will not work on Linux or Windows.

## Architecture

```
apple-workflows/
├── .claude-plugin/plugin.json    # Plugin manifest
├── .mcp.json                     # Local MCP server config (uv run)
├── mcp/                          # Python MCP server
│   ├── pyproject.toml
│   └── src/apple_productivity_mcp/
│       ├── __init__.py
│       └── server.py             # 28 MCP tools
├── commands/                     # 7 slash commands
├── agents/                       # 2 AI agents
├── skills/                       # 2 on-demand skills
├── hooks/                        # Safety + audit hooks
│   ├── hooks.json
│   └── scripts/confirm-destructive.sh
└── README.md
```

## License

MIT
