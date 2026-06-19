# notfair-marketing

Open-source Claude Code agent skills for SEO, GEO, Google Ads, and Meta Ads (~2.9k GitHub stars).
Source: https://github.com/nowork-studio/NotFair

## Skills

- **notfair-seo** — Site analysis, keyword research, meta tags, schema markup, GEO optimization for AI search engines. Requires Google Search Console MCP and Google Analytics (GA4) MCP.
- **notfair-google-ads** — Account audits, wasted-spend detection, search-term cleanup, keyword and bid management. Requires Google Ads MCP.
- **notfair-meta-ads** — Campaign audits, ROAS analysis, creative fatigue detection, audience overlap. Requires Meta Ads MCP.

## Platform Limitations

MCP-dependent skills (notfair-google-ads, notfair-meta-ads, notfair-seo) require MCP runtime support. On Codex CLI and Windsurf, MCP tools are unavailable — skills will operate in a limited, read-only advisory mode without live account data.
