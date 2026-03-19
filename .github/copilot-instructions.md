# GitHub Copilot Instructions

For the complete project guide, see [AGENTS.md](../AGENTS.md).

## AgentHaus Marketplace

A marketplace of 23 production-ready plugins for AI coding assistants. Plugins provide commands, agents, skills, hooks, and MCP server integrations.

## Quick Reference

### Build Commands

```bash
cd agenthaus-web && npm install && npm run dev    # Dev server
npm run build                                      # Production build
npm run lint                                       # Lint
bash scripts/validate-plugins.sh                   # Validate all plugins
```

### Code Style

- TypeScript strict mode, React 19 functional components
- Tailwind CSS utility classes inline, Lucide React for icons
- PascalCase for components/interfaces, camelCase for variables, kebab-case for files
- No hardcoded secrets; use `${ENV_VAR}` in MCP configs

### Plugin Structure

```text
plugins/<name>/
├── .claude-plugin/plugin.json    # Required manifest
├── commands/*.md                 # Slash commands (YAML frontmatter)
├── agents/*.md                   # Subagent definitions
├── skills/<name>/SKILL.md        # Skill instructions
├── hooks/hooks.json              # Event hooks
├── .mcp.json                     # MCP server configs
└── README.md                     # Documentation
```

### Copilot-Specific Notes

- Plugin files are Markdown/JSON with no compilation step
- When suggesting plugin manifest completions, use explicit file paths (not globs)
- All YAML frontmatter in commands requires `name` and `description` fields
- MCP environment variables use `${VAR_NAME}` interpolation syntax
- The web app (agenthaus-web/) uses Next.js 16 App Router with React 19

### Tech Stack

- Next.js 16.0.0, React 19.0.0, TypeScript 5.7.0, Tailwind CSS 4.0.0
- Neon Serverless Postgres, Lucide React 0.469.0
- npm package manager
