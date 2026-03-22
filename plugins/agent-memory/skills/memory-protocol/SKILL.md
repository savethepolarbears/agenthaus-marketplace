---
name: memory-protocol
description: Persist session learnings to shared Postgres memory for cross-session knowledge retention. Use when storing decisions, errors, patterns, or environment specifics at end of a task, recalling previous session context before starting work, or managing a CRUD lifecycle for agent memories via SQL. Covers tagging, querying, and memory cleanup.
---

# Memory Protocol

Automatically persist session learnings to shared memory for cross-session knowledge retention.

## When to Store Memories

At the end of each significant task, evaluate whether any of the following were discovered:

1. **Key decisions**: Architectural choices, library selections, configuration decisions
2. **Patterns discovered**: Code patterns, API behaviors, framework conventions
3. **Errors encountered**: Error messages with their root causes and solutions
4. **Environment specifics**: System configurations, dependency versions, deployment details
5. **User preferences**: Coding style preferences, workflow patterns, naming conventions

## How to Store

For each item worth remembering, use the postgres MCP tool to INSERT into the memories table:

```sql
INSERT INTO memories (content, tags, session_id, context)
VALUES (
    '<concise description of what was learned>',
    ARRAY['<relevant>', '<tags>'],
    '<current-session-id>',
    '<file or area where this applies>'
);
```

### Tagging Guidelines

Use consistent tags for discoverability:

- `#error` -- Error resolutions
- `#architecture` -- System design decisions
- `#config` -- Configuration knowledge
- `#api` -- API behavior and endpoints
- `#performance` -- Performance findings
- `#security` -- Security-related findings
- `#pattern` -- Reusable code patterns
- `#preference` -- User preferences
- `#workaround` -- Temporary fixes or known issues

## How to Recall

Before starting a new task in a familiar area, query existing memories:

```sql
SELECT id, content, tags, created_at
FROM memories
WHERE content ILIKE '%<relevant-keyword>%'
   OR tags @> ARRAY['<tag>']::text[]
ORDER BY created_at DESC
LIMIT 10;
```

This provides context from previous sessions and avoids re-discovering known information.

## Memory Lifecycle

- **Create**: Store after completing a task or discovering something notable
- **Read**: Query before starting work in a known area
- **Update**: If a previous memory is outdated, delete the old one and create a new one
- **Delete**: Remove memories that are no longer relevant (deprecated APIs, removed code)

## Quick Reference

| Operation | SQL | When |
|-----------|-----|------|
| Store | `INSERT INTO memories (content, tags, session_id, context) VALUES (...)` | End of task with new learnings |
| Recall | `SELECT ... FROM memories WHERE content ILIKE '%keyword%' OR tags @> ARRAY['tag']::text[]` | Start of task in familiar area |
| Update | DELETE old + INSERT new | Memory is outdated |
| Delete | `DELETE FROM memories WHERE id = <id>` | Deprecated API, removed code |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Storing trivial or obvious information | Only store what's non-obvious or was hard-won — decisions, gotchas, error resolutions |
| Using vague tags like `#general` | Use specific tags from the guidelines: `#error`, `#architecture`, `#config`, etc. |
| Not querying memories before starting work | Always check for existing context — avoids re-discovering known issues |
| Storing multiple unrelated learnings in one row | One memory per insight — makes recall and deletion precise |
| Forgetting `session_id` when inserting | Include session ID for traceability across conversations |
| Not cleaning up outdated memories | Periodically delete memories for deprecated APIs, removed code, or changed configs |

## Table Schema

```sql
CREATE TABLE IF NOT EXISTS memories (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    context TEXT
);
```
