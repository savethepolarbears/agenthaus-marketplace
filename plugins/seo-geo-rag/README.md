# seo-geo-rag

Six-phase SEO, Generative Engine Optimization (GEO), and RAG optimization skill for Claude Code. Audits any codebase, front-end, or blog for missing metadata, generates `llms.txt` and `AI-FAQ.md`, and makes projects discoverable by Traditional Search, AI search engines, and LLM RAG systems.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | n/a | n/a | n/a | n/a | n/a | n/a |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## What This Plugin Does

The `seo-geo-rag` plugin optimizes your project for three discovery surfaces:

1. **Traditional Search** (Google, Bing, GitHub Search) — audits `<title>`, meta description, canonical URLs, Open Graph tags, Twitter cards, semantic HTML, and JSON-LD structured data
2. **Generative Engine Optimization / GEO** (Perplexity, ChatGPT Web Search, Google AI Overviews, Claude) — generates pronoun-free AI elevator pitches and self-contained FAQ content optimized for AI extraction and citation
3. **RAG & LLM Coding Agents** (Cursor, GitHub Copilot, Windsurf, custom vector databases) — produces `llms.txt` manifests and context-rich docstrings to improve agent comprehension of the repository

## Prerequisites

This plugin requires no external API keys or MCP servers. All optimization uses Claude's built-in web search and file-reading capabilities.

| Requirement | Details |
|---|---|
| Web search | Used in Phase 1 to validate current SEO/GEO standards |
| File access | Used in Phase 2 to scan HTML, TSX, and Markdown files |

## Installation

```bash
/plugin install seo-geo-rag
```

## Usage

### Skill (Autonomous)

The `seo-geo-rag-optimizer` skill activates automatically when you ask Claude to optimize SEO, improve AI search visibility, or generate `llms.txt` / `AI-FAQ.md`. No slash command required.

```
> Make this project discoverable by AI search engines

> Audit our metadata for SEO gaps

> Generate llms.txt for this repository

> Optimize our README for RAG ingestion
```

### Commands (Manual)

#### `/seo-geo-rag:audit`

Run a full 6-phase SEO, GEO, and RAG audit on the current project.

```
/seo-geo-rag:audit
/seo-geo-rag:audit src/app/
```

The audit produces:
- Phase 1 research findings (current standards, competitor terminology)
- Phase 2 variable audit table (missing tags with exact code fixes)
- Phase 3 AI elevator pitch and `AI-FAQ.md` content
- Phase 4 `llms.txt` content and header rewrites
- Phase 5 RAG-optimized docstring examples
- Phase 6 GitHub topics, meta description, and H1 copy

#### `/seo-geo-rag:generate-llms`

Generate a production-ready `llms.txt` at the repository root.

```
/seo-geo-rag:generate-llms
```

The `llms.txt` file helps AI coding agents (Cursor, GitHub Copilot, Windsurf) and vector databases understand the repository's purpose, architecture, and entry points without reading every source file.

#### `/seo-geo-rag:generate-faq`

Generate an `AI-FAQ.md` file with 5–7 GEO-optimized Q&A pairs targeting AI search engine queries.

```
/seo-geo-rag:generate-faq
```

Each Q&A pair is self-contained, uses explicit proper nouns instead of pronouns, and leads with the direct answer — the format most likely to be cited by Perplexity, ChatGPT, and Google AI Overviews.

## Six-Phase Workflow

| Phase | Name | Output |
|---|---|---|
| 1 | Deep Web Research | Current SEO/GEO standards for your tech stack |
| 2 | Content & Variable Sweep | Missing metadata table with code fixes and JSON-LD schemas |
| 3 | GEO Content | AI elevator pitch and `AI-FAQ.md` |
| 4 | RAG Structuring | `llms.txt` and context-rich README headers |
| 5 | Code Enrichment | RAG-optimized docstrings for 3–5 core functions |
| 6 | Discoverability | GitHub topics, SEO meta description, H1 and subtitle |

## Variable Audit Checklist

The plugin checks all of the following during Phase 2:

**HTML/JSX/TSX meta tags:** `<title>`, `meta description`, `canonical`, `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `robots`, `html lang`

**JSON-LD schemas:** `SoftwareApplication`, `BlogPosting`, `TechArticle`, `FAQPage` (matched to actual content type)

**Markdown/MDX frontmatter:** `title`, `description`, `date`, `tags`, `image`, `canonical`

**Semantic HTML:** Single `<h1>`, heading hierarchy, `<main>`, `<nav>`, `<footer>`, `<article>`, `<header>`, descriptive `alt` text

## Architecture

This plugin is a pure skill and command plugin — no MCP servers or external APIs required.

- **`skills/seo-geo-rag-optimizer/SKILL.md`** — Autonomous six-phase optimization workflow invoked by Claude when SEO/GEO/RAG tasks are detected
- **`commands/audit.md`** — Manual `/seo-geo-rag:audit` command for full project audits
- **`commands/generate-llms.md`** — Manual `/seo-geo-rag:generate-llms` command for targeted `llms.txt` generation
- **`commands/generate-faq.md`** — Manual `/seo-geo-rag:generate-faq` command for targeted `AI-FAQ.md` generation

## Research Sources

The Phase 1 web research in this plugin is grounded in the following 2025–2026 GEO and SEO best practices:

- [GEO Best Practices for 2026 — Firebrand](https://www.firebrand.marketing/2025/12/geo-best-practices-2026/)
- [Mastering Generative Engine Optimization in 2026 — Search Engine Land](https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142)
- [Skill Authoring Best Practices — Claude API Docs](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Claude Code Skills Structure — Mikhail Shilkov](https://mikhail.io/2025/10/claude-code-skills/)
- [Structured Data: SEO and GEO Optimization for AI in 2026 — Digidop](https://www.digidop.com/blog/structured-data-secret-weapon-seo)
