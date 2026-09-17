---
description: Search Google Maps for businesses, or search Google/YouTube for web results. Usage examples—`/outscraper:search 'coffee shops in Austin TX' --limit 20`, `/outscraper:search google 'best CRM tools 2025'`, `/outscraper:search youtube 'AI tutorials'`
---

# Outscraper Search Command

Search for businesses on Google Maps or web results across Google, YouTube, and news platforms.

## Google Maps Search

Find businesses, places, and venues by category, location, and keywords.

```
/outscraper:search "coffee shops in Austin TX" --limit 20
/outscraper:search "sushi restaurants near 38.8951,-77.0369" --language en
/outscraper:search "dental clinics in Los Angeles" --fields name,rating,reviews_count,type
```

**Parameters:**
- `query` (required): Business category, name, or keyword + location (e.g., "plumbers in Denver CO")
- `--limit` (optional): Number of results (default 10, max 100)
- `--language` (optional): Language code (en, fr, de, es, etc.)
- `--fields` (optional): Comma-separated fields to include in results
  - Default: name, address, type, rating, reviews_count, phone, website, place_id
  - Available: All of above plus coordinates, photos_count, google_review_link, working_hours

**Output:**
```json
{
  "data": [
    {
      "name": "Blue Bottle Coffee",
      "address": "123 Main St, Austin, TX 78701",
      "type": "Coffee Shop",
      "rating": 4.7,
      "reviews_count": 342,
      "phone": "+1-512-555-0123",
      "website": "bluebottle.com",
      "place_id": "ChIJ...",
      "coordinates": {"latitude": 30.2672, "longitude": -97.7431}
    }
  ],
  "status": "success",
  "credits_used": 5
}
```

**Common Workflows:**

1. **Local business research**: `"pizza delivery in 90210"` → find competitors, ratings, phone numbers
2. **Lead generation**: `"B2B software companies in San Francisco"` → collect business info and websites
3. **Branch finder**: `"Starbucks near user location"` → locate nearest franchises with hours
4. **Review baseline**: Get Google Maps reviews alongside business metadata

---

## Google Search

Search across the public web for pages, images, and products.

```
/outscraper:search google "best project management tools 2025"
/outscraper:search google "site:github.com Claude Code" --limit 10
/outscraper:search google "AI agents" --language de
```

**Parameters:**
- `query` (required): Search keyword or query (supports Google operators: site:, inurl:, intitle:, etc.)
- `--limit` (optional): Number of results (default 10, max 100)
- `--language` (optional): Language code for results
- `--region` (optional): Geographic region for results (us, gb, de, etc.)

**Output:**
```json
{
  "data": [
    {
      "title": "Best Project Management Tools 2025 - Review",
      "url": "https://example.com/pm-tools-2025",
      "snippet": "Compare top project management software including Asana, Monday.com, Jira...",
      "rank": 1
    }
  ],
  "status": "success"
}
```

---

## Google News Search

Find recent news articles and press releases on specific topics.

```
/outscraper:search news "artificial intelligence policy" --limit 20
/outscraper:search news "tech layoffs" --language en --region us
```

**Parameters:**
- `query` (required): News topic or keyword
- `--limit` (optional): Number of articles (default 10, max 100)
- `--language` (optional): Language code
- `--region` (optional): Geographic region

**Output:**
```json
{
  "data": [
    {
      "title": "New AI Regulations Announced by EU Commission",
      "source": "Reuters",
      "url": "https://reuters.com/...",
      "published_date": "2025-04-10",
      "snippet": "The European Commission unveiled sweeping new regulations..."
    }
  ],
  "status": "success"
}
```

---

## YouTube Search

Search for videos on YouTube by topic, channel, or keywords.

```
/outscraper:search youtube "Claude Code tutorial" --limit 15
/outscraper:search youtube "machine learning" --language en
```

**Parameters:**
- `query` (required): Video topic or keyword
- `--limit` (optional): Number of results (default 10, max 100)
- `--language` (optional): Language code

**Output:**
```json
{
  "data": [
    {
      "title": "Claude Code Tutorial - Getting Started",
      "channel": "Anthropic Official",
      "url": "https://youtube.com/watch?v=...",
      "views": 125000,
      "published_date": "2025-03-15",
      "duration_seconds": 1240
    }
  ],
  "status": "success"
}
```

---

## Cost & Rate Limits

- **Google Maps Search**: 1 credit per query
- **Google Search**: 1 credit per query
- **News Search**: 1 credit per query
- **YouTube Search**: 1 credit per query
- **Rate limit**: ~20 queries per second (QPS)

Use `--limit` conservatively to manage credit usage. Batching searches in a loop costs credits per query.

---

## Advanced Tips

1. **Geolocation targeting**: Include city, zip code, or coordinates in query
   - `"restaurants near 40.7128,-74.0060"` (NYC coordinates)
   - `"plumbers in Denver CO"` (city + state)

2. **Google search operators**: Filter results precisely
   - `site:github.com` — Results from specific domain
   - `intitle:Claude Code` — Title contains phrase
   - `inurl:api` — URL contains keyword
   - Combine: `site:github.com intitle:MCP`

3. **Review baseline**: Search for a business on Maps first, then get reviews separately
4. **Competitive intelligence**: Search competitor names + "reviews" or "complaints"
5. **Lead verification**: Use Google Search to verify business websites before enrichment
