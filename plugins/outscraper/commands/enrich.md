---
description: Enrich contacts and companies — extract emails, verify addresses, look up phone numbers, company insights. Usage—`/outscraper:enrich emails 'example.com'`, `/outscraper:enrich verify 'user@example.com'`, `/outscraper:enrich company 'example.com'`, `/outscraper:enrich phones 'John Smith'`
---

# Outscraper Enrichment Command

Find and verify contact information, extract business emails, and gather company intelligence.

## Email & Contact Discovery

Extract emails and contact information from company websites and directories.

```
/outscraper:enrich emails "example.com" --limit 50
/outscraper:enrich emails "techstartup.io" --fields email,name,title
/outscraper:enrich emails "company_name"
```

**Parameters:**
- `domain` (required): Company domain (example.com) or company name
- `--limit` (optional): Number of contacts (default 10, max 500)
- `--fields` (optional): Comma-separated fields (email, name, title, department, linkedin_url)

**Output:**
```json
{
  "company": "Example Company",
  "domain": "example.com",
  "contacts": [
    {
      "email": "john.smith@example.com",
      "name": "John Smith",
      "title": "VP of Sales",
      "department": "Sales",
      "linkedin_url": "linkedin.com/in/john-smith-123"
    },
    {
      "email": "sarah@example.com",
      "name": "Sarah Johnson",
      "title": "Engineering Manager",
      "department": "Engineering"
    }
  ],
  "total_found": 47,
  "status": "success"
}
```

---

## Email Verification

Verify if email addresses are valid, deliverable, and in-use.

```
/outscraper:enrich verify "user@example.com"
/outscraper:enrich verify "john.smith@company.com,sarah@company.com"
/outscraper:enrich verify --batch-file emails.csv
```

**Parameters:**
- `email` or `--batch-file` (required): Single email, comma-separated list, or path to CSV file
- `--format` (optional): "csv" or "json" (default: json)

**Output (Single Email):**
```json
{
  "email": "user@example.com",
  "is_valid": true,
  "is_deliverable": true,
  "in_use": true,
  "smtp_verified": true,
  "disposable": false,
  "role_account": false,
  "confidence_score": 0.98,
  "mx_records": ["mail.example.com"],
  "status": "success"
}
```

**Output (Batch Verification):**
```json
{
  "results": [
    {
      "email": "john@example.com",
      "is_valid": true,
      "is_deliverable": true,
      "confidence_score": 0.95
    },
    {
      "email": "invalid@fake.com",
      "is_valid": false,
      "reason": "Domain does not exist"
    }
  ],
  "total_verified": 47,
  "valid_emails": 45,
  "invalid_emails": 2
}
```

---

## Company Insights

Get detailed information about a company including industry, size, funding, and more.

```
/outscraper:enrich company "example.com"
/outscraper:enrich company "Company Name"
/outscraper:enrich company --crunchbase "example"
```

**Parameters:**
- `domain_or_name` (required): Company domain or name
- `--crunchbase` (optional): Use Crunchbase data source
- `--fields` (optional): Comma-separated fields

**Output:**
```json
{
  "company": {
    "name": "Example Company",
    "domain": "example.com",
    "industry": "Software/SaaS",
    "company_size": "51-200 employees",
    "founded_year": 2015,
    "headquarters": {
      "city": "San Francisco",
      "state": "CA",
      "country": "US"
    },
    "description": "Cloud-based project management software for distributed teams",
    "website": "https://example.com",
    "phone": "+1-415-555-0123",
    "linkedin_url": "linkedin.com/company/example-company",
    "crunchbase_url": "crunchbase.com/organization/example-company",
    "total_funding": "$25.5M",
    "funding_rounds": 3,
    "investors": ["Sequoia Capital", "Andreessen Horowitz"],
    "status": "Actively Funded",
    "technologies": ["React", "Node.js", "AWS", "PostgreSQL"]
  }
}
```

---

## Phone Number Enrichment

Look up phone numbers and associated details.

```
/outscraper:enrich phones "John Smith"
/outscraper:enrich phones "+1-415-555-0123"
/outscraper:enrich phones "Company Name" --location "San Francisco"
```

**Parameters:**
- `query` (required): Person name, phone number, or "company + location"
- `--location` (optional): City, state, or country to narrow search
- `--format` (optional): "csv" or "json"

**Output (Person Lookup):**
```json
{
  "person": "John Smith",
  "results": [
    {
      "phone": "+1-415-555-0123",
      "associated_name": "John Smith",
      "type": "mobile",
      "carrier": "AT&T",
      "city": "San Francisco",
      "state": "CA",
      "country": "US"
    }
  ]
}
```

**Output (Phone Reverse Lookup):**
```json
{
  "phone": "+1-415-555-0123",
  "associated_info": {
    "name": "John Smith",
    "type": "personal",
    "city": "San Francisco",
    "state": "CA"
  }
}
```

---

