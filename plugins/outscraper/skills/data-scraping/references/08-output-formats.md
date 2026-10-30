## Output Formats

### Standardized JSON Output

```json
{
  "research_objective": "Market research",
  "search_parameters": {
    "location": "Austin TX",
    "category": "Services",
    "filters": "rating >= 4.0"
  },
  "findings": [
    {
      "name": "Business Name",
      "rating": 4.8,
      "reviews": 125,
      "phone": "+1-512-555-0123"
    }
  ],
  "data_sources": ["Google Maps"],
  "total_credits_used": 10,
  "confidence_score": 0.95,
  "timestamp": "2025-04-10T14:30:00Z"
}
```

### CSV Export Columns

```csv
name,location,rating,reviews_count,phone,website,avg_sentiment,source,scraped_date
```

### Report Structure

```text
1. Executive Summary
2. Research Methodology
3. Key Findings
4. Data Tables
5. Visualizations (maps, charts)
6. Recommendations
7. Data Quality Notes
```

---

