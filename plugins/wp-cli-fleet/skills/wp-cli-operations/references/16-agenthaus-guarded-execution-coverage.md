## AgentHaus guarded execution coverage

The optional AgentHaus stdio proxy is the single execution owner only for MCP
servers explicitly wrapped with `guardPlugin` from
`scripts/generate-cross-platform.js`. Default installation remains native.
Direct shell commands, WP-CLI, SDK/HTTP calls, and agent instructions are outside
that boundary. Native hooks supply guidance; they do not intercept those paths.

Use an operator-owned policy and pinned Ed25519 public key. Approval receipts
bind the complete request, policy, actor, provider, scope and 60-second expiry;
the proxy consumes each nonce once before forwarding. An independent operator
may issue a receipt with `scripts/approve-guard-request.js` from a terminal.
Without that broker or a valid receipt, approval-required calls stay blocked.
Keep signing keys, pinned configuration and consumed-nonce storage outside the
agent's OS identity. File mode 0700 alone does not isolate same-user processes.
This proxy does not provide an OS sandbox, native provider approval UI, or remote
transport enforcement. Local fixtures verify protocol behavior; live provider
discovery and operator UX still require validation.
