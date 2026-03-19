# GOG Workspace Plugin

Google Workspace CLI integration for Claude Code using [gogcli](https://github.com/steipete/gogcli) (`gog`).

## Overview

Manage your entire Google Workspace from the terminal — Gmail, Calendar, Drive, Docs, Sheets, Slides, Tasks, Contacts, Chat, Forms, and Apps Script — all through natural language commands powered by the `gog` CLI.

### Features

* **9 slash commands** — Direct access to Gmail, Calendar, Drive, Docs, Sheets, Slides, Tasks, Contacts, and Chat
* **Workspace Assistant agent** — Multi-service workflow orchestration (morning briefings, meeting prep, email-to-task pipelines)
* **Email Composer agent** — Context-aware email drafting with tone matching and thread awareness
* **Google Workspace CLI skill** — Comprehensive command reference automatically invoked when you mention Google services
* **Safety hooks** — Pre-execution confirmation for send/delete operations and audit logging

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
brew install gogcli

# Store your OAuth credentials (from Google Cloud Console)
gog auth credentials ~/Downloads/client_secret_*.json

# Add your Google account
gog auth add you@gmail.com

# Set default account
export GOG_ACCOUNT=you@gmail.com
```

See the [gogcli setup guide](https://github.com/steipete/gogcli#setup) for detailed OAuth configuration.

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

# Cross-service workflows via agent
/agents workspace-assistant
```

### Required Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOG_ACCOUNT` | Default Google account email | Recommended |
| `GOG_ACCESS_TOKEN` | Direct access token (CI/headless) | Optional |
| `GOG_CLIENT` | OAuth client name (multi-client setups) | Optional |
| `GOG_KEYRING_BACKEND` | Keyring backend (`file` or `keychain`) | Optional |

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
| Forms | `gog forms` | Form management |
| Apps Script | `gog apps-script` | Script execution |

### Latest Release

**v0.12.0** (March 9, 2025) — Full Workspace Admin coverage, spreadsheet editing enhancements with named ranges and formatting, Docs comment management, Sheets cell notes.

See [all releases](https://github.com/steipete/gogcli/releases) for the complete changelog.

### Customization

Adjust the safety hooks in `hooks/hooks.json` to:
- Add or remove pre-execution confirmations for specific operations
- Customize the audit log location and format
- Add notifications for specific Gmail or Calendar events
