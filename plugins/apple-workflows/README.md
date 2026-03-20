# Apple Workflows

Manage Apple Notes, Reminders, and Shortcuts with AI agents via a local MCP server on macOS.

## Overview

This plugin provides a complete Apple productivity integration for Claude Code and compatible AI coding agents. It bundles a local Python MCP server with 28 tools across three Apple productivity domains, plus 7 slash commands, 2 AI agents, 2 skills, and safety hooks with audit logging.

| Domain | Backend | Tool Count | Capabilities |
|--------|---------|------------|--------------|
| Notes | `macnotesapp` (Python) | 10 | accounts, folders, search, get, create, update, move, delete, create\_folder, delete\_folder |
| Reminders | `remindctl` or `rem` (CLI) | 12 | status, request\_access, lists, list, get, add, update, complete, delete, list\_create, list\_rename, list\_delete |
| Shortcuts | Apple `shortcuts` (built-in) | 5 | list, run, view, create\_new, open |
| Utility | — | 1 | system\_status |

## Requirements

- **macOS** (Monterey 12.0 or later recommended)
- **Python >= 3.11** and **uv** package manager (`brew install uv` or `pip install uv`)
- **macnotesapp** — `uv tool install --python 3.13 macnotesapp`
- **remindctl** (recommended) — `brew install steipete/tap/remindctl`
  - Or **rem** (alternative) — `curl -fsSL https://rem.sidv.dev/install | bash`
- **shortcuts** CLI — built into macOS, no installation needed

### First-Time Setup

After installing the backends, grant Terminal (or your IDE) access to Reminders:

1. Run `remindctl authorize` to trigger the system permission prompt.
2. If denied, enable access in **System Settings > Privacy & Security > Reminders**.
3. Verify everything works with `/apple-workflows:status`.

## Installation

```bash
# Install the plugin from the marketplace
/plugin install apple-workflows

# Or add the entire marketplace first
/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace
/plugin install apple-workflows
```

### Local Development

```bash
# Test the plugin locally without installing
claude --plugin-dir ./plugins/apple-workflows
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APPLE_REMINDERS_BACKEND` | `remindctl` | Which Reminders CLI to use: `remindctl` or `rem`. Auto-detects if not set. |
| `APPLE_PRODUCTIVITY_MCP_TRANSPORT` | `stdio` | MCP transport: `stdio` (default) or `streamable-http`. |

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/apple-workflows:notes` | Create, search, update, move, and delete Apple Notes | `/apple-workflows:notes search quarterly planning` |
| `/apple-workflows:reminders` | Manage reminders — add, complete, list, search, organize | `/apple-workflows:reminders list today` |
| `/apple-workflows:shortcuts` | List, run, and manage Apple Shortcuts | `/apple-workflows:shortcuts run "Daily Summary"` |
| `/apple-workflows:daily-review` | Morning productivity briefing with overdue, today, and upcoming items | `/apple-workflows:daily-review` |
| `/apple-workflows:capture` | Quick capture — auto-detects note vs reminder from text | `/apple-workflows:capture Buy groceries --due tomorrow` |
| `/apple-workflows:status` | Check Apple CLI backend availability and system readiness | `/apple-workflows:status` |
| `/apple-workflows:organize` | Organize notes into folders, triage reminders by priority | `/apple-workflows:organize notes` |

## Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| `productivity-assistant` | sonnet | General Apple productivity management across Notes, Reminders, and Shortcuts |
| `workflow-automator` | sonnet | Shortcuts-focused automation agent for chaining workflows and integrating results |

## Skills

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `apple-productivity` | Notes, Reminders, Shortcuts interactions | Decision rules for choosing between Notes vs Reminders vs Shortcuts, safe operating patterns |
| `apple-automation` | Automation, workflow chaining | Shortcuts automation patterns: morning briefing, content pipeline, project kickoff |

## Usage Examples

### Getting Started

```bash
# Check that all backends are available
/apple-workflows:status

