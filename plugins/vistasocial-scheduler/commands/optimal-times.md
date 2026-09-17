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

   ```yaml
   targets: [{ profile_id: "<id>", timezone: "<brand_timezone>" }]
   ```

3. Compare results against the brand's standard cadence from `scheduling-sop`
4. Report findings with any recommended adjustments

## Output Format

```text
Optimal Times: Brand Alpha — Threads (10001)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VistaSocial recommended: [times from API]
Current standard:        17:19 CET/CEST daily

Match: ✓ / ⚠️ Mismatch detected
Recommendation: [keep current / consider adjusting to X]
```

## Important Notes

- Optimal times are based on historical engagement data from VistaSocial
- This costs only 1 MCP call per profile — very rate-limit-friendly
- Do NOT change established posting times without explicit owner approval
- Cluster posting times are often standardized across brands for operational consistency — individual optimization may conflict with cluster-wide coordination
