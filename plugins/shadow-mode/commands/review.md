---
name: review
description: Review and approve or reject queued shadow mode actions
---

You are reviewing actions queued during shadow mode.

Follow these steps:

1. **List queued actions**: Read all JSON files from `review_queue/` (excluding the `rejected/` subdirectory). If the directory is empty or does not exist, report "No actions queued for review" and stop.

2. **Display each action** with details:
```
=== REVIEW QUEUE ({count} actions) ===

[1] {timestamp} | Tool: Write
    File: src/main.ts
    Content preview: (first 5 lines of content)
    ---

[2] {timestamp} | Tool: Bash
    Command: npm install express
    ---

[3] {timestamp} | Tool: Edit
    File: package.json
    Change: old_string -> new_string (preview)
    ---
```

3. **Process each action**: For each queued action, present the options:
   - **Approve**: Execute the action as originally intended (run the tool call with the saved parameters)
   - **Reject**: Move the JSON file to `review_queue/rejected/`
   - **Skip**: Leave in queue for later review
   - **Approve all**: Execute all remaining queued actions
   - **Reject all**: Move all remaining to rejected

4. **Execute approved actions**: For each approved action, execute the original tool call and report success or failure.

5. **Summary**: Display how many actions were approved, rejected, and skipped.
