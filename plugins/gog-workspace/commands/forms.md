---
description: Create and manage Google Forms, list responses, and set up response watches. Usage: `/gog-workspace:forms create "Survey Title"` or `/gog-workspace:forms responses <form_id>`
argument-hint: "<create <title> | responses <form_id>>"
---

Given "$ARGUMENTS" as user input, execute Google Forms operations using the `gog` CLI.

## Supported Operations

### Forms
- **Create form**: `gog forms create --title '<title>'`
- **Get form details**: `gog forms get <form_id> --json`

### Responses
- **List responses**: `gog forms responses list <form_id> --json`
- **Get response data**: `gog forms responses get <form_id> <response_id> --json`

### Watches (Response Notifications)
- **Create watch**: `gog forms watch create <form_id> --topic projects/<project>/topics/<topic>`
- **List watches**: `gog forms watch list <form_id>`
- **Delete watch**: `gog forms watch delete <form_id> <watch_id>`
- **Renew watch**: `gog forms watch renew <form_id> <watch_id>`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Use `--json` for structured output
3. Present form responses in a clear tabular format
4. For response watches, explain the notification mechanism
