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
4. **First-comment link**: For cluster brand posts and any Facebook link-out post, prepare the `comments` array with the brand-specific URL.
5. **Label format**: Apply labels as a comma-separated string: `brand-name,network,week-of-[date]`.

## Timezone Standards

| Timezone | Example Brands | UTC Offset (Standard) | UTC Offset (DST) |
| ---------- | ---------------- | ----------------------- | ------------------- |
| `Europe/Amsterdam` | European Cluster Brands, Regional Portals | `+01:00` (CET) | `+02:00` (CEST, late Mar–late Oct) |
| `America/Chicago` | Central US Brands, Travel & Lifestyle Portals | `-06:00` (CST) | `-05:00` (CDT, mid Mar–early Nov) |
| `America/New_York` | Eastern US Brands, Editorial & Finance | `-05:00` (EST) | `-04:00` (EDT) |

**Rule**: Always use explicit ISO 8601 offsets in `publish_at`. Example: `2026-04-01T17:03:00+02:00`. Never submit bare `2026-04-01T17:03:00Z` for an offset brand.

**DST boundary**: European clocks change the last Sunday of March and October. US clocks change the second Sunday of March and first Sunday of November. Always verify which side of the boundary the publish date falls on.

## Cadence Standards (Example Reference)

### Regional Cluster (Europe/Amsterdam)

| Brand | Facebook | Threads | Instagram |
| ------- | ---------- | --------- | ----------- |
| **Brand Beta** | Daily 12:46 | Daily 19:03 | Tue/Thu/Sat/Sun 17:00 |
| **Brand Alpha** | Daily 14:18 | Daily 17:19 | Mon/Wed/Fri/Sun 18:00 |
| **Brand Gamma** | Daily 19:12 | Daily 13:13 | Tue/Thu/Fri/Sun 18:01 |
| **Brand Delta** | Weekly | Daily 17:03 | Weekly |

### Flagship & Global Brands (America/Chicago unless noted)

| Brand | Schedule |
| ------- | ---------- |
| **Flagship Brand** | LinkedIn Tue/Thu 09:00 CT · Instagram Mon/Wed/Fri 11:00 CT · Facebook Tue/Sat 10:00 CT · Threads Mon/Wed/Fri 15:00 CT |
| **Regional Portal** | Facebook Mon/Wed/Fri 13:00 CET · Instagram Tue/Thu 18:30 CET |
| **City Guide** | GBP Tue/Fri 09:00 CET · Facebook Tue/Sat 12:15 CET · Instagram Thu/Sat 18:15 CET · Pinterest Mon/Thu 20:00 CET |

## First-Comment Link Protocol

**Rule**: For engagement algorithms that penalize outbound links in captions, place traffic-driving URLs in the first comment.

**Comment format for `schedulePost`**:

```yaml
comments: ['→ Explore more: https://example.com']
```

**Brand domain mapping (Example)**:

| Brand | Domain |
| ------- | -------- |
| Brand Alpha | destination-alpha.example.com |
| Brand Beta | destination-beta.example.com |
| Brand Gamma | destination-gamma.example.com |
| Brand Delta | destination-delta.example.com |
| Flagship Brand | flagship.example.com |
| Regional Portal | regional.example.com |
| City Guide | cityguide.example.com |

## Label Convention

Format: `brand-name,network,week-of-[MMMDD]`

Examples:

- `brand-alpha,threads,week-of-mar16`
- `brand-beta,facebook,week-of-mar23`
- `flagship,instagram,week-of-apr06`

## `schedulePost` Parameter Reference (Non-Premium)

```yaml
profile_id:       numeric string, e.g., "10001"
network_code     — "facebook", "instagram", "threads", "linkedin", "pinterest", "tiktok", "youtube", "googlebusiness", "reddit", "vistapage"
message          — post body text (no external links if using first-comment protocol)
publish_at       — ISO 8601 with explicit UTC offset, e.g., "2026-04-01T17:03:00+02:00"
labels           — comma-separated string, e.g., "brand-alpha,threads,week-of-mar30"
comments         — array of strings for first-comment, e.g., ["→ Explore more: https://example.com"]
```

## `searchPosts` Parameter Reference

```yaml
profile_ids:      array of numeric strings, e.g., ["10001"]
dateFrom         — string "YYYY-MM-DD"
dateTo           — string "YYYY-MM-DD"
status           — array, e.g., ["APPROVED", "NEEDS_APPROVAL"]
timezone         — string, e.g., "Europe/Amsterdam"
```
