---
description: Create a ClickUp task and schedule reminders
---
# /clickup:todo <title> [due date] [assignee]
1. Determine the target ClickUp list: search for the "Sprint Backlog" or other specified list.
2. Create a new ClickUp task with the provided title and optional assignee using `clickup.create_task`.  Include a due date if one was provided; otherwise set it for two days from now.
3. Call `google-calendar.create_event` to add a calendar event on the task's due date.  Include a reminder 30 minutes before the due time.
4. Call `slack.post_message` to notify the relevant channel that a new task has been created, including the task link and due date.
5. Call `gmail.send_email` to send a brief email to the assignee with the task details and due date, cc'ing the requester for transparency.