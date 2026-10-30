## API Limits & Rate Limiting

**Rate Limits:**

- ~20 requests per second (RPS)
- Burst: 100 requests/minute
- Daily: 100K+ requests/day (account-dependent)

**Batch Limits:**

- People import: max 100 per request
- Tag creation: max 50 per request
- Tag add/remove: max 100 contacts per request
- Email send batch: max 100 recipients per request

**Backoff Strategy:**

```text
Request fails → wait 2s → retry
Still fails → wait 4s → retry
Still fails → wait 8s → retry
Still fails → wait 16s → retry
After 4 attempts → abort, report error
```

