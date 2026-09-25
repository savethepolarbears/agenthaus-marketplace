# vistasocial-scheduler

Social media scheduling and management plugin using VistaSocial MCP. Handles post scheduling, content creation, queue auditing, profile lookups, rate-limit-aware batch operations, and multi-brand social media operations.

> **MCP setup:** `agenthaus install --target <provider>` registers these MCP servers in the provider's config (Codex: `config.toml` via `codex-mcp-config.toml`).

## Platform Support

| Platform | MCP | Hooks | Commands/Agents | Skills |
| :--- | :--- | :--- | :--- | :--- |
| Claude Code | full | n/a | full | full |
| Codex CLI | via config.toml | n/a | partial | full |
| Antigravity / Gemini CLI | via mcp_config.json / settings.json | n/a | partial | full |
| Cursor | via .cursor/mcp.json | n/a | partial | full |
| Windsurf / Devin | via mcp_config.json | n/a | partial | full |
| GitHub Copilot | via .vscode/mcp.json | n/a | prompts | full |
