# Encharge Plugin for Claude Code

Professional marketing automation for Encharge.io with 55 MCP tools, multi-account support, and comprehensive CLI commands.

## Features

- **55 MCP Tools** across 9 domains: People, Tags, Emails, Segments, Custom Objects, Schemas, Webhooks, Accounts, Associations
- **Multi-Account Support** with account discovery, configuration, and cross-account workflows
- **Contact Management** with bulk import/export, de-duplication, lifecycle management
- **Tag Taxonomy** with bulk tagging, strategy tools, and team governance
- **Email Templates** with merge variables, transactional emails, and campaign auditing
- **Segment Operations** with audience export, membership queries, and dynamic segments
- **CLI Commands** for people, tags, emails, status, and segments
- **Marketing Operations Agent** for complex multi-step automation tasks
- **Comprehensive Skill** with 200+ lines of domain knowledge, workflows, and best practices

## Quick Start

### 1. Installation

```bash
# Install via Claude Code marketplace
/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace

# Or install specific plugin
/plugin install encharge
```

### 2. Configuration

Set environment variables in `.env` or system:

```bash
# Single account (simplest)
export ENCHARGE_API_KEY="your-api-key-here"

# Multiple accounts (JSON)
export ENCHARGE_ACCOUNTS='{"prod":{"apiKey":"key1"},"staging":{"apiKey":"key2"}}'
export ENCHARGE_DEFAULT_ACCOUNT="prod"

# Or use workspace config file
export ENCHARGE_WORKSPACE_CONFIG="/path/to/encharge.config.json"
```

### 3. Verify Setup

```bash
# Check API connectivity
/encharge:status

# List accounts (if multi-account)
/encharge:status --list-accounts

# Get detailed info
/encharge:status --verbose
```

## Usage Examples

### People Management

```bash
# List contacts
/encharge:people list --limit 100

# Import from CSV
/encharge:people import --file contacts.csv --mode upsert

# Tag contacts
/encharge:people search --tag "VIP" --account my-account

# Export segment
/encharge:people export --format csv --file vip-customers.csv
```

### Tag Management

```bash
# List all tags
/encharge:tags list

# Create tags
/encharge:tags create "VIP Customer" "High Engagement"

# Bulk tag contacts
/encharge:tags apply "Customer" --file email-list.txt

# Audit unused tags
/encharge:tags stats
```

### Email Management

```bash
# List templates
/encharge:emails list

# Create template
/encharge:emails create --name "Welcome" --subject "Welcome {{firstName}}!" --html-body "<html>...</html>"

# Send transactional
/encharge:emails send --template-id abc123 --email user@example.com --variables '{"firstName":"John"}'

# Get statistics
/encharge:emails stats template-id
```

### Segment Operations

```bash
# List segments
/encharge:segments list

# Export segment
/encharge:segments get "Active Customers" --limit 1000

# Get segment size
/encharge:segments count "Trial Users"

# Find contact's segments
/encharge:segments find-contact email@example.com
```

### Account Status

```bash
# API health check
/encharge:status

# Show credits
/encharge:status --show-credits

# Export account info
/encharge:status --export json --output accounts.json
```

## MCP Tools (55 Total)

### People (10 tools)
- `encharge_get_people` — Get contact by email
- `encharge_get_all_people` — List all contacts
- `encharge_create_update_people` — Upsert contacts (batch)
- `encharge_archive_people` — Soft-delete contacts
- `encharge_restore_people` — Restore archived
- `encharge_unsubscribe_person` — Mark unsubscribed
- `encharge_get_people_in_segment` — Get segment members
- `encharge_get_person_custom_values` — Get custom fields
- `encharge_alias_user` — Merge duplicates
- `encharge_search_people` — Full-text search

### Tags (7 tools)
- `encharge_get_tags` — List tags with counts
- `encharge_get_tag_counts` — Get usage counts
- `encharge_get_tags_by_contact` — Get contact's tags
- `encharge_create_tags` — Create tags (batch)
- `encharge_update_tag` — Rename tag
- `encharge_delete_tag` — Delete unused
- `encharge_add_tag` — Apply to contacts (batch)
- `encharge_remove_tag` — Remove from contacts (batch)

### Emails (8 tools)
- `encharge_get_emails` — List templates
- `encharge_get_email` — Get template details
- `encharge_create_email` — Create template
- `encharge_update_email` — Modify template
- `encharge_update_email_status` — Activate/deactivate
- `encharge_send_email` — Send single email
- `encharge_send_batch_email` — Send batch (up to 100)
- `encharge_get_emails_by_contact` — Contact history
- `encharge_delete_email` — Delete template
- `encharge_get_email_automations` — Find campaign usage

### Segments (5 tools)
- `encharge_get_segments` — List segments
- `encharge_get_segment_detail` — Get criteria
- `encharge_get_people_in_segment` — Export contacts
- `encharge_get_segment_contacts_count` — Quick count
- `encharge_get_contact_segments` — Find contact's segments

### Custom Objects (8 tools)
- `encharge_get_custom_objects` — List types
- `encharge_get_custom_object_schema` — Get schema
- `encharge_get_person_custom_values` — Get values
- `encharge_update_person_custom_values` — Set values
- `encharge_create_custom_object_type` — Define type
- `encharge_update_custom_object_type` — Modify type
- `encharge_delete_custom_object_type` — Remove type
- `encharge_associate_custom_object_to_person` — Link

