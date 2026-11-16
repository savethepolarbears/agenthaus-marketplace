# shadow-mode

Agents draft outputs to a review queue instead of executing directly.

> **Platform note:** This plugin ships Claude Code-format hooks. Other providers have their own hook systems; agenthaus does not translate these hooks, so the guardrails only run in Claude Code. Commands and skills remain usable.

## Platform Support

| Platform | MCP | Hooks | Commands/Agents | Skills |
| :--- | :--- | :--- | :--- | :--- |
| Claude Code | n/a | full | full | full |
| Codex CLI | n/a | not translated | partial | full |
| Antigravity / Gemini CLI | n/a | not translated | partial | full |
| Cursor | n/a | not translated | partial | full |
| Windsurf / Devin | n/a | not translated | partial | full |
| GitHub Copilot | n/a | not translated | prompts | full |
