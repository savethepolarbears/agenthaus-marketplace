# Agent Memory

Shared persistent memory across agent sessions using Neon Postgres. Store, search, and manage knowledge that persists between conversations.

## Prerequisites

| Variable | Description |
|----------|-------------|
| `NEON_DATABASE_URL` | Neon Postgres connection string |

## Installation

```bash
/plugin install agent-memory
```

Ensure `NEON_DATABASE_URL` is set in your environment before using memory commands.

## Usage

### Store a Memory

```
/remember The Stripe API requires idempotency keys for POST requests #api #stripe
```

Hashtags are automatically extracted as searchable tags.

### Search Memories

```
/recall stripe
/recall --tag api
/recall --all
```

### Delete a Memory

```
/forget 42
/forget stripe webhook
/forget --older-than 90
/forget --tag deprecated
```

## Architecture

This plugin uses the Postgres MCP server to connect to a Neon serverless database. Memories are stored in a `memories` table with full-text search indexes.

### MCP Configuration

The `.mcp.json` configures a Postgres MCP server pointing to `${NEON_DATABASE_URL}`.

### Database Schema

```sql
memories (
    id          SERIAL PRIMARY KEY,
    content     TEXT NOT NULL,
    tags        TEXT[] DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    session_id  TEXT,
    context     TEXT
)
```

Indexes:
- GIN index on `to_tsvector('english', content)` for full-text search
- GIN index on `tags` for tag-based filtering

### Memory Protocol Skill

The included skill teaches agents to automatically persist learnings at the end of significant tasks, using consistent tagging for discoverability across sessions.
