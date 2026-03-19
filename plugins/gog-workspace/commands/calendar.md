---
description: Manage Google Calendar events — list, create, update, delete, and check availability. Usage: `/gog-workspace:calendar list` or `/gog-workspace:calendar create "Meeting" tomorrow 2pm 3pm`
---

Given "$ARGUMENTS" as user input, execute Calendar operations using the `gog` CLI.

## Supported Operations

### List & Search
- **Today's events**: `gog calendar list`
- **Date range**: `gog calendar list --from 2025-03-01 --to 2025-03-31`
- **Specific calendar**: `gog calendar list --calendar <name>`
- **List calendars**: `gog calendar calendars`

### Create & Update
- **Create event**: `gog calendar create '<title>' --start '<datetime>' --end '<datetime>'`
- **With location**: `gog calendar create '<title>' --start '<datetime>' --end '<datetime>' --location '<place>'`
- **With attendees**: `gog calendar create '<title>' --start '<datetime>' --end '<datetime>' --attendees 'a@b.com,c@d.com'`
- **All-day event**: `gog calendar create '<title>' --date 2025-03-20`
- **Update event**: `gog calendar update <event_id> --title '<new_title>'`
- **Delete event**: `gog calendar delete <event_id>`

### Availability
- **Free/busy check**: `gog calendar freebusy --start '<datetime>' --end '<datetime>'`
- **Propose time**: `gog calendar propose-time <event_id> --start '<datetime>' --end '<datetime>'`
- **Check conflicts**: `gog calendar conflicts --date 2025-03-20`

### Invitations
- **Accept invite**: `gog calendar rsvp <event_id> --accept`
- **Decline invite**: `gog calendar rsvp <event_id> --decline`
- **Maybe**: `gog calendar rsvp <event_id> --tentative`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. For event creation, parse natural language dates into ISO 8601 format
3. Always use `--json` when processing results programmatically
4. Show event details including time, location, attendees, and status
