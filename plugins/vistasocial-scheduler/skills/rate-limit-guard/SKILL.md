---
name: rate-limit-guard
description: Enforces the hard 60-requests-per-minute VistaSocial rate limit, implements batch pacing, tracks the x-vs-rate-limit-remaining header, and prevents API lockouts. Use when making any VistaSocial MCP tool call or planning batch operations.
---

# Rate Limit Guard — VistaSocial MCP Enforcement

## HARD LIMITS (NON-NEGOTIABLE)

| Rule | Value | Consequence of Violation |
|------|-------|--------------------------|
| **Max requests per minute** | 60 | API returns 429 errors; all calls fail for remainder of minute |
| **Response header to monitor** | `x-vs-rate-limit-remaining` | Shows remaining calls in current minute window |
| **Abort threshold** | remaining < 5 | STOP all MCP calls immediately, wait 60 seconds |
| **Slow-down threshold** | remaining < 10 | Insert 3-second delay between every subsequent call |
| **Burst ceiling** | 50 calls max in rapid succession | Even if limit shows 60, never burst above 50 |

## Batch Scheduling Pacing Protocol

When scheduling multiple posts in sequence (e.g., a week of daily posts):

### Per-Post MCP Call Budget

Each post typically requires 2–3 MCP calls:
1. `searchPosts` — conflict check (~1 call)
2. `schedulePost` — create the post (~1 call)
3. Optional: verify via `searchPosts` (~1 call)

A 7-post weekly batch = ~14–21 MCP calls. Safe within limits if paced.

### Pacing Rules

1. **Between each post's scheduling cycle**: wait 2 seconds minimum
2. **After every 10 MCP calls**: wait 5 seconds
3. **After every 20 MCP calls**: wait 10 seconds and check `x-vs-rate-limit-remaining`
4. **If scheduling more than 14 posts**: split into two batches with a 60-second pause between them

### Emergency Stop Protocol

If at any point during batch scheduling:
- An MCP call returns a 429 status → STOP immediately, wait 60 seconds, then resume
- `x-vs-rate-limit-remaining` is not present in response → assume 30 remaining and proceed cautiously
- A transient auth/server error occurs → retry ONCE after 5 seconds, then skip the post and continue

## MCP Call Counting Reference

| Operation | Typical MCP Calls | Notes |
|-----------|-------------------|-------|
| Look up one profile | 1 | `listProfiles` with query |
| List all profiles in a group | 1 | `listProfilesInGroup` |
| List all profile groups | 1 | `listProfileGroups` |
| Check for scheduling conflicts | 1 | `searchPosts` with date range |
| Schedule one post | 1 | `schedulePost` |
| Schedule one post with first comment | 1 | `schedulePost` with comments array |
| Get optimal publish times | 1 | `getOptimalPublishTimes` |
| Verify a scheduled post | 1 | `searchPosts` post-scheduling |
| Full weekly batch (7 posts) | 14–21 | Conflict check + schedule + verify each |
| Full two-week batch (14 posts) | 28–42 | MUST split into two batches |

## What NOT to Do

- **NEVER** loop through all 47 profiles with individual API calls in one session
- **NEVER** schedule 20+ posts without pacing delays
- **NEVER** ignore a 429 response and retry immediately
- **NEVER** assume the rate limit has reset without waiting a full 60 seconds
- **NEVER** run `searchPosts` with broad date ranges across multiple profiles simultaneously

## Logging Guidance

When performing batch operations, report to the user:
- How many MCP calls have been made so far
- Current `x-vs-rate-limit-remaining` value (if available)
- Estimated remaining calls needed to complete the batch
- Any pauses being taken and why

Example output during batch scheduling:
```
Scheduling post 3/7 for Santorini Secrets Threads...
✓ Conflict check passed (MCP calls: 7/21, rate limit remaining: 48)
✓ Post scheduled for 2026-04-01T17:19:00+02:00
Pausing 2 seconds before next post...
```
