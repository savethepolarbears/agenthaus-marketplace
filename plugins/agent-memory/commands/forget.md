---
name: forget
description: Delete a memory from persistent storage
---

You are deleting a memory from the Postgres MCP server.

Follow these steps:

1. **Parse the input**: Take $ARGUMENTS which can be:
   - A numeric ID (e.g., `42`) -- delete by exact ID
   - A search term (e.g., `stripe webhook`) -- find and confirm before deleting
   - `--older-than <days>` -- delete memories older than N days
   - `--tag <tagname>` -- delete all memories with a specific tag

2. **If deleting by ID**:
   - First SELECT the memory to show what will be deleted:
     `SELECT id, content, tags, created_at FROM memories WHERE id = <id>;`
   - Display the memory content and confirm the deletion
   - Run: `DELETE FROM memories WHERE id = <id> RETURNING id, content;`

3. **If deleting by search term**:
   - First search: `SELECT id, content, tags, created_at FROM memories WHERE content ILIKE '%<term>%';`
   - Display all matches
   - State clearly which memories will be deleted and the count
   - Run the DELETE for matching IDs

4. **If deleting by age**:
   - Run: `DELETE FROM memories WHERE created_at < NOW() - INTERVAL '<days> days' RETURNING id;`
   - Report how many memories were removed

5. **If deleting by tag**:
   - Run: `DELETE FROM memories WHERE tags @> ARRAY['<tagname>']::text[] RETURNING id, content;`
   - Report how many memories were removed

6. **Confirm deletion**: Display the count of deleted memories and their IDs.

IMPORTANT: Always show what will be deleted before executing the DELETE statement. This is a destructive operation.
