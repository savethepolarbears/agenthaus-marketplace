---
name: seo-content-optimization
description: NeuronWriter SEO analysis, content optimization, and publishing workflows — keyword research, competitor analysis, content scoring, and WordPress integration. Use when optimizing content for SEO, analyzing competitor search terms, scoring content quality, or publishing articles via NeuronWriter.
---

# SEO Content Optimization with NeuronWriter

This skill provides a complete SEO content workflow powered by NeuronWriter's AI engine. Use it for keyword research, content optimization, competitive analysis, and automated WordPress publishing.

## When to Use This Skill

Trigger this skill when you need to:

- **Keyword Analysis** — Research SEO potential of a target keyword
- **Competitive Benchmarking** — Analyze top-ranking content for a keyword
- **Content Planning** — Get recommendations for article structure and topics
- **Content Optimization** — Score your draft and identify improvement areas
- **Content Generation** — Automatically write SEO-optimized articles
- **WordPress Publishing** — Deploy content to WordPress with optimization
- **SEO Audits** — Evaluate existing content against current best practices
- **Bulk Content** — Process multiple keywords for campaigns or content calendars
- **Multi-language Strategy** — Analyze keywords across 40+ languages
- **Content Refresh** — Update existing articles with current ranking factors

## The 7 NeuronWriter MCP Tools

### 1. nw_create_query

**Purpose**: Initiate SEO analysis for a target keyword

**Signature**:

```python
nw_create_query(
  query: str,              # Target keyword (required)
  language: str = "en",    # Language code (default: English)
  search_engine: str = "google",  # google|bing|baidu
  domain: str = None       # Target specific domain (optional)
) -> { query_id: str, status: str }
```

**What It Does**:

- Creates analysis request in NeuronWriter's queue
- Returns immediately with query_id
- Actual analysis runs asynchronously (3-60 seconds)
- Use poll strategy with nw_get_query_data to get results

**Example**:

```python
result = nw_create_query(
  query="best project management tools",
  language="en",
  search_engine="google"
)
# Returns: { query_id: "q_abc123", status: "processing" }
```

**Best Practices**:

- Use specific, long-tail keywords (3-5 words) for best results
- Analyze before writing to inform outline strategy
- Save query_id for later reference

### 2. nw_get_query_data

**Purpose**: Retrieve completed analysis results and poll for status

**Signature**:

```python
nw_get_query_data(
  query_id: str,
  format: str = "full"  # full|summary|recommendations
) -> { 
  status: str,         # ready|processing|error
  recommendations: {...},
  competitors: {...},
  metrics: {...}
}
```

**What It Does**:

- Returns current analysis status and partial results
- "ready" status = full recommendations available
- Includes content outline, semantic terms, competitor data, scoring factors
- Poll every 3-5 seconds until status is "ready"

**Status Values**:

- **processing** — Analysis in progress (1-60 seconds typical)
- **ready** — Results available, proceed to get/evaluate
- **error** — Failed (check query or retry)

**Return Data Structure**:

```json
{
  status: "ready",
  recommendations: {
    outline: { sections: [...], headings: [...] },
    semantic_terms: [...],  # LSI keywords to include
    target_length: 2500,    # Optimal word count
    readability_score: 65,  # Target reading level
    content_type: "blog_post"
  },
  competitors: {
    top_10_results: [
      { url: "...", title: "...", keyword_mentions: 5 },
      ...
    ],
    common_terms: [...],
    coverage_gaps: [...],   # Topics you should cover
    avg_word_count: 2800
  },
  metrics: {
    keyword_difficulty: 45,  # 0-100 scale
    search_volume: 2500,
    cpc: 2.50
  }
}
```

**Polling Pattern**:

```python
# Poll for results
for attempt in range(20):  # Max 20 attempts (~5 minutes)
  data = nw_get_query_data(query_id)
  if data["status"] == "ready":
    # Process recommendations
    break
  sleep(3)  # Wait 3 seconds before retry
```

**Best Practices**:

