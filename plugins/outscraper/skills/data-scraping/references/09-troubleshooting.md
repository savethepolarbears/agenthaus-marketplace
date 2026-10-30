## Troubleshooting

### Common Issues

| Issue | Solution |
| ------- | ---------- |
| "Place ID not found" | Verify with google_maps_search first |
| "No email results" | Company may not have public email list |
| "Rate limited" | Wait 60 seconds, reduce request rate |
| "Insufficient credits" | Purchase more or reduce batch size |
| "Invalid email domain" | Check spelling; domain may be non-standard |
| "Geocoding failed" | Use more complete address (street + city + zip) |

### Performance Optimization

1. **Parallel operations**
   - Run multiple searches simultaneously
   - Batch verify emails at once
   - Geocode in chunks of 100

2. **Caching**
   - Store results locally
   - Reuse geocoded coordinates
   - Cache company insights

3. **Monitoring**
   - Track API response times
   - Monitor credit usage
   - Log errors for analysis

---

