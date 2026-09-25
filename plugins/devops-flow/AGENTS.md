# devops-flow

Orchestrate Cloudflare deployments, GitHub PRs, and Slack notifications.

> **Platform note:** This plugin uses Claude Code hooks. Hook-based automation is not available on Codex CLI, Windsurf, Gemini CLI, or Cursor. Commands and skills remain usable.

> **MCP setup:** `agenthaus install --target <provider>` registers these MCP servers in the provider's config (Codex: `config.toml` via `codex-mcp-config.toml`).

## Platform Support

| Platform | MCP | Hooks | Commands/Agents | Skills |
| :--- | :--- | :--- | :--- | :--- |
| Claude Code | full | full | full | full |
| Codex CLI | via config.toml | none | partial | full |
| Antigravity / Gemini CLI | via mcp_config.json / settings.json | none | partial | full |
| Cursor | via .cursor/mcp.json | none | partial | full |
| Windsurf / Devin | via mcp_config.json | none | partial | full |
| GitHub Copilot | via .vscode/mcp.json | none | prompts | full |
