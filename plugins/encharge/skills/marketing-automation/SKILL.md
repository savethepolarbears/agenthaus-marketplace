---
name: marketing-automation
description: Comprehensive guide to Encharge marketing automation — 55 MCP tools for contact management, email campaigns, tag strategy, and multi-account workflows. Use when managing contacts, email campaigns, tags, dynamic segments, or marketing automations in Encharge.
---

# Encharge Marketing Automation Skill

Master Encharge.io marketing automation with this comprehensive skill covering 55 MCP tools, multi-account patterns, and proven workflows.

## When to Activate This Skill

Trigger this skill when the user mentions:

- **Encharge** (platform name)
- **Contact management** or **subscriber management** (core function)
- **Email automation** or **email campaigns**
- **Tag management** or **tag strategy**
- **Segment** (dynamic or static audience)
- **Marketing automation** or **marketing operations**
- **CRM** for marketing context
- **Bulk contact operations** or **contact import**
- **Email templates** or **transactional emails**
- **Multi-account marketing** or **cross-brand campaigns**
- **Customer lifecycle** or **lifecycle automation**
- **Audience building** or **audience segmentation**

## Tool Organization & Domains

The 55 MCP tools organize into 9 functional domains:

### Domain 1: People Management (10 tools)

Contact creation, updates, archives, and lifecycle management.

**Core Tools:**

- `encharge_get_people` — Get single contact by email
- `encharge_get_all_people` — List all contacts (paginated)
- `encharge_create_update_people` — Upsert contacts (batch up to 100)
- `encharge_archive_people` — Soft-delete contacts (reversible)
- `encharge_restore_people` — Restore archived contacts
- `encharge_unsubscribe_person` — Mark contact as unsubscribed
- `encharge_get_people_in_segment` — Get contacts in segment (paginated)
- `encharge_get_person_custom_values` — Get custom field values
- `encharge_alias_user` — Link duplicate contacts (merge)
- `encharge_search_people` — Full-text search contacts

**When to Use:**

- Import contacts: `encharge_create_update_people` (batch)
- List contacts: `encharge_get_all_people` (paginated)
- Merge duplicates: `encharge_alias_user`
- Segment exports: `encharge_get_people_in_segment`
- Archive: `encharge_archive_people`

**Best Practices:**

- Batch operations for 10+ contacts (max 100 per request)
- Validate email before creation
- Use archive (reversible) not delete
- Check for duplicates before bulk import

### Domain 2: Tag Management (7 tools)

Tag creation, updates, bulk tagging, and taxonomy management.

**Core Tools:**

- `encharge_get_tags` — List all tags with counts
- `encharge_get_tag_counts` — Get usage count for tags
- `encharge_get_tags_by_contact` — Get tags on specific contact
- `encharge_create_tags` — Create new tags (batch up to 50)
- `encharge_update_tag` — Rename or update tag properties
- `encharge_delete_tag` — Delete unused tags
- `encharge_add_tag` — Add tags to contacts (batch up to 100)
- `encharge_remove_tag` — Remove tags from contacts (batch)

**When to Use:**

- Create taxonomy: `encharge_create_tags` (batch)
- Bulk tag contacts: `encharge_add_tag` (batch, max 100)
- Rename tag: `encharge_update_tag`
- Cleanup: `encharge_delete_tag`
- Analyze: `encharge_get_tags`, `encharge_get_tag_counts`

**Best Practices:**

- Plan tag hierarchy (e.g., product-*, stage-*, region-*)
- Use consistent naming (PascalCase or kebab-case)
- Document tag meanings
- Audit quarterly for unused tags
- Batch add/remove for efficiency

**Tag Strategy Template:**

```yaml
Taxonomy:
- Customer Type: Customer, Lead, Prospect, Partner
- Stage: Awareness, Consideration, Decision, Customer, Advocate
- Product: ProductA, ProductB, ProductC
- Engagement: Active, Inactive, AtRisk, VIP
- Region: US, EU, APAC, LatAm
```

