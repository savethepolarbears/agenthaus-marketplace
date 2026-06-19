# notfair-marketing

Open-source Claude Code agent skills for SEO, GEO, Google Ads, and Meta Ads. Connects to live marketing data via Google Ads MCP, Meta Ads MCP, Google Search Console MCP, and Google Analytics (GA4) MCP.

Source: [nowork-studio/NotFair](https://github.com/nowork-studio/NotFair) — MIT license, ~2.9k GitHub stars.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Skills | full | full | full | full | full | n/a |
| MCP | full | n/a | full | full | n/a | full |
| Commands | n/a | n/a | n/a | n/a | n/a | n/a |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Skills

### [notfair-seo](./skills/notfair-seo/SKILL.md)

SEO and GEO optimization for Claude Code. Site analysis, keyword research, meta tags, schema markup, content writing, and GEO optimization for AI search engines. Uses Google Search Console MCP and Google Analytics (GA4) MCP.

### [notfair-google-ads](./skills/notfair-google-ads/SKILL.md)

Google Ads account management skills. Account audits, wasted-spend detection, search-term cleanup, keyword and bid management. Uses Google Ads MCP.

### [notfair-meta-ads](./skills/notfair-meta-ads/SKILL.md)

Meta Ads (Facebook + Instagram) skills. Campaign audits, ROAS analysis, creative fatigue detection, and audience overlap analysis. Uses Meta Ads MCP.

## Prerequisites

| Skill | Required MCPs | Environment Variables |
|-------|--------------|----------------------|
| notfair-seo | Google Search Console MCP, Google Analytics (GA4) MCP | See NotFair repo for setup |
| notfair-google-ads | Google Ads MCP | `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID` |
| notfair-meta-ads | Meta Ads MCP | `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` |

## Installation

```bash
/plugin install notfair-marketing@AgentHaus
```

Or install directly from the source repo:

```bash
/plugin add https://github.com/nowork-studio/NotFair
```

## Usage

After installation, Claude automatically applies the relevant skill based on what you ask:

```
> Audit my Google Ads account for wasted spend
> Research keywords for our product landing page
> Analyze ROAS across my Meta ad campaigns
> Generate schema markup for this blog post
> What are our top-performing search terms this month?
```

## License

MIT — [nowork-studio/NotFair](https://github.com/nowork-studio/NotFair)
