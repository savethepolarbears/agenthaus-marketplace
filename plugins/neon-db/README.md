# Neon DB Plugin

Connect to Neon’s serverless Postgres with the **neon-db** plugin.  The plugin wraps the Postgres MCP server and provides a simple slash command for executing SQL.

## Features

* **Run queries** – Use `/neon-db:query <SQL>` to run arbitrary SQL against your Neon database.  Results are returned as a table where appropriate.
* **Safe operations** – Destructive queries (INSERT, UPDATE, DELETE, DROP) trigger a confirmation prompt.  The plugin respects transactions and rolls back on errors.
* **Configuration** – Set the `NEON_DATABASE_URL` environment variable to your database connection string.  The Postgres MCP server will use this to connect.

## Installation

```bash
/plugin install neon-db@AgentHaus
```

After installation, call `/neon-db:query` followed by your SQL.  Example:

```bash
/neon-db:query SELECT * FROM users LIMIT 5;
```

The plugin will return the first five rows of the `users` table.
