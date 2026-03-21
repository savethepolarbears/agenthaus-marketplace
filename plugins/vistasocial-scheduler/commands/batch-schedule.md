---
description: >
  Schedule a full week (or custom range) of posts for a brand with rate-limit
  pacing and batch safety. Use when scheduling 3+ posts at once for a single
  brand or across the Greece cluster.
allowed-tools: VistaSocial:schedulePost, VistaSocial:searchPosts, VistaSocial:listProfiles, VistaSocial:getOptimalPublishTimes
---

# Batch Schedule Posts

Schedule multiple posts with rate-limit-safe pacing. This command enforces all scheduling SOPs automatically.

## Step 1: Define the Batch

Collect from the user:
- **Brand name(s)** — single brand or multiple (e.g., "all Greece Threads")
- **Date range** — start and end dates (e.g., "March 30 – April 5")
- **Network(s)** — which platforms to schedule for
- **Content** — either provided by user or to be generated (invoke `content-creation` skill)

## Step 2: Calculate MCP Budget

Count the total posts to schedule, then estimate MCP calls:
- Per post: ~3 calls (conflict check + schedule + verify)
- Total budget = posts × 3

**Safety rules**:
| Total Posts | Batching Strategy |
|-------------|-------------------|
| 1–7 | Single batch, 2-second delays between posts |
| 8–14 | Single batch, 3-second delays, pause 10s after every 5 posts |
| 15–20 | Split into 2 batches with 60-second pause between them |
| 21+ | Split into 3+ batches, 60-second pause between each |

Report the plan to the user before executing:
```
Batch plan: 7 posts for Santorini Secrets Threads (Mar 30 – Apr 5)
Estimated MCP calls: ~21
Pacing: 2-second delays, single batch
Proceed? (y/n)
```

## Step 3: Pre-Flight Conflict Scan

Run ONE `searchPosts` call covering the entire date range:
```
profile_ids: ["<target_profile_id>"]
dateFrom: "<start_date>"
dateTo: "<end_date>"
status: ["APPROVED", "NEEDS_APPROVAL"]
timezone: "<brand_timezone>"
```

Parse results and flag any dates that already have scheduled posts. Present conflicts to the user before continuing.

## Step 4: Execute Scheduling Loop

For each post in the batch:

1. **Validate content** — confirm message text, check character count for Threads (<500)
2. **Build parameters** — profile_id, network_code, message, publish_at (with correct offset), labels, comments
3. **Call `schedulePost`** — capture response
4. **Log result** — report success/failure with rate limit remaining
5. **Pace** — wait the required delay before next post

Progress reporting format:
```
[1/7] ✓ Mar 30 17:19 CEST — "The Acropolis now requires timed entry..."
      Rate limit remaining: 52 | Next post in 2s...
[2/7] ✓ Mar 31 17:19 CEST — "Skip the Plaka tourist traps..."
      Rate limit remaining: 49 | Next post in 2s...
```

## Step 5: Emergency Protocols

During batch execution:
- **Rate limit remaining < 10**: Increase delay to 5 seconds between posts
- **Rate limit remaining < 5**: STOP batch, wait 60 seconds, then resume
- **429 error**: STOP batch, wait 60 seconds, report which posts completed
- **Auth/server error on a post**: Skip that post, log it, continue with remaining posts
- **3 consecutive failures**: ABORT entire batch, report status

## Step 6: Batch Summary

After completion, report:
```
Batch Complete: Santorini Secrets Threads (Mar 30 – Apr 5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Scheduled: 7/7
✗ Failed: 0
⚡ MCP calls used: 19
🏷️ Labels: santorini-secrets,threads,week-of-mar30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If any posts failed, list them with error details so the user can retry individually with `/schedule-post`.
