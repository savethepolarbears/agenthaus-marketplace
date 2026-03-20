# task-commander

Unified task management with ClickUp, Slack notifications, Gmail integration, and Google Calendar scheduling.

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
| `GMAIL_CREDS` | Gmail credentials JSON |
| `GOOGLE_CALENDAR_TOKEN` | Google Calendar OAuth token |

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
GMAIL_CREDS={"client_id":"...","client_secret":"..."}
GOOGLE_CALENDAR_TOKEN=your-google-calendar-token
```

## Architecture

Four-service integration for full task lifecycle management:

- **@taazkareem/clickup-mcp-server** -- Task creation, updates, and tracking
- **@modelcontextprotocol/server-slack** -- Team notifications and reminders
- **@modelcontextprotocol/server-gmail** -- Email-based task assignments and updates
- **@modelcontextprotocol/server-google-calendar** -- Deadline scheduling and event creation

The `/todo` command orchestrates all four services to create a task with notifications and calendar entries in a single action.
