---
description: >
  Retrieve the best posting times for a profile from VistaSocial analytics.
  Compares optimal times against the brand's standard cadence and flags
  any mismatches. Use when evaluating or adjusting posting schedules.
allowed-tools: VistaSocial:getOptimalPublishTimes
---

# Get Optimal Publish Times

Query VistaSocial for a profile's best posting times based on audience engagement data.

## Workflow

1. Resolve the profile ID from the `profile-lookup` skill
2. Call `getOptimalPublishTimes` with:
   ```
   targets: [{ profile_id: "<id>", timezone: "<brand_timezone>" }]
   ```
3. Compare results against the brand's standard cadence from `scheduling-sop`
4. Report findings with any recommended adjustments

## Output Format

```
Optimal Times: Santorini Secrets — Threads (531212)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VistaSocial recommended: [times from API]
Current standard:        17:19 CET/CEST daily

Match: ✓ / ⚠️ Mismatch detected
Recommendation: [keep current / consider adjusting to X]
```

## Important Notes

- Optimal times are based on historical engagement data from VistaSocial
- This costs only 1 MCP call per profile — very rate-limit-friendly
- Do NOT change established posting times without Kyle's explicit approval
- The Greece cluster posting times (17:00-hour range) are standardized across brands for operational consistency — individual optimization may conflict with cluster-wide coordination
