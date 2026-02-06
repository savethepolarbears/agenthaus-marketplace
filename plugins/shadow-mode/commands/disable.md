---
name: disable
description: Disable shadow mode and resume normal execution
---

You are disabling shadow mode. Actions will execute normally after this.

Follow these steps:

1. Check if `.shadow-mode-enabled` exists. If it does not, report that shadow mode is already inactive and stop.

2. Remove the `.shadow-mode-enabled` file.

3. Check if there are any pending items in `review_queue/` (excluding the `rejected/` subdirectory). If there are, warn the user:
```
Warning: {count} actions still pending in review_queue/.
Run /review to process them before they are lost.
```

4. Confirm deactivation:
```
Shadow Mode: INACTIVE
All actions will now execute normally.
```
