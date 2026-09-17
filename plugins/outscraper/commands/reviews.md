---
description: Scrape reviews from 17+ platforms — Google, Yelp, TripAdvisor, Trustpilot, Amazon, Glassdoor, Apple, Google Play, and more. Usage—`/outscraper:reviews google 'ChIJ...' --limit 100`, `/outscraper:reviews trustpilot 'example.com'`, `/outscraper:reviews amazon 'B07ABCD1234'`
---

# Outscraper Reviews Command

Mine customer reviews from 17+ platforms for sentiment analysis, competitive intelligence, and product feedback.

## Google Maps Reviews

Extract reviews, ratings, and metadata from Google Maps listings.

```
/outscraper:reviews google "ChIJ2V-Mo8dQwokRfZy-E-zcKbs" --limit 100
/outscraper:reviews google "business_name_and_location" --limit 50
/outscraper:reviews google "place_id" --sort newest --language en
```

**Parameters:**
- `place_id` (required): Google Maps place ID (starts with "ChIJ") or business name + location
- `--limit` (optional): Number of reviews (default 10, max 500)
- `--sort` (optional): "newest", "oldest", "highest_rating", "lowest_rating" (default: newest)
- `--language` (optional): Language code for results
- `--fields` (optional): Comma-separated fields (reviewer_name, rating, text, date, helpful_count)

**Output:**
```json
{
  "data": [
    {
      "reviewer_name": "Jane Smith",
      "rating": 5,
      "text": "Best coffee in town! Friendly staff and quality beans.",
      "date": "2025-04-08",
      "helpful_count": 24,
      "images_count": 2,
      "response_from_owner": "Thanks for the kind words!"
    }
  ],
  "status": "success",
  "business_info": {
    "name": "Blue Bottle Coffee Austin",
    "rating": 4.7,
    "total_reviews": 342
  }
}
```

---

## Yelp Reviews

Scrape reviews and business details from Yelp listings.

```
/outscraper:reviews yelp "best-pizza-downtown-denver" --limit 100
/outscraper:reviews yelp "pizza_restaurants_denver" --limit 50
```

**Parameters:**
- `query` (required): Yelp business URL slug or business name + location
- `--limit` (optional): Number of reviews (default 10, max 500)
- `--sort` (optional): "newest", "highest_rating", "lowest_rating"

**Output:**
```json
{
  "data": [
    {
      "author": "John D.",
      "rating": 4,
      "text": "Great atmosphere, good pizza, but service was slow on Saturday.",
      "date": "2025-04-07",
      "useful_votes": 5,
      "photos": 1
    }
  ],
  "business_info": {
    "name": "Best Pizza Downtown",
    "rating": 4.3,
    "review_count": 287
  }
}
```

---

## TripAdvisor Reviews

Extract reviews from TripAdvisor for hotels, restaurants, attractions.

```
/outscraper:reviews tripadvisor "hotels-in-new-york-city" --limit 100
/outscraper:reviews tripadvisor "restaurants_paris" --limit 50
```

**Output:** Author, rating (1-5), text, date, helpful_count, traveler_type (family, solo, business)

---

## Trustpilot Reviews & Company Search

Scrape company reviews from Trustpilot and find company profiles.

```
/outscraper:reviews trustpilot "example.com" --limit 100
/outscraper:reviews trustpilot "company-name" --limit 50
/outscraper:reviews trustpilot-company "example.com"
```

**Parameters:**
- `--limit` (optional): Number of reviews (default 10, max 500)
- `--sort` (optional): "newest", "highest_rating", "lowest_rating"
- `--language` (optional): Language code

**Company Search Output:**
```json
{
  "company": {
    "name": "Example Company",
    "url": "https://trustpilot.com/review/example.com",
    "overall_rating": 4.2,
    "total_reviews": 1245,
    "categories": ["Customer Service", "E-commerce"],
    "country": "US"
  }
}
```

---

## Glassdoor Company Reviews

Mine employee reviews and company ratings from Glassdoor.

```
/outscraper:reviews glassdoor "google-reviews" --limit 100
/outscraper:reviews glassdoor "company_name" --limit 50
```

**Output:** Title, author_job, rating, text, date, company_benefits, salary_insights

---

## Amazon Product Reviews

Scrape product reviews from Amazon by ASIN or product URL.

```
/outscraper:reviews amazon "B07ABCD1234" --limit 100
/outscraper:reviews amazon "https://amazon.com/dp/B07ABCD1234" --limit 50
```