- Always wait for "ready" status before writing
- Save full results for reference during writing
- Use format="full" for comprehensive details

### 3. get_content

**Purpose**: Retrieve saved content analysis from NeuronWriter

**Signature**:

```python
get_content(
  query_id: str,
  format: str = "html"  # html|markdown|text
) -> { content: str, metadata: {...} }
```

**What It Does**:

- Fetches content previously imported or saved to query
- Returns in requested format
- Includes metadata: creation date, last updated, source URL

**Return Data**:

```json
{
  content: "<html>...</html>",
  metadata: {
    source_url: "https://...",
    imported_at: "2026-04-10T12:34:56Z",
    content_type: "blog_post",
    word_count: 3200
  }
}
```

**Use Cases**:

- Retrieve previously imported competitor content
- Get your draft content for re-evaluation
- Fetch saved content versions

### 4. nw_import_content

**Purpose**: Import existing content for evaluation or archival

**Signature**:

```python
nw_import_content(
  query_id: str,
  content: str,       # HTML or text content
  source_url: str = None,  # Optional source URL
  content_type: str = "blog_post"  # blog_post|guide|comparison
) -> { imported_id: str, word_count: int }
```

**What It Does**:

- Saves content to NeuronWriter for analysis
- Prepares content for evaluation scoring
- Tracks multiple versions per query

**Example**:

```python
result = nw_import_content(
  query_id="q_abc123",
  content="<html><body>Your article HTML</body></html>",
  source_url="https://mysite.com/article",
  content_type="blog_post"
)
# Returns: { imported_id: "imp_xyz789", word_count: 2845 }
```

**Use Cases**:

- Import competitor content for analysis
- Save multiple draft versions
- Archive published content with metadata

### 5. evaluate_content

**Purpose**: Score content against NeuronWriter algorithm and get improvement recommendations

**Signature**:

```python
evaluate_content(
  query_id: str,
  html: str,          # HTML or plain text content
  save: bool = False  # Save to content history (optional)
) -> {
  overall_score: int,  # 0-100
  component_scores: {...},
  recommendations: [...],
  improvement_areas: [...]
}
```

**What It Does**:

- Analyzes content against query recommendations
- Returns detailed scoring breakdown
- No save = dry-run evaluation, can iterate freely
- Identifies specific gaps and improvement areas

**Return Data Structure**:

```json
{
  overall_score: 85,
  component_scores: {
    keyword_integration: 82,      # Keyword usage
    content_structure: 88,         # Heading hierarchy
    semantic_coverage: 80,         # LSI keywords
    readability: 87,               # Reading level
    content_length: 90,            # Word count vs. benchmark
    heading_hierarchy: 85          # H1/H2/H3 structure
  },
  recommendations: [
    {
      area: "keyword_integration",
      issue: "Primary keyword appears 3x, target is 5-7",
      action: "Add keyword to introduction and 2 section headings"
    },
    ...
  ],
  improvement_areas: [
    "Add 2-3 LSI keywords from recommendations",
    "Expand 'How to Choose' section (currently 200 words, target 400+)"
  ],
  estimated_improvement: 3  # Points if recommendations implemented
}
```

**Score Interpretation**:

- **90-100** — Excellent, competitive with top results
- **80-89** — Good, should rank well
- **70-79** — Fair, needs optimization in specific areas
- **60-69** — Poor, significant gaps vs. competitors
- **Below 60** — Major issues, comprehensive rewrite recommended

**Workflow Pattern**:

```python
# Draft evaluation (no save)
score1 = evaluate_content(query_id, draft_v1, save=False)
if score1["overall_score"] < 80:
  # Get recommendations and improve
  recommendations = score1["recommendations"]
  # Iterate on content...
  
# Final evaluation (save for history)
score_final = evaluate_content(query_id, final_content, save=True)
if score_final["overall_score"] >= 80:
  # Ready to publish
```

**Best Practices**:

- Evaluate multiple draft versions to compare scores
- Don't aim for 100 — 80-90 is realistic and competitive
- Prioritize high-impact recommendations first
- Re-score after each major edit

