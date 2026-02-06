---
description: Deploy current project to Cloudflare and notify team
---
# /devops:deploy
1. Use the `cloudflare.list_workers` tool to check existing scripts and ensure no naming conflicts.
2. Read `wrangler.toml` to confirm the environment and account IDs match the target environment.
3. Run `npx wrangler deploy` via the Cloudflare MCP to upload and activate your Worker.
4. After deployment succeeds, call `github.create_issue_comment` to post the deployment URL to the active pull request so that reviewers see the result.
5. Call `slack.post_message` to send a summary of the deployment (including the new URL) to the configured channel.  Mention who initiated the deploy and any relevant environment details.