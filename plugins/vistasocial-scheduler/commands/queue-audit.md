---
description: >
  Audit scheduled posts for a brand and date range. Detects gaps in the
  publishing cadence, duplicate posts, missing first-comment links, incorrect
  timezones, and label inconsistencies. Use to verify the queue before a week
  starts or to find scheduling pipeline gaps.
allowed-tools: VistaSocial:searchPosts, VistaSocial:listProfiles, VistaSocial:listPosts
---

# Queue Audit

Inspect the scheduling queue for a brand and surface problems before they go live.

## Step 1: Define Audit Scope

Collect from the user:
- **Brand name** (or "all Greece" for cluster-wide audit)
- **Date range** (default: next 7 days if not specified)
- **Network filter** (optional — e.g., "threads only")

## Step 2: Pull Scheduled Posts

For each profile in scope, call `searchPosts`:
```
profile_ids: ["<profile_id>"]
dateFrom: "<start_date>"
dateTo: "<end_date>"
status: ["APPROVED", "NEEDS_APPROVAL"]
timezone: "<brand_timezone>"
```

**Rate limit note**: For a full Greece cluster audit (4 brands × 3 networks = 12 profiles), this could be up to 12 MCP calls. Batch profiles from the same group where possible, or run sequentially with 1-second delays.

## Step 3: Analyze Against Cadence Standards

Compare the retrieved posts against the brand's expected cadence from the `scheduling-sop` skill.

Check for:

### Gaps
- Missing days where a daily post is expected (e.g., Santorini Threads should post every day)
- Missing scheduled days for non-daily cadences (e.g., Crete Instagram on Tue/Thu/Sat/Sun)

### Duplicates
- Two posts scheduled for the same profile at the same time or within 30 minutes

### Timing Errors
- Posts scheduled at wrong times (not matching brand standard)
- Posts with incorrect timezone offsets (e.g., +01:00 when it should be +02:00 for CEST)

### Content Issues
- Posts without first-comment links (for Greece brands)
- Posts with links embedded in the message body (should be comment-only for Greece)
- Threads posts exceeding 500 characters

### Label Issues
- Missing labels
- Incorrect label format (should be `brand-name,network,week-of-<date>`)

## Step 4: Generate Audit Report

Present findings in a clear table:

```
Queue Audit: Santorini Secrets Threads (Mar 30 – Apr 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Expected posts: 7 (daily)
Found posts:    5

✓ Mar 30 17:19 CEST — "The caldera walk is free..."
✓ Mar 31 17:19 CEST — "Skip the Plaka tourist traps..."
✗ Apr 01 — MISSING (gap)
✓ Apr 02 17:19 CEST — "Fira to Oia sunset hike..."
✗ Apr 03 — MISSING (gap)
✓ Apr 04 17:19 CEST — "Best bakery in Oia..."
✓ Apr 05 17:19 CEST — "Ferry booking hack..."

Issues Found:
⚠️ 2 gaps on Apr 01, Apr 03
✓ All posts have first-comment links
✓ All posts under 500 characters
✓ Labels consistent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Step 5: Recommend Actions

For each issue found, suggest a fix:
- **Gaps**: Offer to generate content and schedule for missing dates using `/schedule-post`
- **Duplicates**: Identify which to keep and offer to flag the other for removal in VistaSocial dashboard
- **Timing errors**: Offer to note the correct time for manual correction (MCP does not support post editing)
- **Content issues**: Offer to draft corrected content

Note: VistaSocial MCP does not currently expose a `deletePost` or `updatePost` tool for non-premium accounts. Manual fixes must be done in the VistaSocial dashboard.
