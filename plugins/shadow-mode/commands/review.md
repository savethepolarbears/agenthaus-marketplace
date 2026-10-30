---
name: review
description: Review digest-only shadow proposals against freshly supplied original requests
---

Review JSON records in `review_queue/`, excluding `rejected/`. Report when empty.

1. Display only ID, timestamp, allowlisted tool, status and `request_sha256`.
   Do not display or execute raw parameters found in legacy queue files: those
   files may contain secrets. Treat legacy records as requiring fresh review.
2. For each proposal, ask the operator to return to the original request in the
   current session, or provide its intended operation again using secret-store
   references. The digest cannot reconstruct a command or prove authorization.
3. Inspect the fresh operation, exact target, arguments, authorization and current
   state. If exact original request bytes are available in memory, compare their
   SHA-256 with the record; a mismatch requires a new proposal and review.
4. Offer **Review fresh request**, **Reject** (move to `rejected/`) or **Skip**.
   Never replay a saved payload or batch-approve unknown operations. Approval of
   metadata alone cannot authorize execution.
5. Execute only after separate, fresh operator approval of the complete operation
   through the provider's normal execution path. Do not silently disable the marker
   to bypass interception. If the active hook blocks again, leave the record pending
   and report that execution did not occur.
6. Mark completed only after observed execution/readback; otherwise preserve pending
   status. Summarize completed, rejected and skipped records without raw requests.

Native hooks cover only configured Claude Code tool events and supply guidance;
other providers, direct execution and same-user bypass remain outside this boundary.
