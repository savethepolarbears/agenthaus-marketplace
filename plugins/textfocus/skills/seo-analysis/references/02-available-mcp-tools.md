## Available MCP Tools

### 1. analyze_keyword

**Purpose**: Get comprehensive keyword metrics and performance data

**When to use**:

- Evaluating single keyword opportunity
- Comparing keyword difficulty across variations
- Assessing commercial value (CPC) of keywords
- Analyzing market saturation (competition level)
- Finding best keywords in a list

**Input**:

- keyword (required): The keyword phrase
- language (optional): Language code (en, de, fr, es, it, nl, pt, ru, zh, ja)

**Output**:

- Search volume (monthly)
- CPC (cost-per-click) range
- Keyword difficulty (0-100 scale)
- Competition level
- Trend data
- Related metrics

**Example workflow**:

```text
1. User asks: "Should I target 'project management software' or 'best project management tools'?"
2. Analyze both keywords
3. Compare: volume, difficulty, CPC
4. Recommend best opportunity
5. Explain reasoning (feasibility vs. value)
```

### 2. get_related_keywords

**Purpose**: Discover semantically related keywords and variations

**When to use**:

- Finding keyword cluster topics
- Discovering long-tail variations
- Identifying question-format queries
- Content gap analysis
- Building topic hierarchies
- Planning content clusters

**Input**:

- keyword (required): Seed keyword to find related terms
- language (optional): Language code

**Output**:

- Related keyword variations
- Long-tail opportunities
- Question-based formats
- Semantic synonyms
- Content cluster suggestions
- Search suggestion variations

**Example workflow**:

```text
1. User has pillar keyword: "project management"
2. Get related keywords
3. Identify clusters: tools, methodology, software, automation, team
4. Plan content structure (pillar + cluster pages)
5. Map internal linking strategy
```

### 3. analyze_seo

**Purpose**: Score a page's SEO performance for a target keyword

**When to use**:

- Optimizing existing content
- Competitive page analysis
- Finding on-page issues blocking rankings
- Creating optimization roadmaps
- Measuring improvement after changes
- Comparing your page vs. competitors

**Input**:

- url (required): Full URL to analyze (http/https)
- keyword (required): Target keyword for the page
- language (optional): Language code

**Output**:

- Overall SEO score (0-100)
- Title tag analysis
- Meta description evaluation
- H1 & heading structure
- Content quality metrics
- Keyword usage analysis
- Internal linking assessment
- Technical SEO elements
- Improvement recommendations (prioritized)

**Score interpretation**:

- 80-100: Excellent (ready to rank high)
- 60-79: Good (minor improvements needed)
- 40-59: Moderate (significant work required)
- 20-39: Poor (major optimization needed)
- 0-19: Critical (blocking rankings)

**Example workflow**:

```text
1. User: "Analyze my page for 'email marketing best practices'"
2. Get SEO score and component breakdown
3. Identify critical issues (missing H1, title tag optimization)
4. Suggest quick wins (meta description, keyword density)
5. Recommend deeper improvements (content expansion, semantic terms)
6. Provide implementation roadmap
```

### 4. get_semantic_analysis

**Purpose**: Identify semantic vocabulary and topic comprehensiveness

**When to use**:

- Understanding full semantic scope of topic
- Content enrichment and gap analysis
- Semantic optimization of existing content
- Building topically comprehensive articles
- Competitive semantic analysis
- Identifying missing vocabulary

**Input**:

- keyword (required): Main keyword to analyze
- language (optional): Language code

**Output**:

- Semantic vocabulary list (categorized)
- Core concepts and terms
- Technical terminology
- Related field vocabulary
- Question-format terms
- Semantic term frequency
- Coverage percentage metrics
- Gaps vs. competitors

**Semantic categories**:

- **Core concepts**: Essential vocabulary
- **Technical terms**: Industry-specific terminology
- **Related fields**: Adjacent topic areas
- **User intent terms**: Different search intents
- **Question formats**: "How to", "What is", "Why", etc.

**Example workflow**:

```text
1. User: "How can I make my article more comprehensive?"
2. Analyze semantic vocabulary for topic
3. Identify missing terms (gaps)
4. Suggest sections covering semantic concepts
5. Recommend natural incorporation of terms
6. Plan content structure improvements
```

