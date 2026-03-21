---
description: >
  Look up VistaSocial profile IDs, group IDs, and network codes for any brand.
  Uses the built-in reference table first to save MCP calls, falling back to
  live API queries only when needed. Use when you need to find or verify a
  profile ID before scheduling.
allowed-tools: VistaSocial:listProfiles, VistaSocial:listProfileGroups, VistaSocial:listProfilesInGroup
---

# Profile Lookup

Quickly resolve brand names to VistaSocial profile IDs.

## Workflow

1. **Check the `profile-lookup` skill reference table first** — this covers all 47 profiles
2. If the profile is found, return it immediately with no MCP calls
3. If not found (new profile or suspected change), call `listProfiles` with `q: "<brand name>"`
4. Report the profile ID, network code, group membership, and operator

## Output Format

```
Profile: Santorini Secrets — Threads
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Profile ID:    531212
Network Code:  threads
Group:         Greece (eb160100-1c4e-11f0-9913-9fe464d8ed3e)
Operator:      Lexi Voy
Timezone:      Europe/Amsterdam
Post Time:     17:19 CET/CEST daily
First Comment: → santorinisecrets.com
```

## Bulk Lookup

If the user asks for "all Santorini profiles" or "all Greece profiles", return the full table from the skill reference. Do not make multiple MCP calls.

## When to Use Live API

Only call VistaSocial MCP for profile lookups when:
- The user asks about a brand not in the reference table
- The user suspects a profile was recently added or removed
- You need to verify a profile still exists before a critical operation
