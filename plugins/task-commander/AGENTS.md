# task-commander

ClickUp task management with Slack, Gmail and Calendar notifications.

> **Codex CLI note:** This plugin requires MCP tools. Codex CLI does not implement MCP; configure the MCP server in your platform settings to enable full functionality.

## Platform Support

| Platform | MCP | Hooks | Commands/Agents | Skills |
|----------|-----|-------|-----------------|--------|
| Claude Code | full | n/a | full | full |
| Codex CLI | none | n/a | partial | full |
| Gemini CLI | via gemini-settings | n/a | partial | full |
| Cursor | via .cursor/mcp.json | n/a | partial | full |
| Windsurf | TBD | n/a | partial | full |

## Environment Variables

- `CLICKUP_API_KEY`
- `SLACK_BOT_TOKEN`
- `SLACK_DEFAULT_CHANNEL`
- `GMAIL_CREDENTIALS`
- `GOOGLE_CALENDAR_TOKEN`
