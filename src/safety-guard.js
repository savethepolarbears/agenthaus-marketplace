#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { spawn } = require('node:child_process');
const { parseArgs } = require('node:util');
const { TextDecoder } = require('node:util');
const { evaluate, validatePolicy } = require('./safety-policy.js');
const { isPlainObject } = require('./fs-utils.js');

const MAX_FRAME = 1024 * 1024;
const READ_METHODS = new Set(['ping', 'tools/list', 'resources/list', 'resources/templates/list', 'resources/read', 'prompts/list', 'prompts/get']);
const NOTIFICATIONS = new Set(['notifications/initialized', 'notifications/cancelled', 'notifications/progress']);
const hasId = m => Object.hasOwn(m, 'id');
const validId = id => typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id));
function validMessage(m) {
  if (!isPlainObject(m) || m.jsonrpc !== '2.0' || (hasId(m) && !validId(m.id))) return false;
  if (typeof m.method === 'string') return !Object.hasOwn(m, 'result') && !Object.hasOwn(m, 'error') && (m.params === undefined || isPlainObject(m.params));
  return hasId(m) && (Object.hasOwn(m, 'result') !== Object.hasOwn(m, 'error'));
}

// Buffer bytes, not UTF-16 characters; reject malformed UTF-8 and unbounded lines.
function readFrames(stream, receive, fail) {
  let buffer = Buffer.alloc(0), failed = false;
  function stop() { if (!failed) { failed = true; fail(); } }
  stream.on('data', chunk => {
    if (failed) return;
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    // Scan chunk incrementally so many small frames do not trip the single-frame bound.
    let start = 0;
    while (start < bytes.length && !failed) {
      const end = bytes.indexOf(10, start);
      const fragment = bytes.subarray(start, end < 0 ? bytes.length : end);
      if (buffer.length + fragment.length > MAX_FRAME) { stop(); break; }
      buffer = Buffer.concat([buffer, fragment]);
      if (end < 0) break;
      try {
        const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
        const message = JSON.parse(text);
        if (!validMessage(message)) throw new Error('Invalid frame');
        receive(message);
      } catch { stop(); }
      buffer = Buffer.alloc(0);
      start = end + 1;
    }
  });
  stream.on('end', () => { if (buffer.length) stop(); });
  stream.on('error', stop);
}

