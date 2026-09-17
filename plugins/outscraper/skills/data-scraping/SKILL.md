---
name: data-scraping
description: Comprehensive guide to Outscraper's 28 MCP tools for web scraping, data enrichment, and market research workflows. Use when scraping Google Maps, extracting multi-platform reviews, enriching contacts, geocoding addresses, or gathering market research via Outscraper.
---

# Outscraper Data Scraping Skill

Master web scraping, contact enrichment, and market research using Outscraper's 28 production-ready MCP tools covering Google Maps, reviews from 17 platforms, search engines, and contact intelligence.

## When to Trigger This Skill

Use this skill when you encounter user requests for:

- **Web scraping**: "Find businesses", "scrape reviews", "mine customer feedback"
- **Google Maps**: "Search Google Maps for", "find businesses near", "get business listings"
- **Review scraping**: "Get reviews from", "analyze customer feedback", "mine reviews from"
- **Lead generation**: "Find businesses in", "extract emails from", "build prospect list"
- **Contact enrichment**: "Find phone numbers", "verify emails", "get company data"
- **Business intelligence**: "Market research", "competitive analysis", "identify leads"
- **Sentiment analysis**: "Analyze reviews", "track customer sentiment", "mine feedback"
- **Location-based research**: "Find nearby", "map locations", "geocode addresses"
- **Employee research**: "Find team members", "extract company contacts", "recruiting intelligence"
- **Outscraper**: Any tool mention or request matching the 28 available tools

---

## Core Tool Categories

### 1. Google Maps Tools (5 tools)

**Purpose:** Search, analyze, and extract data from Google Maps listings.

#### google_maps_search

Find businesses on Google Maps by category, location, and keywords.

```text
Usage: Search for "coffee shops in Austin TX"
Returns: name, address, rating, reviews_count, phone, website, place_id, coordinates
Cost: 1 credit per query
Rate limit: ~20 QPS
```

**When to use:**

- Finding local businesses by category and location
- Competitor discovery
- Multi-location research (franchises, chains)
- Market gap analysis
- Lead generation for service businesses

**Key parameters:**

- `query`: "business type in location" or "business name"
- `limit`: 10-100 results
- `language`: en, fr, de, es, etc.
- `fields`: Customize output columns

**Example:**

```text
Query: "plumbers in Denver Colorado"
Results: 15 plumbing companies with ratings, phone, website
Cost: 1 credit
```

---

#### google_maps_reviews

Extract reviews from Google Maps listings for sentiment analysis.

```text
Usage: Get 100 reviews from specific business place_id
Returns: reviewer_name, rating, text, date, helpful_count, owner_response
Cost: 5-15 credits for 100+ reviews
```

**When to use:**

- Competitive review analysis
- Customer sentiment tracking
- Reputation monitoring
- Feature request mining
- Quality issue identification

**Key parameters:**

- `place_id`: Google Maps ID (ChIJ...)
- `limit`: 10-500 reviews
- `sort`: newest, oldest, highest_rating, lowest_rating
- `language`: Language code

**Output structure:**

```json
{
  "reviewer_name": "Jane Smith",
  "rating": 5,
  "text": "Excellent service!",
  "date": "2025-04-08",
  "helpful_count": 15,
  "owner_response": "Thank you!"
}
```

---

### 2. Review Platform Tools (17 tools)

**Purpose:** Mine reviews from customer feedback platforms.

#### yelp_search & yelp_reviews

Find Yelp businesses and extract reviews.

```text
yelp_search: Find businesses on Yelp
yelp_reviews: Extract reviews from Yelp listings
Cost: 2-5 credits per platform
```

#### tripadvisor_reviews

Extract reviews from TripAdvisor (hotels, restaurants, attractions).

```text
Usage: Scrape reviews for hotel or restaurant
Cost: 5-10 credits for 100 reviews
```

#### trustpilot_search, trustpilot_reviews, trustpilot_company

Find and scrape Trustpilot company reviews.

```text
trustpilot_search: Find company on Trustpilot
trustpilot_reviews: Extract company reviews
trustpilot_company: Get company profile data
Cost: 5-10 credits per company
```

#### glassdoor_reviews

Extract employee reviews from Glassdoor.

```text
Usage: Analyze employer brand and employee sentiment
Cost: 10-15 credits for 100 reviews
```

#### amazon_reviews

Scrape product reviews from Amazon.

```text
Usage: Get reviews for ASIN (product ID)
Cost: 5-10 credits for 100 reviews
```

