#!/usr/bin/env node
'use strict';
// Run outside the agent's execution identity. This command is deliberately not an MCP tool.
const fs = require('node:fs');
const crypto = require('node:crypto');
const { parseArgs } = require('node:util');
const readline = require('node:readline/promises');
const { signReceipt, requestDigest } = require('../src/approval-receipts.js');
const { validatePolicy, evaluate, digest } = require('../src/safety-policy.js');
async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Interactive operator terminal required');
  const { values } = parseArgs({ options: Object.fromEntries(['request', 'policy', 'private-key', 'actor', 'provider', 'out'].map(k => [k, { type: 'string' }])) });
  if (Object.values(values).length !== 6) throw new Error('All request, policy, private-key, actor, provider and out options required');
  const request = JSON.parse(fs.readFileSync(values.request, 'utf8'));
  const policy = validatePolicy(JSON.parse(fs.readFileSync(values.policy, 'utf8')));
  const decision = evaluate(policy, request.params);
  if (request.method !== 'tools/call' || decision.action !== 'require-approval') throw new Error('Request is not approval-eligible');
  // Only hashes and scope are printed; request files must be reviewed independently by the operator.
  const requestHash = requestDigest(request), policyHash = digest(policy);
  process.stdout.write(`Review request file: ${values.request}\nRequest SHA-256: ${requestHash}\nPolicy SHA-256: ${policyHash}\nActor: ${values.actor}\nProvider: ${values.provider}\nScope: ${decision.resource_scope}\n`);
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout });
  let answer; try { answer = await terminal.question('Type the full request SHA-256 to approve once for 60 seconds: '); } finally { terminal.close(); }
  if (answer !== requestHash) throw new Error('Operator declined');
  const now = Date.now();
  const payload = { version: 1, receipt_id: crypto.randomUUID(), request_sha256: requestHash, policy_sha256: policyHash,
    actor: values.actor, provider: values.provider, resource_scope: decision.resource_scope,
    issued_at: new Date(now).toISOString(), expires_at: new Date(now + 60000).toISOString(), nonce: crypto.randomUUID() };
  const receipt = signReceipt(payload, fs.readFileSync(values['private-key'], 'utf8'));
  fs.writeFileSync(values.out, JSON.stringify(receipt) + '\n', { flag: 'wx', mode: 0o600 });
}
if (require.main === module) main().catch(() => { process.stderr.write('Approval unavailable or declined; no authorization issued\n'); process.exitCode = 1; });