### Domain 3: Email Management (8 tools)

Email template creation, sending, and campaign management.

**Core Tools:**

- `encharge_get_emails` — List email templates with metadata
- `encharge_get_email` — Get full template with HTML/variables
- `encharge_create_email` — Create new template (name, subject, htmlBody)
- `encharge_update_email` — Modify template content
- `encharge_update_email_status` — Activate/deactivate template
- `encharge_send_email` — Send email to single contact
- `encharge_send_batch_email` — Send to multiple (batch up to 100)
- `encharge_get_emails_by_contact` — Get contact's email history
- `encharge_delete_email` — Delete unused templates
- `encharge_get_email_automations` — Find campaigns using template

**When to Use:**

- Create template: `encharge_create_email`
- Send transactional: `encharge_send_email`
- Batch sends: `encharge_send_batch_email` (max 100)
- Audit: `encharge_get_email_automations`, `encharge_get_emails`
- Update: `encharge_update_email`

**Best Practices:**

- Test send to self before automation
- Document merge variables: {{firstName}}, {{customField}}
- Provide plain text version
- Include unsubscribe link (compliance)
- Mobile-responsive design
- Batch sends for 10+ emails

**Email Template Variables:**

```text
{{email}} — Contact email
{{firstName}} — First name
{{lastName}} — Last name
{{customField}} — Custom field by ID
{{tagList}} — Comma-separated tags
{{createdAt}} — Contact creation date
```

### Domain 4: Segment Operations (5 tools)

Segment listing, membership queries, and audience management.

**Core Tools:**

- `encharge_get_segments` — List all segments with counts
- `encharge_get_segment_detail` — Get segment criteria/rules
- `encharge_get_people_in_segment` — Export segment (paginated)
- `encharge_get_segment_contacts_count` — Quick count
- `encharge_get_contact_segments` — Which segments include contact

**When to Use:**

- List: `encharge_get_segments`
- Export: `encharge_get_people_in_segment` (paginate for large)
- Analyze: `encharge_get_segment_detail`, `encharge_get_segment_contacts_count`
- Check membership: `encharge_get_contact_segments`

**Best Practices:**

- Name clearly: "Active Customers" not "Segment 1"
- Understand criteria before campaign
- Sample segment (100 contacts) before campaign
- Dynamic segments update hourly
- Document segment meaning

**Common Segment Examples:**

| Segment | Criteria | Use |
| --------- | ---------- | ----- |
| Active Customers | tag="Customer" AND lastActivityDate > 30d | Retention |
| Trial Users | stage="Trial" AND signupDate > 90d | Upgrade |
| VIP | tag="VIP" OR tag="Enterprise" | Premium support |
| Inactive | lastActivityDate < 180d | Re-engagement |

### Domain 5: Custom Objects (8 tools)

Manage custom data types, field definitions, and associations.

**Core Tools:**

- `encharge_get_custom_objects` — List custom object types
- `encharge_get_custom_object_schema` — Get fields and types
- `encharge_get_person_custom_values` — Get custom data for contact
- `encharge_update_person_custom_values` — Set custom fields
- `encharge_create_custom_object_type` — Define new data type
- `encharge_update_custom_object_type` — Modify schema
- `encharge_delete_custom_object_type` — Remove data type
- `encharge_associate_custom_object_to_person` — Link to contact

**When to Use:**

- Store structured data (products purchased, account tier, etc.)
- Map custom fields: `encharge_get_custom_object_schema`
- Set custom values: `encharge_update_person_custom_values`
- Create schema: `encharge_create_custom_object_type`
- Query by custom field: use with segments

**Best Practices:**

- Define schema before bulk import
- Validate field types (text, number, date, etc.)
- Use required fields for important data
- Document field meanings
- Map CSV columns to field IDs

### Domain 6: Schemas & Definitions (4 tools)

Contact field definitions, field options, and metadata.

**Core Tools:**

- `encharge_get_contact_schema` — List all contact fields
- `encharge_get_custom_object_schema` — Get custom object definition
- `encharge_get_field_definitions` — Detailed field metadata
- `encharge_get_field_options` — Enum values for choice fields

