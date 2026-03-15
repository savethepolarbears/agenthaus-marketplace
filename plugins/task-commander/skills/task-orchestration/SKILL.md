---
name: task-orchestration
description: Unified task management combining ClickUp tasks, Slack notifications, Gmail communications, and Google Calendar scheduling in a single workflow. Use when the user asks to create tasks with notifications, schedule work with calendar events, coordinate task updates across tools, or run a complete task lifecycle from creation to completion with team communication.
---

# Task Orchestration

Unified task management across ClickUp, Slack, Gmail, and Google Calendar with automated coordination.

## When to Use

- User asks to create a task and notify the team
- User wants to schedule work with calendar events and reminders
- User needs to coordinate task updates across multiple tools
- User asks to manage a complete task lifecycle with notifications
- User wants to sync task status between ClickUp and team channels

## Prerequisites

- `CLICKUP_KEY` — for ClickUp task management
- `SLACK_TOKEN` and `SLACK_CHANNEL` — for Slack notifications
- `GMAIL_CREDS` — for email communications
- `GOOGLE_CALENDAR_TOKEN` — for calendar scheduling
- MCP servers: `@taazkareem/clickup-mcp-server`, `@modelcontextprotocol/server-slack`, `@modelcontextprotocol/server-gmail`, `@modelcontextprotocol/server-google-calendar`

## Steps

### 1. Task Creation with Full Orchestration

When creating a task with cross-tool coordination:

1. **Create in ClickUp**: Task with title, description, assignee, due date, priority
2. **Notify via Slack**: Post task assignment notification to the team channel
3. **Email stakeholders**: Send detailed task brief via Gmail (if requested)
4. **Schedule in Calendar**: Create a calendar event for the task deadline or work block

### 2. Unified Task Workflow

```
User Request → Create ClickUp Task → Notify Slack → Email (optional) → Calendar Event (optional)
```

#### ClickUp Task Creation
```markdown
### Task Created

- **ID**: #abc123
- **Title**: Implement user authentication
- **Assignee**: @developer
- **Due**: 2026-03-20
- **Priority**: High
- **URL**: https://app.clickup.com/t/abc123
```

#### Slack Notification
```
:clipboard: New Task Assigned
• Task: Implement user authentication
• Assignee: @developer
• Due: March 20, 2026
• Priority: :red_circle: High
• Link: https://app.clickup.com/t/abc123
```

#### Calendar Event
```
Title: [Task] Implement user authentication
Date: March 20, 2026
Description: ClickUp task #abc123 deadline
Reminders: 1 day before, 2 hours before
```

### 3. Task Status Updates

When updating task status:

1. Update the task in ClickUp (status, progress, comments)
2. Post a status update to Slack
3. If the task is completed, send a summary email to stakeholders
4. Update or remove the calendar event as appropriate

### 4. Daily/Weekly Summaries

Generate periodic task summaries:

1. Query ClickUp for tasks due today/this week
2. Group by status: overdue, due today, upcoming
3. Post the summary to Slack
4. Optionally email the summary to stakeholders

```markdown
### Weekly Task Summary — March 15, 2026

**Overdue (2)**
- [ ] Fix payment gateway — Due: Mar 13 — @alice
- [ ] Update API docs — Due: Mar 14 — @bob

**Due Today (1)**
- [ ] Deploy v2.1 — Due: Mar 15 — @charlie

**Upcoming (3)**
- [ ] Code review sprint — Due: Mar 18 — @team
- [ ] User auth implementation — Due: Mar 20 — @developer
- [ ] QA sign-off — Due: Mar 22 — @qa-lead
```

### 5. Todo Command

The `/todo` command provides quick task management:

1. With no arguments: Show today's tasks and deadlines
2. With a task description: Create a new task with smart defaults
3. With a task ID: Show task details and allow status updates

## Output Format

Present task operations with clear confirmations showing what was done in each tool:

```
### Task Orchestration Complete

- [x] ClickUp: Task #abc123 created
- [x] Slack: Notification sent to #engineering
- [x] Calendar: Event created for March 20
- [ ] Gmail: Skipped (not requested)
```

## Error Handling

- If any service is unavailable, complete the task in available services and report which ones failed
- Missing credentials: List required env vars and which services they enable
- ClickUp workspace not found: Help the user identify the correct workspace
- Calendar conflicts: Warn about existing events at the same time