#### apple_store_reviews & google_play_reviews

Extract reviews from mobile app stores.

```text
Usage: Analyze app customer feedback
Cost: 5-10 credits for 100 reviews
```

#### youtube_comments

Mine comments from YouTube videos.

```text
Usage: Extract audience feedback and engagement
Cost: 5-10 credits for 100 comments
```

#### capterra_reviews

Extract B2B software reviews from Capterra.

```text
Usage: Analyze software product feedback
Cost: 5-10 credits for 100 reviews
```

---

### 3. Search Engine Tools (3 tools)

**Purpose:** Search across web, news, and video platforms.

#### google_search

Search the public web for pages, articles, and results.

```text
Usage: Broad web search with Google operators
Returns: title, url, snippet, rank
Cost: 1 credit per query
```

**Supports operators:**

- `site:github.com` — Results from specific domain
- `intitle:keyword` — Title contains phrase
- `inurl:path` — URL contains keyword
- `"exact phrase"` — Exact phrase matching
- `-excluded_word` — Exclude words

**Example:**

```text
Query: site:github.com intitle:MCP
Results: GitHub repositories related to MCP
Cost: 1 credit
```

---

#### google_search_news

Find recent news articles and press releases.

```text
Usage: Monitor news about company, industry, or topic
Returns: title, source, url, published_date, snippet
Cost: 1 credit per query
```

---

#### youtube_search

Search for videos on YouTube.

```text
Usage: Find video content on topic
Returns: title, channel, url, views, published_date
Cost: 1 credit per query
```

---

### 4. Enrichment Tools (6 tools)

**Purpose:** Extract and verify contact information and company data.

#### emails_and_contacts

Extract emails and contacts from company websites.

```text
Usage: Get employee contact list from domain
Returns: email, name, title, department, linkedin_url
Cost: 1 credit per domain
```

**Workflow:**

1. Provide company domain: "example.com"
2. Tool extracts public email addresses
3. Returns names, titles, departments
4. Cross-reference with LinkedIn URLs

**Example:**

```text
Input: "techcompany.io"
Output: 47 employee emails with names and titles
Cost: 1 credit
```

---

#### email_verifier

Verify if email addresses are valid and deliverable.

```text
Usage: Batch verify email list
Returns: is_valid, is_deliverable, confidence_score, mx_records
Cost: 0.1 credit per email (bulk discounts)
```

**Validation checks:**

- Format validation (RFC-compliant)
- Domain existence
- MX record verification
- SMTP verification
- Disposable domain detection
- Role account detection (info@, support@, etc.)

**Batch processing:**

```text
Input: 100 emails
Output: Valid/invalid status with confidence scores
Cost: 10 credits (0.1 per email)
```

---

#### company_insights

Get detailed company information and intelligence.

```text
Usage: Enrich company data with funding, employees, tech stack
Returns: industry, size, funding, investors, technologies, location
Cost: 2-5 credits per company
```

**Data included:**

- Company description
- Industry and category
- Employee count
- Founded year
- Funding status and amounts
- Key investors
- Technology stack
- LinkedIn profile
- Crunchbase profile

---

#### phones_enricher

Look up phone numbers and associated details.

```text
Usage: Find or verify phone numbers
Returns: associated_name, type, carrier, location
Cost: 1 credit per lookup
```

---

#### whitepages_phones & whitepages_addresses

Comprehensive WhitePages lookups for people and addresses.

```text
whitepages_phones: Reverse lookup phone to person/address
whitepages_addresses: Reverse lookup address to resident
Cost: 1-2 credits per lookup
```

**Use cases:**

- Verify customer identity
- Address validation
- Fraud detection
- Property owner identification

---

### 5. Geocoding Tools (2 tools)

**Purpose:** Convert addresses to coordinates and vice versa.

#### geocoding

Forward geocoding: Address → Latitude/Longitude

```text
Usage: Convert street address to coordinates
Returns: latitude, longitude, place_name, accuracy, components
Cost: 0.5 credit per address
```

**Applications:**

- Map visualization
- Distance calculations
- Location-based filtering
- Service area analysis

**Example:**

```text
Input: "1600 Pennsylvania Ave, Washington DC"
Output: 38.8977, -77.0365 (The White House)
Cost: 0.5 credit
```

---

#### reverse_geocoding

Reverse geocoding: Latitude/Longitude → Address

```text
Usage: Convert coordinates to street address
Returns: address, place_name, place_type, components
Cost: 0.5 credit per coordinate
```

