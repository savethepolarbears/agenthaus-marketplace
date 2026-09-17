---
name: seo-content-pipeline
description: End-to-end SEO content pipeline orchestrating NeuronWriter, TextFocus, MarkupGo, and Outscraper into unified workflows. Use when researching topics, writing SEO-optimized content, generating accompanying visuals, and publishing across the content pipeline.
---

# SEO Content Pipeline

Orchestrate four specialized tools into a seamless content production workflow: from keyword research through content creation, visual asset generation, and publishing.

## Tool Overview

This pipeline combines four MCP servers, each handling a distinct phase:

| Phase | Tool | What it does |
| --- | --- | --- |
| Research | **TextFocus** | Keyword metrics (volume, difficulty, CPC), related keywords, semantic vocabulary |
| Research | **Outscraper** | Competitor reviews, market data, Google search results for real-world context |
| Content | **NeuronWriter** | Content analysis, competitor benchmarking, SEO scoring, WordPress publishing |
| Visuals | **MarkupGo** | Blog headers, social cards, OG images, PDF exports from HTML/Markdown |

## Pipeline Workflows

### Workflow 1: Full Article Pipeline (Research → Write → Visuals → Publish)

This is the complete workflow for producing a fully optimized, illustrated article.

#### Step 1 — Keyword Research (TextFocus)

Start with TextFocus to understand the keyword landscape:

1. `analyze_keyword` — Get volume, difficulty, CPC for your primary keyword
2. `get_related_keywords` — Discover long-tail variations and supporting terms
3. `get_semantic_analysis` — Get the semantic vocabulary search engines associate with this topic

This gives you: a primary keyword with metrics, 10-20 related keywords for internal linking, and a semantic term list for content completeness.

#### Step 2 — Market Context (Outscraper, optional)

For topics where real-world data strengthens the content:

1. `google_search` — See what currently ranks and what angles competitors take
2. `google_maps_search` — For local/business topics, find real businesses to reference
3. `trustpilot_reviews` or `google_maps_reviews` — Mine customer language and pain points for authentic content

#### Step 3 — Content Analysis (NeuronWriter)

Create a NeuronWriter query to get content-specific recommendations:

1. `nw_create_query` — Submit the primary keyword for analysis
2. `nw_get_query_data` — Poll until ready, then review:
   - Recommended terms and their ideal frequency
   - Competitor content structure (headings, word count)
   - Content score targets
3. Write the article incorporating NeuronWriter's recommended terms and TextFocus's semantic vocabulary
4. `evaluate_content` — Score your draft against NeuronWriter's algorithm
5. Iterate until the score exceeds 80%

#### Step 4 — Visual Assets (MarkupGo)

Generate accompanying visuals:

1. `generate_image` — Create a blog header/hero image from HTML
2. `generate_social_asset_pack` — Generate social media cards for promotion (Facebook, Instagram, Pinterest)
3. `generate_pdf` — Optionally create a downloadable PDF version

#### Step 5 — Publish (NeuronWriter)

Push the final content to WordPress:

1. `nw_import_content` — Save the optimized content back to NeuronWriter
2. Use the NeuronWriter CLI orchestrator for WordPress publishing

### Workflow 2: Keyword Research Sprint

When you need to evaluate multiple keyword opportunities quickly:

1. `analyze_keyword` for 5-10 keyword ideas
2. Compare volume vs. difficulty vs. commercial intent (CPC)
3. For top candidates, run `get_related_keywords` to see cluster potential
4. For the winner, run `get_semantic_analysis` to map the topic vocabulary
5. Output: a prioritized keyword target with full semantic briefing

### Workflow 3: Content Refresh

When updating an existing article that has dropped in rankings:

1. `get_page_analysis` (TextFocus) on the live URL to diagnose issues
2. `nw_create_query` (NeuronWriter) for the primary keyword to see current competitor benchmarks
3. Compare live content against current benchmarks — find missing topics and terms
4. Update the content to fill gaps
5. `evaluate_content` (NeuronWriter) to verify the updated draft scores > 80%
6. `generate_image` (MarkupGo) for a fresh hero image
7. Publish updated version

### Workflow 4: Visual Asset Creation

Create a set of visual assets for promoting content across platforms:

1. **MarkupGo** `get_platform_specs` — Get current dimension requirements
2. **MarkupGo** `generate_social_asset_pack` — Generate platform-optimized images
3. **MarkupGo** `transform_social_image` — Fine-tune individual assets if needed

## Tool Selection Guide

Not every task needs all four tools. Here's when to use each:

| Task | TextFocus | NeuronWriter | MarkupGo | Outscraper |
| --- | --- | --- | --- | --- |
| Keyword research | ✅ Primary | — | — | ✅ SERP check |
| Content writing | ✅ Semantic terms | ✅ Primary | — | ✅ Context |
| Content scoring | — | ✅ Primary | — | — |
| Visual assets | — | — | ✅ Primary | — |
| Market research | — | — | — | ✅ Primary |
| Content refresh | ✅ SEO audit | ✅ Scoring | ✅ New images | — |
| Publishing | — | ✅ WordPress | — | — |

## Best Practices

**Start with research, not writing.** The TextFocus semantic analysis and NeuronWriter recommendations should inform what you write, not validate it after the fact. Content that starts from data consistently scores higher.

**Combine semantic sources.** TextFocus gives you the vocabulary search engines associate with a topic. NeuronWriter gives you what top-ranking competitors actually use. Together they provide a more complete picture than either alone.

**Score early and often.** Don't wait until the article is finished to check NeuronWriter scores. Evaluate after drafting the outline, after the first section, and after major revisions. Early scoring catches structural issues before they compound.

**Generate visuals last.** The blog header and social cards should reflect the final content, not a draft. Create them after the content is scored and approved.

**Use Outscraper strategically.** API credits cost money. Use it when real-world data would meaningfully improve the content (local business topics, product comparisons, review-driven content) rather than on every article.

## Environment Variables Required

| Variable | Tool | Required |
| --- | --- | --- |
| `TEXTFOCUS_API_KEY` | TextFocus | Yes (for keyword/semantic analysis) |
| `NEURONWRITER_API_KEY` | NeuronWriter | Yes (for content analysis/scoring) |
| `MARKUPGO_API_KEY` | MarkupGo | Yes (for visual asset generation) |
| `OUTSCRAPER_API_KEY` | Outscraper | Optional (for market research) |

You don't need all four API keys to use the pipeline. Configure the tools you have and the skill will adapt the workflow accordingly.
