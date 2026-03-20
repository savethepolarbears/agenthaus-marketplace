# devops-flow

Orchestrate Cloudflare deployments, GitHub PRs, and Slack notifications.

> **Platform note:** This plugin uses Claude Code hooks. Hook-based automation is not available on Codex CLI, Windsurf, Gemini CLI, or Cursor. Commands and skills remain usable.

> **Codex CLI note:** This plugin requires MCP tools. Codex CLI does not implement MCP; configure the MCP server in your platform settings to enable full functionality.

## Platform Support

| Platform | MCP | Hooks | Commands/Agents | Skills |
|----------|-----|-------|-----------------|--------|
| Claude Code | full | full | full | full |
| Codex CLI | none | none | partial | full |
| Gemini CLI | via gemini-settings | none | partial | full |
| Cursor | via .cursor/mcp.json | none | partial | full |
| Windsurf | TBD | none | partial | full |

## Environment Variables

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `GITHUB_PERSONAL_ACCESS_TOKEN`
- `SLACK_BOT_TOKEN`
- `SLACK_DEFAULT_CHANNEL`