**Applications:**

- Identify locations from GPS data
- Validate coordinates
- Service area mapping
- Historical location tracking

---

## 28 Tools Summary Table

| Category | Tool Name | Cost | Use Case |
| ---------- | ----------- | ------ | ---------- |
| **Google Maps (5)** | google_maps_search | 1 credit | Find businesses |
| | google_maps_reviews | 5-15 credits/100 | Mine reviews |
| **Yelp (2)** | yelp_search | 2 credits | Find Yelp business |
| | yelp_reviews | 5 credits/100 | Get Yelp reviews |
| **TripAdvisor (1)** | tripadvisor_reviews | 5 credits/100 | Hotel/restaurant reviews |
| **Trustpilot (3)** | trustpilot_search | 2 credits | Find company |
| | trustpilot_reviews | 5 credits/100 | Get reviews |
| | trustpilot_company | 5 credits | Company profile |
| **Glassdoor (1)** | glassdoor_reviews | 10 credits/100 | Employee reviews |
| **Amazon (1)** | amazon_reviews | 5 credits/100 | Product reviews |
| **Apple (1)** | apple_store_reviews | 5 credits/100 | iOS app reviews |
| **Google Play (1)** | google_play_reviews | 5 credits/100 | Android app reviews |
| **YouTube (2)** | youtube_search | 1 credit | Video search |
| | youtube_comments | 5 credits/100 | Video comments |
| **Capterra (1)** | capterra_reviews | 5 credits/100 | B2B software reviews |
| **Web Search (2)** | google_search | 1 credit | Web search |
| | google_search_news | 1 credit | News search |
| **Email/Contacts (2)** | emails_and_contacts | 1 credit | Extract emails |
| | email_verifier | 0.1 credit/email | Verify emails |
| **Company (1)** | company_insights | 2-5 credits | Company data |
| **Phone (2)** | phones_enricher | 1 credit | Phone lookup |
| | whitepages_phones | 1 credit | Person lookup |
| **Address (1)** | whitepages_addresses | 1 credit | Address lookup |
| **Geocoding (2)** | geocoding | 0.5 credit/address | Address→Coord |
| | reverse_geocoding | 0.5 credit/coord | Coord→Address |

---

## Common Workflows

### Workflow 1: Lead Generation Pipeline

**Objective:** Generate 100 B2B qualified leads

**Steps:**

1. **Search** using `google_maps_search` or `google_search`
   - Query: "SaaS companies in San Francisco"
   - Cost: 2-5 credits
   - Output: Business names and domains

2. **Extract Emails** using `emails_and_contacts`
   - Input: company1.com, company2.com, ...
   - Cost: 1 credit per domain × 10 = 10 credits
   - Output: Employee emails with titles

3. **Verify Emails** using `email_verifier`
   - Input: 100 extracted emails
   - Cost: 0.1 credit × 100 = 10 credits
   - Output: Verified email list

4. **Enrich Company Data** using `company_insights`
   - Input: 10 company domains
   - Cost: 2 credits × 10 = 20 credits
   - Output: Size, funding, industry

5. **Export** as CSV with columns: email, name, title, company, company_size, funding_status

**Total cost:** 42-47 credits

**Timeline:** 10-15 minutes

---

### Workflow 2: Competitor Review Analysis

**Objective:** Analyze 3 competitors across Google, Yelp, Trustpilot

**Steps:**

1. **Find competitors** using `google_maps_search`
   - Get place_id for each competitor
   - Cost: 3 credits

2. **Scrape Google reviews** using `google_maps_reviews`
   - 100 reviews per competitor × 3 competitors
   - Cost: 15 credits × 3 = 45 credits
   - Output: 300 reviews with ratings, text, dates

3. **Scrape Yelp reviews** using `yelp_reviews`
   - 100 reviews per competitor
   - Cost: 5 credits × 3 = 15 credits
   - Output: 300 Yelp reviews

4. **Scrape Trustpilot reviews** using `trustpilot_reviews`
   - 100 reviews per competitor
   - Cost: 5 credits × 3 = 15 credits
   - Output: 300 Trustpilot reviews

5. **Analyze sentiment** (manual or AI-powered)
   - Extract themes: quality, price, service, support
   - Calculate sentiment score
   - Create comparison report

6. **Export** comparison: Avg rating, review count, top complaints, strengths

**Total cost:** 78 credits

**Timeline:** 20-30 minutes

---

### Workflow 3: Service Market Research

**Objective:** Map plumbing market in 3 cities

