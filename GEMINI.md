# GEMINI.md

This file provides guidance to Gemini CLI when working in this repository.

For the complete plugin development guide, architecture details, and full reference, see [AGENTS.md](AGENTS.md).

## AgentHaus Marketplace

A marketplace of 27 production-ready plugins for AI coding assistants. Plugins provide commands, agents, skills, hooks, and MCP server integrations that extend assistant capabilities.

Repository: https://github.com/savethepolarbears/agenthaus-marketplace

## Architecture

```text
agenthaus-marketplace/
├── agenthaus-web/          # Next.js 16 storefront (React 19, Tailwind 4, Neon Postgres)
├── plugins/                # 27 production plugins
├── schemas/                # JSON schemas for validation
├── scripts/                # Validation and utility scripts
├── reports/                # All project reports and documentation
├── .env.example            # Required environment variables
├── CONTRIBUTING.md         # Plugin development guide
└── README.md               # Project overview
```

## Build Commands

### Web Application (agenthaus-web/)

```bash
cd agenthaus-web && npm install     # Install dependencies
npm run dev                         # Start Next.js dev server
npm run build                       # Production build
npm run start                       # Start production server
npm run lint                        # Run Next.js linter (ESLint)
```

The web app requires `DATABASE_URL` environment variable pointing to a Neon Postgres connection string.

### Plugin Validation

```bash
bash scripts/validate-plugins.sh    # Validate all plugins and marketplace
```

## Code Style

### TypeScript (agenthaus-web/)

- Strict mode enabled in tsconfig.json (strict: true, target ES2022)
- Path aliases: `@/*` maps to `./src/*`
- React functional components with TypeScript interfaces
- Tailwind CSS utility classes inline, no separate CSS files
- Lucide React for icons exclusively
- PascalCase for components/interfaces, camelCase for variables/functions, kebab-case for files

### Plugin Files

- Manifest: JSON in `.claude-plugin/plugin.json` with name, version, description, author, capabilities, tags
- Commands: Markdown with YAML frontmatter (description field required)
- Agents: Markdown with YAML frontmatter (name, description, model fields)
- Skills: Markdown in `skills/<name>/SKILL.md` with YAML frontmatter (name, description fields)
- Hooks: JSON with `{ "hooks": { "PreToolUse": [...], "PostToolUse": [...] } }` format
- MCP configs: JSON in `.mcp.json` with `mcpServers` object; use `${ENV_VAR}` for secrets
- All plugin directories and file names use kebab-case

## Plugin Development

See CONTRIBUTING.md for the complete guide.

### Required Structure

```text
plugins/your-plugin/
├── .claude-plugin/
│   └── plugin.json          # Required: name, version, description
├── .mcp.json                # Optional: MCP server configs
├── commands/                # Optional: Slash commands (Markdown + YAML frontmatter)
├── agents/                  # Optional: Subagent definitions
├── skills/                  # Optional: Skill instructions (skills/<name>/SKILL.md)
├── hooks/                   # Optional: Event hooks (JSON)
└── README.md                # Required: Plugin documentation
```

## Gemini-Specific Notes

### Context Caching

When working with this repository, use Gemini's context caching to retain the full plugin catalog and marketplace.json across turns. The `.claude-plugin/marketplace.json` file and `plugins/` directory tree are stable between edits and benefit from caching.

### File Inclusion

Use @include patterns to pull in relevant plugin manifests when working on specific plugins:

- @plugins/<plugin-name>/.claude-plugin/plugin.json for the manifest
- @plugins/<plugin-name>/README.md for plugin documentation
- @.claude-plugin/marketplace.json for the full registry

### Working with Plugins

Plugins are Markdown/JSON configurations with no build step. When creating or editing plugins:

1. Follow the kebab-case naming convention for directories and files
2. Use explicit file paths in plugin.json (not glob patterns)
3. Include YAML frontmatter in all command and agent Markdown files
4. Use `${ENV_VAR}` syntax for secrets in MCP configurations
5. Run `bash scripts/validate-plugins.sh` after changes to verify structure

### Tech Stack

- Web: Next.js 16.0.0, React 19.0.0, TypeScript 5.7.0, Tailwind CSS 4.0.0
- Database: Neon Serverless Postgres (@neondatabase/serverless)
- Validation: Zod 4.3.6
- Icons: Lucide React 0.469.0
- Package Manager: npm

## Security

- Never commit API keys, tokens, or credentials
- Use environment variables for all secrets (see .env.example)
- Use `${ENV_VAR}` interpolation in MCP configs
- Validate inputs at system boundaries
- Plugin hooks run shell commands -- review for injection risks

## Testing

- Web app: `npm run lint` in agenthaus-web/
- Plugins: `bash scripts/validate-plugins.sh` for structure validation
- Local plugin testing: use `claude --plugin-dir ./plugins/your-plugin`
- When tests fail, fix the code, not the test
