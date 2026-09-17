---
description: "Manage Encharge tags — create, rename, delete, diff, and bulk-apply tags with multi-account synchronization support."
---

# Tag Management

Use these commands to build and maintain your tag taxonomy in Encharge. Tags are the foundation of segmentation and contact organization.

## Quick Actions

**List all tags:**
```
/encharge:tags list [--account my-account]
```

**Create new tag:**
```
/encharge:tags create "VIP Customer" [--description "High-value clients"]
```

**Rename a tag:**
```
/encharge:tags rename "Old Tag Name" "New Tag Name"
```

**Delete a tag:**
```
/encharge:tags delete "Unused Tag" [--confirm]
```

**Compare tags across accounts:**
```
/encharge:tags diff --account1 account-a --account2 account-b
```

**Get tag usage statistics:**
```
/encharge:tags stats [--account my-account]
```

## Available MCP Tools

### View Tags

- **encharge_get_tags**: List all tags in an account with counts
- **encharge_get_tag_counts**: Get usage count for specific tags
- **encharge_get_tags_by_contact**: Get all tags applied to a specific contact

### Create & Update

- **encharge_create_tags**: Create one or more new tags
  - Supports: tag name, color coding, description
  - Batch up to 50 tags per request

- **encharge_update_tag**: Rename or update tag properties
  - Rename: change tag name (reassigns to all contacts)
  - Update color/metadata

### Apply & Remove

- **encharge_add_tag**: Add tag(s) to one or more contacts
  - Supports batch: up to 100 contact/tag combinations per request
  - Returns count of updated contacts

- **encharge_remove_tag**: Remove tag(s) from contacts
  - Bulk remove for efficiency
  - Useful for campaign cleanup

### Delete & Cleanup

- **encharge_delete_tag**: Delete unused tags
  - Will warn if tag has active contacts
  - Verify count with `encharge_get_tag_counts` first

## Common Workflows

### Build Tag Taxonomy

1. Plan tag categories: Customer Type, Stage, Product, Region, Engagement Level
2. Use `encharge_create_tags` to batch-create all tags
3. Document tag meanings in your wiki/notion
4. Train team on tagging standards

Example taxonomy:
```
Customer Type: Customer, Lead, Prospect, Partner
Stage: Awareness, Consideration, Decision, Customer, Advocate
Product: ProductA, ProductB, ProductC
Engagement: Active, Inactive, AtRisk, VIP
Region: US, EU, APAC, LatAm
```

### Tag Import Batch & Segment

1. Import contacts with `encharge_create_update_people`
2. Use `encharge_add_tag` to apply source/campaign tag
3. Apply secondary tags: stage, type, region based on import data
4. Create segment in UI based on tag combinations

### Sync Tags Across Accounts

1. Get tags from source account: `encharge_get_tags`
2. Check target account for missing tags: `encharge_get_tags`
3. Create missing tags in target: `encharge_create_tags`
4. Verify sync with count comparison

### Cleanup Unused Tags

1. Get all tags with counts: `encharge_get_tags`
2. Identify zero-count tags
3. Confirm no campaigns reference them
4. Delete with `encharge_delete_tag`

### Bulk Re-tag Campaign Cohort

1. Get contacts from segment: `encharge_get_people_in_segment`
2. Remove old campaign tag: `encharge_remove_tag` (bulk)
3. Add new tag (if needed): `encharge_add_tag` (bulk)
4. Verify with `encharge_get_tag_counts`

## Best Practices

- **Consistency**: Use consistent naming (PascalCase or kebab-case, pick one)
- **Hierarchy**: Group related tags (e.g., all product tags start with "product-")
- **Avoid Duplication**: Always check existing tags before creating new ones
- **Document**: Keep tag guide updated — share with team
- **Review Quarterly**: Audit unused tags and clean up
- **Color Coding**: Use colors to visually categorize tag groups in UI
- **Batch Operations**: Use bulk add/remove for 10+ contacts to save API calls
- **Test First**: Always test on small segment before bulk operations

## Multi-Account Tag Sync

For organizations with multiple Encharge accounts (separate brands/regions):

**Option 1: Manual Sync**
```
1. Get tags from primary account: encharge_get_tags --account primary
2. Get tags from secondary: encharge_get_tags --account secondary
3. Identify differences
4. Create missing tags: encharge_create_tags --account secondary
```

**Option 2: Unified Tag Strategy**
- Maintain master tag list in documentation
- Onboard new accounts with batch tag creation
- Use `encharge_update_tag` to keep naming consistent

## Bulk Tag Application Examples

**Tag all inactive contacts:**
```
1. Get inactive segment: encharge_get_people_in_segment "inactive"
2. Extract email list
3. Apply tag: encharge_add_tag "AtRisk" [email list]
4. Verify: encharge_get_tag_counts "AtRisk"
```

**Apply product tag based on history:**
```
1. Query contacts (external system or segment filter)
2. For each product: encharge_add_tag "product-X" [emails who purchased X]
3. Create segments combining tags for nurture campaigns
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Tag already exists" | Check spelling, case-sensitive |
| "Rate limit exceeded" | Reduce batch size (max 100 per request) |
| "Tag not found" | Verify name, may be deleted by another user |
| "Cannot delete tag with active contacts" | Remove tag from all contacts first, or archive contacts |
| "Tag not applied to contact" | Verify contact email exists and is active |

## See Also

- `/encharge:people` — Tag contacts in bulk
- `/encharge:segments` — Create segments based on tags
- `/encharge:emails` — Send to tag-based segments
