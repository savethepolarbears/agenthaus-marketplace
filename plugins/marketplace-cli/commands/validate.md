---
name: validate
description: Validate a plugin directory for correctness and completeness
---

When the user runs `/marketplace:validate <plugin-path>`, validate the specified plugin directory:

1. Check that `.claude-plugin/plugin.json` exists and is valid JSON
2. Verify required fields: `name` (kebab-case), `version` (semver), `description` (non-empty)
3. For each file referenced in `commands[]`, `agents[]`, `skills[]`, `hooks[]` — verify the file exists
4. If `.mcp.json` exists, verify it is valid JSON with a `mcpServers` object
5. Check that `README.md` exists
6. Verify `tags` is a non-empty array if present
7. Check that `author`, `homepage`, and `license` fields are present

Report results as a checklist with pass/fail for each check. Summarize with an overall pass/fail status.

If no `<plugin-path>` is provided, default to the current working directory.
