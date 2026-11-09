---
description: Google Workspace Admin operations — manage users and groups (requires Workspace admin privileges). Usage: `/gog-workspace:admin users list` or `/gog-workspace:admin groups list`
argument-hint: "<users | groups> list"
---

Given "$ARGUMENTS" as user input, execute Google Workspace Admin operations using the `gog` CLI.

## Supported Operations

### Users
- **List users**: `gog admin users list --json`
- **Get user**: `gog admin users get <user_email> --json`
- **Create user**: `gog admin users create <user_email> --given '<first>' --family '<last>'`
- **Suspend user**: `gog admin users suspend <user_email>`

### Groups
- **List groups**: `gog admin groups list --json`
- **List members**: `gog admin groups members list <group_email> --json`
- **Add member**: `gog admin groups members add <group_email> <member_email>`
- **Remove member**: `gog admin groups members remove <group_email> <member_email>`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Admin operations require Workspace admin privileges and appropriate service account setup
3. Confirm destructive operations (suspend, remove) before executing
4. Use `--json` for structured output
5. Present user/group data in organized tables
