## Multi-Account Patterns

### Pattern 1: Single Default Account

```bash
export ENCHARGE_API_KEY="key1"
# All operations target this account
encharge_get_all_people  # Uses default
```

### Pattern 2: Multiple Named Accounts

```bash
export ENCHARGE_ACCOUNTS='{"prod":{"apiKey":"key1"},"staging":{"apiKey":"key2"}}'
export ENCHARGE_DEFAULT_ACCOUNT="prod"

encharge_get_all_people --account prod      # Specific account
encharge_get_all_people                     # Uses default
encharge_list_accounts                      # See all
```

### Pattern 3: Workspace Config File

```bash
export ENCHARGE_WORKSPACE_CONFIG="/path/to/encharge.config.json"

# File contents:
{
  "accounts": {
    "production": {"apiKey": "key1"},
    "staging": {"apiKey": "key2"}
  },
  "defaultAccount": "production"
}
```