# Get a morning productivity briefing
/apple-workflows:daily-review
```

### Notes Management

```bash
# Search for notes
/apple-workflows:notes search quarterly planning

# Create a new note
/apple-workflows:notes create "Project Ideas" "List of project ideas for Q2"

# Move a note to a folder
/apple-workflows:notes move "Project Ideas" --folder Projects

# List all folders
/apple-workflows:notes folders
```

### Reminders Management

```bash
# View today's reminders
/apple-workflows:reminders list today

# View overdue items
/apple-workflows:reminders list overdue

# Add a new reminder with a due date
/apple-workflows:reminders add "Review PR #42" --due tomorrow --list Work

# Complete a reminder
/apple-workflows:reminders complete "Review PR #42"

# Create a new list
/apple-workflows:reminders create-list "Travel Planning"
```

### Quick Capture

```bash
# Auto-detect: action-oriented text becomes a reminder
/apple-workflows:capture Buy groceries --due tomorrow

# Force as note
/apple-workflows:capture Meeting notes from standup --note

# Force as reminder with list
/apple-workflows:capture Call dentist --reminder --list Personal
```

### Shortcuts

```bash
# List all shortcuts
/apple-workflows:shortcuts list

# Run a shortcut
/apple-workflows:shortcuts run "Daily Summary"

# Run with text input
/apple-workflows:shortcuts run "Process Text" --input "Hello world"

# Run with file input and output
/apple-workflows:shortcuts run "Resize Image" --input-file photo.jpg --output resized.jpg
```

### Organization

```bash
# Suggest folder organization for notes
/apple-workflows:organize notes

# Triage reminders: overdue, uncategorized, reschedule
/apple-workflows:organize reminders
```

## MCP Server Tools Reference

### Notes Tools

| Tool | Description | Destructive |
|------|-------------|-------------|
| `notes_accounts` | List available Notes accounts | No |
| `notes_folders` | List folders, optionally by account | No |
| `notes_search` | Search notes by title/body text | No |
| `notes_get` | Get one note by id or title | No |
| `notes_create` | Create a new note | No |
| `notes_update` | Update note title and/or body | No |
| `notes_move` | Move a note to another folder | No |
| `notes_delete` | Delete a note | Yes (`confirm=True`) |
| `notes_create_folder` | Create a top-level folder | No |
| `notes_delete_folder` | Delete a folder | Yes (`confirm=True`) |

### Reminders Tools

| Tool | Description | Destructive |
|------|-------------|-------------|
| `reminders_status` | Backend info and permission status | No |
| `reminders_request_access` | Trigger permission prompt | No |
| `reminder_lists` | List all reminder lists | No |
| `reminders_list` | List reminders with view filter | No |
| `reminder_get` | Get one reminder by id or title | No |
| `reminders_add` | Create a reminder | No |
| `reminders_update` | Update a reminder | No |
| `reminders_complete` | Mark a reminder complete | No |
| `reminders_delete` | Delete a reminder | Yes (`confirm=True`) |
| `reminder_list_create` | Create a reminder list | No |
| `reminder_list_rename` | Rename a reminder list | No |
| `reminder_list_delete` | Delete a reminder list | Yes (`confirm=True`) |

### Shortcuts Tools

| Tool | Description | Destructive |
|------|-------------|-------------|
| `shortcuts_list` | List shortcuts or folders | No |
| `shortcuts_run` | Run a shortcut with optional input/output | No |
| `shortcuts_view` | Open shortcut in editor | No |
| `shortcuts_create_new` | Open editor for new shortcut | No |
| `shortcuts_open` | Open named shortcut in app | No |

## Safety

This plugin implements a **double safety layer** for destructive operations:

1. **MCP Server Level**: All destructive tools (`notes_delete`, `notes_delete_folder`, `reminders_delete`, `reminder_list_delete`) require an explicit `confirm=True` parameter. Calls without it are rejected with an error.

2. **PreToolUse Hook**: A shell script hook intercepts destructive tool calls before they reach the MCP server, verifying that `confirm: true` is present in the tool input. This catches any agent that bypasses the parameter check.

3. **Audit Logging**: All command invocations are logged to `apple_workflows_audit.log` in the project directory via a PostToolUse hook, providing a complete trail of operations.

## Reminders Backend Comparison

| Feature | `remindctl` | `rem` |
|---------|-------------|-------|
| Install | `brew install steipete/tap/remindctl` | `curl -fsSL https://rem.sidv.dev/install \| bash` |
| JSON output | `--json` flag | `-o json` flag |
| Authorization | `remindctl authorize` | First write triggers prompt |
| List management | `list --create`, `list --rename` | `list-mgmt create`, `list-mgmt rename` |
| Best for | Clean installs, JSON workflows | Rich CRUD, import/export |

