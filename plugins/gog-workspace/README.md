# GOG Workspace Plugin

Google Workspace CLI integration for Claude Code using [gogcli](https://github.com/openclaw/gogcli) (`gog`).

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands/Agents | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | n/a | n/a | n/a | n/a | n/a | n/a |
| Hooks | full | none | none | none | none | n/a |

## Overview

Manage your entire Google Workspace from the terminal — Gmail, Calendar, Drive, Docs, Sheets, Slides, Tasks, Contacts, Chat, Forms, and Apps Script — all through natural language commands powered by the `gog` CLI.

### Features

* **12 slash commands** — Direct access to Gmail, Calendar, Drive, Docs, Sheets, Slides, Tasks, Contacts, Chat, Forms, Classroom, and Admin
* **Workspace Assistant agent** — Multi-service workflow orchestration (morning briefings, meeting prep, email-to-task pipelines)
* **Email Composer agent** — Context-aware email drafting with tone matching and thread awareness
* **Google Workspace CLI skill** — Comprehensive command reference automatically invoked when you mention Google services
* **Confirmation and audit hooks** — Claude Code asks before gog send, share and delete commands (a best-effort prompt, not a security boundary), and `gog_audit.log` records each gog invocation issued. The log works from the command text, so it records what was issued, not what the shell actually ran.

### Installation

```bash
# Install the plugin
/plugin install gog-workspace@AgentHaus

# Or test locally
claude --plugin-dir ./plugins/gog-workspace
```

### Prerequisites

Install and authenticate the `gog` CLI before using this plugin:

```bash
# Install gog CLI
brew install openclaw/tap/gogcli

# Store your OAuth credentials (from Google Cloud Console)
gog auth credentials set ~/Downloads/client_secret_*.json

# Add your Google account
gog auth add you@gmail.com

# Set default account
export GOG_ACCOUNT=you@gmail.com
```

See the [gogcli setup guide](https://github.com/openclaw/gogcli#readme) for detailed OAuth configuration.

### Usage Examples

```bash
# Gmail
/gog-workspace:gmail search "is:unread newer_than:7d"
/gog-workspace:gmail send boss@company.com "Status Update" "Here's the weekly summary..."

# Calendar
/gog-workspace:calendar list
/gog-workspace:calendar create "Team Standup" tomorrow 9am 9:30am

# Drive
/gog-workspace:drive search "Q1 budget"
/gog-workspace:drive upload ./report.pdf

# Docs & Sheets
/gog-workspace:docs create "Meeting Notes"
/gog-workspace:sheets read <sheet_id> --range 'A1:D10'

# Slides
/gog-workspace:slides create "Quarterly Review"

# Tasks
/gog-workspace:tasks add "Review PR #42" --due tomorrow

# Contacts
/gog-workspace:contacts search "John"

# Chat
/gog-workspace:chat send <space_id> "Build passed!"

# Forms
/gog-workspace:forms create "Customer Survey"

# Classroom
/gog-workspace:classroom courses

# Admin (Workspace)
/gog-workspace:admin users list

# Cross-service workflows via agent
/agents workspace-assistant
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOG_ACCOUNT` | Default Google account email | Recommended |
| `GOG_HOME` | Override the gogcli config/data/state/cache root | Optional |

For CI or headless use, pass `--access-token <token>`; for multi-client setups, pass `--client <name>`.

### Supported Google Services

| Service | Command Group | Key Operations |
|---------|---------------|----------------|
| Gmail | `gog gmail` | Search, send, reply, draft, label, filter |
| Calendar | `gog calendar` | List, create, RSVP, free/busy, conflicts |
| Drive | `gog drive` | List, upload, download, share, organize |
| Docs | `gog docs` | Create, read, export, comment |
| Sheets | `gog sheets` | Read, write, format, export |
| Slides | `gog slides` | Create, export, template-based |
| Tasks | `gog tasks` | List, add, complete, organize |
| Contacts | `gog contacts` | List, search |
| People | `gog people` | Directory search (Workspace) |
| Chat | `gog chat` | Spaces, messages, threads |
| Forms | `gog forms` | Create, responses, watches |
| Apps Script | `gog appscript` | Create, run, fetch source |
| Classroom | `gog classroom` | Courses, roster, assignments |
| Admin | `gog admin` | Users, groups, members (Workspace) |
| Keep | `gog keep` | Create, delete notes (Workspace) |

### gogcli Version

The command examples match the gogcli command reference at [openclaw/gogcli `docs/commands`](https://github.com/openclaw/gogcli/tree/main/docs/commands). `tests/gog-cli-drift.test.js` checks them against a snapshot of that reference. See [all releases](https://github.com/openclaw/gogcli/releases) for the changelog.

### Customization

Adjust the safety hooks in `hooks/hooks.json` to:
- Change which `gog` subcommands trigger the PreToolUse confirmation prompt. `hooks/scripts/gog-guard.py` splits each Bash command with shlex and treats every `gog` word, and every quoted command string that mentions gog (`bash -lc '…'`, `ssh host '…'`), as a possible invocation. So env prefixes, `if`/`while`/`!`, `timeout`, `sudo`, `xargs` and full paths are all covered. It asks before any command listed in `hooks/guarded-commands.json`: sends, replies, forwards, shares, mail forwarding changes, deletes, trash and clears. Regenerate that table with `node scripts/snapshot-gogcli.js --guard-only`. It errs toward asking, so text that merely names a guarded command (`echo gog gmail send`) also prompts. It is a confirmation prompt, not a security boundary: a determined shell construct can still avoid it. For hard guarantees, run gogcli with its own `--gmail-no-send`, `--readonly` or `--enable-commands` flags.
- The hooks need `python3` on `PATH`
- Customize the audit log location and format
- Add notifications for specific Gmail or Calendar events
