---
name: remote
description: Send a command to a remote OpenClaw instance
---

You are sending a command to a remote OpenClaw instance.

Take $ARGUMENTS in the format: `<instance_url> <command_text>`

Follow these steps:

1. **Parse arguments**: Split $ARGUMENTS into:
   - `instance_url` -- The URL of the remote OpenClaw instance (e.g., `https://openclaw.example.com`)
   - `command_text` -- Everything after the URL is the command to send

   If arguments are missing or malformed, display usage:
   ```
   Usage: /remote <instance_url> <command_text>
   Example: /remote https://openclaw.local:8080 run skill greeting --name "World"
   ```

2. **Validate the URL**: Ensure the instance URL is a valid HTTPS URL. Warn if HTTP is used.

3. **Send the command**: Use an HTTP POST request via curl to `{instance_url}/api/v1/execute`:
   ```bash
   curl -s -X POST "{instance_url}/api/v1/execute" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ${OPENCLAW_API_KEY}" \
     -d '{"command": "<command_text>", "source": "agenthaus-bridge", "timestamp": "<ISO timestamp>"}'
   ```

4. **Handle the response**:
   - **Success (200)**: Display the response body with any output from the remote execution
   - **Auth required (401/403)**: Report that `OPENCLAW_API_KEY` environment variable must be set
   - **Not found (404)**: Report that the endpoint was not found -- the instance may not support remote execution
   - **Error (5xx)**: Report the server error and suggest checking the remote instance logs
   - **Connection error**: Report that the instance is unreachable

5. **Display result**:
```
Remote execution on {instance_url}:
  Command: {command_text}
  Status: {success/failure}
  Response: {response body}
```
