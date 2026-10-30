## Performance Tips

**Optimize API Usage:**

1. Use batch operations for 10+ contacts
2. Paginate large result sets (limit=1000, offset=0,1000,2000,...)
3. Cache segment IDs/tag IDs to avoid repeated lookups
4. Implement request queuing to avoid rate limits
5. Parallel requests for independent operations (3-5 concurrent max)
6. Monitor credit usage: `encharge_get_account_limits`

**Efficient Workflow:**

1. Prepare data offline (CSV validation, de-dup)
2. Batch import (100 per request)
3. Apply tags in batches
4. Query once for reporting
5. Cache results when possible

