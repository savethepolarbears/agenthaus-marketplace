---
name: notfair-seo
description: SEO and GEO agent skills for Claude Code. Use when the user asks to audit a site for SEO, research keywords, optimize meta tags, generate schema markup, improve GEO visibility for AI search engines, or optimize for regional/local search. Connects to live data via Google Search Console MCP and Google Analytics (GA4) MCP.
---

# NotFair SEO & GEO Skills

Agent skills for SEO, Generative Engine Optimization (GEO), and content marketing.
Source: https://github.com/nowork-studio/NotFair/tree/main/seo

## Capabilities

- **Site analysis** — audit on-page SEO, Core Web Vitals signals, and crawlability using Google Search Console MCP
- **Keyword research** — surface high-opportunity queries from Google Search Console MCP and GA4 MCP data
- **Meta tags optimizer** — generate and update title, description, Open Graph, and Twitter Card tags
- **Schema markup generator** — produce JSON-LD structured data for pages, articles, products, and FAQs
- **GEO optimization** — optimize content for AI search engines (Perplexity, ChatGPT, Google AI Overviews)
- **Content writer** — draft SEO-optimized content aligned to keyword intent
- **Geo optimizer** — local and regional SEO signals, hreflang, and location-aware structured data

## MCPs Required

- Google Search Console MCP — impressions, clicks, position data
- Google Analytics (GA4) MCP — traffic, engagement, conversion data

## Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Google Search Console MCP unavailable | Tool call returns error | Fall back to manual URL inspection; prompt user to verify MCP credentials |
| GA4 MCP returns empty data | Empty result set | Check that the property ID is correct and the date range has data |
| Schema markup invalid JSON-LD | Validator rejects output | Re-generate with strict schema.org constraints; test with Google Rich Results Test |
