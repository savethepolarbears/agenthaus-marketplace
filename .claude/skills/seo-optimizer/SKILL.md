---
name: seo-optimizer
description: Analyzes, copy-edits, and SEO-optimizes written content and software codebases using 2026 search engine algorithms and conversion-focused copywriting. Use when the user asks to SEO optimize content, audit a page or site for search visibility, improve meta tags or schema markup, fix Core Web Vitals, rewrite copy for clarity and ranking, generate JSON-LD structured data, or run a technical SEO audit on a Next.js, React, Astro, or HTML codebase.
---

# SEO Optimizer

Autonomous SEO analysis and optimization for content and codebases.

## Decision matrix — read supporting files as needed

| Task type | Load these files |
|---|---|
| Content rewrite, copy editing, keyword strategy | [content-seo.md](content-seo.md) |
| HTML/JSX/TSX audits, meta tags, Core Web Vitals | [technical-seo.md](technical-seo.md) |
| Schema markup, JSON-LD generation | [schema-templates.json](schema-templates.json) |
| Full-site audit (content + code + schema) | All three files |

## Execution workflow

Copy this checklist and track progress:

```
SEO Optimization Progress:
- [ ] Step 1: Classify the request (content / technical / schema / full-audit)
- [ ] Step 2: Load required supporting files
- [ ] Step 3: Ultrathink — analyze scope and form an optimization plan
- [ ] Step 4: Execute optimizations directly on files
- [ ] Step 5: Output a structured changelog
```

### Step 1 — Classify

Determine what the user wants:

- **Content**: Rewriting copy, editing headlines, fixing keyword density, improving meta descriptions, eliminating AI-speak.
- **Technical**: Auditing HTML/JSX/TSX for semantic structure, meta tags, Open Graph, lazy-loading, LCP, INP, CLS.
- **Schema**: Generating or validating JSON-LD structured data.
- **Full audit**: All of the above applied to an entire page, route, or codebase.

### Step 2 — Load supporting files

Read only what you need (progressive disclosure):

```bash
# Content optimization
cat .claude/skills/seo-optimizer/content-seo.md

# Technical SEO audit
cat .claude/skills/seo-optimizer/technical-seo.md

# Schema generation
cat .claude/skills/seo-optimizer/schema-templates.json
```

### Step 3 — Ultrathink

Before touching any file, ultrathink through the full optimization scope:

- What is the primary keyword / search intent?
- Which E-E-A-T signals are missing?
- What Core Web Vitals issues exist?
- Which schema types apply?
- What is the blast radius of changes (single file vs. multiple routes)?

Form a ranked list of optimizations ordered by impact-to-effort ratio.

### Step 4 — Execute

Apply changes directly to source files using Edit or Write tools. Never produce a diff without applying it. For each file touched:

1. Read the file first — understand existing structure before modifying.
2. Apply changes per the loaded checklist.
3. Validate: no keyword stuffing, no broken HTML tags, valid JSON-LD.

### Step 5 — Output a structured changelog

After all edits, always output a changelog in this format:

```markdown
## SEO Optimization Changelog

### Files Modified
- `path/to/file.tsx` — [summary of changes]

### Improvements Made
| Category | Before | After |
|---|---|---|
| Title tag | 78 chars, no keyword | 58 chars, primary keyword in position 1 |
| Meta description | Missing | 142 chars, includes CTA |
| H1 | Generic headline | Keyword-forward, BLUF structure |
| Schema | None | Article + BreadcrumbList JSON-LD added |
| Semantic HTML | <div> wrappers | <article>, <nav>, <main> |
| LCP image | No preload | <link rel="preload"> added |

### Estimated Impact
- **Crawlability**: [improvement note]
- **CTR**: [improvement note]
- **E-E-A-T signals**: [improvement note]
```

## Key constraints

- **Never keyword-stuff.** Natural density: primary keyword 1–2% of body copy.
- **Never hallucinate schema.** Use templates from `schema-templates.json` only.
- **Never shorten content below 300 words** for primary landing pages.
- **Always preserve existing functionality** — SEO changes must not break components, routing, or data fetching.
- **Title tags ≤ 60 chars. Meta descriptions ≤ 155 chars.**
- **Validate JSON-LD** — all schema must be syntactically correct JSON.
