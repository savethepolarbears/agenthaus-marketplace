---
description: Analyze a keyword for SEO content optimization — get recommendations, competitor analysis, and content scoring. Usage: `/neuronwriter:analyze 'best project management tools'`
---

# Analyze Keyword

Use this command to perform comprehensive SEO analysis on a target keyword using NeuronWriter's AI-powered analysis engine.

## Full Analysis Workflow

The analysis follows a two-step pattern:

1. **Create Query** — Use `nw_create_query` to initiate analysis with your target keyword
2. **Poll Results** — Use `nw_get_query_data` to retrieve recommendations and competitor insights (may take 10-60 seconds)

## Step 1: Create the Query

Call `nw_create_query` with these parameters:

- **query** — Your target keyword (e.g., "best project management tools")
- **language** — Language code (default: "en", supports 40+ languages)
- **search_engine** — Target engine: "google", "bing", "baidu" (default: "google")
- **domain** (optional) — Target specific domain for analysis

Example:
```
nw_create_query(query="best project management tools", language="en", search_engine="google")
```

This returns a `query_id` immediately.

## Step 2: Poll for Results

Use `nw_get_query_data` with the query_id to check status and retrieve results:

```
nw_get_query_data(query_id=<id>, format="full")
```

**Important**: The query needs time to process. Implement polling:
- Wait 3-5 seconds, then poll
- Retry up to 20 times (max 5 minutes total)
- Check the `status` field: "ready", "processing", or "error"

## Interpreting the Results

Once status is "ready", you'll receive comprehensive data:

### Content Recommendations
- **Recommended Outline** — Suggested heading structure and sections
- **Semantic Terms** — Keywords to naturally incorporate in your content
- **Content Length** — Target word count for competitive ranking
- **Readability Score** — Optimal reading level for the audience

### Competitor Analysis
- **Top 10 Results** — Current ranking content with URL and keyword mentions
- **Coverage Gap** — Terms competitors use that you should include
- **Backlink Profile** — Link authority patterns in top-ranking content
- **Content Type** — Blog post, guide, comparison, product page, etc.

### Content Scoring Factors
- Term frequency and density
- Heading structure alignment
- Semantic relevance
- Content depth and comprehensiveness
- Keyword placement (title, headings, first 100 words)

## Language & Search Engine Options

NeuronWriter supports 40+ languages:
- "en" (English), "es" (Spanish), "fr" (French), "de" (German), "it" (Italian)
- "pt" (Portuguese), "ru" (Russian), "ja" (Japanese), "zh" (Chinese)
- And many more — use language codes per ISO 639-1

Search engines:
- "google" — Most searches
- "bing" — Microsoft ecosystem
- "baidu" — Chinese market

## Next Steps

After analysis:
1. Use `/neuronwriter:content` to import and evaluate your draft content
2. Use the **seo-writer** agent to create optimized content based on recommendations
3. Use `/neuronwriter:publish` to push finalized content to WordPress

## Tips for Better Results

- Use specific, long-tail keywords (3-5 words) for best recommendations
- Analyze keyword before writing to inform your outline
- Re-run analysis for multiple keyword variations to discover ranking opportunities
- Compare analysis across markets/languages for international content strategy