**When to Use:**

- Before import: understand available fields
- Map CSV: match columns to field IDs
- Validate: check field types and requirements
- Document: export schema for team reference

### Domain 7: Account & System (6 tools)

Multi-account discovery, limits, usage, and API status.

**Core Tools:**

- `encharge_list_accounts` — Discover all configured accounts
- `encharge_get_account` — Account details, contact count, tier
- `encharge_get_account_limits` — API quotas, credit usage
- `encharge_get_account_custom_objects` — List custom object types
- `encharge_get_account_webhook_events` — Webhook event types
- `encharge_get_api_status` — API connectivity check

**When to Use:**

- Startup: `encharge_list_accounts` to discover accounts
- Capacity planning: `encharge_get_account_limits`, `encharge_get_account`
- Health check: `encharge_get_api_status`
- Multi-account: target specific account with `account` parameter

**Multi-Account Configuration:**

```json
{
  "ENCHARGE_ACCOUNTS": {
    "account-a": { "apiKey": "key1" },
    "account-b": { "apiKey": "key2" }
  },
  "ENCHARGE_DEFAULT_ACCOUNT": "account-a"
}
```

### Domain 8: Webhooks (3 tools)

Webhook configuration, testing, and event management.

**Core Tools:**

- `encharge_get_webhooks` — List configured webhooks
- `encharge_create_webhook` — Set up event notification
- `encharge_delete_webhook` — Remove webhook
- `encharge_test_webhook` — Send test payload

**When to Use:**

- Sync with external systems: create webhook for contact changes
- Real-time data: trigger downstream actions on Encharge events
- Integration: connect to Slack, Zapier, custom APIs

### Domain 9: Associations & Bulk (3 tools)

Link related data and track bulk operations.

**Core Tools:**

- `encharge_get_associations` — Get related records
- `encharge_create_association` — Link records
- `encharge_delete_association` — Unlink records
- `encharge_get_bulk_operation_status` — Track async operations

**When to Use:**

- Track bulk operations: `encharge_get_bulk_operation_status`
- Link custom objects: `encharge_create_association`

## Common Workflows

### Workflow 1: Contact Import & Segmentation

**Goal:** Import 500 new leads and tag them for nurture campaigns

**Steps:**

1. **Prepare:** Clean CSV (email, firstName, lastName, source, product)
2. **Validate:** Check for duplicates with `encharge_search_people`
3. **Import:** `encharge_create_update_people` (batch 100 at a time)
   - Request 1: contacts 1-100
   - Request 2: contacts 101-200
   - Request 3: contacts 201-300
   - Request 4: contacts 301-400
   - Request 5: contacts 401-500
4. **Tag:** `encharge_add_tag` "source-import" [all 500 emails]
5. **Segment:** `encharge_add_tag` "stage-lead" [all 500 emails]
6. **Verify:** `encharge_get_all_people` with limit=10, check count
7. **Report:** "500 contacts imported, tagged, ready for nurture"

**API Calls:** 9 total (5 import + 2 tag + 1 verify + 1 report)

### Workflow 2: Tag Taxonomy Implementation

**Goal:** Create structured tag taxonomy for team

**Steps:**

1. **Define:** Plan hierarchy
   - Customer Type: Customer, Lead, Prospect, Partner (4)
   - Stage: Awareness, Consideration, Decision, Customer, Advocate (5)
   - Product: ProductA, ProductB, ProductC (3)
   - Engagement: Active, Inactive, AtRisk, VIP (4)
   - Total: 16 tags
2. **Create:** `encharge_create_tags` (batch 16)
3. **Apply:** For all 1000+ existing contacts:
   - `encharge_add_tag` "Customer" [customer emails] (batch)
   - `encharge_add_tag` "stage-customer" [customer emails] (batch)
   - etc. for all combinations
4. **Document:** Share taxonomy in wiki with examples
5. **Train:** Team alignment on standards
6. **Audit:** Schedule quarterly review

