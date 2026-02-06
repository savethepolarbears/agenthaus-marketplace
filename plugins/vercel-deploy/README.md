# Vercel Deploy Plugin

Deploy and manage your Vercel projects from within Claude using the **vercel-deploy** plugin.

## Features

* **Trigger deployments** – Use `/vercel-deploy:deploy` to deploy your project.  Optionally specify a project name and branch to deploy a feature branch.
* **Monitor status** – The plugin polls Vercel’s API for deployment status and reports the final URL or any build failures.
* **Authentication** – Set the `VERCEL_TOKEN` environment variable to a Vercel personal access token.  The plugin uses the official Vercel MCP server to perform operations.

## Installation

```bash
/plugin install vercel-deploy@AgentHaus
```

After installation, you can trigger deployments like this:

```bash
/vercel-deploy:deploy my-nextjs-app main
```

If you omit the project or branch, Claude will attempt to determine sensible defaults from your current directory’s `vercel.json` or prompt you interactively.
