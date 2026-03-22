---
name: recall
description: Search and retrieve memories from persistent storage
---

You are retrieving memories from the Postgres MCP server.

Follow these steps:

1. **Parse the query**: Take $ARGUMENTS as the search query. If empty, retrieve the 10 most recent memories.

2. **Search memories**: Run this SQL via the postgres MCP tool:
```sql
SELECT id, content, tags, created_at, session_id
FROM memories
WHERE content ILIKE '%<search_term>%'
   OR EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%<search_term>%')
ORDER BY created_at DESC
LIMIT 20;
```

   If $ARGUMENTS contains `--all`, remove the LIMIT clause.
   If $ARGUMENTS contains `--tag <tagname>`, filter by tag specifically:
```sql
SELECT id, content, tags, created_at, session_id
FROM memories
WHERE tags @> ARRAY['<tagname>']::text[]
ORDER BY created_at DESC;
```

3. **Display results** in a readable format:
```
=== MEMORIES ===

[#42] 2025-01-15 14:30 | Tags: #api #debugging
  The Stripe webhook endpoint requires idempotency keys for retry safety...

[#38] 2025-01-14 09:15 | Tags: #architecture
  The payment service uses event sourcing with a 24-hour replay window...

Found 2 memories matching "stripe"
```

4. If no results found, suggest broadening the search or list available tags:
```sql
SELECT DISTINCT unnest(tags) as tag, COUNT(*) as count
FROM memories
GROUP BY tag
ORDER BY count DESC
LIMIT 20;
```
