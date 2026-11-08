---
description: Create a ClickUp task, announce it in Slack, and optionally add a Google Calendar hold and email the assignee via the gog CLI
argument-hint: "<title> [due date] [assignee]"
---
# /task-commander:todo <title> [due date] [assignee]

Arguments: `$ARGUMENTS`

Run these steps in order. Each step is idempotent: before creating anything, check
whether it already exists (same title + due date) and reuse it instead of creating a duplicate.

1. **Target list**: use the ClickUp MCP server to find the "Sprint Backlog" list (or the list the user named).
2. **Create the task** with the ClickUp MCP create-task tool: title, optional assignee, and the due date
   (default: two days from now). Record the returned task URL.
3. **Slack**: post a short message to the relevant channel with the official Slack MCP server's
   send-message tool, including the task link and due date.
4. **Calendar hold (optional, gog CLI)**: if `gog` is installed and authenticated, create a 30-minute hold
   on the due date. Check first so re-runs don't duplicate it:

   ```bash
   gog calendar list --from <due-date> --to <due-date> --json   # skip if an event with this title exists
   gog calendar create '<title>' --start '<due-date>T09:00' --end '<due-date>T09:30'
   ```

5. **Email (optional, gog CLI)**: only if the user asked for it, draft the assignee email and show it
   before sending (gog-workspace's PreToolUse hook also asks before `gog gmail send`):

   ```bash
   gog gmail draft <assignee-email> --subject 'New task: <title>' --body '<task link, due date>'
   ```

6. **Report** a checklist of what was done and skipped, e.g. `[x] ClickUp`, `[x] Slack`, `[ ] Calendar: gog not installed`.

If `gog` is missing, skip steps 4–5 and tell the user to install the `gog-workspace` plugin and run
`gog auth add <email>`.
