---
description: Get, import, and evaluate content in NeuronWriter. Usage: `/neuronwriter:content get <query-id>`, `/neuronwriter:content evaluate <query-id> '<html>'`
---

# Content Evaluation

Retrieve analysis recommendations and score your content against NeuronWriter's SEO algorithm.

## Get Analysis Recommendations

```
/neuronwriter:content get <query-id>
```

Retrieves the complete analysis for a query, including:

### Content Structure
- **Recommended Outline** — Heading hierarchy and section order
- **Content Type** — Blog post, guide, comparison, product page
- **Target Length** — Word count range for competitive ranking
- **Sections Needed** — Required topics for comprehensive coverage

### Semantic Recommendations
- **Primary Keywords** — Main terms to rank for
- **LSI Keywords** — Semantically related terms for context
- **Related Queries** — Search intent variations
- **Synonym Suggestions** — Natural keyword variations

### Competitor Insights
- **Top 10 Results** — Current ranking articles with URLs
- **Common Terms** — Words/phrases in top-ranking content
- **Coverage Gaps** — Topics you should address
- **Link Authority** — Domain authority of ranking pages

### Readability Metrics
- **Reading Level** — Target audience education level
- **Avg. Sentence Length** — Word/sentence optimization targets
- **Vocabulary Complexity** — Use natural language complexity

## Evaluate Your Content

Score your draft content without saving it:

```
/neuronwriter:content evaluate <query-id> <html>
```

Pass either:
- **HTML content** — Full HTML markup of your draft
- **Plain text** — Simple text version (less detailed scoring)

Returns detailed scoring:

### SEO Score Breakdown
- **Overall Score** — 0-100 (80+ is excellent)
- **Keyword Integration** — Term frequency and placement
- **Content Structure** — Heading and section alignment
- **Semantic Coverage** — LSI keyword usage
- **Readability** — Avg. sentence length, vocabulary complexity
- **Content Length** — Word count sufficiency

### Recommendations for Improvement
- **Missing Elements** — Sections or topics to add
- **Keyword Gaps** — Terms to naturally incorporate
- **Structure Issues** — Heading hierarchy problems
- **Readability Issues** — Overly complex sentences or vocabulary

### Content Scoring Factors
- Keyword density (2-3% optimal for most topics)
- Keyword placement: title, H1, first paragraph, headings
- Semantic term distribution throughout content
- Heading structure hierarchy (H1 → H2 → H3)
- Content length vs. competitor benchmarks
- Sentence variety and readability

## Import Content

Import existing content for evaluation:

```
/neuronwriter:content import <query-id> --url https://example.com/article
```

Or:

```
/neuronwriter:content import <query-id> --file article.html
```

Fetches content and scores it against NeuronWriter recommendations.

## Score Interpretation

- **90-100** — Excellent, optimized for the keyword
- **80-89** — Good, competitive with top results
- **70-79** — Fair, needs optimization in specific areas
- **60-69** — Poor, significant gaps vs. competitors
- **Below 60** — Major issues, comprehensive rewrite recommended

## Workflow: Analyze → Write → Score

1. **Analyze** — Use `/neuronwriter:analyze` to get recommendations
2. **Write** — Create content following the outline and semantic recommendations
3. **Score** — Use `evaluate_content` to check your draft
4. **Iterate** — Address low-scoring areas (keywords, structure, length)
5. **Publish** — Once score is 80+, use `/neuronwriter:publish`

## Common Patterns

### Quick Content Check
```
/neuronwriter:content get <query-id>  # See recommendations
/neuronwriter:content evaluate <query-id> <your-html>  # Check draft
```

### Content Refresh
Import existing article, evaluate against current recommendations, identify gaps.

### Competitor Analysis
Review the "Top 10 Results" and "Common Terms" from `get` to understand ranking factors.

### Multi-Language Optimization
Create separate queries for different languages (each returns language-specific recommendations).

## Tips

- Evaluate multiple draft versions to compare scores
- Don't just aim for high keyword density — prioritize natural readability
- Include all recommended semantic terms, not just primary keywords
- Follow the recommended outline structure closely
- Ensure your H1 includes the target keyword
- Aim for content length equal to or exceeding top competitors
