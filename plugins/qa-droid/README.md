# qa-droid

Automated Playwright tests with Slack notifications and optional email reports via the `gog` CLI.

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
| `gog` CLI | Optional email reports (`gog auth add you@example.com`) |

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
4. Report results to Slack and/or email (gog CLI)
```

## Configuration

Add credentials to `.env`:

```bash
SLACK_TOKEN=xoxb-your-slack-token
SLACK_CHANNEL=C0123456789
```

The plugin includes a custom `index.js` that starts a local Playwright MCP server. This is configured as `playwright-local` in `.mcp.json`.

Install its runtime dependencies and Chromium before using the local server:

```bash
cd plugins/qa-droid
npm ci --ignore-scripts
npx playwright install --with-deps chromium
npm test
```

`npm test` verifies the STDIO initialization handshake, tool discovery, a real
browser visit to a local fixture, invalid inputs, and recovery after navigation
failure. CI runs this smoke test on Node 20, 22, and 24. `visit_and_report` accepts
HTTP and HTTPS URLs, returns the page title, and closes the browser after both
successful and failed visits. Navigation failures return an MCP tool error;
invalid arguments and unknown tools return protocol errors.

## Architecture

- **playwright-local** -- Custom local MCP server (`index.js`) wrapping Playwright for browser automation
- **Slack MCP** (`https://mcp.slack.com/mcp`, OAuth) -- Test result notifications to team channels
- **gog CLI** -- Email-based test reports (no Google MCP server)

The sdet-agent drives Playwright via the local MCP server to execute browser tests, then reports results through Slack and gog CLI email.
