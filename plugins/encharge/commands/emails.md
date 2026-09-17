---
description: "Manage Encharge email templates — list, create, update, send transactional emails, and audit campaign setups."
---

# Email Management

Use these commands to manage email templates, transactional email workflows, and audit your email infrastructure in Encharge.

## Quick Actions

**List email templates:**
```
/encharge:emails list [--limit 50] [--account my-account]
```

**Get template details:**
```
/encharge:emails get template-id [--account my-account]
```

**Create email template:**
```
/encharge:emails create --name "Welcome Email" --subject "Welcome to our platform" --html-body "<html>...</html>"
```

**Send transactional email:**
```
/encharge:emails send --template-id abc123 --email user@example.com --variables '{"firstName": "John"}'
```

**Update template:**
```
/encharge:emails update template-id --subject "New Subject" --html-body "<html>...</html>"
```

**Get email statistics:**
```
/encharge:emails stats template-id [--account my-account]
```

## Available MCP Tools

### View Email Templates

- **encharge_get_emails**: List all email templates with metadata
  - Returns: id, name, subject, created date, modified date, type
  - Supports pagination: limit, offset

- **encharge_get_email**: Get full template details
  - Returns: HTML body, plain text version, variables used, segments linked

- **encharge_get_emails_by_contact**: Get sent email history for a contact
  - Shows: sent emails, opens, clicks, bounces
  - Useful for contact profile review

### Create & Update Templates

- **encharge_create_email**: Create new email template
  - Required: name, subject, htmlBody
  - Optional: plainBody, variables, tags, description
  - Returns: template ID, creation timestamp

- **encharge_update_email**: Update existing template
  - Can change: subject, htmlBody, plainBody, variables
  - Does not impact already-sent emails
  - Updates apply to future sends

- **encharge_update_email_status**: Activate/deactivate templates
  - Deactivate to prevent accidental use
  - Does not affect scheduled sends

### Send Transactional Emails

- **encharge_send_email**: Send email to contact immediately
  - Requires: emailId, emailAddress (recipient)
  - Optional: variables (merge tags), delaySeconds
  - Returns: send ID, timestamp

- **encharge_send_batch_email**: Send to multiple contacts (up to 100)
  - Batch sends reduce API calls
  - Each email gets unique variables/personalization

### Manage Email Metadata

- **encharge_get_email_automations**: List automations using email template
  - Shows which campaigns send this email
  - Helps identify impact before deleting

- **encharge_delete_email**: Delete unused email template
  - Verify with `encharge_get_email_automations` first
  - Cannot delete templates in active automations

## Common Workflows

### Create Welcome Email Series

1. Design 3 templates: Welcome Day 0, Day 2 Check-in, Day 7 Deep Dive
2. Use `encharge_create_email` for each:
   ```
   encharge_create_email
     name: "Welcome - Day 0"
     subject: "Welcome to {{companyName}}!"
     htmlBody: "<html>Dear {{firstName}},...</html>"
   ```
3. Note returned template IDs
4. Set up automation workflows linking them

### Send Transactional Alert Email

For real-time alerts (order confirmation, password reset, etc.):

```
1. Create template with variables: encharge_create_email
   Variables: {{orderId}}, {{amount}}, {{customerName}}

2. When event occurs, send email:
   encharge_send_email
     emailId: "template-123"
     emailAddress: "customer@example.com"
     variables: {"orderId": "ORD-456", "amount": "$99", "customerName": "John"}

3. Monitor delivery in contact history
```

### Audit Email Infrastructure

1. Get all templates: `encharge_get_emails`
2. For each, check usage: `encharge_get_email_automations`
3. Identify unused templates: `encharge_delete_email` (safe to remove)
4. Check template variables against system fields
5. Document template inventory

### Update Campaign Email Template

1. Get current template: `encharge_get_email` template-id
2. Modify content: `encharge_update_email`
3. Preview changes (test send to self)
4. Apply updates — affects future sends only
5. Old sends are preserved with original content

### Batch Send Onboarding Emails

```
1. Export contacts from segment
2. Prepare variables for personalization:
   [{email: "user1@example.com", firstName: "Alice", plan: "Pro"},
    {email: "user2@example.com", firstName: "Bob", plan: "Basic"}]

3. Use encharge_send_batch_email:
   emailId: "onboarding-template-123"
   recipients: [array above]

4. Verify sends in contact records
```

## Best Practices

- **Template Naming**: Use clear, descriptive names (e.g., "Welcome - Day 0", not "Email1")
- **Variables**: Document all merge tags used ({{firstName}}, {{customField}})
- **Testing**: Always send test copy to yourself before automation
- **Plain Text**: Provide plain text version for email clients that don't render HTML
- **Responsive**: Design templates mobile-responsive (60% mobile opens)
- **Unsubscribe**: Always include unsubscribe link in templates
- **Compliance**: Follow CAN-SPAM (unsubscribe, contact info, consent)
- **Audit Trail**: Document template changes in wiki/notion
- **Batch Sends**: Use batch API for 10+ emails to save requests
- **Rate Limiting**: Max 100 emails/request, implement backoff

## Template Variables Reference

Common variables you can use in templates:

| Variable | Value |
|----------|-------|
| {{email}} | Contact email address |
| {{firstName}} | Contact first name |
| {{lastName}} | Contact last name |
| {{phone}} | Contact phone number |
| {{customField}} | Custom field value (use field ID) |
| {{tagList}} | Comma-separated tags |
| {{createdAt}} | Contact creation date |
| {{lastActivityDate}} | Last interaction date |

Add custom variables in email creation for dynamic content.

## Multi-Account Email Management

When managing multiple Encharge accounts:

```
/encharge:emails list --account account-a
/encharge:emails list --account account-b

# Compare templates across accounts
# Identify common templates for sync
```

Strategy: Create email template library in primary account, replicate to others.

## Email Delivery Troubleshooting

| Issue | Solution |
|-------|----------|
| "Template not found" | Verify template ID, check account |
| "Invalid email address" | Validate recipient email format |
| "Rate limit exceeded" | Use batch API, implement exponential backoff |
| "Variable not found in template" | Check variable syntax {{varName}} |
| "Email bounced" | Check contact's unsubscribe/archive status |
| "High spam rate" | Review content, check authentication (SPF/DKIM) |

## See Also

- `/encharge:people` — Manage recipients
- `/encharge:tags` — Segment audiences
- `/encharge:segments` — Create dynamic email lists
