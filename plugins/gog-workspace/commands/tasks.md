---
description: Manage Google Tasks — list, create, complete, and organize task lists. Usage: `/gog-workspace:tasks list` or `/gog-workspace:tasks add "Buy groceries" --due tomorrow`
argument-hint: "<list | add <title> [--due <date>]>"
---

Given "$ARGUMENTS" as user input, execute Google Tasks operations using the `gog` CLI.

## Supported Operations

### Task Lists
- **List task lists**: `gog tasks lists list`
- **Create task list**: `gog tasks lists create '<name>'`

### Tasks
- **List tasks**: `gog tasks list <tasklist_id>` (get IDs from `gog tasks lists list`)
- **Include completed**: `gog tasks list <tasklist_id> --show-completed`
- **Add task**: `gog tasks add <tasklist_id> --title '<title>'`
- **Add with due date**: `gog tasks add <tasklist_id> --title '<title>' --due 2026-03-20`
- **Add with notes**: `gog tasks add <tasklist_id> --title '<title>' --notes '<notes>'`
- **Complete task**: `gog tasks done <tasklist_id> <task_id>`
- **Update task**: `gog tasks update <tasklist_id> <task_id> --title '<new_title>'`
- **Delete task**: `gog tasks delete <tasklist_id> <task_id>`
- **Clear completed**: `gog tasks clear <tasklist_id>` (removes completed tasks)

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. Resolve the task list ID first with `gog tasks lists list --json`
3. For due dates, convert natural language to `YYYY-MM-DD` or RFC3339
4. Use `--json` for structured output
5. Show task status (completed/pending), due dates, and notes
