## 2026-06-03 - Next.js Dev Artifacts & Validation Strategy
**Vulnerability:** Next.js dev server modifies `next-env.d.ts` with dev-specific imports (e.g., `./.next/dev/types/routes.d.ts`) which can break CI if committed.
**Learning:** Always revert changes to `next-env.d.ts` before committing.
**Prevention:** Add `next-env.d.ts` check in pre-commit or revert it manually.

**Vulnerability:** API routes dependent on DB connection often skip validation if DB is missing, making it hard to test validation logic.
**Learning:** Place input validation logic *before* resource checks (DB, etc.) to allow testing validation independently.
**Prevention:** Structure API handlers: 1. Parse/Validate Input -> 2. Check Resources -> 3. Execute.

## 2026-06-03 - In-Memory Rate Limiter Bypass
**Vulnerability:** RateLimiter class cleared the entire map when full (10k entries), allowing attackers to reset their block by flooding the map with requests.
**Learning:** Simple "clear all" cache eviction strategies are vulnerable to DoS/Bypass attacks under load.
**Prevention:** Implement tiered cleanup: first remove expired entries, then (and only then) clear/evict active entries if memory pressure persists.
