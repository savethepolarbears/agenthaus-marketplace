# github-integration

Full GitHub management: create/search issues and pull requests using GitHub's MCP server.

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

- `GITHUB_PERSONAL_ACCESS_TOKEN`
