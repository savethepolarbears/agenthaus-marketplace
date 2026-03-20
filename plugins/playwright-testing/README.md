# Playwright Testing Plugin

Automate end‑to‑end testing with the **playwright-testing** plugin.  It leverages Playwright to launch a headless browser, run scripted interactions, and return detailed results.  A QA engineer subagent writes and executes tests on demand.

## Platform Support

| Feature | Claude Code | Codex CLI | Gemini CLI | Cursor | Windsurf | Claude Desktop |
|---------|-------------|-----------|------------|--------|----------|----------------|
| Commands/Agents | full | partial | partial | partial | partial | n/a |
| Skills | full | full | full | full | full | n/a |
| MCP | full | none | full | full | partial | full |
| Hooks | n/a | n/a | n/a | n/a | n/a | n/a |

## Features

* **Automated test generation** – When you ask Claude to test a flow (for example, "Test the login page"), the QA agent writes a Playwright script tailored to your scenario.
* **Real browser execution** – The Playwright MCP server runs your script in a headless (or optionally visible) browser.  You can simulate clicks, form submissions, and multi‑page workflows.
* **Structured results** – After execution, Claude summarises whether the test passed and provides any console output or errors.  You can iterate quickly on failing tests.

## Installation

```bash
/plugin install playwright-testing@AgentHaus
```

No custom commands are provided; instead, simply describe the test you’d like to run in natural language.  For example:

```bash
Test our login page by entering a valid email and password, verify that the dashboard loads, then log out.

Simulate adding an item to the cart and proceed through checkout.  Confirm the order confirmation page appears.
```

The agent will generate and run appropriate Playwright scripts.  Ensure that Node.js is installed in your environment; the plugin uses the Playwright MCP server (`@modelcontextprotocol/server-playwright`), which installs dependencies automatically.
