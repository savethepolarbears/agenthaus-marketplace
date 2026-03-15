---
name: fleet-management
description: Monitor, dispatch, and control multiple concurrent agent sessions with task board visualization and session lifecycle management. Use when the user asks to view running agent sessions, dispatch tasks to agents, take over a session, or manage multi-agent workloads across a fleet.
---

# Fleet Commander — Agent Session Management

Visualize and control a fleet of running agent sessions with task dispatch, monitoring, and takeover capabilities.

## When to Use

- User asks to see what agent sessions are currently running
- User wants to dispatch a task to a new or existing agent
- User needs to take over or redirect an agent session
- User asks for a dashboard view of multi-agent workloads
- User wants to monitor agent progress across parallel tasks
- User needs to coordinate work between multiple agent instances

## Steps

### 1. Fleet Status Overview

Display all active agent sessions with:

```markdown
### Agent Fleet Status

| Session | Task | Status | Duration | Progress |
|---------|------|--------|----------|----------|
| agent-01 | Refactor auth module | Running | 12m | 65% |
| agent-02 | Write API tests | Running | 8m | 40% |
| agent-03 | Fix CSS layout | Idle | — | — |
```

Include summary metrics:
- Total active sessions
- Tasks in progress vs. idle vs. completed
- Average task duration
- Resource utilization

### 2. Task Dispatch

When dispatching a new task:

1. **Define the task**: Get a clear description, priority, and constraints
2. **Select or spawn agent**: Choose an idle agent or launch a new session
3. **Configure context**: Set working directory, branch, and relevant files
4. **Dispatch**: Send the task to the agent with full instructions
5. **Track**: Add the task to the fleet board with monitoring

#### Dispatch Template

```
Task: [description]
Priority: [high/medium/low]
Agent: [session-id]
Branch: [git-branch]
Files: [relevant file paths]
Constraints: [time limit, tool restrictions]
```

### 3. Session Takeover

When the user needs to take control of an agent session:

1. Identify the target session by ID or task name
2. Display the session's current state and recent actions
3. Pause the agent's autonomous execution
4. Transfer control to the user's current session
5. Provide context summary so the user can continue seamlessly

### 4. Fleet Monitoring (Background)

The fleet-monitor agent (haiku model) runs in the background to:

- Track session heartbeats and detect stalled agents
- Report completion or failure of dispatched tasks
- Alert on agents that exceed time or resource budgets
- Maintain a real-time fleet status board

### 5. Task Board Management

Manage the task board lifecycle:

- **Add tasks**: Queue new tasks for assignment
- **Assign tasks**: Match tasks to available agents
- **Track progress**: Update completion percentages
- **Close tasks**: Mark completed and archive results
- **Requeue failed tasks**: Reassign tasks from failed sessions

## Output Format

Present fleet status as a formatted dashboard with clear visual hierarchy. Use tables for structured data and status indicators for quick scanning.

## Error Handling

- If no agents are running, offer to dispatch a new one
- If a session is unresponsive, suggest termination and task requeue
- If takeover fails, provide session logs for debugging
