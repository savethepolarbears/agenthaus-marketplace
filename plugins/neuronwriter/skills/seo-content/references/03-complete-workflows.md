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

