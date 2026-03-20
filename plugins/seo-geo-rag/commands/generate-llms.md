---
name: generate-llms
description: Generate a production-ready llms.txt file for the current repository to improve RAG ingestion by AI coding agents (Cursor, GitHub Copilot, Windsurf) and vector databases. Reads the project structure and README, then produces a structured manifest at the repository root. Usage: `/seo-geo-rag:generate-llms`
---

You are generating an `llms.txt` file for the current repository to maximize AI agent and RAG system comprehension of the codebase.

## Step 1: Gather Repository Context

Read the following files to understand the project:
1. `README.md` — extract project name, description, and architecture
2. `package.json` or equivalent manifest — extract name, description, version, dependencies
3. Top-level directory listing — identify main folders and entry points
4. Any existing `llms.txt` or `ARCHITECTURE.md` — if found, use as base and update

## Step 2: Identify Core Entry Points

Find the main entry files based on framework conventions:
- Next.js: `src/app/layout.tsx`, `src/app/page.tsx`, `next.config.*`
- Node/Express: `src/index.ts`, `src/server.ts`, `app.ts`
- Python: `main.py`, `app.py`, `__init__.py`
- Generic: `src/index.*`, `index.*`

## Step 3: Build the Semantic Directory Map

Read the top-level directory structure and write one sentence per folder/file describing its purpose in business terms — not technical terms.

Format:
```
- `src/app/` — Next.js App Router pages and layouts for the AgentHaus storefront
- `src/components/` — Reusable React UI components shared across all pages
- `plugins/` — 23 production-ready Claude Code plugin packages
```

## Step 4: Write the llms.txt File

Generate the complete file content in this structure:

```markdown
# [Project Name]

> [One-sentence elevator pitch: what it is, who it's for, and what problem it solves]

[Paragraph 1: Detailed description of the project's purpose and primary use case. Use explicit proper nouns — no pronouns.]

[Paragraph 2: Architecture overview. How the main components relate to each other. Name each component explicitly.]

[Paragraph 3: Key differentiators. What makes this project distinct from alternatives in its category.]

## Core Concepts

- **[Concept Name]**: [Definition using explicit noun references, not "it" or "this"]
- **[Concept Name]**: [Definition]

## Architecture

[Semantic directory tree — one sentence per entry, written in business language]

## Entry Points

- Main: `[path/to/main-entry]` — [what this file does]
- Config: `[path/to/config]` — [what this file configures]
- API/Routes: `[path/to/api]` — [what endpoints or routes this defines]

## Quick Start

```bash
[minimal working example to run or use the project]
```

## Key Files

| File | Purpose |
|------|---------|
| `[path]` | [business-language description] |

## Optional

- [Documentation URL if available]
- [API reference URL if available]
- [Contributing guide if present]
```

Rules for llms.txt content:
- Replace all ambiguous pronouns with explicit project and component names
- Every section must be self-contained — readable in isolation by an AI agent
- Include actual file paths from the repository (not placeholders)
- Version numbers and dates should reflect the current repository state
- Keep total file length under 2,000 words for optimal RAG chunking

## Step 5: Write and Confirm

Write the generated content to `llms.txt` at the repository root.

Confirm to the user: "llms.txt written to `[repo-root]/llms.txt` — [word count] words, [section count] sections. AI coding agents (Cursor, Copilot, Windsurf) will use this file to understand the repository architecture."

Suggest adding `llms.txt` to the repository root and committing it so AI search crawlers and coding agent context loaders can discover it automatically.
