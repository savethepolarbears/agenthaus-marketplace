---
name: apple-automation
description: Build and run Apple Shortcuts automation workflows on macOS. Use when the user wants to chain shortcuts, automate multi-step productivity workflows, or integrate shortcut results with Notes and Reminders.
---

# Skill: Apple Shortcuts Automation Workflows

Use this skill when the user wants to automate workflows using Apple Shortcuts, chain multiple automations together, or integrate shortcut results with Notes and Reminders.

## When to Use

- User wants to run a shortcut and save the output
- User describes a multi-step workflow that could be automated
- User wants to chain shortcuts together
- User asks about automation patterns for daily routines
- User wants to integrate shortcut results with Notes or Reminders

## Prerequisites

- macOS with `shortcuts` CLI available
- `apple-productivity` MCP server running
- Relevant shortcuts already installed (for execution)

## Automation Patterns

### Pattern 1: Morning Briefing

**Goal**: Compile a daily productivity summary.

Steps:
1. Call `reminders_list(view="overdue")` to find overdue items.
2. Call `reminders_list(view="today")` to get today's tasks.
3. Call `shortcuts_list` to check for a "Daily Summary" shortcut.
4. If found, run it with `shortcuts_run("Daily Summary")`.
5. Compile all results into a structured briefing.
6. Optionally save the briefing as a note with `notes_create`.

### Pattern 2: Content Pipeline

**Goal**: Gather, process, and store content automatically.

Steps:
1. Run a data-gathering shortcut: `shortcuts_run("Fetch RSS", input_text="https://...")`.
2. Capture the stdout output.
3. Create a note with the content: `notes_create(title="RSS Digest — [date]", body=output)`.
4. Create a reminder to review: `reminders_add(title="Review RSS digest", due="today 5pm")`.

### Pattern 3: End-of-Day Capture

**Goal**: Log completed work and carry forward incomplete tasks.

Steps:
1. Call `reminders_list(view="today")` to get today's items.
2. Separate completed from incomplete reminders.
3. Create a daily log note: `notes_create(title="Daily Log — [date]", body=summary)`.
4. For incomplete items, reschedule to tomorrow: `reminders_update(ref, due="tomorrow")`.

### Pattern 4: Project Kickoff

**Goal**: Set up notes and reminders for a new project.

Steps:
1. Create a notes folder: `notes_create_folder("Project: [name]")`.
2. Create a kickoff note with goals and scope.
3. Create a reminder list: `reminder_list_create("Project: [name]")`.
4. Add initial task reminders with due dates.
5. If a project template shortcut exists, run it.

### Pattern 5: Research and Archive

**Goal**: Run a research shortcut and archive the results.

Steps:
1. Verify the shortcut exists: `shortcuts_list`.
2. Run with input: `shortcuts_run("Research", input_text=query)`.
3. Save output to notes: `notes_create(title="Research: [topic]", body=output, folder="Research")`.
4. Create a follow-up reminder if action is needed.

## Chaining Shortcuts

When chaining multiple shortcuts:

1. **Verify all shortcuts exist** before starting the chain.
2. **Run sequentially**: Execute each shortcut one at a time.
3. **Pass output forward**: Use stdout from one shortcut as `input_text` for the next.
4. **Check exit codes**: If any shortcut fails (exit_code != 0), stop the chain and report the error.
5. **Save intermediate results**: For long chains, save intermediate output to notes as checkpoints.

Example chain:
```
shortcuts_run("Fetch Data", input_text=url)
  → stdout → shortcuts_run("Process Data", input_text=previous_stdout)
  → stdout → shortcuts_run("Format Report", input_text=previous_stdout)
  → stdout → notes_create(title="Report", body=final_stdout)
```

## Error Handling

- If a shortcut is not found, suggest listing all shortcuts and checking the name.
- If a shortcut hangs, it may be waiting for interactive input. Suggest the user design shortcuts without modal prompts for CLI use.
- If output is empty, the shortcut may not have a "Stop and Output" action at the end.
- If permissions are denied, suggest checking System Settings > Privacy & Security.

## Best Practices

1. **Design shortcuts for CLI**: Avoid interactive prompts, alerts, and "Ask for Input" actions.
2. **Use "Stop and Output"**: End shortcuts with this action to return data to the CLI.
3. **Keep shortcuts focused**: One task per shortcut makes chaining easier.
4. **Test individually**: Run each shortcut alone before chaining.
5. **Document inputs/outputs**: Note what each shortcut expects and produces.
