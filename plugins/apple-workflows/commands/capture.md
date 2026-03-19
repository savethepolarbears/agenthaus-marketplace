---
description: Quick capture to Apple Notes or Reminders. Usage: `/apple-workflows:capture <text> [--reminder|--note] [--list <list>] [--due <date>]`
---
Given "$ARGUMENTS" as the user input, quickly capture the text to either Apple Notes or Apple Reminders using the `apple-productivity` MCP tools.

**Determine the target:**

1. If `--reminder` flag is present, create a reminder using `reminders_add`.
2. If `--note` flag is present, create a note using `notes_create`.
3. If neither flag is present, infer from the text:
   - If the text contains action-oriented language (verbs like "buy", "call", "fix", "schedule", "send", "review", "finish") or includes a date/deadline, create a **reminder**.
   - Otherwise, create a **note**.

**For reminders:**
- Use the text as the title.
- If `--due <date>` is provided, set the due date.
- If `--list <name>` is provided, add to that list.

**For notes:**
- Use the first line or first ~50 characters as the title.
- Use the full text as the body.
- If `--list <name>` is provided, use it as the folder name.

**After capturing**, confirm what was created with a brief summary:
- "Captured as reminder: [title] (due: [date], list: [list])"
- "Captured as note: [title] (folder: [folder])"
