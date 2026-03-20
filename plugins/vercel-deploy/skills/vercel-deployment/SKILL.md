---
name: vercel-deployment
description: Deploy and manage Vercel projects, trigger deployments, monitor build status, and manage environment configurations. Use when the user asks to deploy to Vercel, check deployment status, manage project settings, or trigger redeployments via the Vercel MCP server.
---

# Vercel Deployment Management

Deploy projects, monitor builds, and manage Vercel hosting configurations.

## When to Use

- User asks to deploy a project to Vercel
- User wants to check deployment status or build logs
- User needs to trigger a redeployment of an existing project
- User asks to manage Vercel project settings or environment variables
- User wants to list or compare deployments across branches

## Prerequisites

- `VERCEL_TOKEN` environment variable must be set
- Vercel MCP server (`@modelcontextprotocol/server-vercel`) must be available

## Steps

### 1. Identify Deployment Target

1. Determine the project name from the user's request or current directory
2. Identify the branch to deploy (default: main/master)
3. If no project is specified, list available projects and prompt the user to select one

### 2. Trigger Deployment

1. Use the `vercel` MCP tools to initiate the deployment
2. Specify the project and branch
3. Monitor the deployment progress in real-time
4. Report the final deployment URL or error details

### 3. Monitor Deployment Status

When checking an existing deployment:

1. Fetch the latest deployment status for the specified project
2. Display: status (building/ready/error), URL, branch, commit, duration
3. If the deployment failed, fetch and summarize build logs
4. Suggest fixes based on common error patterns

### 4. Manage Projects

When managing Vercel project configurations:

1. List all projects in the account with their latest deployment status
2. View project settings: framework, build command, output directory
3. Manage environment variables (list, add, update)
4. Configure deployment protections and domain settings

### 5. Redeployment

When triggering a redeployment:

1. Confirm which deployment to redeploy (latest or specific)
2. Optionally allow the user to change environment variables before redeploying
3. Trigger the redeployment and monitor progress
4. Report the new deployment URL

## Output Format

```
### Deployment Status

- **Project**: my-app
- **Branch**: main
- **Status**: Ready
- **URL**: https://my-app.vercel.app
- **Build Duration**: 45s
- **Deployed at**: [timestamp]
```

## Error Handling

- If `VERCEL_TOKEN` is not set, provide setup instructions
- If the project is not found, list available projects
- If a build fails, summarize the error from build logs and suggest fixes
- Rate limit errors should be reported with retry guidance
