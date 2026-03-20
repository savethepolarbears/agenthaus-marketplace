# Context7 Docs Plugin

Quickly fetch reliable documentation with the **context7-docs** plugin.  Instead of hallucinating API usage, Claude calls Context7 to retrieve official docs for the library you need.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | full | none | full | full | partial | full |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Features

* **Library resolution** – Use `/context7-docs:docs <library> <query>` to find the right documentation.  The plugin first resolves the library name to a unique ID and then queries the docs database.
* **Detailed answers with examples** – Claude summarises the retrieved documentation, extracts code examples and explains API usage.  If multiple versions exist, the latest stable version is used.
* **Optional API key** – For most public libraries, no API key is required.  If you have a Context7 API key, set `CONTEXT7_API_KEY` to enable access to private or rate‑limited docs.

## Installation

```bash
/plugin install context7-docs@AgentHaus
```

After installation, call the `/context7-docs:docs` command as in the examples:

```bash
/context7-docs:docs pandas read_csv
/context7-docs:docs react useEffect
```

The plugin will return authoritative guidance drawn from official documentation.
