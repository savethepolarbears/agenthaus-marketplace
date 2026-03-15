---
name: clickup-management
description: Create, update, and manage ClickUp tasks, lists, spaces, and time tracking through the ClickUp MCP server. Use when the user asks to manage project tasks, create or update ClickUp items, track time, organize sprints, or query task status across workspaces.
---

# ClickUp Task Management

Full lifecycle task management in ClickUp: create, update, organize, and track tasks across workspaces.

## When to Use

- User asks to create or update ClickUp tasks
- User wants to list, search, or filter tasks by status, assignee, or due date
- User needs to manage ClickUp lists, spaces, or folders
- User asks to track time against tasks
- User wants to organize sprint or project boards
- User asks about task status or workload across the team

## Prerequisites

- `CLICKUP_API_KEY` environment variable must be set
- ClickUp MCP server (`@modelcontextprotocol/server-clickup`) must be available

## Steps

### 1. Workspace Discovery

Before any operation:

1. Use the `clickup` MCP tools to list available workspaces
2. Identify the target workspace, space, and list
3. If ambiguous, present options and let the user choose

### 2. Task Operations

#### Create Task
1. Gather: task name, description, assignee(s), due date, priority, tags
2. Identify the target list within the workspace hierarchy
3. Create the task via the `clickup` MCP tools
4. Return the task ID and URL

#### Update Task
1. Find the task by ID, name, or search query
2. Apply requested changes: status, assignee, due date, priority, description
3. Confirm the update and report changes made

#### Search/List Tasks
1. Accept filters: status, assignee, due date range, tags, priority
2. Query tasks via the `clickup` MCP tools
3. Present results in a scannable table:

```markdown
| ID | Task | Status | Assignee | Due Date | Priority |
|----|------|--------|----------|----------|----------|
```

#### Delete/Archive Task
1. Confirm with the user before any destructive operation
2. Archive is preferred over deletion for audit trails

### 3. Time Tracking

1. Start a timer on a specific task
2. Stop the running timer and log the duration
3. View time entries for a task or date range
4. Summarize total time by task, assignee, or project

### 4. List and Space Management

1. Create new lists within spaces
2. Move tasks between lists
3. Update list statuses and workflows
4. View space and folder hierarchy

## Output Format

```
### Task Created

- **ID**: #abc123
- **Name**: Implement user authentication
- **List**: Sprint 12 > Backend
- **Status**: To Do
- **Assignee**: @developer
- **Due**: 2026-03-20
- **Priority**: High
- **URL**: https://app.clickup.com/t/abc123
```

## Error Handling

- If `CLICKUP_API_KEY` is not set, provide setup instructions
- If workspace/space/list cannot be found, list available options
- Validate due dates are in the future for new tasks
- Warn if assigning to users not in the workspace
