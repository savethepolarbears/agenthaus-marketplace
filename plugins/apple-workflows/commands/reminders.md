---
description: Manage Apple Reminders — add, complete, list, search, and organize lists. Usage: `/apple-workflows:reminders <action> [args]` where action is list, add, complete, get, update, delete, search, lists, or create-list.
---
Given "$ARGUMENTS" as the user input (action and arguments), use the `apple-productivity` MCP tools to manage Apple Reminders.

**Parse the action from the first word of $ARGUMENTS:**

- **list [view] [--list <name>]**: Use `reminders_list` with the specified view. Valid views: today (default), tomorrow, week, overdue, upcoming, completed, all. Optionally filter by list name.
- **add <title> [--due <date>] [--list <name>] [--notes <text>] [--priority <level>]**: Use `reminders_add` to create a new reminder. Due dates accept natural formats like "tomorrow", "next Friday", or "2026-04-01".
- **complete <title or id>**: Use `reminders_complete` to mark a reminder as done.
- **get <title or id>**: Use `reminder_get` to fetch details for a specific reminder.
- **update <title or id> [--title <new>] [--due <date>] [--notes <text>]**: Use `reminders_update` to modify an existing reminder.
- **delete <title or id>**: Use `reminders_delete` with `confirm=True` only after explicitly confirming with the user.
- **search <query>**: Use `reminders_list` with `query` parameter to find reminders by text.
- **lists**: Use `reminder_lists` to show all reminder lists.
- **create-list <name>**: Use `reminder_list_create` to create a new list.
- **rename-list <old> <new>**: Use `reminder_list_rename`.
- **delete-list <name>**: Use `reminder_list_delete` with `confirm=True` only after user confirmation.

**Present reminders in a clean table format** with columns: Title, Due, List, Priority, Status.

**Safety rules:**
- Never auto-confirm deletions. Always ask the user first.
- If a reminder reference is ambiguous, show matches and let the user choose.
