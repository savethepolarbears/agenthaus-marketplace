---
name: profile-lookup
description: Profile ID map template for resolving brand names to numeric VistaSocial profile IDs without unnecessary MCP calls. Use when looking up profile IDs, group IDs, network codes, or brand-to-profile mappings.
---

# Profile Lookup — VistaSocial ID Map

## Purpose

This skill exists to **eliminate unnecessary MCP calls**. Instead of calling `listProfiles` or `listProfileGroups` every time you need a profile ID, look it up in your local configuration table first. Only call the MCP API if the profile is not listed or you suspect the data has changed.

> **Setup Note:** Populate the tables below with your organization's brand profile IDs and group UUIDs retrieved from your VistaSocial account.

## Profile Groups (Example Structure)

| Group Name | Group UUID | Status |
| ------------ | ----------- | -------- |
| Primary Brand Cluster | `11111111-2222-3333-4444-555555555551` | Active |
| Regional Media Group | `11111111-2222-3333-4444-555555555552` | Active |
| Product & Commerce | `11111111-2222-3333-4444-555555555553` | Active |
| Secondary Brands | `11111111-2222-3333-4444-555555555554` | Paused |

## Quick Lookup: Active Brand Profile IDs

### Brand Cluster A

| Brand | Facebook | Instagram | Threads | LinkedIn | Pinterest |
| ------- | ---------- | ----------- | --------- | ---------- | ----------- |
| Brand Alpha | 10001 | 10002 | 10003 | 10004 | 10005 |
| Brand Beta | 10006 | 10007 | 10008 | — | — |
| Brand Gamma | 10009 | 10010 | 10011 | — | — |
| Brand Delta | 10012 | 10013 | 10014 | — | — |

### Brand Cluster B

| Brand | Facebook | Instagram | Threads | LinkedIn | Pinterest | TikTok | YouTube | GBP | Vista Page | Reddit |
| ------- | ---------- | ----------- | --------- | ---------- | ----------- | -------- | --------- | ----- | ------------ | -------- |
| Flagship Brand | 20001 | 20002 | 20003 | 20004 | 20005 | 20006 | 20007 | 20008 | 20009 | 20010 |
| Regional Portal | 20011 | 20012 | — | — | — | — | — | — | — | — |
| City Guide | 20013 | 20014 | — | — | 20015 | — | — | 20016 | — | — |
| Editorial Brand | 20017 | — | — | 20018 | — | — | 20019 | — | — | — |

## Network Code Reference

| VistaSocial Network Code | Display Name |
| -------------------------- | ------------- |
| `facebook` | Facebook Page |
| `instagram` | Instagram Profile |
| `threads` | Threads Profile |
| `linkedin` | LinkedIn Company/Personal Page |
| `pinterest` | Pinterest Profile |
| `tiktok` | TikTok Profile |
| `youtube` | YouTube Profile |
| `googlebusiness` | Google Business Profile |
| `reddit` | Reddit Profile |
| `vistapage` | Vista Page (Link-in-Bio) |

## VistaSocial API Patterns

- `listProfileGroups` → returns UUIDs (group IDs above)
- `listProfilesInGroup` → param: `profile_group_id` (UUID) → returns numeric profile IDs
- `listProfiles` with `q: "brand name"` → most reliable profile lookup
- `searchPosts` → `profile_ids` takes an array of numeric string IDs
- `schedulePost` → `profile_id` takes a single numeric string ID

## Best Practices

- Cache profile IDs locally in this skill to minimize API calls and avoid rate limits.
- If a brand is paused or sunset, flag it in the table and skip scheduling.
