# vistasocial-scheduler

Social media scheduling and management plugin using VistaSocial MCP. Handles post scheduling, content creation, queue auditing, profile lookups, rate-limit-aware batch operations, and multi-brand social media operations.

> **Platform note:** This plugin ships Claude Code-format hooks. Other providers have their own hook systems; agenthaus does not translate these hooks, so the guardrails only run in Claude Code. Commands and skills remain usable.

> **MCP setup:** `agenthaus install --target <provider>` registers these MCP servers in the provider's config (Codex: `config.toml` via `codex-mcp-config.toml`).

## Platform Support

| Platform | MCP | Hooks | Commands/Agents | Skills |
| :--- | :--- | :--- | :--- | :--- |
| Claude Code | full | full | full | full |
| Codex CLI | via config.toml | not translated | partial | full |
| Antigravity / Gemini CLI | via mcp_config.json / settings.json | not translated | partial | full |
| Cursor | via .cursor/mcp.json | not translated | partial | full |
| Windsurf / Devin | via mcp_config.json | not translated | partial | full |
| GitHub Copilot | via .vscode/mcp.json | not translated | prompts | full |
