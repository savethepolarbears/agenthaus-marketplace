---
name: docs
description: Find documentation for a specific library. Usage: `/context7-docs:docs <library> <query>`
---
Use the `context7` MCP tools to search for documentation.  Follow these steps:

1. Call `resolve-library-id` with the library name to obtain its unique ID.
2. Call `query-docs` with the ID and the user’s query to fetch relevant documentation sections.
3. Summarise the answer in your own words, include relevant code examples, and cite the library version if available.

If no documentation is found, inform the user and suggest alternative queries.