## Troubleshooting Decision Tree

```text
Problem?
├─ API not responding
│  └─ Check: ENCHARGE_API_KEY, firewall, Encharge status page
├─ Operation failed
│  ├─ Get error message
│  ├─ Check: email format, tag exists, account accessible
│  └─ Retry with backoff or batch smaller subset
├─ Results unexpected
│  ├─ Verify: segment criteria, tag applied correctly
│  ├─ Sample results manually
│  └─ Adjust operation and retry
├─ Rate limited
│  └─ Reduce batch size, add delays, retry with backoff
└─ Data quality issue
   ├─ Check: duplicates, invalid emails, missing fields
   ├─ Clean: de-dup, validate, normalize
   └─ Re-import
```

