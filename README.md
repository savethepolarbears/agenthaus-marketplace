# 🚀 AgentHaus Marketplace

> A comprehensive marketplace of **15 production-ready plugins** for Claude Code and Claude Cowork.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](./CHANGELOG.md)
[![Plugins](https://img.shields.io/badge/plugins-15-green.svg)](#available-plugins)
[![License](https://img.shields.io/badge/license-MIT-yellow.svg)](./LICENSE)

## Quick Start

```bash
# Add the marketplace to Claude Code
/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace

# Install any plugin
/plugin install social-media@AgentHaus
```

## Available Plugins

### 📝 Content & Communication

| Plugin           | Description                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **social-media** | Generate high-engagement posts for Twitter, LinkedIn, Instagram, Facebook with trend analysis  |

### 🔧 DevOps & Infrastructure

| Plugin                  | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| **github-integration**  | Manage GitHub issues and PRs via MCP server                    |
| **cloudflare-platform** | Deploy Workers, manage KV storage, AI Gateway                  |
| **vercel-deploy**       | Manage Vercel projects and deployments                         |
| **devops-flow**         | Integrated Cloudflare + GitHub + Slack workflows with hooks    |

### 📚 Knowledge & Documentation

| Plugin                | Description                                      |
| --------------------- | ------------------------------------------------ |
| **notion-workspace**  | Search and update Notion pages via MCP           |
| **context7-docs**     | Fetch hallucination-free library documentation   |
| **knowledge-synapse** | Context7 + Notion + Google Drive RAG system      |

### ✅ Productivity

| Plugin             | Description                                      |
| ------------------ | ------------------------------------------------ |
| **clickup-tasks**  | Manage ClickUp tasks, lists, and time tracking   |
| **task-commander** | ClickUp + Slack + Gmail + Calendar integration   |

### 🧪 Testing & QA

| Plugin                 | Description                                      |
| ---------------------- | ------------------------------------------------ |
| **playwright-testing** | E2E browser tests with QA engineer agent         |
| **qa-droid**           | Automated testing with Slack/Gmail notifications |

### 🗄️ Database

| Plugin        | Description                               |
| ------------- | ----------------------------------------- |
| **neon-db**   | Serverless Postgres via MCP               |
| **data-core** | Advanced Neon/Postgres with migrations    |

### 🛠️ Utilities

| Plugin              | Description                          |
| ------------------- | ------------------------------------ |
| **marketplace-cli** | CLI for managing AgentHaus plugins   |

## Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

See each plugin's README for specific environment variables.

## Web Storefront

A Next.js web app is included in `agenthaus-web/`:

```bash
cd agenthaus-web
npm install
npm run dev
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for plugin development guide.

## License

MIT © AgentHaus Team
