---
name: notfair-google-ads
description: Google Ads agent skills for Claude Code. Use when the user asks to audit a Google Ads account, find wasted spend, clean up search terms, manage keywords, adjust bids, or analyze campaign performance. Connects to live account data via Google Ads MCP.
---

# NotFair Google Ads Skills

Agent skills for Google Ads account management and optimization.
Source: https://github.com/nowork-studio/NotFair/tree/main/google-ads

## Capabilities

- **Account audit** — full performance audit across campaigns, ad groups, and keywords via Google Ads MCP
- **Wasted-spend detection** — identify irrelevant search terms, low-quality keywords, and budget leaks
- **Search-term cleanup** — analyze search term reports and add negative keywords
- **Keyword management** — add, pause, or move keywords across ad groups
- **Bid management** — adjust bids at keyword or ad-group level based on performance data

## MCPs Required

- Google Ads MCP — live campaign, keyword, search term, and spend data

## Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Google Ads MCP authentication error | OAuth error returned | Prompt user to refresh credentials; link to Google Ads MCP setup docs |
| No data returned for date range | Empty GAQL result | Widen the date range; confirm the customer ID is correct |
| Bid change rejected | API validation error | Check keyword status (paused keywords cannot have bids updated); verify bid is within allowed range |
