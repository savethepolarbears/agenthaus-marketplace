# ClickUp Tasks Plugin

The **clickup-tasks** plugin connects Claude to ClickUp so you can manage tasks, lists and time tracking.  It includes an MCP server configuration but no custom slash commands; instead, Claude can use the ClickUp tools autonomously when asked.

## Features

* **Task creation and updates** – Ask Claude to create a task, assign it to someone, set priorities or due dates, or update fields.  Claude will call the ClickUp API via the MCP server.
* **Search and reporting** – Request lists of tasks that match a given query (for example, tasks labeled “bug” in a specific list) and Claude will return a structured summary.
* **Time tracking** – Start or stop timers on tasks and log time entries using ClickUp’s native capabilities.

## Installation

```bash
/plugin install clickup-tasks@AgentHaus
```

Set the `CLICKUP_API_KEY` environment variable to a ClickUp personal access token with necessary scopes.  After installation, you can issue natural‑language requests about your ClickUp workspace and Claude will use the MCP tools to perform them.

### Example usage

```
Create a task "Write marketing plan" in the product backlog and assign it to Alice with high priority, due next Friday.

List all tasks in the "Sprint 12" list tagged "frontend" and summarise their status.

Start a timer on the task "Update landing page".
```
