---
description: Google Workspace Admin operations — manage users and groups (requires Workspace admin privileges). Usage: `/gog-workspace:admin users list` or `/gog-workspace:admin groups list`
---

Given "$ARGUMENTS" as user input, execute Google Workspace Admin operations using the `gog` CLI.

## Supported Operations

### Users
- **List users**: `gog admin users list --json`
- **Get user**: `gog admin users get <user_id> --json`
- **Create user**: `gog admin users create`
- **Suspend user**: `gog admin users suspend <user_id>`

### Groups
- **List groups**: `gog admin groups list --json`
- **List members**: `gog admin groups members list <group_id> --json`
- **Add member**: `gog admin groups members add <group_id>`
- **Remove member**: `gog admin groups members remove <group_id>`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Admin operations require Workspace admin privileges and appropriate service account setup
3. Confirm destructive operations (suspend, remove) before executing
4. Use `--json` for structured output
5. Present user/group data in organized tables
