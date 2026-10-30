const { test } = require('node:test');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, readdirSync, readFileSync, rmSync, statSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawn } = require('node:child_process');
const script = process.env.SHADOW_TEST_SCRIPT || resolve(__dirname, '../plugins/shadow-mode/hooks/scripts/shadow-intercept.sh');
function invoke(cwd, input, { raw = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn('bash', [script], { cwd });
    let output = '';
    child.stdout.on('data', b => output += b);
    child.stderr.on('data', b => output += b);
    child.on('close', code => resolve({ code, output }));
    child.stdin.end(raw ? input : JSON.stringify(input));
  });
}
test('concurrent identical proposals retain separate private digest-only records', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'shadow-test-'));
  try {
    writeFileSync(join(dir, '.shadow-mode-enabled'), 'test');
    const secret = 'synthetic-only-secret-9e316';
    const payload = { tool_name: 'Bash', tool_input: { command: `TOKEN=${secret} echo example`, file_path: `/tmp/${secret}` } };
    const results = await Promise.all(Array.from({length: 24}, () => invoke(dir, payload)));
    assert.ok(results.every(r => r.code === 2));
    const files = readdirSync(join(dir, 'review_queue')).filter(f => f.endsWith('.json'));
    assert.equal(files.length, 24);
    for (const file of files) {
      const text = readFileSync(join(dir, 'review_queue', file), 'utf8');
      assert.ok(!text.includes(secret));
      const entry = JSON.parse(text);
      assert.equal(entry.request_sha256, createHash('sha256').update(JSON.stringify(payload)).digest('hex'));
      assert.equal(statSync(join(dir, 'review_queue', file)).mode & 0o777, 0o600);
      assert.equal(entry.requires_fresh_review, true);
      assert.equal(entry.tool, 'Bash');
    }
    assert.ok(results.every(r => !r.output.includes(secret)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('inactive mode allows without persisting a request', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'shadow-test-'));
  try { assert.equal((await invoke(dir, { tool_name: 'Bash' })).code, 0); assert.deepEqual(readdirSync(dir), []); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('single proposal never persists synthetic command or path secrets', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'shadow-test-'));
  try {
    writeFileSync(join(dir, '.shadow-mode-enabled'), 'test');
    const marker = 'synthetic-noncredential-31fef';
    const result = await invoke(dir, {tool_name: 'Bash', tool_input: {command: `TOKEN=${marker} echo hello`, file_path: `/tmp/${marker}`}});
    assert.equal(result.code, 2);
    const saved = readdirSync(join(dir, 'review_queue')).map(f => readFileSync(join(dir, 'review_queue', f), 'utf8')).join('');
    assert.ok(!saved.includes(marker));
    assert.ok(!result.output.includes(marker));
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
test('queue storage errors still block without disclosing request', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'shadow-test-'));
  try {
    writeFileSync(join(dir, '.shadow-mode-enabled'), 'test');
    writeFileSync(join(dir, 'review_queue'), 'not-a-directory');
    const result = await invoke(dir, {tool_name: 'Bash', tool_input: {command: 'synthetic-private-value'}});
    assert.equal(result.code, 2);
    assert.ok(!result.output.includes('synthetic-private-value'));
  } finally { rmSync(dir, {recursive: true, force: true}); }
});

const INPUT_LIMIT = 4 * 1024 * 1024;
function paddedRequest(bytes) {
  const base = {tool_name: 'Write', tool_input: {file_path: 'synthetic.txt', content: ''}};
  const overhead = Buffer.byteLength(JSON.stringify(base));
  base.tool_input.content = 'x'.repeat(bytes - overhead);
  const raw = JSON.stringify(base);
  assert.equal(Buffer.byteLength(raw), bytes);
  return raw;
}
test('valid request at the 4 MiB limit retains its exact digest', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'shadow-test-'));
  try {
    writeFileSync(join(dir, '.shadow-mode-enabled'), 'test');
    const raw = paddedRequest(INPUT_LIMIT);
    const result = await invoke(dir, raw, {raw: true});
    assert.equal(result.code, 2);
    const files = readdirSync(join(dir, 'review_queue'));
    assert.equal(files.length, 1);
    const entry = JSON.parse(readFileSync(join(dir, 'review_queue', files[0]), 'utf8'));
    assert.equal(entry.request_sha256, createHash('sha256').update(raw).digest('hex'));
    assert.equal(entry.tool, 'Write');
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
test('request one byte over 4 MiB blocks without recording or echoing raw input', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'shadow-test-'));
  try {
    writeFileSync(join(dir, '.shadow-mode-enabled'), 'test');
    const result = await invoke(dir, paddedRequest(INPUT_LIMIT + 1), {raw: true});
    assert.equal(result.code, 2);
    assert.deepEqual(readdirSync(dir), ['.shadow-mode-enabled']);
    assert.match(result.output, /input limit/i);
    assert.ok(!result.output.includes('synthetic.txt'));
    assert.ok(!result.output.includes('xxxxxxxx'));
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
