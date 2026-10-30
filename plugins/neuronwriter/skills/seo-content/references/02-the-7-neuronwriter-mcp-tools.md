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

