---
description: Search and manage Google Contacts and People directory. Usage: `/gog-workspace:contacts search "John"` or `/gog-workspace:contacts list`
---

Given "$ARGUMENTS" as user input, execute Contacts/People operations using the `gog` CLI.

## Supported Operations

### Contacts
- **List contacts**: `gog contacts list`
- **Search contacts**: `gog contacts search '<query>'`
- **Contact details**: `gog contacts get <contact_id>`

### People (Workspace Directory)
- **Search directory**: `gog people search '<query>'`
- **Get person**: `gog people get <email>`
- **List directory**: `gog people list`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Use `--json` for structured output
3. Display contact info including name, email, phone, and organization
4. For directory searches, note that People API requires Workspace account
