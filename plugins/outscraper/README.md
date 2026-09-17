# Outscraper Plugin

Web scraping and data enrichment with Outscraper — Google Maps, reviews from 17 platforms, search engines, email/phone enrichment via 28 MCP tools.

## Overview

The Outscraper plugin brings professional-grade web scraping and data enrichment to Claude Code. Access 28 tools covering:

- **Google Maps**: Business search, place details, and review mining
- **Review Platforms**: Google, Yelp, TripAdvisor, Trustpilot, Glassdoor, Amazon, Apple App Store, Google Play, YouTube, Capterra
- **Search Engines**: Google web search, news, and YouTube
- **Contact Enrichment**: Email extraction, phone lookup, company insights
- **Geocoding**: Address to coordinates and reverse lookups

Perfect for market research, lead generation, competitor analysis, sentiment mining, and business intelligence.

## Installation

```bash
# Via Claude Code
/plugin install outscraper

# Or install from marketplace
/plugin marketplace add https://github.com/savethepolarbears/agenthaus-marketplace
```

## Configuration

Set up your Outscraper API key in `.env`:

```bash
OUTSCRAPER_API_KEY=your_api_key_here
```

Get your API key at [outscraper.com](https://outscraper.com).

## Quick Start

### Search for Businesses

```bash
/outscraper:search "coffee shops in Austin TX" --limit 20
```

### Mine Customer Reviews

```bash
/outscraper:reviews google "ChIJ2V-Mo8dQwokRfZy-E-zcKbs" --limit 100
/outscraper:reviews trustpilot "example.com" --limit 50
/outscraper:reviews amazon "B07ABCD1234" --limit 100
```

### Extract & Verify Emails

```bash
/outscraper:enrich emails "example.com"
/outscraper:enrich verify "user@example.com"
```

### Get Company Data

```bash
/outscraper:enrich company "example.com"
```

### Geocode Addresses

```bash
/outscraper:geocode "1600 Pennsylvania Ave, Washington DC"
/outscraper:geocode reverse "38.8977,-77.0365"
```

## Commands

| Command | Purpose |
| --------- | --------- |
| `/outscraper:search` | Google Maps, Google, YouTube, and news search |
| `/outscraper:reviews` | Mine reviews from 17+ platforms |
| `/outscraper:enrich` | Extract and verify emails, get company data, phone lookup |
| `/outscraper:geocode` | Convert addresses to coordinates and vice versa |

## Agents

### data-researcher

AI-powered research specialist for market intelligence, lead generation, and competitive analysis.

```text
Use when: "Find competitors", "Analyze reviews", "Generate leads", "Market research"
```

The agent will:

1. Clarify research objectives
2. Design appropriate workflow
3. Execute searches and scraping
4. Analyze sentiment and themes
5. Compile structured reports with cost estimates

## Skills

### data-scraping

Comprehensive guide covering:

- All 28 tools and their use cases
- 5 production-ready workflows
- Cost management strategies
- Data quality and validation
- Ethical scraping practices

## 28 Tools Reference

### Google Maps (5 tools)

- `google_maps_search` — Find businesses by category, location, keywords
- `google_maps_reviews` — Extract reviews and ratings

### Reviews (17 tools)

- Google Maps, Yelp, TripAdvisor, Trustpilot, Glassdoor, Amazon, Apple App Store, Google Play, YouTube, Capterra

### Search (3 tools)

- `google_search` — Web search with operators
- `google_search_news` — News article search
- `youtube_search` — Video discovery

### Enrichment (6 tools)

- `emails_and_contacts` — Extract company emails and contacts
- `email_verifier` — Verify email deliverability
- `company_insights` — Get company data (size, funding, tech stack)
- `phones_enricher` — Phone number lookup
- `whitepages_phones` — WhitePages phone reverse lookup
- `whitepages_addresses` — WhitePages address reverse lookup

### Geocoding (2 tools)

- `geocoding` — Address to coordinates
- `reverse_geocoding` — Coordinates to address

## Common Workflows

### Lead Generation Pipeline (40-50 credits)

1. Search for businesses in target market
2. Extract company emails and contacts
3. Verify email deliverability
4. Get company size, funding, industry
5. Export as CSV with verified contact list

**Time:** 15 minutes | **Cost:** $20-30

### Competitor Review Analysis (75-100 credits)

1. Search competitors on Google Maps
2. Scrape 100+ reviews from each competitor
3. Cross-reference with Yelp and Trustpilot reviews
4. Analyze sentiment themes and common complaints
5. Compare ratings and review counts

**Time:** 30 minutes | **Cost:** $40-60

### Market Research (100-150 credits)

1. Map service providers in 3 cities
2. Geocode all business locations
3. Scrape 30-50 reviews per business
4. Analyze market density and gaps
5. Benchmark pricing and quality

**Time:** 45 minutes | **Cost:** $50-80

### Employer Brand Monitoring (50-75 credits)

1. Find your company on Glassdoor and Trustpilot
2. Compare vs. 2 competitors
3. Scrape 100 reviews per company
4. Analyze employee sentiment and themes
5. Track satisfaction trends

**Time:** 20 minutes | **Cost:** $25-40

### Product Roadmap Intelligence (25-40 credits)

1. Scrape Amazon reviews (your product + 2 competitors)
2. Mine YouTube comments for feature requests
3. Extract B2B feedback via Capterra
4. Identify top feature requests and complaints
5. Prioritize roadmap items

**Time:** 15 minutes | **Cost:** $15-25

## Cost & Rate Limits

### Rate Limits

- **Google Maps Search:** ~20 QPS
- **Review Scraping:** ~15 QPS per platform
- **Email Enrichment:** ~30 QPS
- **Overall aggregate:** Respect ~20 QPS

### Pricing (Typical Outscraper Plans)

| Operation | Cost per Item |
| ----------- | --------------- |
| Google Maps search | 1 credit |
| Extract emails per domain | 1 credit |
| Verify email | 0.1 credit |
| Company insights | 2-5 credits |
| Review mining (100 reviews) | 5-15 credits |
| Phone/address lookup | 1 credit |
| Geocode address | 0.5 credit |

### Budget Examples

| Project | Estimated Credits | Cost |
| --------- | ------------------- | ------ |
| Small research (10 businesses) | 15-25 | $8-15 |
| Lead generation (100 leads) | 40-50 | $20-30 |
| Competitive analysis | 75-100 | $40-60 |
| Market research (3 cities) | 100-150 | $50-80 |
| Full market intelligence | 200-300 | $100-150 |

## Best Practices

### Data Quality

1. **Verify before processing** — Use email_verifier before outreach
2. **Cross-reference** — Validate data across multiple platforms
3. **Check freshness** — Prefer recent data (< 6 months)
4. **Deduplicate** — Remove duplicates before batch processing

### Cost Management

1. **Start conservative** — Use `--limit 10-20` for exploration
2. **Batch operations** — Process 50+ items at once
3. **Cache results** — Reuse geocoded addresses
4. **Monitor spending** — Check credits before large jobs

### Ethics & Compliance

1. **Respect ToS** — Outscraper respects robots.txt and platform policies
2. **Privacy** — GDPR/CCPA compliant, no PII selling
3. **Legitimate use** — Lead gen, market research, competitive analysis ✓
4. **Rate limits** — Never exceed ~20 QPS aggregate

## Examples

### Find Top-Rated Plumbers in Austin

```bash
/outscraper:search "plumbers in Austin TX" --limit 20
/outscraper:reviews google [place_id] --limit 50 --sort highest_rating
```

**Output:** 20 plumbing companies with ratings, phone, website, and top 50 reviews

### Generate B2B Lead List

```bash
/outscraper:search "SaaS companies in San Francisco"
/outscraper:enrich emails company1.com company2.com ...
/outscraper:enrich verify --batch-file emails.csv
/outscraper:enrich company company1.com company2.com ...
```

**Output:** CSV with email, name, title, company, size, funding

### Analyze Competitor Reviews

```bash
/outscraper:reviews google [competitor_place_id] --limit 100
/outscraper:reviews trustpilot "competitor.com" --limit 100
/outscraper:reviews amazon [competitor_asin] --limit 100
```

**Output:** 300+ reviews with sentiment analysis for comparison

### Map Service Providers

```bash
/outscraper:search "restaurants in Austin TX" --limit 50
/outscraper:geocode batch restaurants.csv --mode forward
```

**Output:** Coordinates for mapping, density analysis, gap identification

## Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `OUTSCRAPER_API_KEY` | Yes | Your Outscraper API key |

## Troubleshooting

### "No results found"

- Verify query spelling and format
- Try broader search terms
- Check location is correctly formatted

### "Rate limited"

- Wait 60 seconds before retrying
- Reduce request rate (spread requests over time)
- Batch operations may have rate limits

### "Insufficient credits"

- Purchase more credits from Outscraper
- Reduce batch size or result limits
- Use lower limit values (10-20 vs. 100+)

### "Invalid email"

- Check domain spelling
- Verify company has public email list
- Try alternative email lookup tools

## Support

- **API Docs**: <https://outscraper.com/api>
- **CLI Tool Docs**: <https://github.com/savethepolarbears/agenthaus-marketplace>
- **AgentHaus Issues**: <https://github.com/savethepolarbears/agenthaus-marketplace/issues>

## License

MIT — See LICENSE in repository root.

---

**Happy researching!** Use Outscraper to turn web data into actionable business intelligence.