**Steps:**

1. **Search** using `google_maps_search`
   - Query: "plumbers in Austin TX"
   - Cost: 1 credit × 3 cities = 3 credits
   - Output: 30-50 plumbing companies per city

2. **Geocode addresses** using `geocoding`
   - 150 addresses total
   - Cost: 0.5 credit × 150 = 75 credits
   - Output: Coordinates for mapping

3. **Scrape Google reviews** using `google_maps_reviews`
   - 50 reviews per top 10 companies × 3 cities
   - Cost: 10 credits × 3 = 30 credits
   - Output: 1500 reviews for sentiment analysis

4. **Get phone numbers** (from search results)
   - Output: Contact info for outreach

5. **Analyze results:**
   - Create map visualization with coordinates
   - Density analysis (competitors per area)
   - Pricing benchmarks (from reviews)
   - Service area gaps
   - Quality metrics (ratings, review counts)

6. **Export** market intelligence report with density maps, pricing ranges, identified opportunities

**Total cost:** 108 credits

**Timeline:** 45-60 minutes

---

### Workflow 4: Employee Sentiment & Employer Brand

**Objective:** Monitor employer brand vs. competitors

**Steps:**

1. **Find employee reviews** using `glassdoor_reviews`
   - Your company: 100 reviews
   - Competitor A: 50 reviews
   - Competitor B: 50 reviews
   - Cost: 10 credits × 3 = 30 credits

2. **Find company on Trustpilot** using `trustpilot_company`
   - Get company profile and rating
   - Cost: 2 credits × 3 = 6 credits

3. **Scrape Trustpilot reviews** using `trustpilot_reviews`
   - 100 reviews per company
   - Cost: 5 credits × 3 = 15 credits

4. **Analyze themes:**
   - Work culture and team dynamics
   - Compensation and benefits
   - Growth opportunities
   - Management quality
   - Work-life balance

5. **Generate report:**
   - Your rating vs. competitors
   - Key strengths
   - Areas for improvement
   - Sentiment trend over time

6. **Export** employer brand scorecard

**Total cost:** 51 credits

**Timeline:** 20-25 minutes

---

### Workflow 5: Product Review Synthesis

**Objective:** Mine customer feedback to inform product roadmap

**Steps:**

1. **Scrape Amazon reviews** using `amazon_reviews`
   - Your product: 100 reviews
   - Competitor 1: 100 reviews
   - Competitor 2: 100 reviews
   - Cost: 5 credits × 3 = 15 credits

2. **Mine YouTube comments** using `youtube_comments`
   - Related videos: 100 comments
   - Cost: 5 credits

3. **Extract B2B feedback** using `capterra_reviews` (if SaaS)
   - 100 reviews
   - Cost: 5 credits

4. **Identify feature requests:**
   - Parse review text for "wish" statements
   - Extract "needs X" mentions
   - Identify competitor comparisons

5. **Create roadmap input:**
   - Top 10 feature requests
   - Most painful gaps
   - Market differentiation opportunities
   - Pricing perceptions

6. **Export** product insights with feature priority matrix

**Total cost:** 25 credits

**Timeline:** 15-20 minutes

---

## Rate Limiting & Cost Management

### Rate Limits

- **Google Maps Search:** ~20 QPS (queries per second)
- **Review Scraping:** ~15 QPS per platform
- **Email Enrichment:** ~30 QPS
- **Overall:** Respect 20 QPS aggregate limit

### Cost Optimization Tips

1. **Batch operations**
   - Process 50+ items at once
   - Email verification: Batch 100+ emails (0.1 credit/email)
   - Geocoding: Batch 100+ addresses

2. **Conservative limits**
   - Start with `limit: 10-20` for exploration
   - Scale to `limit: 50-100` for full research
   - Reserve high limits (200+) for validated queries

3. **Cache results**
   - Reuse geocoded coordinates
   - Store verified emails
   - Avoid re-scraping same place_id

4. **Monitor spending**
   - Check account credits before large jobs
   - Estimate costs: `num_items × credits_per_item`
   - Set alerts at 80% credit usage

### Budget Examples

| Project | Items | Est. Credits | Cost |
| --------- | ------- | -------------- | ------ |
| Lead gen (100 leads) | 10 companies × 10 contacts | 40-50 | $20-30 |
| Competitor review analysis (3 competitors) | 300+ reviews | 75-100 | $40-60 |
| Market research (3 cities) | 150 businesses + 1500 reviews | 100-150 | $50-80 |
| Employer brand (3 companies) | 300 reviews | 50-75 | $25-40 |
| Product roadmap (product + 2 competitors) | 300+ reviews | 25-40 | $15-25 |

