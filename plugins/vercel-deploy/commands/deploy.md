---
description: Deploy a Vercel project or trigger a redeploy. Usage: `/vercel-deploy:deploy [project] [branch]`
argument-hint: "[project] [branch]"
---

# Deploy Vercel Project

This command uses the `vercel` MCP tools to deploy a project.  If the user specifies a project name and branch, deploy that branch; otherwise deploy the default branch of the current project.  After triggering the deployment, monitor the deployment status and return the final URL or error message.  Authentication is handled by the Vercel MCP server's OAuth session (`/mcp`).  Optionally prompt the user to select from available projects if none is specified.
