---
description: Security guardrails for secrets, environment variables, and plugin safety
activation: always_on
---

# Security Rules

Security constraints that apply to all work in this repository.

## Secrets Management

- **Never hardcode** API keys, tokens, passwords, or credentials in any file
- Use `${ENV_VAR}` interpolation syntax in MCP configs and hook scripts
- Use `${CLAUDE_PLUGIN_ROOT}` for plugin-local script references
- All required environment variables must be documented in both the plugin README and `.env.example`

## Environment Variables

- `.env` and `.env.local` are gitignored — never commit them
- Reference `.env.example` for the authoritative list of required variables
- When adding a new env var dependency, update `.env.example` immediately

## Plugin Safety

- Plugin hooks run shell commands — review carefully for injection risks
- Only use MCP servers from trusted, documented providers
- Never reference files outside plugin directories (plugins are cached, `../` paths break)
- Validate all inputs at system boundaries (user input, external APIs)

## Pre-Commit Checks

Before committing any changes:

1. Verify no secrets appear in staged files: `git diff --cached | grep -iE '(api_key|token|password|secret)='`
2. Confirm `.env` is not staged: `git status`
3. Validate JSON files: `python3 -m json.tool <file>`
