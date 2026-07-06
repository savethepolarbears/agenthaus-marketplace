# notfair-marketing

Open-source Claude Code agent skills for SEO, GEO, Google Ads, and Meta Ads. Connects to live account data via Google Ads MCP, Meta Ads MCP, Google Search Console MCP, and Google Analytics (GA4) MCP.

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

- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`
- `GOOGLE_ADS_REFRESH_TOKEN`
- `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
- `META_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`
