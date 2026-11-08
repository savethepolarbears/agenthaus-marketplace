# task-commander

Unified task management with ClickUp and Slack (official remote MCP servers), plus Gmail and Google Calendar through the `gog` CLI.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | full | none | full | full | partial | full |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Prerequisites

| Variable | Description |
|---|---|
| `CLICKUP_KEY` | ClickUp API token |
| `SLACK_TOKEN` | Slack bot OAuth token |
| `SLACK_CHANNEL` | Slack channel ID for task notifications |
| `gog` CLI | Gmail and Calendar steps (`brew install gogcli && gog auth add you@example.com`) |

## Installation

```bash
/plugin install task-commander
```

## Usage

### Commands

#### `/todo`

Create a ClickUp task with optional Slack reminder and calendar event.

```
> /todo Fix the auth bug by Friday

Creates:
- ClickUp task with due date
- Slack reminder in configured channel
- Google Calendar event for the deadline
```

## Configuration

Add credentials to `.env`:

```bash
CLICKUP_KEY=pk_your-clickup-key
SLACK_TOKEN=xoxb-your-slack-token
SLACK_CHANNEL=C0123456789
```

## Architecture

Four-service integration for full task lifecycle management:

- **@taazkareem/clickup-mcp-server** -- Task creation, updates, and tracking
- **Slack MCP** (`https://mcp.slack.com/mcp`, OAuth) -- Team notifications and reminders
- **gog CLI** -- Email drafts and Google Calendar holds (run through Bash; no Google MCP server)

The `/todo` command orchestrates all four services to create a task with notifications and calendar entries in a single action.
