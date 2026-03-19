# Coding Conventions

> Generated: 2026-03-19 | Source: GSD Map-Codebase

## TypeScript (Web App)

- **Strict mode** enabled (`strict: true` in tsconfig.json)
- **Target:** ES2022
- **Module resolution:** Bundler
- **Path aliases:** `@/*` → `./src/*`
- **JSX:** `react-jsx` (no React import needed)
- **Naming:**
  - PascalCase for components and interfaces (`PluginCard`, `StaticPlugin`)
  - camelCase for variables and functions (`getPlugins`, `installCount`)
  - kebab-case for file names (`plugin-card.tsx`, `rate-limit.ts`)
- **Exports:** Default exports for page components, named exports for utilities and types
- **Imports:** Named imports, grouped external → internal

## CSS

- Tailwind CSS 4.0 utility classes inline — no separate CSS module files
- Single `globals.css` for base styles and custom properties
- No CSS-in-JS libraries

## Components

- React functional components with TypeScript interfaces for props
- Lucide React for all icons (no other icon libraries)
- `clsx` for conditional class name composition

## Plugin Files

- **Manifest:** JSON at `.claude-plugin/plugin.json` with `name`, `version`, `description` (required)
- **Commands:** Markdown with YAML frontmatter (`description` field required)
- **Agents:** Markdown with YAML frontmatter (`name`, `description`, `model` fields)
- **Skills:** Markdown at `skills/<name>/SKILL.md` with YAML frontmatter (`name`, `description`)
- **Hooks:** JSON with `{ "hooks": { "PreToolUse": [...], "PostToolUse": [...] } }` object format
- **Naming:** kebab-case for plugin directories
- **Versioning:** Semantic versioning (semver)

## Security

- Never hardcode secrets — use `${ENV_VAR}` interpolation in MCP configs
- Use `${CLAUDE_PLUGIN_ROOT}` for plugin-local script references
- CSP computed once at module load in middleware
- Security headers split: static in `next.config.mjs`, dynamic in `middleware.ts`

## Database

- Neon SQL tagged-template client (`neon()`)
- Graceful fallback to static data when `DATABASE_URL` is unset
- `SERIAL PRIMARY KEY` for all tables
- `TIMESTAMPTZ` with `DEFAULT NOW()` for temporal columns
- GIN index on `tags` array column

## Git

- `.env` and `.env.local` in `.gitignore`
- Reports go to `reports/` directory
- Temporary files go to `temp/` (never committed)
