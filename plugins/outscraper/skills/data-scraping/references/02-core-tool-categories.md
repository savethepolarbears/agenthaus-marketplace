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

