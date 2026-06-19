# notfair-marketing

Open-source Claude Code agent skills for SEO, GEO, Google Ads, and Meta Ads (~2.9k GitHub stars).
Source: https://github.com/nowork-studio/NotFair

## Skills

- **notfair-seo** — Site analysis, keyword research, meta tags, schema markup, GEO optimization for AI search engines. Requires Google Search Console MCP and Google Analytics (GA4) MCP.
- **notfair-google-ads** — Account audits, wasted-spend detection, search-term cleanup, keyword and bid management. Requires Google Ads MCP.
- **notfair-meta-ads** — Campaign audits, ROAS analysis, creative fatigue detection, audience overlap. Requires Meta Ads MCP.

## MCP Configuration

For Gemini CLI, merge the following into `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "google-ads": {
      "command": "npx",
      "args": ["-y", "@nowork-studio/google-ads-mcp"],
      "env": {
        "GOOGLE_ADS_DEVELOPER_TOKEN": "YOUR_TOKEN",
        "GOOGLE_ADS_CLIENT_ID": "YOUR_CLIENT_ID",
        "GOOGLE_ADS_CLIENT_SECRET": "YOUR_CLIENT_SECRET",
        "GOOGLE_ADS_REFRESH_TOKEN": "YOUR_REFRESH_TOKEN",
        "GOOGLE_ADS_LOGIN_CUSTOMER_ID": "YOUR_CUSTOMER_ID"
      }
    },
    "meta-ads": {
      "command": "npx",
      "args": ["-y", "@nowork-studio/meta-ads-mcp"],
      "env": {
        "META_ACCESS_TOKEN": "YOUR_ACCESS_TOKEN",
        "META_AD_ACCOUNT_ID": "YOUR_ACCOUNT_ID"
      }
    }
  }
}
```

See https://github.com/nowork-studio/NotFair for full setup instructions.
