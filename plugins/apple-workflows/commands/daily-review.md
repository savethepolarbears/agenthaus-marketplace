---
description: Morning productivity review — shows today's reminders, overdue items, and recent notes in a structured briefing.
---
Perform a comprehensive daily productivity review using the `apple-productivity` MCP tools. Do NOT require any arguments.

**Steps:**

1. Call `system_status` to verify backends are available. If any are missing, note it but continue with what is available.

2. **Today's Reminders**: Call `reminders_list` with `view="today"`. Present as a checklist with due times and list names.

3. **Overdue Items**: Call `reminders_list` with `view="overdue"`. Highlight these prominently — they need attention.

4. **This Week**: Call `reminders_list` with `view="week"`. Show upcoming items for the rest of the week.

5. **Recent Notes**: Call `notes_search` with a broad query (empty or recent date) to show recently modified notes. Present the 5 most recent with titles and modification dates.

**Output format:**

```
## Daily Review — [today's date]

### Overdue (needs attention)
- [ ] Reminder title — due date — list name

### Today
- [ ] Reminder title — due time — list name

### This Week
- [ ] Reminder title — due date — list name

### Recent Notes
- Note title — last modified date
```

If any section is empty, say "All clear" instead of leaving it blank. End with a brief summary of the day's workload.