## WhitePages Phone Lookup

Comprehensive phone lookup with address verification using WhitePages data.

```
/outscraper:enrich whitepages-phone "+1-415-555-0123"
/outscraper:enrich whitepages-phone "John Smith" --city "San Francisco"
```

**Output:**
```json
{
  "phone": "+1-415-555-0123",
  "associated_person": {
    "name": "John Smith",
    "age_range": "35-40",
    "associated_addresses": [
      {
        "address": "123 Main St, San Francisco, CA 94105",
        "type": "current",
        "move_date": "2022-03-15"
      }
    ],
    "relatives": ["Sarah Smith", "Michael Smith"],
    "aliases": ["J. Smith"]
  }
}
```

---

## WhitePages Address Lookup

Reverse lookup an address to find associated people and contact details.

```
/outscraper:enrich whitepages-address "123 Main St, San Francisco, CA 94105"
/outscraper:enrich whitepages-address --zip "94105"
```

**Output:**
```json
{
  "address": "123 Main St, San Francisco, CA 94105",
  "residents": [
    {
      "name": "John Smith",
      "age_range": "35-40",
      "phone": "+1-415-555-0123",
      "email": "john@example.com",
      "relatives": ["Sarah Smith"]
    }
  ],
  "property_info": {
    "property_type": "Apartment",
    "owner": "Example Real Estate LLC",
    "estimated_value": "$1,200,000"
  }
}
```

---

## Cost & Rate Limits

- **Email discovery**: 1 credit per domain
- **Email verification**: 0.1 credit per email (bulk discounts available)
- **Company insights**: 2-5 credits depending on data source
- **Phone enrichment**: 1 credit per lookup
- **WhitePages lookup**: 1-2 credits per search
- **Rate limit**: ~20 QPS for enrichment API

**Budget Examples:**
- Extract 50 emails from 1 domain: 1 credit
- Verify 100 emails: 10 credits
- Get company insights for 5 companies: 10-25 credits
- Phone lookups (10 numbers): 10 credits

---

## Advanced Workflows

### 1. Lead Generation Pipeline
```
1. Search businesses in target market
2. Extract company domains
3. Find emails for each company (contacts + general info)
4. Verify emails for deliverability
5. Get company insights (size, funding, industry)
6. Export CSV: company, email, contact_name, title, industry, size
```

### 2. Email List Validation
```
1. Import CSV with email list
2. Batch verify all emails
3. Filter deliverable emails
4. Get company info for each email domain
5. Remove disposable/role accounts
6. Export cleaned list with company context
```

### 3. Recruitment Targeting
```
1. Search for companies in target industry
2. Find engineering managers and CTOs
3. Verify emails
4. Get funding info (target well-funded startups)
5. Build outreach list with LinkedIn profiles
```

### 4. Sales Intelligence Gathering
```
1. Identify target accounts (company name list)
2. Get company size, funding, technology stack
3. Find decision makers (VP Sales, CFO, etc.)
4. Extract and verify emails
5. Cross-reference with phone numbers
6. Create enriched prospect list
```

### 5. Address Verification & Risk Assessment
```
1. Import list of customer addresses
2. Reverse lookup via WhitePages
3. Flag addresses with no residents or multiple unrelated people
4. Identify property ownership changes
5. Create fraud risk report
```

---

## Tips & Best Practices

1. **Email discovery optimization**
   - Start with company domain, then use company name as fallback
   - Verify emails immediately after discovery
   - Cross-reference emails with LinkedIn profiles

2. **Bulk verification efficiency**
   - Batch verify 100+ emails at once (cheaper per email)
   - Schedule verification during off-peak hours
   - Cache verified emails to avoid re-verification

3. **Company data freshness**
   - Refresh company insights quarterly
   - Monitor funding announcements for status changes
   - Track technology stack updates

4. **Privacy and compliance**
   - Respect GDPR/CCPA regulations on personal data
   - Use data only for intended business purpose
   - Disclose data sources in marketing communications
   - Get explicit consent before email outreach

5. **Deduplication**
   - Check for duplicate emails before verification
   - Cross-reference across multiple data sources
   - Remove role accounts (info@, support@, noreply@)

6. **Quality assurance**
   - Sample verify a small batch before full processing
   - Monitor verification accuracy over time
   - Flag suspicious results (100% valid rate is unrealistic)

---

## Error Handling

```json
{
  "email": "invalid@fake.com",
  "is_valid": false,
  "reason": "Domain does not exist",
  "error_code": "INVALID_DOMAIN"
}
```

Common error codes:
- `INVALID_FORMAT` — Email format is wrong
- `INVALID_DOMAIN` — Domain does not exist or has no MX records
- `RATE_LIMIT` — API rate limit exceeded (retry after 60 seconds)
- `API_ERROR` — Temporary service issue (retry with backoff)
- `INSUFFICIENT_CREDITS` — Upgrade account or purchase credits
