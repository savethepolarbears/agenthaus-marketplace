---
name: doc-lookup
description: Fetch up-to-date, hallucination-free documentation for any library, framework, or API using Context7. Use when the user asks about library APIs, needs accurate documentation references, wants to verify framework behavior, or needs code examples from official docs instead of training data.
---

# Documentation Lookup (Context7)

Retrieve accurate, up-to-date library documentation to prevent hallucination and ensure correct API usage.

## When to Use

- User asks how to use a specific library, framework, or API
- User needs accurate function signatures, parameters, or return types
- User wants code examples from official documentation
- User is debugging and needs to verify correct API behavior
- You are unsure about a library's API and need to verify before writing code
- User asks about breaking changes or migration guides between versions

## Prerequisites

- Context7 MCP server (`@modelcontextprotocol/server-context7`) must be available
- `CONTEXT7_API_KEY` environment variable should be set (if required)

## Steps

### 1. Identify the Library

1. Determine the library or framework from the user's question
2. Identify the specific version if mentioned (otherwise use latest)
3. Note the specific API, function, or concept they need help with

### 2. Fetch Documentation

1. Use the `context7` MCP tools to search for the library
2. Query for the specific topic, function, or API endpoint
3. Retrieve the relevant documentation sections

### 3. Synthesize the Response

1. Present the official documentation content accurately
2. Include function signatures with parameter types and descriptions
3. Provide code examples directly from the documentation
4. Note any version-specific behavior or deprecation warnings
5. Link to related documentation sections when relevant

### 4. Verify Against Context

When writing code based on documentation:

1. Cross-reference the fetched docs with the user's codebase version
2. Flag any version mismatches between docs and installed packages
3. Highlight breaking changes if the user is on an older version
4. Suggest migration steps if an upgrade is needed

## Output Format

```markdown
## [Library Name] — [Topic/Function]

### Signature
\`\`\`typescript
functionName(param1: Type, param2: Type): ReturnType
\`\`\`

### Parameters
- **param1** (`Type`): Description
- **param2** (`Type`): Description

### Returns
`ReturnType` — Description

### Example
\`\`\`typescript
// Code example from official docs
\`\`\`

### Notes
- Any caveats, version requirements, or related functions
```

## Best Practices

- Always fetch docs before writing code for unfamiliar APIs
- Prefer Context7 docs over training data for accuracy
- Check the installed version in `package.json` before looking up docs
- When multiple libraries could solve a problem, fetch docs for each to compare
- Cache frequently accessed documentation mentally within a session to reduce lookups
