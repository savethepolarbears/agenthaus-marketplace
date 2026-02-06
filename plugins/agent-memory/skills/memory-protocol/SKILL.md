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
   OR '<tag>' = ANY(tags)
ORDER BY created_at DESC
LIMIT 10;
```

This provides context from previous sessions and avoids re-discovering known information.

## Memory Lifecycle

- **Create**: Store after completing a task or discovering something notable
- **Read**: Query before starting work in a known area
- **Update**: If a previous memory is outdated, delete the old one and create a new one
- **Delete**: Remove memories that are no longer relevant (deprecated APIs, removed code)

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
