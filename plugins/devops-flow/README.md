# devops-flow

Orchestrate Cloudflare deployments, GitHub PRs, and Slack notifications in integrated workflows.

## Prerequisites

| Variable | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers/Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier |
| `GITHUB_TOKEN` | GitHub personal access token |
| `SLACK_TOKEN` | Slack bot OAuth token |
| `SLACK_CHANNEL` | Slack channel ID for deployment notifications |

## Installation

```bash
/plugin install devops-flow
```

## Usage

### Commands

#### `/deploy`

Deploy to Cloudflare Workers/Pages and notify the team via Slack.

```
> /deploy
Deploying current project to Cloudflare Workers...
```

### Hooks

#### pre-deploy-confirmation

Triggers before any Cloudflare deploy tool call. Outputs a confirmation message before proceeding.

#### post-deploy-notify

Triggers after a successful Cloudflare deploy. Sends a notification to the configured Slack channel.

## Configuration

Add credentials to `.env`:

```bash
CLOUDFLARE_API_TOKEN=your-cloudflare-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
GITHUB_TOKEN=ghp_your-github-token
SLACK_TOKEN=xoxb-your-slack-token
SLACK_CHANNEL=C0123456789
```

## Architecture

Multi-service orchestration combining three MCP servers:

- **@cloudflare/mcp-server-cloudflare** -- Workers and Pages deployment management
- **@modelcontextprotocol/server-github** -- PR creation, issue tracking, repo operations
- **@modelcontextprotocol/server-slack** -- Team notifications and channel messaging

Pre/post deployment hooks in `hooks/` enforce confirmation before deploys and automated notification after completion.
