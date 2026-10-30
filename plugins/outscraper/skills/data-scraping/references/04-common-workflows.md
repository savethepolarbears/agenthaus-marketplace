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

