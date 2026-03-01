---
name: seo-geo-rag-optimizer
description: Audits and optimizes a repository, codebase, or blog for Traditional Search (Google/Bing), Generative Engine Optimization (GEO, AI search engines like Perplexity and ChatGPT), and LLM RAG ingestion (Cursor, Copilot, custom vector databases). Use when the user asks to optimize SEO, improve AI search visibility, generate llms.txt, create AI-FAQ.md, audit metadata variables, add JSON-LD structured data, or make a project more discoverable by AI systems. Executes six sequential phases: web research, content sweep, GEO content generation, RAG file generation, code enrichment, and discoverability improvement.
---

# SEO, GEO & RAG Optimization Skill

Optimize any repository or codebase for Traditional Search, Generative AI Search (GEO), and LLM RAG ingestion by executing a structured six-phase workflow grounded in live web research.

## Phase 1: Deep Web Research & Landscape Analysis

Before auditing any files, research the latest standards for the tech stack found in the user's context.

1. Identify the tech stack from files in the current repository (framework, language, CMS, deployment target)
2. Search the web for: `"[tech stack] SEO metadata best practices [current year]"` — verify current standards, not training data
3. Search for: `"[domain/industry] competitor SEO GitHub topics keywords"` — identify dominant ranking terminology
4. Search for: `"llms.txt [tech stack] example"` and `"JSON-LD schema [content type] 2025 2026"` — find concrete templates
5. Note any deprecated APIs or patterns found (e.g., `<meta name="keywords">` is obsolete; `twitter:card` still valid but `x:card` not yet standardized)

Record research findings as a bulleted list before moving to Phase 2.

## Phase 2: Content, Front-End & Blog Sweep

Scan all front-end and content files in the repository for missing SEO/GEO variables.

### Files to check
- HTML/JSX/TSX: `<head>` section, `<meta>` tags, `<title>`, semantic landmarks
- Markdown/MDX blog posts: YAML frontmatter fields
- `package.json` / framework config: `name`, `description`, `keywords`, `repository`
- `README.md`: description coverage, headings, keyword density

### Variables to audit (all must be present and non-empty)

**HTML/JSX/TSX meta tags:**
- `<title>` — unique per page, 50–60 characters, primary keyword first
- `<meta name="description">` — 120–160 characters, includes action verb
- `<link rel="canonical">` — absolute URL, prevents duplicate content
- `<meta property="og:title">` — matches `<title>` or is more conversational
- `<meta property="og:description">` — matches meta description
- `<meta property="og:image">` — absolute URL, 1200×630px minimum
- `<meta property="og:url">` — canonical URL of the current page
- `<meta property="og:type">` — `website`, `article`, or `product`
- `<meta name="twitter:card">` — `summary_large_image` recommended
- `<meta name="twitter:title">` — same as og:title
- `<meta name="twitter:description">` — same as og:description
- `<meta name="twitter:image">` — same as og:image
- `<meta name="robots">` — present and not accidentally set to `noindex`
- `<html lang="">` — ISO language code (e.g., `en`, `en-US`)

**JSON-LD Structured Data (inject in `<script type="application/ld+json">`):**
- For software/SaaS: `SoftwareApplication` schema with `applicationCategory`, `operatingSystem`, `offers`
- For blog posts: `BlogPosting` or `TechArticle` with `headline`, `author`, `datePublished`, `dateModified`
- For FAQ pages: `FAQPage` with `mainEntity` array of `Question`/`Answer` pairs
- For documentation: `TechArticle` with `about`, `teaches`, `dependencies`

**Markdown/MDX frontmatter:**
- `title` — page title string
- `description` — 120–160 character summary
- `date` — ISO 8601 format (`YYYY-MM-DD`)
- `tags` — array of relevant keywords
- `image` — social share image path
- `canonical` — canonical URL if published elsewhere

**Semantic HTML checks:**
- Single `<h1>` per page that matches the `<title>`
- Heading hierarchy: `<h1>` → `<h2>` → `<h3>` (no skipped levels)
- Landmark elements: `<main>`, `<nav>`, `<footer>`, `<article>`, `<header>`
- All `<img>` tags have descriptive `alt` text (not empty, not "image")

For each missing variable, generate the exact code snippet needed to fix the gap.

## Phase 3: Generative Engine Optimization (GEO) & AI Context

Produce content assets optimized for AI search engines (Perplexity, ChatGPT, Google AI Overviews, Claude).

### AI Elevator Pitch
Write a 2–3 sentence dense semantic summary of the project that:
- States the project name explicitly (no pronouns like "it" or "this")
- Describes the specific problem the project solves
- Names the target audience (developers, marketers, teams, etc.)
- Lists the core tech stack as explicit proper nouns

### AI-FAQ.md Generation
Generate an `AI-FAQ.md` file with 5–7 Q&A pairs targeting the questions users ask AI engines about this type of project. Format:
```markdown
## What is [Project Name]?
[Project Name] is a [category] tool that [specific function] for [target audience].

## How does [Project Name] work?
[Project Name] uses [technology A] to [action] and [technology B] to [outcome].
```

