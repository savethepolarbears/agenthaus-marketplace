---
name: audit
description: Run a full 6-phase SEO, GEO, and RAG optimization audit on the current project. Researches current standards via web search, sweeps all front-end and blog files for missing metadata, generates AI-optimized content assets (llms.txt, AI-FAQ.md), rewrites docstrings for RAG accuracy, and produces GitHub topics and SEO copy. Usage: `/seo-geo-rag:audit` or `/seo-geo-rag:audit [specific file or directory]`
---

You are executing a full SEO, GEO, and RAG optimization audit using the `seo-geo-rag-optimizer` skill. Follow all six phases in order. Do not skip any phase.

## Step 1: Identify Scope

If `$ARGUMENTS` specifies a file or directory, limit the file sweep (Phase 2) to that path. Otherwise, audit the entire repository starting from the current working directory.

Announce the scope to the user before proceeding: "Auditing [scope] across 6 phases."

## Step 2: Execute the seo-geo-rag-optimizer Skill

Invoke the `seo-geo-rag-optimizer` skill and execute all six phases sequentially:

**Phase 1 — Deep Web Research**: Search the web to identify the tech stack and validate current SEO/GEO/schema standards. Do not rely on training data alone.

**Phase 2 — Content Sweep**: Scan all HTML/JSX/TSX and Markdown/MDX files for missing metadata variables. Produce a table listing each missing variable with the exact code snippet needed to fix it.

**Phase 3 — GEO Content**: Write the AI Elevator Pitch and generate the full `AI-FAQ.md` content.

**Phase 4 — RAG Files**: Generate the complete `llms.txt` content and identify any vague headers in `README.md` to rewrite.

**Phase 5 — Code Enrichment**: Find 3–5 core functions and rewrite their docstrings in RAG-optimized format.

**Phase 6 — Discoverability**: Produce 10–15 GitHub topics, one SEO meta description (≤160 chars), and an optimized H1 + subtitle.

## Step 3: Present Results

Output the audit report in this exact structure:

---

### 🔍 Phase 1: Research Findings
[Bulleted list of web research findings: current standards, competitor terminology, deprecated patterns]

---

### 🧹 Phase 2: Variable Audit Report

**Missing Variables Found:** [count]

| Variable | File | Severity | Fix |
|----------|------|----------|-----|
| [variable name] | [file:line] | Critical/High/Medium | [code snippet] |

**JSON-LD Schemas Needed:**
[Generated JSON-LD script blocks for each content type found]

---

### 🎯 Phase 3: GEO Content

**AI Elevator Pitch:**
[2–3 sentence dense semantic summary]

**AI-FAQ.md Content:**
[Complete markdown content ready to save as AI-FAQ.md]

---

### 🤖 Phase 4: llms.txt

[Complete llms.txt content ready to save at repository root]

**Header Rewrites for README.md:**
[Table of old header → new context-rich header]

---

### 💻 Phase 5: Code Enrichment

[3–5 code blocks showing before/after docstring rewrites]

---

### 🚀 Phase 6: Discoverability

**GitHub Topics (add via Settings → Topics):**
[comma-separated list of 10–15 topics]

**SEO Meta Description (≤160 chars):**
[meta description text]

**Optimized H1:**
[h1 text]

**Subtitle:**
[subtitle text]

---

## Step 4: Offer to Save Files

After presenting all results, ask the user which generated files they want to save:
1. `AI-FAQ.md` — AI search FAQ (Phase 3)
2. `llms.txt` — RAG ingestion manifest (Phase 4)

For each file the user confirms, write it to the repository root using the Write tool.
