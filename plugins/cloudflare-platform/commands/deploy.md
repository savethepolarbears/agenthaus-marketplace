---
name: deploy
description: Deploy a Cloudflare Worker script to your account. Usage: `/cloudflare-platform:deploy <script_path> [environment]`
---
When invoked, use the `cloudflare` MCP tools to upload and deploy the specified Worker script.  Require the user to provide the local file path to the JavaScript or TypeScript Worker.  Optionally accept an environment name (for example `production` or `staging`).  Deploy the script to the target environment, report the deployment URL and any errors.  Ensure the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` variables are set in your environment.