### 6. list_projects

**Purpose**: List all NeuronWriter projects and queries

**Signature**:

```python
list_projects(
  limit: int = 50,
  status: str = None  # ready|processing|error|all
) -> [{
  project_id: str,
  name: str,
  query_count: int,
  created_at: str
}]
```

**What It Does**:

- Returns all accessible projects
- Can filter by status
- Includes query count and metadata

**Example Return**:

```json
[
  {
    project_id: "p_001",
    name: "Q1-2026-Blog-Posts",
    query_count: 15,
    created_at: "2026-01-15T10:00:00Z"
  },
  ...
]
```

**Use Cases**:

- Discover existing queries without re-creating
- Organize by project/campaign
- Track analysis history

### 7. list_queries

**Purpose**: List queries within a project with filtering

**Signature**:

```python
list_queries(
  project_id: str,
  status: str = None,     # ready|processing|error|all
  keyword: str = None,    # Filter by keyword (partial match)
  limit: int = 50
) -> [{
  query_id: str,
  keyword: str,
  status: str,
  language: str,
  search_engine: str,
  created_at: str
}]
```

**What It Does**:

- Returns queries for a specific project
- Filter by status or keyword
- Pagination via limit parameter

**Example**:

```python
queries = list_queries(
  project_id="p_001",
  status="ready",
  keyword="project management"
)
```

**Use Cases**:

- Find ready queries to process
- Organize queries by keyword type
- Batch retrieve results

## Complete Workflows

### Workflow 1: Single Keyword Article (Analyze → Write → Score → Publish)

```python
# Step 1: Create analysis query
query_result = nw_create_query(
  query="best project management tools for startups",
  language="en",
  search_engine="google"
)
query_id = query_result["query_id"]

# Step 2: Poll for results (3-60 seconds)
for attempt in range(20):
  data = nw_get_query_data(query_id, format="full")
  if data["status"] == "ready":
    break
  sleep(3)

# Step 3: Extract recommendations
outline = data["recommendations"]["outline"]
semantic_terms = data["recommendations"]["semantic_terms"]
target_length = data["recommendations"]["target_length"]
competitors = data["competitors"]["top_10_results"]

# Step 4: Write article following outline
# - Include primary keyword in title and H1
# - Use outline structure for heading hierarchy
# - Naturally incorporate semantic_terms throughout
# - Aim for target_length word count
# - Cover all topics in competitors but add unique insights

article_html = "<html>...</html>"  # Your drafted article

# Step 5: Score and iterate
score = evaluate_content(query_id, article_html, save=False)
if score["overall_score"] < 80:
  # Review recommendations and improve
  for rec in score["recommendations"]:
    # Implement improvements...
    pass
  
  # Re-evaluate
  score = evaluate_content(query_id, improved_html, save=False)

# Step 6: Save final version
final_score = evaluate_content(query_id, final_html, save=True)

# Step 7: Publish to WordPress
# Use /neuronwriter:publish command or WordPress REST API
```

### Workflow 2: Content Refresh (Evaluate Existing Article)

```python
# Step 1: Create query for target keyword
query_id = nw_create_query("your existing article keyword")

# Step 2: Wait for results
while True:
  data = nw_get_query_data(query_id)
  if data["status"] == "ready":
    break
  sleep(3)

# Step 3: Import existing article
existing_html = "<html>...</html>"  # Your current article
nw_import_content(
  query_id=query_id,
  content=existing_html,
  source_url="https://yoursite.com/article"
)

# Step 4: Score current content
current_score = evaluate_content(query_id, existing_html)
print(f"Current score: {current_score['overall_score']}")

# Step 5: Review recommendations
gaps = current_score["improvement_areas"]
recommendations = current_score["recommendations"]

# Step 6: Update article with recommendations
# - Add missing topics
# - Incorporate recommended terms
# - Improve structure
# - Expand weak sections

updated_html = "<html>...</html>"  # Your updated article

# Step 7: Re-score and verify improvement
new_score = evaluate_content(query_id, updated_html, save=True)
print(f"Improved score: {new_score['overall_score']}")

# Step 8: Deploy updated content
# Replace live article with optimized version
```