### Schemas (4 tools)
- `encharge_get_contact_schema` — Contact fields
- `encharge_get_custom_object_schema` — Object schema
- `encharge_get_field_definitions` — Field metadata
- `encharge_get_field_options` — Enum options

### Webhooks (3 tools)
- `encharge_get_webhooks` — List webhooks
- `encharge_create_webhook` — Create webhook
- `encharge_delete_webhook` — Remove webhook
- `encharge_test_webhook` — Send test

### Account (6 tools)
- `encharge_list_accounts` — Discover accounts
- `encharge_get_account` — Account details
- `encharge_get_account_limits` — API quotas
- `encharge_get_account_custom_objects` — List objects
- `encharge_get_account_webhook_events` — Event types
- `encharge_get_api_status` — Connectivity check

### Associations (3 tools)
- `encharge_get_associations` — Get links
- `encharge_create_association` — Create link
- `encharge_delete_association` — Remove link

## Agent: Marketing Operations

Specialized agent for complex marketing automation tasks.

```bash
# Use the agent for multi-step workflows
# Example: "Import 500 customers, tag them VIP, and set up welcome email"

# The agent handles:
# - Contact lifecycle management
# - Tag taxonomy design
# - Email campaign setup
# - Multi-account coordination
# - Data cleanup and hygiene
```

## Skill: Marketing Automation

Comprehensive domain knowledge with:

- When to activate: Triggers for Encharge-related tasks
- Tool organization: 55 tools across 9 domains
- Common workflows: 7 production workflows
- API limits & rate limiting
- Error handling & troubleshooting
- Multi-account patterns
- Performance optimization
- Security & compliance best practices

Access via `/marketing-automation` or when Encharge is mentioned.

## Common Workflows

### Import & Tag New Leads
1. Prepare CSV (email, firstName, lastName, source)
2. Import: `encharge_create_update_people` (batch 100)
3. Tag: `encharge_add_tag` "lead" [emails]
4. Verify: `encharge_get_all_people`

### Create Email Welcome Series
1. Create 3 templates: Day 0, Day 2, Day 7
2. Use merge variables: {{firstName}}, {{productName}}
3. Test send to yourself
4. Set up automation in Encharge UI

### Export Segment for Analytics
1. Get segment: `encharge_get_segment_detail`
2. Count: `encharge_get_segment_contacts_count`
3. Export: `encharge_get_people_in_segment` (paginate)
4. Format CSV and upload

### Sync Tags Across Accounts
1. Get source tags: `encharge_get_tags` --account primary
2. Get target tags: `encharge_get_tags` --account secondary
3. Create missing: `encharge_create_tags` --account secondary
4. Apply tags: `encharge_add_tag` --account secondary

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ENCHARGE_API_KEY` | Single API key | Yes (unless multi-account) |
| `ENCHARGE_ACCOUNTS` | JSON with multiple accounts | No |
| `ENCHARGE_WORKSPACE_CONFIG` | Path to config file | No |
| `ENCHARGE_DEFAULT_ACCOUNT` | Default account name | No |

## Multi-Account Setup

### Option A: Environment JSON
```bash
export ENCHARGE_ACCOUNTS='{
  "production": {"apiKey": "key1"},
  "staging": {"apiKey": "key2"}
}'
export ENCHARGE_DEFAULT_ACCOUNT="production"
```

### Option B: Configuration File
```json
{
  "accounts": {
    "production": {"apiKey": "key1"},
    "staging": {"apiKey": "key2"}
  },
  "defaultAccount": "production"
}
```

Then set:
```bash
export ENCHARGE_WORKSPACE_CONFIG="/path/to/config.json"
```

## API Limits

- **Rate Limit:** ~20 requests/second
- **Batch Limits:**
  - People import: max 100 per request
  - Tag creation: max 50 per request
  - Tag add/remove: max 100 per request
  - Email batch: max 100 per request
- **Backoff:** Exponential (2s, 4s, 8s, 16s)

## Best Practices

### Contact Management
- Validate email before import
- Check duplicates with `encharge_search_people`
- Use batch operations for 10+ contacts
- Archive (reversible) instead of delete

### Tag Strategy
- Plan hierarchy: Customer Type, Stage, Product, Region, Engagement
- Use consistent naming: PascalCase or kebab-case
- Document tag meanings for team
- Audit quarterly for unused tags

### Email Campaigns
- Test send to yourself first
- Include unsubscribe link (compliance)
- Use merge variables for personalization
- Mobile-responsive design

### Segment Operations
- Understand segment criteria before campaign
- Sample segment before bulk send
- Monitor dynamic segment size
- Document segment purpose

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key invalid" | Verify ENCHARGE_API_KEY env var |
| "Account not found" | Check ENCHARGE_ACCOUNTS config |
| "Rate limit exceeded" | Reduce batch size, add backoff |
| "Contact not found" | Verify email, may be archived |
| "Tag not applied" | Check contact is active, tag exists |
| "Import fails" | Validate email format in CSV |

## Support & Resources

- **Plugin Repo:** https://github.com/savethepolarbears/agenthaus-marketplace
- **Encharge Docs:** https://api.encharge.io/docs
- **Issue Tracking:** GitHub Issues
- **Documentation:** See `/encharge:*` commands for detailed guides

## License

MIT - See repository for full license

## Credits

Created by AgentHaus Team for Claude Code integration with Encharge.io marketing automation platform.
