---
name: kv
description: Perform key–value operations on Cloudflare KV. Usage: `/cloudflare-platform:kv <get|put|delete> <namespace> <key> [value]`
---
This command uses the `cloudflare` MCP tools to interact with Cloudflare’s KV storage.  Supported operations:

- **get** – Retrieve the value associated with a key.  Returns the value or indicates if the key does not exist.
- **put** – Set a key to a given value.  Require the value argument.  Confirm success.
- **delete** – Remove a key/value pair from the namespace.  Confirm deletion.

Prompt the user for confirmation before destructive operations (put/delete).  Ensure that the provided namespace exists; if not, return an informative error.