### Workflow 3: Email Campaign Sequence

**Goal:** Set up 3-email welcome series with personalization

**Steps:**

1. **Create Email 1 - Welcome:**

   ```yaml
   encharge_create_email
     name: "Welcome - Day 0"
     subject: "Welcome {{firstName}}!"
     htmlBody: "<html>Hi {{firstName}},...</html>"
   ```

2. **Create Email 2 - Deep Dive:**

   ```yaml
   encharge_create_email
     name: "Welcome - Day 2"
     subject: "Getting Started with {{productName}}"
     htmlBody: "<html>Explore {{productName}}...</html>"
   ```

3. **Create Email 3 - Next Steps:**

   ```yaml
   encharge_create_email
     name: "Welcome - Day 7"
     subject: "You're all set {{firstName}}"
     htmlBody: "<html>Ready for next steps?...</html>"
   ```

4. **Test:** `encharge_send_email` to yourself
5. **Finalize:** Verify rendering, links work
6. **Automation:** Use templates in workflow UI
7. **Monitor:** Track opens, clicks in Encharge dashboard

### Workflow 4: Multi-Account Sync

**Goal:** Sync customer contacts and tags between production and staging

**Steps:**

1. **Discover:** `encharge_list_accounts` — find both accounts
2. **Export Source:**
   - `encharge_get_all_people` --account production
   - Get all contacts (paginate through results)
3. **Transform:** Anonymize sensitive data if needed
4. **Import Target:**
   - `encharge_create_update_people` --account staging
   - Batch import to staging account
5. **Sync Tags:**
   - Get all tags: `encharge_get_tags` --account production
   - Create in target: `encharge_create_tags` --account staging
   - Apply tags: `encharge_add_tag` --account staging
6. **Verify:** Compare counts between accounts
7. **Monitor:** Run sync on schedule (daily/weekly)

### Workflow 5: Segment Export for Analytics

**Goal:** Export VIP segment to analytics platform

**Steps:**

1. **List:** `encharge_get_segments` — find VIP segment
2. **Details:** `encharge_get_segment_detail` "VIP" — understand criteria
3. **Count:** `encharge_get_segment_contacts_count` "VIP"
4. **Export:** `encharge_get_people_in_segment` "VIP"
   - If 1000+ contacts: paginate (offset=0, 1000, 2000, ...)
   - Collect: email, firstName, lastName, tags, customFields
5. **Format:** CSV with headers
6. **Validate:** Row count = segment size
7. **Send:** Upload to analytics platform
8. **Schedule:** Automate daily/weekly exports

### Workflow 6: Clean Up & De-duplication

**Goal:** Find and merge 50 duplicate contacts

**Steps:**

1. **Find Duplicates:** Manual review or external duplicate detection
2. **Merge:** For each duplicate pair:
   - `encharge_alias_user` email1 email2 — link them
   - Mark primary contact
3. **Archive:** `encharge_archive_people` [secondary emails]
4. **Verify:** `encharge_get_person_custom_values` — confirm merge
5. **Report:** "50 duplicates merged, 50 archived"
6. **Prevent:** Add validation to future imports

### Workflow 7: Bulk Tag-Based Campaign

**Goal:** Tag all users who purchased in last 90 days for retention campaign

**Steps:**

1. **Query:** Get contacts from external system (CRM, analytics, etc.)
   - Filter: purchase_date > 90 days ago
   - Extract: email list
2. **Tag:** `encharge_add_tag` "recent-customer" [email list] (batch)
3. **Verify:** `encharge_get_tag_counts` "recent-customer"
4. **Segment:** Create segment in UI: tag="recent-customer"
5. **Campaign:** Send retention email to segment
6. **Track:** Monitor opens/clicks

## API Limits & Rate Limiting

**Rate Limits:**

- ~20 requests per second (RPS)
- Burst: 100 requests/minute
- Daily: 100K+ requests/day (account-dependent)

**Batch Limits:**