The server normalizes output from both backends into a consistent schema, so agents see the same data shape regardless of which backend is active.

## Known Limitations

- **Apple Notes**: Rich formatting, tags, locked notes, deep folder structures, and attachments are the least reliable parts of Notes automation. Plain-text and HTML note body workflows work best.
- **Apple Shortcuts authoring**: Running shortcuts works well from CLI. Authoring does not — for creation and editing, the plugin opens the Shortcuts editor for the user to finish visually.
- **Interactive shortcuts**: Shortcuts that pause for user input (alerts, "Ask for Input" actions) will hang when run from CLI. Design shortcuts without modal prompts for automation.
- **iCloud sync latency**: Notes and Reminders sync via iCloud. Changes may take a moment to appear on other devices.
- **macOS only**: This plugin requires macOS. It will not work on Linux or Windows.

## Architecture

```text
apple-workflows/
├── .claude-plugin/
│   └── plugin.json                    # Plugin manifest (v1.0.0)
├── .mcp.json                          # Local MCP server config (uv run)
├── mcp/                               # Python MCP server package
│   ├── pyproject.toml                 # Package: apple-productivity-mcp
│   └── src/apple_productivity_mcp/
│       ├── __init__.py
│       └── server.py                  # 28 MCP tools (FastMCP)
├── commands/                          # 7 slash commands
│   ├── notes.md                       # Notes CRUD operations
│   ├── reminders.md                   # Reminders management
│   ├── shortcuts.md                   # Shortcuts execution
│   ├── daily-review.md                # Morning productivity briefing
│   ├── capture.md                     # Quick capture (auto-detect type)
│   ├── status.md                      # System readiness check
│   └── organize.md                    # Notes/Reminders organization
├── agents/                            # 2 AI subagents
│   ├── productivity-assistant.md      # General productivity (sonnet)
│   └── workflow-automator.md          # Shortcuts automation (sonnet)
├── skills/                            # 2 on-demand skills
│   ├── apple-productivity/SKILL.md    # Notes/Reminders/Shortcuts decision rules
│   └── apple-automation/SKILL.md      # Automation workflow patterns
├── hooks/                             # Safety + audit hooks
│   ├── hooks.json                     # PreToolUse guard + PostToolUse audit
│   └── scripts/
│       └── confirm-destructive.sh     # Block unconfirmed destructive ops
└── README.md
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `macnotesapp not available` | Install: `uv tool install --python 3.13 macnotesapp` |
| `No Reminders backend found` | Install remindctl: `brew install steipete/tap/remindctl` |
| Reminders permission denied | Run `remindctl authorize` or enable in System Settings > Privacy & Security > Reminders |
| `shortcuts` not found | Ensure you are on macOS. The `shortcuts` CLI is built into macOS 12+. |
| Shortcut hangs when run | The shortcut likely has an interactive prompt. Edit it to remove "Ask for Input" or alert actions. |
| Notes not appearing after create | iCloud sync may be slow. Wait a moment and search again. |
| `uv` not found | Install: `brew install uv` or `pip install uv` |

## License

MIT
