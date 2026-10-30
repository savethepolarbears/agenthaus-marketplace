## Output Expectations

For every task, return:

| Field | Description |
| ------- | ------------- |
| **target** | Site alias, URL, or group |
| **command** | WP-CLI command or REST operation executed |
| **mode** | `read-only`, `dry-run`, or `mutating` |
| **success** | `true` or `false` |
| **result** | Parsed JSON when available |
| **summary** | Short human-readable description |
| **next_action** | Suggested follow-up (only if needed) |

