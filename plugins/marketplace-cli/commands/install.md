---
description: Install a plugin from AgentHaus
---
# /marketplace:install <plugin-name>

When invoked:

1. Validate that the plugin name exists in the AgentHaus registry.  If it doesn’t, return an error.
2. Call `/plugin install <plugin-name>` to install it into the current Claude environment.
3. Confirm success back to the user and, if relevant, provide setup instructions (e.g. environment variables to set).
