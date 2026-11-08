---
description: Manage Google Calendar events — list, create, update, delete, and check availability. Usage: `/gog-workspace:calendar list` or `/gog-workspace:calendar create "Meeting" tomorrow 2pm 3pm`
argument-hint: "<list | create <title> <date> <start> <end>>"
---

Given "$ARGUMENTS" as user input, execute Calendar operations using the `gog` CLI.

Event commands take a calendar ID first. Use `primary` for the user's main calendar, or an ID or alias from `gog calendar calendars`. Times are RFC3339 (`2026-03-20T14:00:00-05:00`).

## Supported Operations

### List & Search
- **Today's events**: `gog calendar events primary --today`
- **Date range**: `gog calendar events primary --from 2026-03-01 --to 2026-03-31`
- **Next N days**: `gog calendar events primary --from 2026-03-01 --days 7`
- **Specific calendar**: `gog calendar events <calendar_id> --week`
- **Search events**: `gog calendar search '<text>' --days 30`
- **List calendars**: `gog calendar calendars`

### Create & Update
- **Create event**: `gog calendar create primary --summary '<title>' --from '<rfc3339>' --to '<rfc3339>'`
- **With location**: `gog calendar create primary --summary '<title>' --from '<rfc3339>' --to '<rfc3339>' --location '<place>'`
- **With attendees**: `gog calendar create primary --summary '<title>' --from '<rfc3339>' --to '<rfc3339>' --attendees 'a@b.com,c@d.com' --send-updates all`
- **All-day event**: `gog calendar create primary --summary '<title>' --all-day --from 2026-03-20 --to 2026-03-21`
- **Update event**: `gog calendar update primary <event_id> --summary '<new_title>'`
- **Delete event**: `gog calendar delete primary <event_id>`

### Availability
- **Free/busy check**: `gog calendar freebusy primary --from '<rfc3339>' --to '<rfc3339>'`
- **Propose a new time** (prints the Google Calendar link for the event): `gog calendar propose-time primary <event_id>`
- **Check conflicts**: `gog calendar conflicts --from 2026-03-20 --days 1`

### Invitations
- **Accept invite**: `gog calendar respond primary <event_id> --status accepted`
- **Decline invite**: `gog calendar respond primary <event_id> --status declined`
- **Maybe**: `gog calendar respond primary <event_id> --status tentative`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. For event creation, convert natural-language dates to RFC3339 with the user's offset; for all-day events use `--all-day` with dates (the `--to` date is exclusive)
3. Before creating an event, list the window with `gog calendar events` to avoid duplicates
4. Always use `--json` when processing results programmatically
5. Show event details including time, location, attendees, and status
