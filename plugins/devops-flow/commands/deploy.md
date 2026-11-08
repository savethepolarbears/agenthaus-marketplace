---
description: Deploy current project to Cloudflare and notify team
argument-hint: "[environment]"
---
# /devops-flow:deploy

Target environment: `$ARGUMENTS` (default: the `wrangler.toml` default environment).

1. Use the Cloudflare API MCP server (`search` to find the Workers scripts endpoint, then `execute`) to list existing Worker scripts and confirm there is no naming conflict.
2. Read `wrangler.toml` (or `wrangler.jsonc`) to confirm the environment and account IDs match the target environment. Stop if they do not.
3. Run `npx wrangler deploy [--env <environment>]` with Bash. The pre-deploy hook asks for confirmation, and circuit-breaker (if installed) enforces the deploy window.
4. After the deploy succeeds, use the GitHub MCP server's add-issue-comment tool to post the deployment URL on the active pull request.
5. Use the Slack MCP server's send-message tool to post a summary (new URL, environment, who initiated it) to `${SLACK_CHANNEL}` or the channel the user names.
6. If any step fails, stop and report the failing step. Never retry a deploy automatically.