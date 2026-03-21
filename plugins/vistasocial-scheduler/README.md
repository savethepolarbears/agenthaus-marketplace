# VistaSocial Scheduler Plugin

Social media scheduling and management plugin using the [VistaSocial MCP](https://vistasocial.com/integrations/mcp/) integration. Built for non-premium VistaSocial accounts.

## What This Plugin Does

Turns Claude into a social media operations specialist. Handles post scheduling, content creation, queue auditing, profile management, and rate-limit-safe batch operations through VistaSocial's remote MCP server.

## Available Commands

| Command | Description |
|---------|-------------|
| `/schedule-post` | Schedule a single post with SOP guardrails |
| `/batch-schedule` | Schedule a week of posts with rate-limit pacing |
| `/queue-audit` | Audit scheduled posts for gaps, duplicates, and issues |
| `/content-week` | Plan and generate a full week of content |
| `/profile-lookup` | Find profile IDs, group IDs, and network codes |
| `/optimal-times` | Get best posting times from VistaSocial analytics |

## Skills

| Skill | Purpose |
|-------|---------|
| `scheduling-sop` | Timezone rules, cadence standards, first-comment protocol, labeling |
| `content-creation` | Brand voice, format library, Threads rules, caption SOPs |
| `greece-cluster` | Greece travel brand operations reference (customizable template) |
| `profile-lookup` | VistaSocial profile ID map for zero-API-call lookups |
| `rate-limit-guard` | 60 req/min enforcement, batch pacing, emergency stop |

## Agents

| Agent | Purpose |
|-------|---------|
| `scheduling-agent` | Autonomous post scheduling with pre-flight validation |
| `content-planner` | Weekly content calendar generation |

## Rate Limit Rules

VistaSocial enforces a **60 requests per minute** hard ceiling. This plugin includes:
- Automatic rate limit tracking via `x-vs-rate-limit-remaining` header
- Batch pacing with configurable delays
- Emergency stop when remaining calls < 5
- Never burst above 50 calls

## Non-Premium Account Limitations

These tools require VistaSocial Premium and are **not available**:

| Tool | Reason |
|------|--------|
| `getPostMetrics` | Requires Premium Integrations |
| `getProfileDailyMetrics` | Requires Premium Integrations |
| `createProfileGroup` | Requires Premium plan |
| `searchProfileGroups` | Requires Premium plan |

Use the VistaSocial dashboard for metrics and group management.

## Setup

1. Get your VistaSocial MCP API key: Settings > Account Settings > Integrations > Copy MCP link
2. Set the environment variable:
   ```bash
   VISTASOCIAL_API_KEY=your_api_key_here
   ```
3. Customize the skills under `skills/` with your brand-specific data (profile IDs, posting cadences, timezone rules)

## Customization

The `skills/` directory contains templates with example brand data. To customize for your brands:

1. **profile-lookup**: Replace the profile ID tables with your own VistaSocial profile IDs
2. **scheduling-sop**: Update timezone rules and cadence standards for your brands
3. **greece-cluster**: Replace or rename with your own brand cluster data
4. **content-creation**: Adapt the format library and voice guidelines to your brand

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VISTASOCIAL_API_KEY` | Yes | VistaSocial MCP API key from your account settings |
