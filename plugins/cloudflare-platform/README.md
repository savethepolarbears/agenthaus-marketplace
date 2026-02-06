# Cloudflare Platform Plugin

Use Claude to manage your Cloudflare account with the **cloudflare-platform** plugin.  It exposes commands for deploying Worker scripts, manipulating KV storage and, in the future, interacting with AI Gateway.

## Features

* **Deploy Workers** – Deploy JavaScript or TypeScript Worker scripts to your Cloudflare account.  Specify the file path and optional environment; the plugin calls the Cloudflare API to upload and activate the worker.
* **KV operations** – Get, put or delete key–value pairs in Cloudflare KV namespaces.  Prompt for confirmation before overwriting or deleting data.
* **Extensible** – The MCP server used by this plugin (published by Cloudflare) also supports other operations such as listing workers, viewing logs, and managing Durable Objects.  You can extend the plugin by adding more command files in the `commands/` directory.

## Installation

```bash
/plugin install cloudflare-platform@AgentHaus
```

Configure the environment variables `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` with your Cloudflare credentials.  You can find these in the Cloudflare dashboard.  After installation, use the `/cloudflare-platform:` namespace commands.
