---
name: cloudflare-deploy
description: Deploy and manage Cloudflare Workers, KV storage namespaces, and AI Gateway configurations. Use when the user asks to deploy edge functions, manage key-value storage, interact with Cloudflare services, or set up AI Gateway routing via the Cloudflare MCP server.
---

# Cloudflare Platform Management

Deploy Workers, manage KV storage, and configure AI Gateway through Cloudflare's edge platform.

## When to Use

- User asks to deploy a Cloudflare Worker script
- User needs to read, write, or delete KV storage entries
- User wants to manage Cloudflare AI Gateway configurations
- User asks about edge deployment or serverless function management
- User needs to manage Cloudflare account resources

## Prerequisites

- `CLOUDFLARE_API_TOKEN` environment variable must be set
- `CLOUDFLARE_ACCOUNT_ID` environment variable must be set
- Cloudflare MCP server (`@cloudflare/mcp-server-cloudflare`) must be available

## Steps

### 1. Worker Deployment

When deploying a Cloudflare Worker:

1. **Identify the script**: Get the local file path to the JavaScript or TypeScript Worker file
2. **Determine environment**: Accept optional environment name (`production`, `staging`, etc.)
3. **Validate the script**: Verify the file exists and is valid JS/TS
4. **Deploy**: Use the `cloudflare` MCP tools to upload and deploy the Worker
5. **Report results**: Provide the deployment URL, status, and any errors
6. **Verify**: Confirm the Worker is accessible at its URL

#### Deployment Checklist

- [ ] Script file exists and is valid
- [ ] Environment variables are configured
- [ ] Target environment is specified
- [ ] Deployment succeeded without errors
- [ ] Worker URL is accessible

### 2. KV Storage Operations

Support three operations on Cloudflare KV namespaces:

#### Get (Read)
1. Accept namespace and key as arguments
2. Use `cloudflare` MCP tools to retrieve the value
3. Return the value or indicate if the key does not exist

#### Put (Write)
1. Accept namespace, key, and value as arguments
2. Confirm the write operation with the user before executing
3. Use `cloudflare` MCP tools to set the key-value pair
4. Confirm success

#### Delete
1. Accept namespace and key as arguments
2. Prompt for confirmation before destructive deletion
3. Use `cloudflare` MCP tools to remove the key-value pair
4. Confirm deletion

### 3. AI Gateway Management

When working with Cloudflare AI Gateway:

1. List available AI Gateway configurations
2. Create or update gateway routing rules
3. Monitor gateway usage and analytics
4. Configure rate limiting and caching policies

### 4. Error Handling

- If `CLOUDFLARE_API_TOKEN` or `CLOUDFLARE_ACCOUNT_ID` is missing, inform the user with setup instructions
- If a KV namespace does not exist, return an informative error rather than failing silently
- Always prompt for confirmation before destructive operations (put/delete)
- Report deployment errors with actionable troubleshooting steps

## Output Format

```
### Deployment Result

- **Worker**: my-worker
- **Environment**: production
- **URL**: https://my-worker.account.workers.dev
- **Status**: Success
- **Deployed at**: [timestamp]
```

For KV operations:

```
### KV Operation

- **Namespace**: MY_NAMESPACE
- **Key**: config-key
- **Operation**: get | put | delete
- **Result**: [value or confirmation]
```
