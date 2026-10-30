## Rate Limiting & Cost Management

### Rate Limits

- **Google Maps Search:** ~20 QPS (queries per second)
- **Review Scraping:** ~15 QPS per platform
- **Email Enrichment:** ~30 QPS
- **Overall:** Respect 20 QPS aggregate limit

### Cost Optimization Tips

1. **Batch operations**
   - Process 50+ items at once
   - Email verification: Batch 100+ emails (0.1 credit/email)
   - Geocoding: Batch 100+ addresses

2. **Conservative limits**
   - Start with `limit: 10-20` for exploration
   - Scale to `limit: 50-100` for full research
   - Reserve high limits (200+) for validated queries

3. **Cache results**
   - Reuse geocoded coordinates
   - Store verified emails
   - Avoid re-scraping same place_id

4. **Monitor spending**
   - Check account credits before large jobs
   - Estimate costs: `num_items × credits_per_item`
   - Set alerts at 80% credit usage

### Budget Examples

| Project | Items | Est. Credits | Cost |
| --------- | ------- | -------------- | ------ |
| Lead gen (100 leads) | 10 companies × 10 contacts | 40-50 | $20-30 |
| Competitor review analysis (3 competitors) | 300+ reviews | 75-100 | $40-60 |
| Market research (3 cities) | 150 businesses + 1500 reviews | 100-150 | $50-80 |
| Employer brand (3 companies) | 300 reviews | 50-75 | $25-40 |
| Product roadmap (product + 2 competitors) | 300+ reviews | 25-40 | $15-25 |

---

