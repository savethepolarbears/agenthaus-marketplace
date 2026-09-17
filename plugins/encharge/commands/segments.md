---
description: "Work with Encharge segments — list segments, get people within segments, create dynamic audiences based on filters."
---

# Segment Management

Use these commands to work with Encharge segments—dynamic contact lists based on criteria. Segments power targeted email campaigns and audience analysis.

## Quick Actions

**List all segments:**
```
/encharge:segments list [--account my-account]
```

**Get contacts in a segment:**
```
/encharge:segments get "Segment Name" [--limit 1000] [--account my-account]
```

**Count contacts in segment:**
```
/encharge:segments count "Segment Name" [--account my-account]
```

**Export segment to CSV:**
```
/encharge:segments export "Segment Name" --file segment-export.csv
```

**Find segments containing contact:**
```
/encharge:segments find-contact email@example.com [--account my-account]
```

## Available MCP Tools

### View Segments

- **encharge_get_segments**: List all segments in account
  - Returns: segment ID, name, type (dynamic/static), contact count, created date
  - Supports pagination: limit, offset
  - Filter by type: dynamic, static, active, archived

- **encharge_get_segment_detail**: Get segment definition and criteria
  - Returns: criteria, contact count, last update timestamp
  - Shows filter logic (AND/OR conditions)
  - Useful for understanding segment rules

- **encharge_get_people_in_segment**: Get all contacts in a segment
  - Returns: email, firstName, lastName, tags, custom fields
  - Pagination: limit, offset
  - Efficient for large segment exports

### Analyze Segments

- **encharge_get_segment_contacts_count**: Quick count of segment size
  - Lightweight operation, no contact details
  - Use for capacity planning before campaigns

- **encharge_get_contact_segments**: Get all segments containing a contact
  - Returns: list of segment IDs and names
  - Useful for contact profile view

## Common Workflows

### Export Segment for External Use

```
1. List segments: encharge_get_segments
2. Get segment details: encharge_get_segment_detail "My Segment"
3. Export all contacts:
   - Use encharge_get_people_in_segment with pagination
   - Collect all records (multiple API calls if >1000)
   - Format as CSV with: email, firstName, lastName, customFields
4. Save to file for external tool import
```

### Identify Segment Composition

Before running a campaign on a segment:

```
1. Get segment details: encharge_get_segment_detail "Campaign Segment"
2. Review criteria (e.g., tag="Customer" AND lastActivityDate>30days ago)
3. Get sample contacts: encharge_get_people_in_segment (limit: 100)
4. Verify data quality and relevance
5. Count total: encharge_get_segment_contacts_count
6. Proceed with confidence that audience matches intent
```

### Build Audience Report

Compare segment sizes and compositions:

```
1. Get all segments: encharge_get_segments
2. For each segment:
   - Get count: encharge_get_segment_contacts_count
   - Get details: encharge_get_segment_detail
   - Sample 10 contacts for review
3. Create report table:
   Segment | Size | Criteria | Sample Data Quality
   Segment A | 1,250 | tag="Customer" | Good
   Segment B | 890 | stage="Trial" | Good
   Segment C | 15 | tag="VIP" AND stage="Customer" | Good
```

### Find Contact's Segment Membership

View all segments a contact belongs to:

```
1. Get contact email
2. Use encharge_get_contact_segments email@example.com
3. Returns all segment IDs and names
4. Useful for:
   - Understanding contact behavior/classification
   - Debugging campaign targeting
   - Contact lifecycle analysis
```

### Campaign Segment Audience

Typical workflow before sending campaign email:

```
1. Identify target segment (e.g., "Active Customers")
2. Get segment definition: encharge_get_segment_detail
3. Verify audience size: encharge_get_segment_contacts_count
4. Sample contacts: encharge_get_people_in_segment (limit: 50)
5. Review sample for data quality/relevance
6. Pull all contacts: encharge_get_people_in_segment (paginated)
7. Prepare merge variables for personalization
8. Send campaign email to segment
```

## Understanding Segment Types

### Dynamic Segments
- Rules-based, update automatically
- Example: All contacts with tag="Active" updated in real-time
- Size changes as contacts meet/leave criteria
- Good for: ongoing engagement, lifecycle stages

### Static Segments
- Fixed list, created at a point in time
- Example: Users imported on 2025-02-15
- Size doesn't change automatically
- Good for: cohort analysis, A/B testing

## Segment Criteria Examples

Common segment definitions you'll see:

| Segment | Criteria | Use Case |
|---------|----------|----------|
| Active Customers | tag="Customer" AND lastActivityDate > 30 days ago | Retention campaigns |
| Trial Users | stage="Trial" AND signupDate > 90 days ago | Upgrade campaigns |
| VIP | tag="VIP" OR tag="Enterprise" | Concierge support |
| Inactive | lastActivityDate < 180 days ago | Re-engagement campaigns |
| New Signups | signupDate > 7 days ago | Onboarding emails |
| High Engagement | emailOpenRate > 50% | Advanced content |

## Best Practices

- **Naming**: Use descriptive segment names (not "Segment 1", use "Q2 Trial Signups")
- **Documentation**: Keep segment criteria documented in wiki
- **Testing**: Always sample segment before campaign send
- **Sizing**: Monitor segment size to catch logic errors
- **Freshness**: Dynamic segments update hourly (verify freshness before send)
- **Audit**: Track which segments were used for which campaigns
- **Versioning**: Create new segment if criteria change (old segment stays for history)
- **Overlap**: Understand if segments overlap for better targeting

## Segment Export Workflow

Full workflow to export segment for analytics:

```bash
# 1. List segments and identify target
/encharge:segments list

# 2. Verify segment definition
/encharge:segments get "Segment Name" --detail

# 3. Get count to estimate file size
/encharge:segments count "Segment Name"

# 4. Export with pagination (API limits ~1000 per call)
Loop until all contacts retrieved:
  encharge_get_people_in_segment
    segment: "Segment Name"
    limit: 1000
    offset: [0, 1000, 2000, ...]

# 5. Format as CSV
email,firstName,lastName,tag1,tag2,...

# 6. Save file
/encharge:segments export "Segment Name" --file contacts.csv

# 7. Verify export
Row count should match segment size
Check for nulls in important fields
Sample-check 10 rows for accuracy
```

## Multi-Account Segment Operations

When managing multiple accounts:

```
# List segments across all accounts
/encharge:segments list --all-accounts

# Get segment from specific account
/encharge:segments get "Segment Name" --account account-a

# Compare segment definitions across accounts
# Identify segments to sync for consistency
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Segment not found" | Check spelling, may be archived |
| "Segment empty" | Verify criteria, may be no matching contacts |
| "Contact count mismatch" | Wait for dynamic segment update (hourly) |
| "Export too large" | Use pagination, break into smaller batches |
| "Segment criteria error" | Review segment definition in Encharge UI |

## Integration Tips

### Combine with People Management

```
1. Get segment: encharge_get_people_in_segment
2. Extract emails
3. Apply new tag: encharge_add_tag "Segment-based-tag" [emails]
4. Create report of changes
```

### Feed Analytics Pipeline

```
1. Export segment regularly: encharge_get_people_in_segment
2. Send to data warehouse/analytics tool
3. Track segment size trends over time
4. Identify growing/shrinking audiences
5. Alert on unusual changes
```

## See Also

- `/encharge:people` — Manage individual contacts
- `/encharge:tags` — Understand tag-based segments
- `/encharge:emails` — Send campaigns to segments
