---
name: remember
description: Store a memory in persistent Postgres storage
---

You are storing a new memory using the Postgres MCP server.

Follow these steps:

1. **Ensure the table exists**: Run this SQL via the postgres MCP tool:
```sql
CREATE TABLE IF NOT EXISTS memories (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    context TEXT
);
CREATE INDEX IF NOT EXISTS idx_memories_content ON memories USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING gin(tags);
```

2. **Parse the input**: Take $ARGUMENTS as the content to remember. If the content contains hashtags (e.g., `#debugging #api`), extract them as tags. The remaining text is the content.

3. **Insert the memory**:
```sql
INSERT INTO memories (content, tags, session_id)
VALUES ('<content>', ARRAY[<tags>], '<session-identifier>')
RETURNING id, content, tags, created_at;
```

4. **Confirm storage**: Display the memory ID, content preview, tags, and timestamp.

If no $ARGUMENTS are provided, ask the user what they want to remember.
