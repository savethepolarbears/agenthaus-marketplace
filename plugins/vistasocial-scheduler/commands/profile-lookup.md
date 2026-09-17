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

1. **Check the `profile-lookup` skill reference table first** — check local cache before querying API
2. If the profile is found, return it immediately with no MCP calls
3. If not found (new profile or suspected change), call `listProfiles` with `q: "<brand name>"`
4. Report the profile ID, network code, group membership, and operator

## Output Format

```text
Profile: Brand Alpha — Threads
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Profile ID:    10003
Network Code:  threads
Group:         Brand Cluster A (11111111-2222-3333-4444-555555555551)
Operator:      Content Specialist
Timezone:      Europe/Amsterdam
Post Time:     17:19 CET/CEST daily
First Comment: → destination-alpha.example.com
```

## Bulk Lookup

If the user asks for "all cluster profiles", return the full table from the skill reference. Do not make multiple MCP calls.

## When to Use Live API

Only call VistaSocial MCP for profile lookups when:

- The user asks about a brand not in the reference table
- The user suspects a profile was recently added or removed
- You need to verify a profile still exists before a critical operation
