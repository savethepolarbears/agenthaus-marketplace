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

