---
description: List, run, and manage Apple Shortcuts. Usage: `/apple-workflows:shortcuts [list|run <name> [input]|view <name>|create|open <name>]`
---
Given "$ARGUMENTS" as the user input, use the `apple-productivity` MCP tools to interact with Apple Shortcuts.

**Parse the action from the first word of $ARGUMENTS:**

- **list [--folder <name>] [--folders]**: Use `shortcuts_list` to enumerate installed shortcuts. With `--folders`, list shortcut folders only. With `--folder <name>`, list shortcuts in that folder.
- **run <name> [--input <text>] [--input-file <path>] [--output <path>]**: Use `shortcuts_run` to execute a shortcut by name.
  - If `--input` is provided, pass it as `input_text`.
  - If `--input-file` is provided, pass it as `input_paths`.
  - If `--output` is provided, pass it as `output_path`.
  - Report the exit code, stdout, and any output file created.
- **view <name>**: Use `shortcuts_view` to open a shortcut in the Shortcuts editor.
- **create**: Use `shortcuts_create_new` to open the Shortcuts editor for a new shortcut.
- **open <name>**: Use `shortcuts_open` to jump directly into a named shortcut in the Shortcuts app.

**If no action is given**, default to `list`.

**Tips:**
- Shortcuts that require interactive UI prompts may hang when run from CLI. Warn the user if execution takes too long.
- If the shortcut is not found, suggest running `list` first to verify the name.
