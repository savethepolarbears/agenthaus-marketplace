---
description: List and manage NeuronWriter projects and queries. Usage: `/neuronwriter:projects list`, `/neuronwriter:projects queries --status ready`
---

# Manage Projects & Queries

View and organize your NeuronWriter projects and analysis queries.

## List All Projects

```
/neuronwriter:projects list
```

Shows all projects with:
- Project ID and name
- Total queries in project
- Project creation date
- Query counts by status

Use projects to organize keyword analysis by topic, client, or campaign.

## List Queries in Project

```
/neuronwriter:projects queries <project-id>
```

Shows all queries in a project:
- Query ID and target keyword
- Current status (ready, processing, error, archived)
- Creation date and last updated
- Search engine and language used

## Filter Queries by Status

```
/neuronwriter:projects queries <project-id> --status ready
```

Status options:
- **ready** — Analysis complete, results available
- **processing** — Currently being analyzed
- **error** — Failed to complete (retry or contact support)
- **archived** — Completed queries no longer in active list

## Filter Queries by Keyword

```
/neuronwriter:projects queries <project-id> --keyword "project management"
```

Returns queries matching the keyword (partial match supported).

## Filter by Source

```
/neuronwriter:projects queries <project-id> --source manual
```

Source types:
- **manual** — Created via nw_create_query
- **imported** — Batch imported from file/API
- **api** — Created via orchestrator automation

## View Query Details

Once you have a query_id, use `/neuronwriter:content get` to view the full analysis data including:
- Content recommendations
- Semantic terms to include
- Competitor analysis
- Heading structure suggestions
- Readability metrics

## Common Workflows

### Finding Ready Analyses
```
/neuronwriter:projects queries <project-id> --status ready
```
Then use the query_id with `/neuronwriter:content get` to retrieve recommendations.

### Organizing by Campaign
Create separate projects for each campaign/client:
- Project: "Q1-2026-Blog-Posts" for quarterly content
- Project: "Client-ABC-Website" for client work
- Project: "SEO-Refresh" for existing content optimization

### Batch Processing
After creating multiple queries via nw_create_query:
```
/neuronwriter:projects queries <project-id> --status ready
```
Monitor completion and fetch all ready results at once.

## Tips

- Project names are case-sensitive
- Query IDs are unique identifiers across all projects
- Archiving queries keeps your dashboard clean without losing data
- Use query metadata to track keyword intent and target audience
