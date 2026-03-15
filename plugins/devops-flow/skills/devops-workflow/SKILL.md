---
name: devops-workflow
description: Orchestrate end-to-end DevOps workflows combining Cloudflare deployments, GitHub PR management, and Slack notifications in a unified pipeline. Use when the user asks to deploy with notifications, coordinate deployment pipelines across services, or automate the deploy-review-notify cycle.
---

# DevOps Workflow Orchestration

Unified deployment pipeline combining Cloudflare Workers, GitHub PR management, and Slack team notifications.

## When to Use

- User asks to deploy code with automated notifications
- User wants an end-to-end deploy pipeline (build, deploy, notify)
- User needs to coordinate Cloudflare deployments with GitHub PRs
- User wants deployment status sent to Slack channels
- User asks to set up or run a CI/CD-like workflow from the agent

## Prerequisites

- `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` — for Cloudflare deployments
- `GITHUB_TOKEN` — for GitHub PR and branch operations
- `SLACK_TOKEN` and `SLACK_CHANNEL` — for Slack notifications
- MCP servers: `@cloudflare/mcp-server-cloudflare`, `@modelcontextprotocol/server-github`, `@modelcontextprotocol/server-slack`

## Steps

### 1. Pre-Deployment Checks

Before deploying:

1. **Verify branch status**: Ensure the current branch is clean (no uncommitted changes)
2. **Check PR status**: If deploying from a feature branch, verify the PR is approved
3. **Run tests**: If test commands are configured, run them and abort on failure
4. **Confirm with user**: Present a deployment summary and get explicit approval

### 2. Deployment Pipeline

Execute the deployment sequence:

1. **Build** (if applicable): Run the project's build command
2. **Deploy to Cloudflare**: Use `cloudflare` MCP tools to deploy the Worker
3. **Verify deployment**: Confirm the deployment URL is accessible
4. **Update GitHub**: Comment on the PR with the deployment URL and status
5. **Notify Slack**: Send a deployment notification to the configured channel

### 3. Slack Notification Format

```
:rocket: Deployment Complete
• Project: [project-name]
• Environment: [staging/production]
• Branch: [branch-name]
• URL: [deployment-url]
• Deployed by: [user]
• Status: :white_check_mark: Success
```

On failure:
```
:x: Deployment Failed
• Project: [project-name]
• Branch: [branch-name]
• Error: [error-summary]
• Action needed: [suggested fix]
```

### 4. Post-Deployment

After successful deployment:

1. Update the PR with deployment URL if applicable
2. Add a deployment label to the PR
3. Log the deployment to the project's deployment history
4. Offer to merge the PR if deployment is verified

### 5. Rollback Procedure

If deployment fails or needs rollback:

1. Identify the previous successful deployment
2. Redeploy the previous version
3. Notify Slack of the rollback
4. Update GitHub PR with rollback information

## Hooks Integration

This plugin includes pre-deployment confirmation and post-deployment notification hooks that automatically:
- Prompt for confirmation before any deployment action
- Send Slack notifications after successful deployments

## Error Handling

- Missing environment variables: List which ones are needed and how to set them
- Deployment failure: Capture error details, notify Slack, suggest fixes
- Network issues: Retry with exponential backoff (up to 3 attempts)
- PR not found: Skip GitHub updates gracefully, still deploy and notify
