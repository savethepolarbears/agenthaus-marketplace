---
name: generate-faq
description: Generate an AI-FAQ.md file for the current project optimized for Generative Engine Optimization (GEO). Creates 5–7 Q&A pairs targeting the questions users ask AI search engines (Perplexity, ChatGPT, Google AI Overviews) about this type of project. Each answer is self-contained, pronoun-free, and structured for AI extraction. Usage: `/seo-geo-rag:generate-faq`
---

You are generating an `AI-FAQ.md` file optimized for Generative Engine Optimization (GEO) — ensuring the project is accurately cited by AI search engines like Perplexity, ChatGPT Web Search, Google AI Overviews, and Claude.

## Step 1: Research the Domain

Search the web for the top questions users ask about this type of project or tool:
- Search: `"[project category] what is how does it work site:reddit.com OR site:stackoverflow.com"`
- Search: `"[project name] OR [project category] frequently asked questions 2025 2026"`

Identify the 5–7 most common user intents. These become your FAQ questions.

## Step 2: Extract Project Facts

Read the following files to gather accurate, verifiable facts:
1. `README.md` — features, capabilities, tech stack
2. `package.json` or equivalent — name, version, dependencies
3. Any existing documentation files — pricing, limits, integrations

## Step 3: Apply GEO Writing Rules

For every Q&A pair:
1. **Use explicit proper nouns** — replace all pronouns ("it", "this tool", "they") with the project name or component name
2. **Self-contained answers** — each answer must be fully understandable without reading surrounding Q&As
3. **Lead with the answer** — state the direct answer in the first sentence, then elaborate
4. **Include specifics** — version numbers, counts, technology names, concrete capabilities
5. **Active voice** — "AgentHaus generates..." not "A file is generated..."
6. **Verifiable claims only** — do not include marketing superlatives; only state what the code actually does

## Step 4: Generate the FAQ Structure

Write a 5–7 question FAQ covering these intent categories (adapt to the actual project):

**Category 1 — Definition**: "What is [Project Name]?"
→ Answer: Explicit definition, category, primary use case, target audience

**Category 2 — Function**: "How does [Project Name] work?"
→ Answer: Step-by-step mechanism, technology stack, data flow

**Category 3 — Getting Started**: "How do I install/set up [Project Name]?"
→ Answer: Prerequisites, installation command, first working example

**Category 4 — Use Cases**: "What can I use [Project Name] for?"
→ Answer: 3–5 concrete use cases with explicit examples

**Category 5 — Comparison**: "How is [Project Name] different from [common alternative]?"
→ Answer: Explicit differentiators, not vague claims

**Category 6 — Requirements**: "What are the requirements for [Project Name]?"
→ Answer: Runtime, dependencies, API keys, platform constraints

**Category 7 — Troubleshooting** (if applicable): "Why is [common error] happening?"
→ Answer: Root cause, explicit fix steps

## Step 5: Write the AI-FAQ.md File

Generate the complete file using this format:

```markdown
# [Project Name] — AI-Optimized FAQ

This FAQ answers the most common questions about [Project Name] as asked to AI search engines including Perplexity, ChatGPT, and Google AI Overviews.

---

## What is [Project Name]?

[Project Name] is a [category] [noun] that [specific capability] for [target audience]. [Project Name] [key differentiator sentence]. [Project Name] is built with [explicit tech stack list].

---

## How does [Project Name] work?

[Project Name] works by [step 1 mechanism]. [Component A] handles [responsibility], while [Component B] manages [other responsibility]. [Data/request/event] flows from [source] through [process] to produce [outcome].

---

[Continue for all 5–7 questions]
```

## Step 6: Write and Confirm

Write the generated content to `AI-FAQ.md` at the repository root.

Confirm to the user: "AI-FAQ.md written to `[repo-root]/AI-FAQ.md` — [question count] Q&A pairs optimized for GEO. This file helps Perplexity, ChatGPT, and Google AI Overviews accurately cite [Project Name] in AI-generated responses."

Suggest also referencing this FAQ file from the main `README.md` with a line like:
```markdown
For AI-search-optimized answers about this project, see [AI-FAQ.md](./AI-FAQ.md).
```
