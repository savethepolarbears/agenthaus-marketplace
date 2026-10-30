---
name: wp-cli-operations
description: Manage WordPress sites and fleets using WP-CLI, SSH aliases, and the Agentic WP CLI companion plugin. Use when the user asks to inspect, update, or maintain WordPress plugins, themes, or core; run search-replace operations; manage Pods custom post types and fields; check site health or checksums; flush caches or rewrites; or operate across a fleet of WordPress installations.
---

# Agentic WP-CLI + WordPress Fleet Operations

## Start here

Resolve exact site/alias, environment, single-site or multisite scope, transport and requested change. Inspect read-only first; choose the relevant procedure, dry-run mutations where supported, verify backup/rollback and authorization, execute the bounded change and read back site state.

Keep credentials in environment/vault references. Verify current tool schemas before calls; examples in references are procedural guidance, not live service proof. Preserve authorization, privacy, rate limits and bounded output. Do not load every reference by default. Never run untrusted arbitrary shell; prefer structured WP-CLI commands and JSON output. Use --url for multisite targets. Companion REST authentication requires a WordPress Application Password and X-Agentic-WP-Secret. Production writes require dry-run where supported, backup/rollback and an audit trail. Hooks provide guidance only; consult guarded execution coverage before claiming enforcement.

## Load only the reference needed

Read the relevant safety/security, limits and failure guidance before a write or batch. Select the tool or workflow reference for the current task; all original procedures and examples remain in these files.

- [Overview](references/00-overview.md)
- [When to Use](references/01-when-to-use.md)
- [Required Context](references/02-required-context.md)
- [Safety Rules](references/03-safety-rules.md)
- [Supported Operations](references/04-supported-operations.md)
- [Decision Flow](references/05-decision-flow.md)
- [Fleet Manifest Format](references/06-fleet-manifest-format.md)
- [Common Workflows](references/07-common-workflows.md)
- [Search-Replace with Regex](references/08-search-replace-with-regex.md)
- [Pods CLI Commands](references/09-pods-cli-commands.md)
- [Multisite Operations](references/10-multisite-operations.md)
- [Output Expectations](references/11-output-expectations.md)
- [Failure Handling](references/12-failure-handling.md)
- [Production Best Practices](references/13-production-best-practices.md)
- [Helper Scripts](references/14-helper-scripts.md)
- [Error Reference](references/15-error-reference.md)
- [AgentHaus guarded execution coverage](references/16-agenthaus-guarded-execution-coverage.md)
