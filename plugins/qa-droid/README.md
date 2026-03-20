# qa-droid

Automated Playwright tests with Slack/Gmail notifications for test results.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands/Agents | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | full | none | full | full | partial | full |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Prerequisites

| Variable | Description |
|---|---|
| `SLACK_TOKEN` | Slack bot OAuth token |
| `SLACK_CHANNEL` | Slack channel ID for test result notifications |
| `GMAIL_CREDS` | Gmail credentials JSON for email reports |

## Installation

```bash
/plugin install qa-droid
```

## Usage

### Agents

#### sdet-agent

SDET (Software Development Engineer in Test) agent for browser automation and test development. Uses `claude-3-7-sonnet` model.

```
> Ask the sdet-agent to write E2E tests for the login flow

The agent will:
1. Analyze the application under test
2. Design test scenarios covering happy path and edge cases
3. Execute tests via the local Playwright server
4. Report results to Slack and/or Gmail
```

## Configuration

Add credentials to `.env`:

```bash
SLACK_TOKEN=xoxb-your-slack-token
SLACK_CHANNEL=C0123456789
GMAIL_CREDS={"client_id":"...","client_secret":"..."}
```

The plugin includes a custom `index.js` that starts a local Playwright MCP server. This is configured as `playwright-local` in `.mcp.json`.

## Architecture

- **playwright-local** -- Custom local MCP server (`index.js`) wrapping Playwright for browser automation
- **@modelcontextprotocol/server-slack** -- Test result notifications to team channels
- **@modelcontextprotocol/server-gmail** -- Email-based test reports

The sdet-agent drives Playwright via the local MCP server to execute browser tests, then reports results through Slack and Gmail notification channels.
