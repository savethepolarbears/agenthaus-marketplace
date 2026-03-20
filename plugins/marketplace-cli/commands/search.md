---
description: Search AgentHaus for available plugins
---
# /marketplace:search <query>

When a user invokes this command with a search query, perform the following steps:

1. Query the marketplace API endpoint (via the web app or directly hitting the GitHub registry) to retrieve plugins whose names or descriptions match the query.
2. Present a list of matching plugins, including their name, description, and installation command.
3. If no plugins match, suggest visiting the AgentHaus website or submitting a feature request.