### Workflow 3: Batch Keyword Campaign (10+ Keywords)

```python
# Step 1: Create queries for keyword cluster
keywords = [
  "best project management tools",
  "project management software for small teams",
  "project management apps comparison",
  "free project management tools 2026"
]

project_id = "p_campaign_001"
query_ids = []

for keyword in keywords:
  result = nw_create_query(keyword, language="en")
  query_ids.append(result["query_id"])

# Step 2: Poll all queries in parallel
all_ready = False
attempt = 0

while not all_ready and attempt < 60:  # Max 5 minutes
  all_ready = True
  for qid in query_ids:
    data = nw_get_query_data(qid)
    if data["status"] != "ready":
      all_ready = False
      break
  sleep(5)
  attempt += 1

# Step 3: Process each keyword
articles = {}

for qid in query_ids:
  data = nw_get_query_data(qid)
  keyword = data["recommendations"]["primary_keyword"]
  
  # Write article for this keyword
  article = write_seo_article(
    keyword=keyword,
    outline=data["recommendations"]["outline"],
    semantic_terms=data["recommendations"]["semantic_terms"],
    target_length=data["recommendations"]["target_length"]
  )
  
  # Score and iterate
  score = evaluate_content(qid, article, save=False)
  while score["overall_score"] < 80:
    article = improve_article(article, score["recommendations"])
    score = evaluate_content(qid, article, save=False)
  
  # Save and store
  evaluate_content(qid, article, save=True)
  articles[keyword] = article

# Step 4: Batch publish
for keyword, article in articles.items():
  publish_to_wordpress(article, keyword)
```

### Workflow 4: Multi-Language Content Strategy

```python
# Create queries for multiple languages
languages = ["en", "es", "fr", "de"]
keywords = ["project management tools", "software de gestión de proyectos", 
            "outils de gestion de projet", "Projektmanagementsoftware"]

for lang, keyword in zip(languages, keywords):
  # Create language-specific query
  result = nw_create_query(
    query=keyword,
    language=lang,
    search_engine="google"
  )
  
  # Poll for results
  while True:
    data = nw_get_query_data(result["query_id"])
    if data["status"] == "ready":
      break
    sleep(3)
  
  # Write article in target language
  article = write_article(keyword, data["recommendations"])
  
  # Score with language-specific algorithm
  score = evaluate_content(result["query_id"], article)
  
  # Publish to appropriate site/language
  publish_multilingual(article, language=lang)
```

### Workflow 5: Competitor Analysis Deep Dive

```python
# Step 1: Analyze target keyword
data = nw_get_query_data(nw_create_query("your keyword")["query_id"])

# Step 2: Extract competitor intelligence
competitors = data["competitors"]["top_10_results"]
common_terms = data["competitors"]["common_terms"]
coverage_gaps = data["competitors"]["coverage_gaps"]

# Step 3: Analyze each competitor
competitor_analysis = {}

for result in competitors[:5]:  # Top 5
  url = result["url"]
  title = result["title"]
  keyword_mentions = result["keyword_mentions"]
  
  # Import competitor content
  competitor_content = fetch_content(url)
  nw_import_content(
    query_id=data["query_id"],
    content=competitor_content,
    source_url=url
  )
  
  # Score competitor content
  competitor_score = evaluate_content(
    query_id=data["query_id"],
    html=competitor_content
  )
  
  competitor_analysis[url] = {
    "title": title,
    "score": competitor_score["overall_score"],
    "keyword_mentions": keyword_mentions,
    "strengths": extract_strengths(competitor_score),
    "weaknesses": extract_weaknesses(competitor_score)
  }

# Step 4: Identify competitive advantages
# - What are top competitors doing well?
# - What are they missing?
# - How can you differentiate?

# Step 5: Create "better than" content
# Use coverage_gaps to find topics competitors miss
article = write_comprehensive_article(
  outline=data["recommendations"]["outline"],
  coverage_gaps=coverage_gaps,
  unique_angle="Include case studies competitors miss"
)
```