- People import: max 100 per request
- Tag creation: max 50 per request
- Tag add/remove: max 100 contacts per request
- Email send batch: max 100 recipients per request

**Backoff Strategy:**

```text
Request fails → wait 2s → retry
Still fails → wait 4s → retry
Still fails → wait 8s → retry
Still fails → wait 16s → retry
After 4 attempts → abort, report error
```

## Error Handling & Troubleshooting

**Common Errors & Solutions:**

| Error | Cause | Fix |
| ------- | ------- | ----- |
| "Invalid email" | Bad format | Validate: `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| "Contact not found" | Email doesn't exist | Create with `encharge_create_update_people` |
| "Tag already exists" | Duplicate name | Check spelling (case-sensitive) |
| "Rate limit exceeded" | Too many concurrent requests | Reduce batch size, add backoff |
| "Account not accessible" | API key invalid | Verify ENCHARGE_API_KEY env var |
| "Segment empty" | Wrong criteria | Review segment definition in UI |
| "Custom field not found" | Wrong field ID | Get schema with `encharge_get_custom_object_schema` |

## Security & Compliance

**Best Practices:**

- Store API keys in env vars, never hardcode
- Validate all user input before API calls
- Use HTTPS for all API communication
- Log API calls for audit trail
- Respect rate limits (don't abuse API)
- Never expose email lists externally without consent
- Implement unsubscribe properly
- Follow CAN-SPAM (unsubscribe link, sender info)

**Data Privacy:**

- Don't share contact data across accounts without permission
- Mask PII in logs/reports
- Implement data retention policy
- Support GDPR right-to-be-forgotten (archive/delete)

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

## Performance Tips

**Optimize API Usage:**

1. Use batch operations for 10+ contacts
2. Paginate large result sets (limit=1000, offset=0,1000,2000,...)
3. Cache segment IDs/tag IDs to avoid repeated lookups
4. Implement request queuing to avoid rate limits
5. Parallel requests for independent operations (3-5 concurrent max)
6. Monitor credit usage: `encharge_get_account_limits`

**Efficient Workflow:**

1. Prepare data offline (CSV validation, de-dup)
2. Batch import (100 per request)
3. Apply tags in batches
4. Query once for reporting
5. Cache results when possible

## Documentation & Reference

**Key Resources:**

- Encharge API Docs: <https://api.encharge.io/docs>
- MCP Integration: Included in plugin
- Team Wiki: Document tag taxonomy, workflows
- Runbooks: Step-by-step guides for common tasks

**What to Document:**

- Tag meanings and examples
- Email template variable list
- Segment criteria reference
- Custom object schema
- Multi-account mapping
- API key rotation schedule
- Contact import validation rules

## Troubleshooting Decision Tree

```text
Problem?
├─ API not responding
│  └─ Check: ENCHARGE_API_KEY, firewall, Encharge status page
├─ Operation failed
│  ├─ Get error message
│  ├─ Check: email format, tag exists, account accessible
│  └─ Retry with backoff or batch smaller subset
├─ Results unexpected
│  ├─ Verify: segment criteria, tag applied correctly
│  ├─ Sample results manually
│  └─ Adjust operation and retry
├─ Rate limited
│  └─ Reduce batch size, add delays, retry with backoff
└─ Data quality issue
   ├─ Check: duplicates, invalid emails, missing fields
   ├─ Clean: de-dup, validate, normalize
   └─ Re-import
```

## Summary

The Encharge MCP integration provides 55 tools organized into 9 domains. Master these key patterns:

1. **People:** Import, tag, segment, export
2. **Tags:** Create taxonomy, bulk apply, audit
3. **Emails:** Create templates, send transactional, campaign setup
4. **Segments:** List, analyze, export, understand criteria
5. **Custom Objects:** Define schema, store custom data
6. **Multi-Account:** Discover, sync, coordinate across accounts
7. **Webhooks:** Real-time integration
8. **API:** Respect rate limits, batch operations, backoff strategy

Use this skill to build robust marketing automation workflows that scale with your team.
