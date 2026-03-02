---
description: TypeScript, React, and Next.js conventions for the web storefront
activation: glob
glob: "agenthaus-web/**"
---

# Web Development Rules

Standards for the `agenthaus-web/` Next.js storefront application.

## TypeScript

- Strict mode enabled (`strict: true`, target ES2022)
- Path aliases: `@/*` maps to `./src/*`
- Explicit interfaces for component props and data structures
- Named imports from packages, grouped: external → internal

## React & Next.js

- Functional components only with TypeScript interfaces
- Default exports for page components, named exports for utilities
- Server Components by default; add `"use client"` only when needed
- Use Next.js 16 App Router conventions

## Styling

- Tailwind CSS 4 utility classes inline — no separate CSS files
- Icons: Lucide React library exclusively
- Double quotes for JSX string attributes
- PascalCase for components/interfaces, camelCase for variables/functions, kebab-case for files

## Build & Lint

- `npm run lint` must pass before committing
- `npm run build` must succeed with placeholder `DATABASE_URL`
- No `any` types without explicit justification in a comment
