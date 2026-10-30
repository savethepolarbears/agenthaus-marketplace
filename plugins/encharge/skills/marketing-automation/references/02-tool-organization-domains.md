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

