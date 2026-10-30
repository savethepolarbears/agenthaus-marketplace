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

