# data-core

Advanced Neon/Postgres database operations with migration support and query optimization.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | n/a | n/a | n/a | n/a | n/a | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | full | none | full | full | partial | full |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Prerequisites

| Variable | Description |
|---|---|
| `NEON_DATABASE_URL` | Neon serverless Postgres connection string |

## Installation

```bash
/plugin install data-core
```

## Usage

This is an MCP-only plugin with no commands, agents, or skills. Once installed, the Postgres MCP server exposes SQL execution tools directly to Claude Code.

Available tools include:

- **query** -- Execute read-only SQL queries against the database
- **execute** -- Run write operations (INSERT, UPDATE, DELETE, DDL)

Example interaction:

```
> Show me all tables in the public schema

> Run a migration to add a created_at column to the users table
```

## Configuration

Add your Neon connection string to `.env`:

```bash
NEON_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

The plugin configures the MCP server in `.mcp.json` using `${NEON_DATABASE_URL}`.

## Architecture

Connects to Neon serverless Postgres via the Postgres MCP Pro server (`postgres-mcp` on PyPI, run with `uvx`; the archived `@modelcontextprotocol/server-postgres` is no longer used). The connection string is passed as the `DATABASE_URI` environment variable, not a command-line argument, so it does not show up in `ps`. The server translates Claude Code tool calls into SQL operations against the configured database. All queries run through the MCP protocol with no local database drivers required.
