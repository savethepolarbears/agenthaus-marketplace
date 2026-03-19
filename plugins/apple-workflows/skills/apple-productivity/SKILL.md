---
name: apple-productivity
description: Manage Apple Notes, Reminders, and Shortcuts on macOS. Use when the user asks to read, create, update, move, delete, search, or run Apple-native productivity objects on a Mac.
---

# Skill: Manage Apple Notes, Reminders, and Shortcuts on macOS

Use this skill when the user wants to interact with Apple productivity apps from the command line.

## Scope

This skill covers:

- Apple Notes (via `macnotesapp`)
- Apple Reminders (via `remindctl` or `rem`)
- Apple Shortcuts (via Apple's built-in `shortcuts` CLI)

## When to Use

- User asks to create, search, read, update, move, or delete notes
- User wants to add, complete, list, or organize reminders
- User asks to run, list, or open shortcuts
- User requests a daily review or morning briefing
- User wants to quickly capture an idea or task
- User asks to organize their notes into folders or triage reminders

## Prerequisites

- macOS (this plugin only works on macOS)
- `apple-productivity` MCP server must be available
- For Notes: `macnotesapp` Python package installed
- For Reminders: `remindctl` (preferred) or `rem` installed
- For Shortcuts: `shortcuts` CLI (built into macOS, no install needed)

## Decision Rules

### Notes

Use Notes when the user wants to:

- Capture ideas or save snippets
- Create or update reference documents
- Search note content
- File notes into folders

Prefer:

- `notes_search` before `notes_get` if the exact title is uncertain
- `notes_get` when you already have an exact note_id or exact title
- `notes_create` for new content
- `notes_update` for content/title changes
- `notes_move` for filing and organizing
- `notes_create_folder` / `notes_delete_folder` for folder management

Important:

- Locked notes may not be accessible
- Deep/nested folder behavior is less reliable than top-level folders
- Attachments and tags are the least reliable part of Apple Notes automation
- For mutating a note, prefer `note_id` over title whenever possible

### Reminders

Use Reminders when the user wants to:

- Track tasks or action items
- Check today / overdue / upcoming work
- Complete tasks
- Create task lists
- Reschedule reminders

Prefer:

- `reminders_list(view="today")` for daily task views
- `reminders_list(view="overdue")` for triage
- `reminders_add` for capture
- `reminders_update` for due date/title changes
- `reminders_complete` for done-state changes
- `reminder_lists` and list CRUD tools for setup and organization

Important:

- Resolve ambiguity with `reminder_get` when titles collide
- Use exact IDs or ID prefixes once you have them
- For destructive actions, require explicit confirmation from the user

### Shortcuts

Use Shortcuts when the user wants to:

- Run an existing automation
- List installed shortcuts
- Open a shortcut for editing
- Create a new shortcut shell

Prefer:

- `shortcuts_list` to verify the shortcut exists
- `shortcuts_run` to execute a shortcut
- `shortcuts_view` to open an existing shortcut in the editor
- `shortcuts_create_new` to open a fresh shortcut editor
- `shortcuts_open` to jump directly into a named shortcut

Important:

- CLI execution works best with shortcuts that do not pause for interactive UI prompts
- If the shortcut needs file input, pass `input_paths`
- If the shortcut needs plain text input, pass `input_text`
- If the shortcut returns a file, set `output_path`

## Safe Operating Pattern

1. Start with `system_status` if the environment is unknown.
2. For Notes and Reminders, search/list first if identifiers are ambiguous.
3. Prefer exact IDs for follow-up mutations.
4. Require confirmation before destructive tools.
5. After writes, summarize what changed in plain language.

## Destructive Actions

The following tools require `confirm=True`:

- `notes_delete`
- `notes_delete_folder`
- `reminders_delete`
- `reminder_list_delete`

Never set `confirm=True` unless the user's intent to delete is explicit.

## Good Agent Behaviors

### Notes
- Keep titles short and searchable
- Put durable reference material in Notes
- Put short-lived tasks in Reminders, not Notes
- When creating notes from plain text, preserve paragraph breaks

### Reminders
- Use due dates only when they are meaningful
- Avoid over-scheduling everything for "today"
- Keep reminder titles action-oriented and short
- Use lists to separate contexts like Work, Personal, Travel, Admin

### Shortcuts
- Treat CLI-triggered Shortcuts as idempotent automations where possible
- Avoid shortcuts that require modal prompts unless the user explicitly wants an interactive flow
- If a shortcut is missing, suggest creating it rather than pretending it exists

## Error Handling

- If `macnotesapp` is not installed, suggest: `uv tool install --python 3.13 macnotesapp`
- If no Reminders backend is found, suggest: `brew install steipete/tap/remindctl`
- If `shortcuts` CLI is missing, warn that macOS is required
- If permissions are denied for Reminders, suggest: run `remindctl authorize` or enable access in System Settings > Privacy & Security > Reminders
- If iCloud sync is slow, note that changes may take a moment to appear

## Output Format

### Notes Operations
```
### Note Operation
- **Action**: create | update | move | delete
- **Title**: [note title]
- **Folder**: [folder name]
- **Status**: Success | Error
```

### Reminders Operations
```
### Reminder Operation
- **Action**: add | complete | update | delete
- **Title**: [reminder title]
- **List**: [list name]
- **Due**: [due date]
- **Status**: Success | Error
```

## Example Prompts This Skill Handles Well

- "Find my note about quarterly planning and update the title."
- "Create a reminder to renew my passport next month."
- "Show me overdue reminders in my Admin list."
- "Run my Publish Blog Draft shortcut with this text."
- "Create a new Shortcut and open it so I can finish wiring it up."
- "What reminders do I have due this week?"
- "Move all my project notes into a Projects folder."