## Best Practices

### Keyword Research

- Use specific, long-tail keywords (3-5 words) for best recommendations
- Analyze high-intent keywords (commercial, transactional) before writing
- Compare analysis across markets/languages for localization strategy
- Save query_id for future reference and A/B testing

### Content Writing

- Always wait for query status="ready" before writing
- Follow recommended outline exactly — structure matters for SEO
- Include ALL semantic terms, not just primary keyword
- Aim for target word count or slightly longer
- Write for humans first, search engines second

### Content Scoring

- Target 80-100 score (80+ indicates competitive ranking potential)
- Don't aim for perfect 100 — diminishing returns above 85
- Prioritize high-impact recommendations (usually keyword/structure/length)
- Re-score after each major edit iteration
- Use save=False for draft evaluation, save=True for final version

### Publishing

- Always publish draft first, review in WordPress before going live
- Use featured images (improves CTR)
- Customize title and excerpt (generated versions are good starting points)
- Monitor keyword rankings 1-4 weeks post-publication
- Track traffic and engagement to validate optimization

### Iteration Strategy

1. Draft v1 → Score 65 → Implement recommendations
2. Draft v2 → Score 78 → Fix remaining gaps
3. Draft v3 → Score 85 → Minor polishing
4. Final → Publish and monitor

### Multi-Keyword Campaigns

- Create 10-20 related keyword queries upfront
- Use list_queries with status="ready" to batch process
- Prioritize high-difficulty keywords early
- Schedule publishing across 2-4 week calendar
- Build topic clusters around related keywords

## Tool Relationships & Data Flow

```text
1. nw_create_query
   └─> Returns: query_id, status (usually "processing")

2. nw_get_query_data(query_id)
   ├─> When status="processing": Return partial data, keep polling
   └─> When status="ready": Full data available

3. get_content(query_id) [if previously imported]
   └─> Retrieve saved content versions

4. nw_import_content(query_id, html)
   ├─> Save content to query
   └─> Prepare for evaluation

5. evaluate_content(query_id, html)
   ├─> Score against recommendations from nw_get_query_data
   ├─> Return scoring breakdown and recommendations
   └─> Optionally save version (save=True)

6. list_projects / list_queries
   ├─> Organize analysis by project
   └─> Find existing queries before re-creating
```

## Environment Configuration

Required environment variables:

- `NEURONWRITER_API_KEY` — Your NeuronWriter API key
- `NEURONWRITER_WP_SITES` — WordPress credentials (JSON)
- `NEURONWRITER_OLLAMA_URL` — Ollama LLM endpoint (optional)
- `NEURONWRITER_LLM_MODEL` — Default LLM model (default: llama3.3)

Example `.env`:

```bash
NEURONWRITER_API_KEY=your_api_key_here
NEURONWRITER_WP_SITES={"mysite.com":{"url":"https://mysite.com","username":"user","password":"app_password"}}
NEURONWRITER_OLLAMA_URL=http://localhost:11434
NEURONWRITER_LLM_MODEL=llama3.3
```

## Troubleshooting

### Query takes too long to process

- Normal: 3-60 seconds
- Timeout: Check API status, may be rate limited
- Solution: Reduce concurrent queries, increase polling interval

### Low SEO scores despite following recommendations

- Verify: All semantic terms included naturally
- Check: Content length matches or exceeds target
- Improve: Heading structure and keyword placement
- Regenerate: Try evaluating different content version

### WordPress publishing fails

- Verify: REST API enabled on WordPress
- Check: Using application password (not login password)
- Confirm: Site domain matches .env configuration

### Content feels over-optimized after following recommendations

- This is normal — NeuronWriter recommends conservative optimization
- Read naturally to humans — if good, it's good
- Trust the score algorithm — it accounts for readability

---

This skill empowers you to create data-driven SEO content that ranks. Always balance algorithmic optimization with quality writing and genuine value for readers.
