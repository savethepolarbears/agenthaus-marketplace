---
description: >
  Schedule a single social media post to VistaSocial with full SOP enforcement.
  Handles timezone validation, first-comment links, label formatting, conflict
  detection, and rate-limit awareness. Use when scheduling one post at a time.
allowed-tools: mcp__plugin_vistasocial-scheduler_vistasocial__createOrUpdatePost, mcp__plugin_vistasocial-scheduler_vistasocial__listPosts, mcp__plugin_vistasocial-scheduler_vistasocial__findProfiles, mcp__plugin_vistasocial-scheduler_vistasocial__getOptimalPublishTimes
---

# Schedule a Single Post

Follow this exact workflow for every post. Do not skip steps.

## Step 1: Gather Required Information

Collect from the user (or infer from context):

- **Brand name** (e.g., "Brand Alpha")
- **Network** (e.g., "threads", "facebook", "instagram")
- **Post content** (the caption/message text)
- **Publish date and time** (or use the brand's standard cadence time)
- **Week label** (e.g., "week-of-mar30")

If any of these are missing, ask the user before proceeding.

## Step 2: Resolve Profile ID

Look up the profile ID from the `profile-lookup` skill first. Only call `findProfiles` via MCP if the profile is not in the reference table.

## Step 3: Determine Correct Timezone Offset

1. Identify the brand's timezone from the `scheduling-sop` skill
2. Determine whether the publish date falls in standard time or DST
3. Construct the `publish_at` value with the correct explicit UTC offset

Example: Brand Alpha Threads on April 1, 2026 → `2026-04-01T17:19:00+02:00` (CEST)

## Step 4: Run Conflict Check

Call `listPosts` with:

```yaml
profile_ids: ["<target_profile_id>"]
dateFrom: "<publish_date>"
dateTo: "<publish_date>"
status: ["SCHEDULED", "IN_REVIEW"]
timezone: "<brand_timezone>"
```

If a post already exists at the target time, **STOP and alert the user**. Do not overwrite.

## Step 5: Prepare First-Comment Link (If Applicable)

For cluster brand posts or any post using first-comment protocol:

```yaml
comments: ["→ Explore more: https://<brand-domain>.example.com"]
```

Use the domain mapping from the `scheduling-sop` skill.

## Step 6: Build Tags

Format: `["brand-name", "network", "week-of-<date>"]`

Example: `["brand-alpha", "threads", "week-of-mar30"]`

## Step 7: Schedule the Post

Call `createOrUpdatePost` with all parameters:

```yaml
profile_id: <numeric_id>
message: "<post_content>"
publish_at: "<ISO_8601_with_offset>"
timezone: "<IANA_timezone>"
tags: ["<brand>", "<network>", "week-of-<date>"]
customization: { comments: [{ message: "<first_comment>" }] }  (if applicable)
```

## Step 8: Confirm Success

Report to the user:

- ✓ Brand and network
- ✓ Scheduled date/time with timezone
- ✓ First-comment link (if added)
- ✓ Tags applied
- ✓ Rate limit remaining (from response header if available)

## Error Handling

- **Transient auth error**: Retry once with identical parameters after 5 seconds
- **429 rate limit**: Stop immediately, wait 60 seconds, then retry
- **Profile not found**: Verify profile ID with `findProfiles` query
- **Any other error**: Report the full error to the user, do not retry silently
