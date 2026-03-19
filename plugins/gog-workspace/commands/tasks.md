---
description: Manage Google Tasks — list, create, complete, and organize task lists. Usage: `/gog-workspace:tasks list` or `/gog-workspace:tasks add "Buy groceries" --due tomorrow`
---

Given "$ARGUMENTS" as user input, execute Google Tasks operations using the `gog` CLI.

## Supported Operations

### Task Lists
- **List task lists**: `gog tasks lists`
- **Create task list**: `gog tasks lists create '<name>'`
- **Delete task list**: `gog tasks lists delete <list_id>`

### Tasks
- **List tasks**: `gog tasks list`
- **List from specific list**: `gog tasks list --list '<name>'`
- **Add task**: `gog tasks add '<title>'`
- **Add with due date**: `gog tasks add '<title>' --due '<date>'`
- **Add with notes**: `gog tasks add '<title>' --notes '<notes>'`
- **Complete task**: `gog tasks complete <task_id>`
- **Update task**: `gog tasks update <task_id> --title '<new_title>'`
- **Delete task**: `gog tasks delete <task_id>`
- **Move task**: `gog tasks move <task_id> --list '<list_name>'`

## Instructions

1. Parse the user's intent from `$ARGUMENTS`
2. For due dates, convert natural language to appropriate date format
3. Use `--json` for structured output
4. Show task status (completed/pending), due dates, and notes
