---
description: "Check Encharge API connectivity, account info, credit usage, and configured accounts. Diagnose integration issues."
---

# Account Status & Health Check

Use these commands to verify your Encharge API configuration, check account details, monitor API credit usage, and diagnose connectivity issues.

## Quick Actions

**Check API status:**
```
/encharge:status
```

**Get detailed account info:**
```
/encharge:status --verbose [--account my-account]
```

**Check API credit usage:**
```
/encharge:status --show-credits [--account my-account]
```

**List all configured accounts:**
```
/encharge:status --list-accounts
```

**Verify multi-account setup:**
```
/encharge:status --all-accounts
```

**Export account inventory:**
```
/encharge:status --export json --output accounts.json
```

## Available MCP Tools

### Account Discovery

- **encharge_list_accounts**: List all configured Encharge accounts
  - Returns: account names, API key status, default account
  - Useful for multi-account workflows
  - Shows account configuration source (env var, config file, single key)

### Account Information

- **encharge_get_account**: Get account details
  - Returns: account name, tier, creation date, contact count, email limit
  - Shows API key permissions/scope
  - Useful for capacity planning

- **encharge_get_account_custom_objects**: List custom object schemas
  - Returns: object type, field names, field types, required fields
  - Needed to understand custom data structure

### Usage & Limits

- **encharge_get_account_limits**: Check API quotas and current usage
  - Returns: monthly credit limit, used credits, resets at date
  - Shows: concurrent request limits, rate limits
  - Plan capacity around limits

## Status Response Format

When you run `/encharge:status`, you get:

```
✓ API Connectivity: OK
✓ Account: my-account (connected)
✓ API Tier: Professional
✓ Active Contacts: 2,847
✓ Custom Objects: 5
✓ Email Sending: Enabled
  └ Monthly Limit: 100,000
  └ Sent This Month: 34,200
  └ Remaining: 65,800

Multi-Account Status:
  ├─ my-account (production): OK
  ├─ my-account-staging: OK
  └─ partner-account: OK
```

## Common Workflows

### Diagnose Integration Issues

1. Run basic health check:
   ```
   /encharge:status
   ```

2. If fails, check API key validity:
   ```
   Verify ENCHARGE_API_KEY env variable is set
   Verify key has not been rotated
   Check account access permissions
   ```

3. Run verbose diagnostics:
   ```
   /encharge:status --verbose
   ```

4. Check network/firewall access to Encharge API

### Monitor API Credit Usage

Before running bulk operations:

```
1. Check remaining credits: /encharge:status --show-credits
2. Review operation cost:
   - List contacts: 1 credit per 100 contacts
   - Tag operations: 0.1 credits per operation
   - Email send: 0.5 credits per email
3. Estimate total cost
4. Proceed only if sufficient credits
```

### Set Up Multi-Account Rotation

If managing multiple Encharge accounts:

```
1. List all accounts: /encharge:status --list-accounts
2. Verify each is accessible: /encharge:status --all-accounts
3. Note default account
4. In operations, specify: account="specific-account-name"
```

### Capacity Planning

Use account details to plan campaigns:

1. Get account limits: `encharge_get_account_limits`
2. Get contact count: `encharge_get_account`
3. Calculate available email sends
4. Plan campaign timing around limits

Example:
```
Account: 50,000 contacts
Monthly email limit: 500,000
Safe batch size per send: 5,000 (0.5M used, 1M remaining for other campaigns)
Can safely send 10 campaigns of 50K recipients/month
```

### Verify Custom Object Setup

Before bulk custom field operations:

```
1. Get custom objects: encharge_get_account_custom_objects
2. Review field names and types
3. Note required vs optional fields
4. Map your data to Encharge fields
5. Test with small batch before bulk operation
```

## Multi-Account Configuration

### Option A: Environment Variable (JSON)

```bash
export ENCHARGE_ACCOUNTS='{"account-a":{"apiKey":"key1"},"account-b":{"apiKey":"key2"}}'
export ENCHARGE_DEFAULT_ACCOUNT="account-a"
```

Check status:
```
/encharge:status --all-accounts
```

### Option B: Configuration File

```bash
export ENCHARGE_WORKSPACE_CONFIG="/path/to/encharge.config.json"
```

File format:
```json
{
  "accounts": {
    "production": { "apiKey": "key1" },
    "staging": { "apiKey": "key2" }
  },
  "defaultAccount": "production"
}
```

### Option C: Single Account (Default)

```bash
export ENCHARGE_API_KEY="your-api-key-here"
```

All operations target single account.

## Health Check Indicators

| Indicator | Status | Action |
|-----------|--------|--------|
| API Connectivity | ✓ OK | Normal operation |
| API Connectivity | ✗ Failed | Check API key, network, Encharge status page |
| Credits | > 1000 | Safe to operate |
| Credits | 100-1000 | Plan large operations carefully |
| Credits | < 100 | Buy more credits or reduce operations |
| Contact Limit | 80%+ used | Plan storage strategy |
| Email Limit | 80%+ used | Reduce send frequency or upgrade |
| Custom Objects | Healthy | Proceed with custom field operations |

## Troubleshooting

| Problem | Diagnosis | Solution |
|---------|-----------|----------|
| "API key invalid" | Run status check | Verify ENCHARGE_API_KEY, regenerate if needed |
| "Account not found" | Check multi-account config | Verify account name in ENCHARGE_ACCOUNTS |
| "Insufficient credits" | Check --show-credits | Purchase more credits or defer operations |
| "Rate limit exceeded" | Monitor API usage | Implement exponential backoff, reduce concurrency |
| "Custom object not found" | List custom objects | Verify custom object type name, check schema |
| "Permission denied" | API key scope issue | Verify API key permissions in Encharge dashboard |

## Integration Checklist

Before deploying Encharge integration to production:

- [ ] API key valid and environment variable set
- [ ] Account status returns "OK"
- [ ] Contact count is accurate (matches UI)
- [ ] Custom objects configured as expected
- [ ] Email sending enabled and limit verified
- [ ] Multi-account setup tested (if applicable)
- [ ] Rate limits documented and backoff implemented
- [ ] Credit budget understood and monitored
- [ ] Error handling in place for failed API calls
- [ ] Logging configured for audit trail

## See Also

- `/encharge:people` — Check contact operations
- `/encharge:tags` — Verify tag setup
- `/encharge:emails` — Test email templates
