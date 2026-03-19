---
description: Manage Google Classroom courses, roster, assignments, and announcements. Usage: `/gog-workspace:classroom courses` or `/gog-workspace:classroom roster <course_id>`
---

Given "$ARGUMENTS" as user input, execute Google Classroom operations using the `gog` CLI.

## Supported Operations

### Courses
- **List courses**: `gog classroom courses --json`

### Roster
- **List students/teachers**: `gog classroom roster <course_id> --json`

### Coursework
- **List assignments**: `gog classroom coursework <course_id> --json`
- **List materials**: `gog classroom materials <course_id> --json`

### Communication
- **List announcements**: `gog classroom announcements <course_id> --json`
- **List topics**: `gog classroom topics <course_id> --json`

### Administration
- **List invitations**: `gog classroom invitations <course_id> --json`
- **List guardians**: `gog classroom guardians --json`
- **View profiles**: `gog classroom profiles --json`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Use `--json` for structured output
3. Present roster and assignment data in organized tables
4. Note: Classroom API requires appropriate Google Workspace for Education scopes
