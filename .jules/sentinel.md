## 2026-06-03 - Next.js Dev Artifacts & Validation Strategy
**Vulnerability:** Next.js dev server modifies `next-env.d.ts` with dev-specific imports (e.g., `./.next/dev/types/routes.d.ts`) which can break CI if committed.
**Learning:** Always revert changes to `next-env.d.ts` before committing.
**Prevention:** Add `next-env.d.ts` check in pre-commit or revert it manually.

**Vulnerability:** API routes dependent on DB connection often skip validation if DB is missing, making it hard to test validation logic.
**Learning:** Place input validation logic *before* resource checks (DB, etc.) to allow testing validation independently.
**Prevention:** Structure API handlers: 1. Parse/Validate Input -> 2. Check Resources -> 3. Execute.
