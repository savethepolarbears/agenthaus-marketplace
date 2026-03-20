---
description: Organize Apple Notes into folders and triage reminders by priority, due date, or list. Usage: `/apple-workflows:organize [notes|reminders]`
---
Given "$ARGUMENTS" as the user input, help organize their Apple Notes and/or Reminders using the `apple-productivity` MCP tools.

**If "notes" is specified (or no argument given):**

1. Call `notes_folders` to list existing folders.
2. Call `notes_search` with a broad query to get all notes.
3. Identify notes that are not in any folder or are in the default folder.
4. Suggest a folder organization scheme based on note titles and content:
   - Group related notes by topic (e.g., Work, Personal, Projects, Reference).
   - Present the suggestions as a table: Note Title → Suggested Folder.
5. Ask the user which moves to execute. Only call `notes_move` after explicit approval.

**If "reminders" is specified:**

1. Call `reminder_lists` to show existing lists.
2. Call `reminders_list` with `view="all"` to get all reminders.
3. Identify organizational issues:
   - Overdue reminders that need rescheduling or completion.
   - Reminders without due dates that might need them.
   - Reminders in the default list that could be categorized.
4. Present a triage plan:
   - Overdue items: suggest complete, reschedule, or delete.
   - Uncategorized items: suggest list assignments.
5. Execute changes only after user approval. For deletions, always confirm individually.

**Safety:** Never move notes or modify reminders without asking first. Present the plan, get approval, then execute.
