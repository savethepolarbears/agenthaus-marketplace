---
name: profile-lookup
description: Complete VistaSocial profile ID map for resolving brand names to numeric profile IDs without unnecessary MCP calls. Use when looking up profile IDs, group IDs, network codes, or brand-to-profile mappings.
---

# Profile Lookup — VistaSocial ID Map

## Purpose

This skill exists to **eliminate unnecessary MCP calls**. Instead of calling `listProfiles` or `listProfileGroups` every time you need a profile ID, look it up here first. Only call the MCP API if the profile is not listed or you suspect the data has changed.

## Profile Groups (12 total)

| Group Name | Group UUID | Decision |
|------------|-----------|----------|
| ViaTravelers | `b63a8810-2327-11ee-ac85-c1a50b1fe7e1` | Retain |
| Greece | `eb160100-1c4e-11f0-9913-9fe464d8ed3e` | Expand |
| Germany | `bd25be30-4a3a-11ee-8b68-3334ada7ed51` | Expand |
| Amsterdam Local Gems | `97cb4150-8576-11ef-ba91-85c6d5b61252` | Retain |
| Kyle Kroeger Personal Brand | `0e55c4e0-f061-11ee-b979-cf1c7b7dfed9` | Retain |
| The Impact Investor | `ed677170-f00b-11ee-b979-cf1c7b7dfed9` | Retain |
| Travel | `455921b0-2327-11ee-ac85-c1a50b1fe7e1` | Pause |
| Finance & Business | `9888cdf0-abca-11ee-b7c4-57d959be487f` | Pause |
| Environment | `e4ef1880-ee90-11ee-88fe-e1108d67b844` | Pause |
| Black Bear Media LLC | `e3c8eb10-2308-11ee-a436-dd8de3849711` | Pause |
| Paris Top Ten | `d9e1b0a0-f256-11ee-823e-0b3dfb3faac9` | Pause |
| Parker Villas | `eee43310-f0df-11ee-8b54-dd039960efa6` | Sunset |

## Quick Lookup: Active Brand Profile IDs

### Greece Cluster

| Brand | Facebook | Instagram | Threads | LinkedIn | Pinterest |
|-------|----------|-----------|---------|----------|-----------|
| Santorini Secrets | 531204 | 531201 | 531212 | 573888 | 622839 |
| Crete Secrets | 531203 | 531208 | 543951 | — | — |
| Mykonos Secrets | 531210 | 531209 | 531247 | — | — |
| Athens Secrets | 538195 | 538196 | 543952 | — | — |

### Flagship & Supporting Brands

| Brand | Facebook | Instagram | Threads | LinkedIn | Pinterest | TikTok | YouTube | GBP | Vista Page | Reddit |
|-------|----------|-----------|---------|----------|-----------|--------|---------|-----|------------|--------|
| ViaTravelers | 95149 | 95156 | 399612 | 95732 | 95386 | 95159 | 95162 | 345239 | 437300 | 308254 |
| Everything About Germany | 95153 | 95157 | — | — | — | — | — | — | — | — |
| Amsterdam Local Gems | 432707 | 437303 | — | — | 622845 | — | — | 622842 | — | — |
| The Impact Investor | 95143 | — | — | 95731 | — | — | 308283 | — | — | — |
| Kyle Kroeger | — | — | — | 95730 | — | — | — | — | — | — |
| worldphotogoat | 95141 | 95154 | — | — | — | — | — | — | — | — |
| Traveleering | 95151 | — | — | — | — | — | — | — | — | — |

## Network Code Reference

| VistaSocial Network Code | Display Name |
|--------------------------|-------------|
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

## Known Data Quality Issues

- **Travel group** and **Black Bear Media LLC group** contain duplicate cross-listings of active profiles — ignore these groups for operational work
- **World Photo GOAT Instagram** (95154) has no dedicated group — listed under Black Bear Media LLC only
- **Paused/Sunset brands** may still appear in group listings — never schedule to them
