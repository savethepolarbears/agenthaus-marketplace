# AgentHaus Marketplace

27 production-ready plugins for Claude Code with cross-platform support for Codex CLI, Gemini CLI, Cursor, and Windsurf.

## Plugins

| Plugin | Description | MCP | Hooks |
| -------- | ------------- | --- | ----- |
| agent-handoff | State-based task handoff between agents using a shared bl... | no | yes |
| agent-memory | Shared persistent memory across agent sessions using Neon... | yes | no |
| apple-photos | Manage Apple Photos libraries using the osxphotos CLI — q... | no | yes |
| circuit-breaker | Pre-built safety guardrails as reusable hooks for Claude ... | no | yes |
| clickup-tasks | Manage ClickUp tasks, lists and time tracking. | yes | no |
| cloudflare-platform | Manage Cloudflare Workers, KV storage and AI Gateway reso... | yes | no |
| context7-docs | Fetch up-to-date, hallucination-free documentation for an... | yes | no |
| data-core | Serverless Postgres database management via Neon. | yes | no |
| devops-flow | Orchestrate Cloudflare deployments, GitHub PRs, and Slack... | yes | yes |
| fleet-commander | Visualization and control of running agent sessions. | no | no |
| github-integration | Full GitHub management: create/search issues and pull req... | yes | no |
| gog-workspace | Google Workspace CLI integration for Gmail, Calendar, Dri... | no | yes |
| knowledge-synapse | RAG Agent combining Context7 docs, Notion memory and Goog... | yes | no |
| marketplace-cli | Utility commands for searching and installing AgentHaus p... | no | no |
| neon-db | Interact with Neon serverless Postgres databases. | yes | no |
| notion-workspace | Interact with your Notion workspace - search pages, query... | yes | no |
| openclaw-bridge | Convert AgentHaus plugins to OpenClaw skills and provide ... | no | no |
| playwright-testing | End-to-end browser automation and testing using Playwright. | yes | no |
| plugin-auditor | Audit plugins for security risks before installation. | no | no |
| qa-droid | Automated Playwright tests with Slack/Gmail notifications. | yes | no |
| seo-geo-rag | Six-phase SEO, Generative Engine Optimization (GEO), and ... | no | no |
| shadow-mode | Agents draft outputs to a review queue instead of executi... | no | yes |
| social-media | Generate high-engagement social media content with trend ... | no | yes |
| task-commander | ClickUp task management with Slack, Gmail and Calendar no... | yes | no |
| ux-ui | Polish and improve your front-end UX/UI, accessibility, d... | no | no |
| vercel-deploy | Manage Vercel projects and deployments. | yes | no |
| wp-cli-fleet | Agentic WP-CLI and WordPress fleet management for plugin ... | no | yes |

## Platform Support

| Platform | MCP | Hooks | Commands | Skills |
| -------- | --- | ----- | -------- | ------ |
| Claude Code | full | full | full | full |
| Codex CLI | none | none | partial | full |
| Gemini CLI | via gemini-settings | none | partial | full |
| Cursor | via .cursor/mcp.json | none | partial | full |
| Windsurf | global config | none | partial | full |

> Hooks are Claude Code-exclusive. MCP tool access requires platform-specific configuration.
