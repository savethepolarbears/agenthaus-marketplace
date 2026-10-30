#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { createHandoffSession, evidenceFor } = require('../src/handoff.js');
const { recallOptional, captureOptional } = require('../src/memory-integrations.js');
async function runReference({ projectRoot, memory = {}, captureOptIn = false, beforeAccept = e => e, failStage, replayResult = false } = {}) {
  if (!projectRoot) throw new Error('Explicit local workspace required');
  const parent = fs.realpathSync(projectRoot);
  const workspace = fs.mkdtempSync(path.join(parent, 'handoff-reference-'));
  const session = createHandoffSession({ projectRoot: workspace });
  const trace = [];
  const accept = (envelope, actor) => {
    session.accept(envelope, { actor });
    trace.push(JSON.parse(JSON.stringify({ envelope, actor })));
  };
  const correlation = crypto.randomUUID();
  const recalled = await recallOptional({ enabled: memory.enabled === true, nativeState: { fixture: true }, recall: memory.recall });
  const actors = ['fixture:local:seo', 'fixture:local:social', 'fixture:local:wordpress'];
  const artifacts = [];
  const stages = ['seo-brief.json', 'social-draft.json', 'wordpress-payload.json'];
  for (let i = 0; i < stages.length; i++) {
    if (failStage === i + 1) throw new Error('Fixture stage failed');
    const producer = i === 0 ? 'fixture:local:coordinator' : actors[i - 1];
    const consumer = actors[i];
    const task = { schema_version: 1, kind: 'task', task_id: crypto.randomUUID(), correlation_id: correlation, producer, consumer,
      created_at: new Date().toISOString(), status: 'pending', input: { fixture: true, stage: i + 1 }, output: null,
      evidence: artifacts.length ? [artifacts.at(-1)] : [] };
    accept(beforeAccept(task), producer);
    accept(beforeAccept({ ...task, status: 'in_progress', created_at: new Date().toISOString() }), consumer);
    const payload = { fixture: true, stage: i + 1, content: ['Synthetic SEO brief', 'Synthetic social draft', 'Synthetic WordPress payload'][i], published: false };
    const file = path.join(workspace, stages[i]);
    fs.writeFileSync(file, JSON.stringify(payload) + '\n', { flag: 'wx', mode: 0o600 });
    const evidence = evidenceFor(workspace, stages[i]);
    const result = { ...task, kind: 'result', producer: consumer, consumer: producer, status: 'completed', input: null,
      output: { fixture: true, artifact: stages[i] }, evidence: [evidence], created_at: new Date().toISOString() };
    accept(beforeAccept(result), consumer);
    if (replayResult) accept(result, consumer);
    artifacts.push(evidence);
  }
  fs.writeFileSync(path.join(workspace, 'trace.json'), JSON.stringify(trace) + '\n', { flag: 'wx', mode: 0o600 });
  const receipt = { fixture: true, correlation_id: correlation, trace_artifact: evidenceFor(workspace, 'trace.json'), completed_stages: 3, artifacts, published: false, workspace, memory: recalled.provenance };
  receipt.capture = await captureOptional({ enabled: memory.enabled === true, optIn: captureOptIn === true, capture: memory.capture, value: receipt });
  return receipt;
}
async function main() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-offline-reference-'));
  const result = await runReference({ projectRoot: directory });
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
if (require.main === module) main().catch(() => { process.stderr.write('Offline reference validation failed\n'); process.exitCode = 1; });
module.exports = { runReference };