**Parameters:**
- `asin_or_url` (required): Amazon ASIN (10-digit code) or full product URL
- `--limit` (optional): Number of reviews (default 10, max 500)
- `--sort` (optional): "newest", "highest_rating", "lowest_rating", "most_helpful"

**Output:**
```json
{
  "product": {
    "asin": "B07ABCD1234",
    "title": "Premium Wireless Headphones",
    "average_rating": 4.5,
    "total_reviews": 3245
  },
  "reviews": [
    {
      "reviewer": "Sarah M.",
      "rating": 5,
      "title": "Excellent sound quality!",
      "text": "Best headphones I've owned. Great bass, comfortable fit...",
      "date": "2025-04-05",
      "helpful_votes": 47,
      "verified_purchase": true
    }
  ]
}
```

---

## Apple App Store Reviews

Extract reviews from the Apple App Store for iOS apps.

```
/outscraper:reviews apple-store "com.example.app" --limit 100
/outscraper:reviews apple-store "app-name" --limit 50
```

**Output:** Author, rating, text, date, app_version

---

## Google Play Store Reviews

Scrape Android app reviews from Google Play Store.

```
/outscraper:reviews google-play "com.example.app" --limit 100
/outscraper:reviews google-play "app_name" --limit 50
```

**Output:** Author, rating, text, date, app_version, helpful_count

---

## YouTube Comments

Mine comments from YouTube videos for sentiment analysis or feedback.

```
/outscraper:reviews youtube "video_id" --limit 100
/outscraper:reviews youtube "dQw4w9WgXcQ" --limit 50
```

**Parameters:**
- `video_id` (required): YouTube video ID (from URL: youtube.com/watch?v=VIDEO_ID)
- `--limit` (optional): Number of comments (default 10, max 500)
- `--sort` (optional): "newest", "most_relevant", "most_liked"

**Output:**
```json
{
  "video": {
    "title": "Claude Code Tutorial",
    "channel": "Anthropic",
    "view_count": 125000,
    "like_count": 5000
  },
  "comments": [
    {
      "author": "Tech Enthusiast",
      "text": "Amazing tutorial! Exactly what I needed.",
      "likes": 234,
      "date": "2025-04-08",
      "replies_count": 3
    }
  ]
}
```

---

## Capterra Software Reviews

Extract reviews for B2B software products from Capterra.

```
/outscraper:reviews capterra "asana" --limit 100
/outscraper:reviews capterra "project-management-software" --limit 50
```

**Output:** Author, role, company_size, rating, text, date, pros, cons

---

## Cost & Rate Limits

- **Per review scrape**: 2-5 credits depending on platform
- **Large batches** (100+ reviews): 10-25 credits
- **Rate limit**: ~15 QPS for review scraping

**Cost examples:**
- 50 Google Maps reviews: ~10 credits
- 100 Yelp reviews: ~15 credits
- 200 Amazon reviews: ~20 credits

Monitor credit usage with `status` command before large scraping jobs.

---

## Advanced Workflows

### 1. Competitive Sentiment Analysis
```
1. Search for competitor business
2. Scrape 200+ reviews from multiple platforms
3. Analyze review text for common themes
4. Export CSV: date, platform, rating, sentiment_keywords
```

### 2. Product Review Summary
```
1. Get Amazon ASIN for product
2. Scrape 150+ reviews (highest + lowest rated first)
3. Extract pros/cons from review text
4. Compile feature request frequency
5. Identify top complaints
```

### 3. Employee Sentiment Baseline
```
1. Find company on Glassdoor and Trustpilot
2. Scrape 100+ reviews from both platforms
3. Compare average ratings and common themes
4. Track rating trends over time
```

### 4. Multi-Platform Review Export
```
1. Search business on Google, Yelp, TripAdvisor
2. Scrape 50 reviews from each platform
3. Combine into single CSV with platform column
4. Deduplicate reviews by content similarity
5. Export for analysis
```

---

## Tips & Best Practices

1. **Review fraud detection**: Look for unusual patterns
   - Same reviewer across multiple platforms
   - Identical text in different reviews
   - Spike in 5-star reviews after competitor activity

2. **Sentiment analysis**: Use review text for mood/theme extraction
   - Positive keywords: "excellent", "amazing", "highly recommend"
   - Negative keywords: "waste of money", "terrible", "avoid"

3. **Rating validation**: Cross-reference ratings across platforms
   - High variance between platforms may indicate fake reviews
   - Verify with business owner response rate

4. **Historical trends**: Compare old vs. new reviews
   - Recent downtrend may indicate service quality change
   - Use dates to spot seasonal patterns

5. **Language detection**: Filter by language if needed
   - `--language en` for English-only reviews
   - Many platforms support multiple languages
