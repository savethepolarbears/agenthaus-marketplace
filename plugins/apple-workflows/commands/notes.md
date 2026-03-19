---
description: Create, search, update, move, and delete Apple Notes. Usage: `/apple-workflows:notes <action> [args]` where action is search, create, get, update, move, delete, folders, or accounts.
---
Given "$ARGUMENTS" as the user input (action and arguments), use the `apple-productivity` MCP tools to manage Apple Notes.

**Parse the action from the first word of $ARGUMENTS:**

- **search <query>**: Use `notes_search` to find notes matching the query. Present results as a numbered list with titles and modification dates.
- **create <title> [body]**: Use `notes_create` with the given title and body. If no body is provided, ask the user for content. Optionally accept `--folder <name>` and `--account <name>` flags.
- **get <title or id>**: Use `notes_get` to retrieve a specific note. Display the full content.
- **update <title or id> [--title <new_title>] [--body <new_body>]**: Use `notes_update` to modify an existing note. If the reference is ambiguous, present matching notes and ask the user to pick one.
- **move <title or id> --folder <folder>**: Use `notes_move` to file a note into a different folder.
- **delete <title or id>**: Use `notes_delete` with `confirm=True` only after explicitly confirming with the user. Never auto-confirm deletions.
- **folders [account]**: Use `notes_folders` to list all folders, optionally filtered by account.
- **accounts**: Use `notes_accounts` to list available Notes accounts.

**Safety rules:**
- For delete operations, always ask the user to confirm before passing `confirm=True`.
- If a note reference is ambiguous, present all matches and let the user choose.
- Prefer note IDs over titles for follow-up mutations when available.
