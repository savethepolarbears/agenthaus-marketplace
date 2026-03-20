---
name: query
description: Execute a SQL query against a Neon Postgres database. Usage: `/neon-db:query <SQL>`
---
When invoked with a SQL statement, use the `postgres` MCP tool to execute it against the configured Neon database.  Return the results in a tabular format if available.  If the query alters data (INSERT, UPDATE, DELETE), summarise how many rows were affected.  Prompt for confirmation before performing destructive queries.  Respect transactional semantics and roll back on errors.