function runGuard({ command, args = [], policy, input = process.stdin, output = process.stdout,
  diagnostics = process.stderr, timeoutMs = 30000, authorize = () => false, env = process.env }) {
  validatePolicy(policy);
  if (typeof command !== 'string' || !command || command.includes('\0') || !Array.isArray(args) ||
      args.some(a => typeof a !== 'string' || a.includes('\0')) || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 300000) {
    throw new Error('Invalid upstream configuration');
  }
  // POSIX process group permits terminating children on disconnect/timeout.
  const child = spawn(command, args, { shell: false, stdio: ['pipe', 'pipe', 'pipe'], env, detached: process.platform !== 'win32' });
  const pending = new Map(), reverse = new Set();
  let stopped = false, initialized = false, ready = false, initPending = false;
  const send = m => {
    if (output.writableLength > 4 * MAX_FRAME) { stop('Client output limit exceeded'); return; }
    if (!output.destroyed) output.write(JSON.stringify(m) + '\n');
  };
  const error = (id, code, message, data) => send({ jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } });
  const forward = m => { if (!child.stdin.destroyed) child.stdin.write(JSON.stringify(m) + '\n'); };
  function stop(reason) {
    if (stopped) return;
    stopped = true;
    diagnostics.write(`${reason}\n`); // Fixed messages only: upstream stderr never leaks credentials.
    for (const [id, item] of pending) { clearTimeout(item.timer); error(id, -32001, 'Upstream unavailable'); }
    pending.clear();
    if (child.pid) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { shell: false, stdio: 'ignore' }).on('error', () => child.kill());
      } else {
        try { process.kill(-child.pid, 'SIGTERM'); } catch {}
        const killTimer = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 250);
        killTimer.unref();
      }
    }
    child.stdin.destroy();
    input.destroy();
  }
  child.stderr.on('data', () => {}); // Drain without retaining/outputting arbitrary upstream text.
  child.stdin.on('error', () => stop('Upstream input failed'));
  child.on('error', () => stop('Upstream launch failed'));
  child.on('exit', () => stop('Upstream exited'));
  input.on('end', () => stop('Client disconnected'));
  input.on('close', () => stop('Client disconnected'));
  output.on('error', () => stop('Client output failed'));
  readFrames(input, m => {
    if (stopped) return;
    if (!m.method) {
      if (!reverse.has(m.id)) { stop('Unexpected client response'); return; }
      reverse.delete(m.id); forward(m); return;
    }
    if (!hasId(m)) {
      if (!NOTIFICATIONS.has(m.method)) return;
      if (m.method === 'notifications/initialized') {
        if (!initialized || ready) return;
        ready = true;
      } else if (m.method === 'notifications/cancelled') {
        const id = m.params?.requestId, item = pending.get(id);
        if (!item || item.method === 'initialize') return;
        clearTimeout(item.timer); pending.delete(id);
      } else if (!ready) return;
      forward(m); return;
    }
    if (pending.has(m.id)) { stop('Duplicate request ID'); return; }
    if (pending.size >= 128) { error(m.id, -32000, 'Too many requests'); return; }
    if (m.method === 'initialize') {
      if (initialized || initPending) { error(m.id, -32600, 'Already initializing'); return; }
      initPending = true;
    } else if (!ready) { error(m.id, -32000, 'Initialization required'); return; }
    if (m.method === 'tools/call') {
      const decision = evaluate(policy, m.params);
      let allowed = decision.action === 'allow-read';
      if (decision.action === 'require-approval') {
        try { allowed = authorize(m, decision) === true; } catch { allowed = false; }
      }
      if (!allowed) {
        error(m.id, -32003, 'Tool call blocked', { status: 'blocked', rule_id: decision.rule_id,
          remediation: 'Obtain an operator-signed, request-bound approval or use an explicitly permitted read tool.' });
        return;
      }
    } else if (m.method !== 'initialize' && !READ_METHODS.has(m.method)) {
      error(m.id, -32601, 'Unsupported method'); return;
    }
    const timer = setTimeout(() => stop('Request timed out'), timeoutMs);
    pending.set(m.id, { timer, method: m.method }); forward(m);
  }, () => stop('Invalid client frame'));
  readFrames(child.stdout, m => {
    if (stopped) return;
    if (m.method) {
      // Do not let an upstream server smuggle an unguarded client tool/request.
      if (hasId(m)) {
        forward({ jsonrpc: '2.0', id: m.id, error: { code: -32601, message: 'Server requests are not supported by this guard' } });
      } else if (NOTIFICATIONS.has(m.method)) send(m);
      return;
    }
    const item = pending.get(m.id);
    if (!item) return; // Late/cancelled responses are ignored.
    clearTimeout(item.timer); pending.delete(m.id);
    if (item.method === 'initialize') {
      initPending = false;
      if (!m.error) initialized = true;
    }
    if (m.error) {
      // Preserve ID/code, remove upstream-controlled strings/data from diagnostics.
      send({ jsonrpc: '2.0', id: m.id, error: { code: Number.isInteger(m.error.code) ? m.error.code : -32603, message: 'Upstream request failed' } });
    } else send(m);
  }, () => stop('Invalid upstream frame'));
  return { child, stop };
}

function main(argv = process.argv.slice(2)) {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: {
    policy: { type: 'string' }, actor: { type: 'string' }, provider: { type: 'string' },
    'public-key': { type: 'string' }, 'receipt-dir': { type: 'string' }, 'receipt-file': { type: 'string' }
  } });
  if (!values.policy || !positionals.length) throw new Error('Usage: safety-guard --policy <file> -- <command> [args]');
  const policy = JSON.parse(fs.readFileSync(values.policy, 'utf8'));
  runGuard({ command: positionals[0], args: positionals.slice(1), policy });
}

if (require.main === module) {
  try { main(); } catch { process.stderr.write('Guard configuration invalid; no upstream started\n'); process.exitCode = 1; }
}
module.exports = { MAX_FRAME, readFrames, runGuard, main };
