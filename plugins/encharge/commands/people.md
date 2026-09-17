---
description: "Manage Encharge contacts — list, get, export, import people with advanced filtering, bulk operations, and lifecycle management."
---

# People Management

Use these commands to manage Encharge contacts across your accounts. This command guides you through the MCP tools available for people operations.

## Quick Actions

**List all contacts:**
```
/encharge:people list [--limit 100] [--account my-account]
```

**Get a specific contact:**
```
/encharge:people get email@example.com [--account my-account]
```

**Search contacts by attributes:**
```
/encharge:people search --tag "VIP" --status "active" [--account my-account]
```

**Export contacts to CSV:**
```
/encharge:people export --format csv --file contacts.csv [--filter tag:VIP]
```

**Import contacts from CSV:**
```
/encharge:people import --file contacts.csv [--mode upsert]
```

## Available MCP Tools

### Get Contact Data

- **encharge_get_people**: Retrieve single contact by email with full profile data
- **encharge_get_all_people**: List all contacts with pagination (limit/offset)
- **encharge_get_people_in_segment**: Get all contacts within a specific segment
- **encharge_get_person_custom_values**: Retrieve custom object field values for a contact

### Create & Update

- **encharge_create_update_people**: Create new contacts or update existing ones (upsert by email)
  - Supports: email, firstName, lastName, phone, custom fields
  - Batch up to 100 contacts per request for efficiency

### Manage Lifecycle

- **encharge_archive_people**: Archive contacts (soft delete, preserves history)
- **encharge_unsubscribe_person**: Unsubscribe a contact from future emails
- **encharge_restore_people**: Restore archived contacts back to active

### Tagging & Segmentation

- **encharge_add_tag**: Add one or more tags to a contact
- **encharge_remove_tag**: Remove tags from a contact
- **encharge_alias_user**: Create an alias for a contact (link duplicate emails/profiles)

## Common Workflows

### Import & Tag Contacts

1. Prepare CSV file with columns: email, firstName, lastName, customField1
2. Use `encharge_create_update_people` with batch import
3. Follow with `encharge_add_tag` to tag the imported batch
4. Verify import with `encharge_get_all_people` with limit

### Find & Archive Inactive Contacts

1. Use `encharge_get_people_in_segment` with "inactive" segment
2. Review contact list for archival candidates
3. Use `encharge_archive_people` to soft-delete (reversible)
4. Verify with filtered `encharge_get_all_people`

### Merge Duplicate Contacts

1. Identify duplicates with search tools
2. Use `encharge_alias_user` to link duplicate emails
3. Keep primary email as canonical contact
4. Archive secondary duplicate contacts

### Bulk Tag Campaign Participants

1. Export contacts from external campaign platform
2. Use `encharge_create_update_people` to upsert
3. Use `encharge_add_tag` in batch (tag all with campaign ID)
4. Use `encharge_get_people_in_segment` to filter by tag for email sends

## Best Practices

- **Batch Operations**: Always use batch API for 10+ contacts to respect rate limits
- **Email Validation**: Validate email format before import to avoid API errors
- **De-duplication**: Check for duplicates before bulk imports using `encharge_get_people`
- **Custom Fields**: Map CSV columns to custom object fields using field IDs
- **Archive vs Delete**: Use archive (reversible) instead of permanent deletion
- **Account Targeting**: Always specify `account` parameter in multi-account setups

## Multi-Account Operations

When multiple Encharge accounts are configured:

```
/encharge:people list --account account-name  # Target specific account
/encharge:people list --all-accounts          # Aggregate all accounts
```

Get account list first:
```
encharge_list_accounts  # See all configured accounts
```

## Error Handling

| Error | Solution |
|-------|----------|
| "Invalid email format" | Validate email before import |
| "Rate limit exceeded" | Reduce batch size, implement backoff |
| "Custom field not found" | Verify field ID with encharge_get_custom_object_schema |
| "Contact not found" | Check email spelling, may be archived |
| "Account not accessible" | Verify API key has permission, check account name |

## See Also

- `/encharge:tags` — Manage tag taxonomy
- `/encharge:segments` — Work with segments
- `/encharge:emails` — Send transactional emails
