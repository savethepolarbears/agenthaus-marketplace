---
name: neon-database
description: Query and manage Neon serverless Postgres databases including running SQL, inspecting schemas, and managing data. Use when the user asks to run SQL queries, inspect database tables, manage data in Neon Postgres, or troubleshoot database connectivity via the Postgres MCP server.
---

# Neon Database Operations

Run SQL queries, inspect schemas, and manage data on Neon serverless Postgres databases.

## When to Use

- User asks to run a SQL query against the database
- User wants to inspect table schemas, columns, or relationships
- User needs to insert, update, or delete data
- User asks about database structure or contents
- User wants to create or modify tables
- User needs to troubleshoot database connectivity

## Prerequisites

- `NEON_DATABASE_URL` or `DATABASE_URL` environment variable must be set
- Postgres MCP server (`@modelcontextprotocol/server-postgres`) must be available

## Steps

### 1. Connect and Verify

1. Confirm the database connection string is available
2. Test connectivity with a simple query (`SELECT 1`)
3. If connection fails, provide troubleshooting guidance

### 2. Schema Inspection

When the user wants to understand the database:

1. **List tables**: Query `information_schema.tables` for user tables
2. **Describe table**: Show columns, types, constraints, and indexes
3. **Show relationships**: Query foreign key constraints
4. **Present schema**: Format as a readable table

```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### 3. Query Execution

When running queries:

1. **SELECT queries**: Execute and present results in markdown tables
2. **Mutations (INSERT/UPDATE/DELETE)**: Always confirm with the user before executing
3. **DDL (CREATE/ALTER/DROP)**: Require explicit confirmation, warn about data loss
4. **Pagination**: For large result sets, use `LIMIT` and offer to fetch more

#### Safety Rules

- Never run `DROP TABLE` or `TRUNCATE` without explicit user confirmation
- Always include `WHERE` clauses on UPDATE and DELETE
- Preview affected rows with `SELECT` before mutations
- Use transactions (`BEGIN`/`COMMIT`) for multi-statement operations

### 4. Common Operations

#### List all tables
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

#### Count rows in a table
```sql
SELECT COUNT(*) FROM table_name;
```

#### Show table size
```sql
SELECT pg_size_pretty(pg_total_relation_size('table_name'));
```

#### Check active connections
```sql
SELECT count(*) FROM pg_stat_activity;
```

## Output Format

Present query results as markdown tables:

```markdown
| id | name | email | created_at |
|----|------|-------|------------|
| 1 | Alice | alice@example.com | 2026-03-15 |
```

Include row count and execution time when available.

## Error Handling

- Connection refused: Check `DATABASE_URL` format and network access
- Permission denied: Verify database role has required privileges
- Table not found: List available tables and suggest corrections
- Query timeout: Suggest adding `LIMIT` or optimizing the query