Rules for GEO-safe content:
- Replace all ambiguous pronouns ("it", "this", "they") with explicit project/tool names
- Each paragraph must be self-contained — meaning is preserved if extracted as a standalone chunk
- Include statistics, version numbers, and specific capability claims where verifiable
- Every Q&A pair must be answerable by an AI without needing surrounding context

## Phase 4: RAG & LLM Ingestion Structuring

Generate files that help AI coding agents (Cursor, GitHub Copilot, Windsurf) and vector databases understand the repository.

### llms.txt Generation
Create an `llms.txt` file at the repository root with this structure:
```
# [Project Name]

> [One-line elevator pitch — what it is and who it's for]

[2–3 paragraph description: purpose, architecture, key differentiators]

## Core Concepts

- **[Concept A]**: [Explicit definition with no pronouns]
- **[Concept B]**: [Explicit definition]

## Architecture

[Semantic directory tree with one sentence per entry]

## Entry Points

- Main: [path/to/main-file]
- Config: [path/to/config]
- API: [path/to/api-or-routes]

## Quick Start

[Minimal working example using actual file paths from the repo]

## Optional

- [Link to detailed docs]
- [Link to API reference]
```

### Context-Rich Headers
Rewrite any vague section headers found in `README.md` to be self-describing:
- "Setup" → "Setup Instructions for [Project Name] using [Framework] on [Platform]"
- "Usage" → "How to Use [Project Name]: Commands and Examples"
- "API" → "[Project Name] API Reference: Endpoints, Parameters, and Response Shapes"

## Phase 5: Code-Level Semantic Enrichment

Improve code documentation for RAG retrieval accuracy.

### RAG-Optimized Docstring Pattern
For each core function or class identified, rewrite docstrings to include:
1. **Purpose**: One sentence explaining what the function does in business terms
2. **Parameters**: Explicit types and what each value represents
3. **Returns**: Explicit type and what the value means in context
4. **Business Logic**: Any non-obvious decision the function makes and why
5. **Edge Cases**: Known inputs that produce unexpected but valid behavior

Example transformation:
```typescript
// Before (RAG-hostile):
// Gets the thing
function getThing(id) { ... }

// After (RAG-optimized):
/**
 * Fetches a Plugin record from the AgentHaus marketplace database by its unique identifier.
 *
 * @param id - UUID string identifying the Plugin in the `plugins` table
 * @returns Plugin object with all metadata fields, or null if no matching record exists
 * @business-logic Returns null (not throws) when id is valid UUID but record is absent,
 *   allowing callers to handle missing plugins gracefully without try/catch
 * @edge-case Malformed UUIDs (non-v4 format) will throw a DatabaseError from the ORM layer
 */
function getPlugin(id: string): Plugin | null { ... }
```

Identify 3–5 core functions in the scanned files and provide rewritten docstrings.

## Phase 6: Traditional SEO & GitHub Discoverability

### GitHub Topics & Keywords
Generate 10–15 GitHub repository topics (lowercase, hyphen-separated, max 50 chars each) based on:
- Core technology stack (e.g., `nextjs`, `typescript`, `postgres`)
- Problem domain (e.g., `seo`, `ai-search`, `rag`)
- Audience (e.g., `developer-tools`, `claude-code`)
- Use case verbs (e.g., `code-generation`, `content-optimization`)

### SEO Meta Description (160 characters max)
Format: `[Action verb] [Project Name] — [primary capability] for [target audience]. [Differentiator or tech stack].`
Example: `Optimize any codebase for AI search with AgentHaus SEO-GEO-RAG — metadata audits, llms.txt generation, and JSON-LD schemas for developers.`

### SEO-Optimized H1 & Subtitle
- **H1**: Primary keyword phrase + brand name, targeting developer search intent (how-to, tool, guide)
- **Subtitle**: Secondary keyword phrase expanding on H1, includes audience and technology terms

## Quick Reference

| Phase | Action | Key Output |
|-------|--------|------------|
| 1 | Web research on tech stack + GEO standards | Bulleted findings list |
| 2 | Scan HTML/MD/TSX for missing variables | Code snippets to fix each gap |
| 3 | Write AI elevator pitch + FAQ | `AI-FAQ.md` file content |
| 4 | Generate RAG ingestion files | `llms.txt` + context-rich headers |
| 5 | Rewrite docstrings for RAG accuracy | 3–5 annotated function examples |
| 6 | Produce SEO keywords + meta copy | GitHub topics, H1, meta description |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping web research and relying on training data | Always search for current-year standards before auditing — schema formats change |
| Generating generic JSON-LD not matched to the actual content type | Identify the Schema.org type from the page content first, then generate the schema |
| Writing FAQ answers with pronouns ("It does X") | Replace every pronoun with the explicit project name ("AgentHaus SEO-GEO-RAG does X") |
| Creating llms.txt with vague headers like "Overview" | Every header must be self-describing when read in isolation by an AI agent |
| Auditing only the home page | Check all unique page templates (blog post, product, landing page, docs) |
| Reporting missing variables without providing the fix | Always generate the exact corrected code snippet alongside each finding |
