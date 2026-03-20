# Coding Conventions

> Generated: 2026-03-20 | Source: GSD Map-Codebase (sequential)

## TypeScript (Web App)

- **Strict mode** enabled (`strict: true` in tsconfig.json)
- **Target:** ES2022 with bundler module resolution
- **Path aliases:** `@/*` → `./src/*`
- **JSX:** `react-jsx` (no React import needed)
- **Naming:**
  - PascalCase for components and interfaces (`PluginCard`, `StaticPlugin`)
  - camelCase for variables and functions (`getPlugins`, `installCount`)
  - kebab-case for file names (`plugin-card.tsx`, `rate-limit.ts`)
- **Exports:** Default exports for page components, named exports for utilities and types
- **Imports:** Named imports, grouped external → internal
- **Type annotations:** Explicit interfaces for component props and data structures

## React Components

- Functional components only (no class components)
- TypeScript interfaces for all props
- Server Components by default; `'use client'` only when interactive
- Lucide React for all icons — no other icon libraries
- `clsx` for conditional class composition

## CSS / Styling

- Tailwind CSS 4.0 utility classes inline — no CSS modules
- Single `globals.css` with `@import "tailwindcss"` only
- Dark theme: gradient backgrounds from `[#0a0a0a]` via `[#0f0f1a]`
- Selection color: `selection:bg-cyan-500/30`
- No CSS-in-JS libraries

## Data Patterns

- **Neon SQL:** Tagged-template literals for database queries (no ORM)
- **Graceful fallback:** `sql` is `null` when `DATABASE_URL` unset → static data
- **Caching:** `unstable_cache` with tags and 1-hour revalidation
- **Validation:** Zod v4 schemas at API boundaries
- **Sanitization:** Strip control chars, escape LIKE wildcards, regex slug validation

## Security Patterns

- Never hardcode secrets — use `${ENV_VAR}` interpolation
- `${CLAUDE_PLUGIN_ROOT}` for plugin-local script references
- CSP computed once at module load in middleware (not per-request)
- CSRF: Origin/Referer validation on POST endpoints
- Rate limiting with proper 429 responses and `Retry-After` headers
- Input length capped at 100 characters (`MAX_INPUT_LENGTH`)
- Error responses never leak stack traces (`console.error` + generic message)

## Plugin Conventions

### Manifest (`plugin.json`)
- Required: `name`, `version`, `description`
- Recommended: `author`, `license`, `homepage`, `tags[]`
- Explicit-path format: arrays of relative paths for commands/agents/skills/hooks
- Inline `mcpServers` object for MCP configs (not string arrays)
- Semantic versioning (semver)

### Commands (`commands/*.md`)
- Markdown with YAML frontmatter (`description` field required)
- File/folder name becomes the command name
- Frontmatter: `description`, optional `allowed-tools`, `user-intent`

### Agents (`agents/*.md`)
- Markdown with YAML frontmatter: `name`, `description`, `model`
- Model values: `sonnet`, `haiku`, `claude-3-7-sonnet`

### Skills (`skills/<name>/SKILL.md`)
- Only `name` and `description` in YAML frontmatter
- `name`: max 64 chars, lowercase letters/numbers/hyphens
- `description`: max 1024 chars, third-person, includes "Use when..." triggers
- Body under 500 lines; use `references/` for heavy content
- Directory structure required: `skill-name/SKILL.md`, not standalone `.md`

### Hooks (`hooks/hooks.json`)
- Object format: `{ "hooks": { "PreToolUse": [...], "PostToolUse": [...] } }`
- NOT flat array format (deprecated)
- Shell scripts referenced via `${CLAUDE_PLUGIN_ROOT}/hooks/script.sh`

### MCP Configs (`.mcp.json`)
- `{ "mcpServers": { "name": { "command": "npx", "args": [...], "env": {...} } } }`
- Secrets via `${ENV_VAR}` — never inline credentials

## Git Conventions

- `.env` and `.env.local` in `.gitignore`
- Reports directory: `reports/`
- Temporary files: `temp/` (never committed)
- AGENTS.md is canonical; CLAUDE.md symlinks to it
- GEMINI.md is standalone (platform-specific)
- `.github/copilot-instructions.md` is standalone
