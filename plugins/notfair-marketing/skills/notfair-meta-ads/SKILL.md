---
name: notfair-meta-ads
description: Meta Ads (Facebook and Instagram) agent skills for Claude Code. Use when the user asks to audit Meta ad campaigns, analyze ROAS, detect creative fatigue, identify audience overlap, or review ad set performance. Connects to live account data via Meta Ads MCP.
---

# NotFair Meta Ads Skills

Agent skills for Meta Ads (Facebook + Instagram) account management and optimization.
Source: https://github.com/nowork-studio/NotFair/tree/main/meta-ads

## Capabilities

- **Campaign audit** — full performance review across campaigns, ad sets, and ads via Meta Ads MCP
- **ROAS analysis** — surface campaigns and ad sets by return on ad spend, identify underperformers
- **Creative fatigue detection** — flag ads with declining CTR or frequency-driven performance drops
- **Audience overlap** — identify overlapping audiences across ad sets that cause internal competition

## MCPs Required

- Meta Ads MCP — live campaign, ad set, ad, and insights data from the Meta Marketing API

## Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Meta Ads MCP token expired | Graph API auth error | Prompt user to regenerate long-lived access token |
| Insights data delayed | Metrics show zeros for recent days | Use a date range ending 2 days before today; Meta insights have a 48-hour attribution delay |
| Ad account not found | "Invalid ad account" error | Confirm the account ID includes the act_ prefix |
