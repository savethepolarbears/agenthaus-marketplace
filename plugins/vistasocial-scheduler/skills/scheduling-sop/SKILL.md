---
name: scheduling-sop
description: Enforces timezone rules, first-comment link protocol, labeling conventions, publish-time standards, and pre-scheduling conflict checks via VistaSocial MCP. Use when scheduling social media posts, checking queues, or discussing posting cadence.
---

# Scheduling SOP — VistaSocial Operations

## CRITICAL: Rate Limit Awareness

Every VistaSocial MCP call counts against a **60 requests/minute** hard cap.
Before ANY scheduling operation:
1. Check `x-vs-rate-limit-remaining` from the most recent MCP response header
2. If remaining < 10, slow down — insert 3-second delays between calls
3. If remaining < 5, STOP all MCP calls for 60 seconds
4. Never fire more than 50 MCP calls in a single burst

## Pre-Scheduling Checklist (MANDATORY)

Before scheduling ANY post, always run these steps in order:

1. **Conflict check**: Call `searchPosts` with the target `profile_ids`, `dateFrom`/`dateTo` covering the intended publish window, and `status: ['APPROVED','NEEDS_APPROVAL']` to confirm no overlapping post exists.
2. **Profile ID verification**: Confirm the profile ID matches the intended brand and network. Use the profile-lookup skill or `listProfiles` with `q: "brand name"`.
3. **Timezone validation**: Use the correct timezone and explicit UTC offset (never bare UTC).
4. **First-comment link**: For ALL Greece brand posts and any Facebook link-out post, prepare the `comments` array with the brand-specific URL.
5. **Label format**: Apply labels as a comma-separated string: `brand-name,network,week-of-[date]`.

## Timezone Standards

| Timezone | Brands | UTC Offset (Standard) | UTC Offset (DST) |
|----------|--------|-----------------------|-------------------|
| `Europe/Amsterdam` | All Greece brands, Germany, Amsterdam Local Gems | `+01:00` (CET) | `+02:00` (CEST, late Mar–late Oct) |
| `America/Chicago` | ViaTravelers, Traveleering, World Photo GOAT | `-06:00` (CST) | `-05:00` (CDT, mid Mar–early Nov) |
| `America/New_York` | Kyle Kroeger Personal Brand, The Impact Investor | `-05:00` (EST) | `-04:00` (EDT) |

**Rule**: Always use explicit ISO 8601 offsets in `publish_at`. Example: `2026-04-01T17:03:00+02:00`. Never submit `2026-04-01T17:03:00Z` for a Europe/Amsterdam brand.

**DST boundary**: European clocks change the last Sunday of March and October. US clocks change the second Sunday of March and first Sunday of November. Always check which side of the boundary the publish date falls on.

## Cadence Standards by Brand

### Greece Cluster (Europe/Amsterdam)

| Brand | Facebook | Threads | Instagram |
|-------|----------|---------|-----------|
| **Crete Secrets** | Daily 12:46 | Daily 19:03 | Tue/Thu/Sat/Sun 17:00 |
| **Santorini Secrets** | Daily 14:18 | Daily 17:19 | Mon/Wed/Fri/Sun 18:00 |
| **Mykonos Secrets** | Daily 19:12 | Threads daily 13:13 | Tue/Thu/Fri/Sun 18:01 |
| **Athens Secrets** | TBD (not yet active daily) | Daily 17:03 | TBD |

### Flagship & Other (America/Chicago unless noted)

| Brand | Schedule |
|-------|----------|
| **ViaTravelers** | LinkedIn Tue/Thu 09:00 CT · Instagram Mon/Wed/Fri 11:00 CT · Facebook Tue/Sat 10:00 CT · Threads Mon/Wed/Fri 15:00 CT |
| **Everything About Germany** | Facebook Mon/Wed/Fri 13:00 CET · Instagram Tue/Thu 18:30 CET |
| **Amsterdam Local Gems** | GBP Tue/Fri 09:00 CET · Facebook Tue/Sat 12:15 CET · Instagram Thu/Sat 18:15 CET · Pinterest Mon/Thu 20:00 CET |

## First-Comment Link Protocol

**Rule**: NEVER embed links in the main post body for Greece brands. All traffic-driving links go in the first comment.

**Comment format for `schedulePost`**:
```
comments: ['→ Plan your trip: https://santorinisecrets.com']
```

**Brand domain mapping**:
| Brand | Domain |
|-------|--------|
| Santorini Secrets | santorinisecrets.com |
| Crete Secrets | cretesecrets.com |
| Mykonos Secrets | mykonossecrets.com |
| Athens Secrets | athenssecrets.com |
| ViaTravelers | viatravelers.com |
| Everything About Germany | everythingaboutgermany.com |
| Amsterdam Local Gems | amsterdamlocalgems.com |

## Label Convention

Format: `brand-name,network,week-of-[MMMDD]`

Examples:
- `santorini-secrets,threads,week-of-mar16`
- `crete-secrets,facebook,week-of-mar23`
- `viatravelers,instagram,week-of-apr06`

## `schedulePost` Parameter Reference (Non-Premium)

```
profile_id       — numeric string, e.g., "531212"
network_code     — "facebook", "instagram", "threads", "linkedin", "pinterest", "tiktok", "youtube", "googlebusiness", "reddit", "vistapage"
message          — post body text (no links for Greece brands)
publish_at       — ISO 8601 with explicit UTC offset, e.g., "2026-04-01T17:03:00+02:00"
labels           — comma-separated string, e.g., "athens-secrets,threads,week-of-mar30"
comments         — array of strings for first-comment, e.g., ["→ Explore more: https://santorinisecrets.com"]
```

## `searchPosts` Parameter Reference

```
profile_ids      — array of numeric strings, e.g., ["531212"]
dateFrom         — string "YYYY-MM-DD"
dateTo           — string "YYYY-MM-DD"
status           — array, e.g., ["APPROVED", "NEEDS_APPROVAL"]
timezone         — string, e.g., "Europe/Amsterdam"
```

## Post-Scheduling Verification

After scheduling, confirm the post was created by:
1. Calling `searchPosts` for the target profile and date
2. Verifying the returned post matches the intended message snippet and publish time
3. If a transient auth error occurs on `schedulePost`, retry once with identical parameters before falling back to draft