---

## Data Quality & Validation

### Review Fraud Detection

Flag suspicious reviews:

```text
1. Same reviewer across multiple competitors → suspicious
2. Sudden spike in 5-star reviews → potential manipulation
3. Identical text in different reviews → copied feedback
4. Recent reviews only → artificial rating inflation
5. Generic praise with no specifics → bot-generated
```

### Email Quality Checks

```text
1. Verify before outreach (email_verifier)
2. Remove role accounts: info@, support@, noreply@, sales@
3. Check domain reputation
4. Validate format and deliverability
5. Remove duplicates before batch processing
```

### Company Data Freshness

```text
1. Refresh company insights quarterly
2. Monitor funding announcements
3. Track technology stack changes
4. Cross-reference with LinkedIn updates
5. Validate addresses with geocoding
```

---

## Security & Ethical Considerations

### Responsible Data Use

1. **Respect platform terms of service**
   - Outscraper respects robots.txt
   - No excessive scraping (follow rate limits)
   - No data resale without consent

2. **Privacy compliance**
   - GDPR: EU resident data
   - CCPA: California resident data
   - Don't combine PII without consent

3. **Legitimate use cases**
   - Lead generation ✓
   - Market research ✓
   - Competitive analysis ✓
   - Employee research ✓
   - Sentiment monitoring ✓
   - Fraud detection ✓

4. **Attribution**
   - Credit data sources in reports
   - When publishing, cite Outscraper
   - Respect reviewer privacy (anonymize if needed)

---

## Output Formats

### Standardized JSON Output

```json
{
  "research_objective": "Market research",
  "search_parameters": {
    "location": "Austin TX",
    "category": "Services",
    "filters": "rating >= 4.0"
  },
  "findings": [
    {
      "name": "Business Name",
      "rating": 4.8,
      "reviews": 125,
      "phone": "+1-512-555-0123"
    }
  ],
  "data_sources": ["Google Maps"],
  "total_credits_used": 10,
  "confidence_score": 0.95,
  "timestamp": "2025-04-10T14:30:00Z"
}
```

### CSV Export Columns

```csv
name,location,rating,reviews_count,phone,website,avg_sentiment,source,scraped_date
```

### Report Structure

```text
1. Executive Summary
2. Research Methodology
3. Key Findings
4. Data Tables
5. Visualizations (maps, charts)
6. Recommendations
7. Data Quality Notes
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
| ------- | ---------- |
| "Place ID not found" | Verify with google_maps_search first |
| "No email results" | Company may not have public email list |
| "Rate limited" | Wait 60 seconds, reduce request rate |
| "Insufficient credits" | Purchase more or reduce batch size |
| "Invalid email domain" | Check spelling; domain may be non-standard |
| "Geocoding failed" | Use more complete address (street + city + zip) |

### Performance Optimization

1. **Parallel operations**
   - Run multiple searches simultaneously
   - Batch verify emails at once
   - Geocode in chunks of 100

2. **Caching**
   - Store results locally
   - Reuse geocoded coordinates
   - Cache company insights

3. **Monitoring**
   - Track API response times
   - Monitor credit usage
   - Log errors for analysis

---

## Advanced Techniques

### Semantic Sentiment Analysis

Extract themes from review text:

```text
Positive: "excellent", "amazing", "highly recommend", "best"
Negative: "terrible", "waste of money", "poor service", "avoid"
Neutral: "ok", "average", "decent", "fine"
```

### Competitive Positioning

```text
1. Extract top complaints from competitor reviews
2. Verify those issues don't exist in your product
3. Emphasize as competitive advantage
4. Monitor sentiment trends over time
```

### Lead Scoring

```text
1. Use company_insights to get company size, funding
2. Adjust lead score based on company metrics
3. Prioritize well-funded companies
4. Target specific industries or geographies
```

### Geographic Clustering

```text
1. Geocode all addresses
2. Group by zip code or neighborhood
3. Identify high-density areas (opportunities)
4. Identify white-space (service gaps)
```

---

## Summary

Outscraper provides a powerful, cost-effective toolkit for market research, lead generation, sentiment analysis, and competitive intelligence. Master the 28 tools, understand rate limits and costs, and implement workflows that turn raw data into actionable business insights.

**Next steps:** Choose a workflow, estimate costs, and begin research!
