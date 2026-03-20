# GitHub Integration Plugin

This plugin connects Claude to GitHub through the official GitHub MCP server, enabling the creation, search and management of issues and pull requests directly from your Claude session.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | full | none | full | full | partial | full |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Features

* **Issue management** – Use `/github-integration:issue` to create new issues or search existing ones.  If you supply a short title, Claude will ask for details and then open a new issue via the GitHub MCP.  Supplying a descriptive query causes Claude to list matching issues in the current repository.
* **Pull request workflows** – Invoke `/github-integration:pr` to open or search pull requests.  Provide a branch name to open a PR; provide a longer query to search for open PRs and summarise their status.
* **Secure API access** – The plugin relies on the GitHub MCP server packaged with `@modelcontextprotocol/server-github`.  Set the `GITHUB_TOKEN` environment variable to a personal access token with appropriate scopes (repo, issues, pull requests) before running Claude.

## Installation

Install the plugin from AgentHaus:

```bash
/plugin install github-integration@AgentHaus
```

Follow the prompts to authorize GitHub (if required).  After installation, use the `/github-integration:` namespace to invoke commands.
