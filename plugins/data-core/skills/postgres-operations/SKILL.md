---
name: postgres-operations
description: Perform advanced Postgres database operations including schema design, migrations, query optimization, and data management on Neon serverless databases. Use when the user asks to design database schemas, write or optimize SQL queries, create migration scripts, manage indexes, or troubleshoot database performance via the Postgres MCP server.
---

# Advanced Postgres Operations

Schema design, migrations, query optimization, and data management for Neon serverless Postgres databases.

## When to Use

- User asks to design or modify a database schema
- User needs to write, debug, or optimize SQL queries
- User wants to create or run database migration scripts
- User asks about index strategy or query performance
- User needs to manage data (CRUD operations, bulk imports, data cleanup)
- User wants to analyze table structure, constraints, or relationships

## Prerequisites

- `NEON_DATABASE_URL` or `DATABASE_URL` environment variable must be set
- Postgres MCP server (`@modelcontextprotocol/server-postgres`) must be available

## Steps

### 1. Schema Design

When designing or modifying schemas:

1. **Understand requirements**: Gather entity relationships, cardinality, and constraints
2. **Design tables**: Create normalized schemas with appropriate data types
3. **Add constraints**: Primary keys, foreign keys, unique constraints, check constraints
4. **Plan indexes**: Design indexes based on expected query patterns
5. **Generate DDL**: Produce `CREATE TABLE` statements ready to execute

#### Schema Best Practices

- Use `UUID` or `BIGSERIAL` for primary keys
- Always add `created_at TIMESTAMPTZ DEFAULT NOW()` and `updated_at` columns
- Use `TEXT` instead of `VARCHAR` unless a hard length limit is required
- Add `NOT NULL` constraints wherever possible
- Use `ENUM` types for fixed-set columns
- Name foreign key columns as `<referenced_table>_id`

### 2. Migration Management

When creating migrations:

1. **Naming convention**: `YYYYMMDD_HHMMSS_description.sql`
2. **Up migration**: Schema changes to apply
3. **Down migration**: Rollback statements (in a separate file or commented section)
4. **Idempotency**: Use `IF NOT EXISTS` / `IF EXISTS` where possible
5. **Data migrations**: Separate from schema migrations

#### Migration Template

```sql
-- Migration: 20260315_120000_add_users_table.sql
-- Description: Create users table with authentication fields

BEGIN;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

COMMIT;
```

### 3. Query Optimization

When optimizing queries:

1. **Analyze the query**: Run `EXPLAIN ANALYZE` to understand the execution plan
2. **Identify bottlenecks**: Look for sequential scans, nested loops, high row estimates
3. **Optimize**: Suggest index additions, query rewrites, or schema changes
4. **Benchmark**: Compare before/after execution times

#### Common Optimizations

- Add indexes on columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses
- Replace `SELECT *` with specific columns
- Use `EXISTS` instead of `IN` for subqueries
- Batch large `INSERT` operations
- Use `LIMIT` with `OFFSET` pagination carefully (prefer keyset pagination)
- Avoid `LIKE '%term%'` — use full-text search or trigram indexes instead

### 4. Data Operations

For data management tasks:

1. **Reads**: Construct efficient SELECT queries with proper filtering
2. **Writes**: Generate INSERT/UPDATE/DELETE with safety checks
3. **Bulk operations**: Use `COPY` or batch INSERT for large datasets
4. **Cleanup**: Identify and remove orphaned or stale data

**Safety rules:**
- Always use `BEGIN`/`COMMIT` for multi-statement operations
- Require `WHERE` clauses on UPDATE and DELETE (no unfiltered mutations)
- Prompt for confirmation before destructive operations
- Suggest `SELECT` preview before any DELETE or UPDATE

## Output Format

For schema changes:
```sql
-- Table: users
-- Purpose: Store user accounts and authentication data

CREATE TABLE users ( ... );
```

For query results, present in markdown tables with row counts.

## Error Handling

- Connection failures: Verify `DATABASE_URL` is set and network is accessible
- Permission errors: Check database role has required privileges
- Migration conflicts: Detect and report conflicting schema changes
- Query timeouts: Suggest `SET statement_timeout` for long-running queries
