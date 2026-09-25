'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const { writeJsonAtomic, BACKUP_SUFFIX } = require('../src/fs-utils.js');
const { syncPluginServers, getOwnedKeys, getPluginMapping, pruneStaleOwnership, loadState } = require('../src/providers/mcp-ownership.js');
const { renderCodexServer, renderCodexSnippet } = require('../src/codex-toml.js');
const { getProvider } = require('../src/providers/index.js');
const { installPlugin, uninstallPlugin, resolvePluginPath } = require('../src/installer.js');
const { checkProviderConfigs, checkOwnershipState } = require('../src/doctor.js');
const { cleanStaleTempFiles } = require('../src/sync.js');
const { transformEnvVars } = require('../scripts/generate-cross-platform.js');

const BIN_PATH = path.resolve(__dirname, '..', 'bin', 'agenthaus.js');

test('Provider lifecycle hardening', async (t) => {
  let tmpDir;

  t.beforeEach(() => {
    tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-harden-')));
    process.env.AGENTHAUS_STATE_FILE = path.join(tmpDir, 'state.json');
  });

  t.afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const writeJson = (p, data) => {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(data, null, 2));
  };
  const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

  // File symlinks need elevated privileges on Windows runners
  await t.test('writeJsonAtomic keeps a backup, leaves no temp files, and writes through symlinks', { skip: process.platform === 'win32' }, () => {
    const real = path.join(tmpDir, 'dotfiles', 'mcp.json');
    const link = path.join(tmpDir, 'home', 'mcp.json');
    writeJson(real, { before: true });
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(real, link);

    writeJsonAtomic(link, { after: true });

    assert.ok(fs.lstatSync(link).isSymbolicLink(), 'symlinked config must stay a symlink');
    assert.deepStrictEqual(readJson(real), { after: true });
    assert.deepStrictEqual(readJson(real + BACKUP_SUFFIX), { before: true });
    assert.deepStrictEqual(fs.readdirSync(path.dirname(real)).filter(f => f.endsWith('.tmp')), []);
  });

  await t.test('legacy namespaced keys are reused (not duplicated) when migrating to the state file', () => {
    const configPath = path.join(tmpDir, 'cursor', 'mcp.json');
    writeJson(configPath, {
      mcpServers: {
        srv: { command: 'q-server' },
        'p-srv': { command: 'p-server-v1' }
      },
      _agenthaus_mcp: { p: ['p-srv'], q: ['srv'] }
    });

    const res = syncPluginServers({
      configPath, pluginName: 'p', label: 'Cursor MCP config',
      servers: { srv: { command: 'p-server-v2' } }
    });

    const config = readJson(configPath);
    assert.deepStrictEqual(res.keys, { srv: 'p-srv' });
    assert.deepStrictEqual(config.mcpServers['p-srv'], { command: 'p-server-v2' });
    assert.strictEqual(config.mcpServers['p-srv-2'], undefined);
    assert.deepStrictEqual(config.mcpServers.srv, { command: 'q-server' });
    assert.strictEqual(config._agenthaus_mcp, undefined, 'legacy markers are stripped from the provider config');
    assert.deepStrictEqual(getOwnedKeys(configPath, 'q'), ['srv'], 'other plugins keep their migrated ownership');
  });

  await t.test('a pre-existing identical user server is reused but never deleted on uninstall', () => {
    const configPath = path.join(tmpDir, 'gemini', 'settings.json');
    writeJson(configPath, { mcpServers: { db: { command: 'node', args: ['db.js'] } } });

    syncPluginServers({ configPath, pluginName: 'p', label: 'Gemini settings', servers: { db: { command: 'node', args: ['db.js'] } } });
    assert.deepStrictEqual(getPluginMapping(configPath, 'p'), { db: 'db' });

    syncPluginServers({ configPath, pluginName: 'p', label: 'Gemini settings', servers: {} });
    assert.deepStrictEqual(readJson(configPath).mcpServers.db, { command: 'node', args: ['db.js'] });
    assert.deepStrictEqual(getOwnedKeys(configPath, 'p'), []);
  });

  await t.test('dryRun reports drift without writing config or state', () => {
    const configPath = path.join(tmpDir, 'cursor', 'mcp.json');
    const res = syncPluginServers({ configPath, pluginName: 'p', label: 'x', servers: { a: { command: 'a' } }, dryRun: true });
    assert.strictEqual(res.changed, true);
    assert.strictEqual(fs.existsSync(configPath), false);
    assert.strictEqual(fs.existsSync(process.env.AGENTHAUS_STATE_FILE), false);
  });

  await t.test('antigravity registers remote servers in .agents/mcp_config.json using serverUrl', () => {
    const antigravity = getProvider('antigravity');
    const workspace = path.join(tmpDir, 'ws');
    const targetDir = path.join(workspace, '.gemini', 'extensions');
    fs.mkdirSync(path.join(workspace, '.agents'), { recursive: true });
    fs.mkdirSync(targetDir, { recursive: true });
    const source = path.join(tmpDir, 'plugins', 'remote-plugin');
    writeJson(path.join(source, 'gemini-settings-snippet.json'), {
      mcpServers: {
        remote: { httpUrl: 'https://example.com/mcp', headers: { Authorization: 'Bearer ${TOKEN}' } },
        local: { command: 'node', args: ['x.js'] }
      }
    });

    antigravity.postInstall(source, targetDir, { dryRun: false });

    const ag = readJson(path.join(workspace, '.agents', 'mcp_config.json'));
    assert.deepStrictEqual(ag.mcpServers.remote, { headers: { Authorization: 'Bearer ${TOKEN}' }, serverUrl: 'https://example.com/mcp' });
    assert.deepStrictEqual(ag.mcpServers.local, { command: 'node', args: ['x.js'] });
    const gemini = readJson(path.join(workspace, '.gemini', 'settings.json'));
    assert.strictEqual(gemini.mcpServers.remote.httpUrl, 'https://example.com/mcp');
    assert.strictEqual(antigravity.isMcpInSync(source, targetDir), true);

    antigravity.postUninstall('remote-plugin', targetDir, { dryRun: false });
    assert.strictEqual(readJson(path.join(workspace, '.agents', 'mcp_config.json')).mcpServers, undefined);
    assert.strictEqual(readJson(path.join(workspace, '.gemini', 'settings.json')).mcpServers, undefined);
  });

  await t.test('copilot writes .vscode/mcp.json with top-level servers, transport type, and resolved plugin root', () => {
    const copilot = getProvider('copilot');
    const repo = path.join(tmpDir, 'repo');
    const targetDir = path.join(repo, '.github', 'plugins');
    fs.mkdirSync(targetDir, { recursive: true });
    const source = path.join(tmpDir, 'plugins', 'cp');
    writeJson(path.join(source, '.cursor', 'mcp.json'), {
      mcpServers: {
        local: { command: 'node', args: ['${workspaceFolder}/plugins/cp/index.js'], env: { KEY: '${env:KEY}' } },
        remote: { url: 'https://example.com/mcp' }
      }
    });

    copilot.postInstall(source, targetDir, { dryRun: false });

    const config = readJson(path.join(repo, '.vscode', 'mcp.json'));
    assert.strictEqual(config.mcpServers, undefined);
    assert.deepStrictEqual(config.servers.local, {
      type: 'stdio', command: 'node', args: [path.join(targetDir, 'cp') + '/index.js'], env: { KEY: '${env:KEY}' }
    });
    assert.deepStrictEqual(config.servers.remote, { type: 'http', url: 'https://example.com/mcp' });

    copilot.postUninstall('cp', targetDir, { dryRun: false });
    assert.strictEqual(readJson(path.join(repo, '.vscode', 'mcp.json')).servers, undefined);
  });

  await t.test('cursor resolves the plugin-root placeholder to the absolute install path', () => {
    const cursor = getProvider('cursor');
    const targetDir = path.join(tmpDir, 'proj', '.cursor', 'plugins');
    fs.mkdirSync(targetDir, { recursive: true });
    const source = path.join(tmpDir, 'plugins', 'qa');
    writeJson(path.join(source, '.cursor', 'mcp.json'), {
      mcpServers: { local: { command: 'node', args: ['${workspaceFolder}/plugins/qa/index.js'] } }
    });
    cursor.postInstall(source, targetDir, { dryRun: false });
    const config = readJson(path.join(tmpDir, 'proj', '.cursor', 'mcp.json'));
    assert.deepStrictEqual(config.mcpServers.local.args, [path.join(targetDir, 'qa') + '/index.js']);
  });

  await t.test('windsurf no longer merges raw .mcp.json with Claude-style interpolation', () => {
    const windsurf = getProvider('windsurf');
    const fakeHome = path.join(tmpDir, 'home');
    fs.mkdirSync(path.join(fakeHome, '.codeium', 'windsurf'), { recursive: true });
    const source = path.join(tmpDir, 'plugins', 'raw-only');
    writeJson(path.join(source, '.mcp.json'), { mcpServers: { s: { command: 'x', env: { K: '${K}' } } } });
    const origHome = os.homedir;
    const origXdg = process.env.XDG_CONFIG_HOME;
    try {
      os.homedir = () => fakeHome;
      delete process.env.XDG_CONFIG_HOME;
      windsurf.postInstall(source, path.join(fakeHome, '.codeium', 'windsurf', 'plugins'), { dryRun: false });
      assert.strictEqual(fs.existsSync(path.join(fakeHome, '.codeium', 'windsurf', 'mcp_config.json')), false);
    } finally {
      os.homedir = origHome;
      if (origXdg === undefined) delete process.env.XDG_CONFIG_HOME;
      else process.env.XDG_CONFIG_HOME = origXdg;
    }
  });

  await t.test('codex renderer uses mcp_servers tables, env_vars, sh wrappers, and bearer_token_env_var', () => {
    const stdio = renderCodexServer('github', {
      command: 'npx', args: ['-y', 'server'], env: { GITHUB_TOKEN: '${GITHUB_TOKEN}', PAT: '${GITHUB_TOKEN}', MODE: 'ro' }
    });
    assert.ok(stdio.supported);
    assert.strictEqual(stdio.lines[0], '[mcp_servers.github]');
    assert.ok(stdio.lines.includes('env_vars = ["GITHUB_TOKEN", "PAT"]'));
    assert.ok(stdio.lines.includes('[mcp_servers.github.env]'));
    assert.ok(stdio.lines.includes('MODE = "ro"'));
    assert.ok(stdio.notes.some(n => n.includes('export PAT="$GITHUB_TOKEN"')));

    const wrapped = renderCodexServer('pg', { command: 'npx', args: ['server-postgres', '${DB_URL}'] });
    assert.ok(wrapped.lines.includes('command = "sh"'));
    assert.ok(wrapped.lines.some(l => l.includes(`"exec 'npx' 'server-postgres' \\"$DB_URL\\""`)));
    assert.ok(wrapped.lines.includes('env_vars = ["DB_URL"]'));

    const http = renderCodexServer('remote', { url: 'https://x.test/mcp', headers: { Authorization: 'Bearer ${TOK}', 'X-Team': '${TEAM}' } });
    assert.ok(http.lines.includes('bearer_token_env_var = "TOK"'));
    assert.ok(http.lines.includes('env_http_headers = { X-Team = "TEAM" }'));

    const unsupported = renderCodexServer('vista', { type: 'http', url: 'https://x.test/mcp?api_key=${KEY}' });
    assert.strictEqual(unsupported.supported, false);

    const snippet = renderCodexSnippet({ 'odd key': { command: 'say "hi"' } });
    assert.ok(snippet.includes('[mcp_servers."odd key"]'));
    assert.ok(snippet.includes('command = "say \\"hi\\""'));
    assert.ok(!snippet.includes('[mcp.servers'));
  });

  await t.test('codex postInstall manages a marked config.toml block and never clobbers user tables', () => {
    const codex = getProvider('codex');
    const codexDir = path.join(tmpDir, 'home', '.codex');
    const targetDir = path.join(codexDir, 'agenthaus-skills');
    const configPath = path.join(codexDir, 'config.toml');
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(configPath, 'model = "gpt-5"\n\n[mcp_servers.db]\ncommand = "user-db"\n');
    const source = path.join(tmpDir, 'plugins', 'dbp');
    writeJson(path.join(source, '.mcp.json'), {
      mcpServers: {
        db: { command: 'node', args: ['${CLAUDE_PLUGIN_ROOT}/db.js'] },
        cache: { command: 'redis-mcp' }
      }
    });

    const origCwd = process.cwd();
    process.chdir(tmpDir);
    try {
      codex.postInstall(source, targetDir, { dryRun: false });
      let toml = fs.readFileSync(configPath, 'utf8');
      assert.ok(toml.startsWith('model = "gpt-5"\n\n[mcp_servers.db]\ncommand = "user-db"\n'), 'user content preserved verbatim');
      assert.ok(toml.includes('# >>> agenthaus:dbp'));
      assert.ok(toml.includes('[mcp_servers.dbp-db]'));
      assert.ok(toml.includes(`args = [${JSON.stringify(path.join(targetDir, 'dbp') + '/db.js')}]`));
      assert.ok(toml.includes('[mcp_servers.cache]'));
      assert.strictEqual(codex.isMcpInSync(source, targetDir), true);

      // Re-running is idempotent
      codex.postInstall(source, targetDir, { dryRun: false });
      assert.strictEqual(fs.readFileSync(configPath, 'utf8'), toml);

      codex.postUninstall('dbp', targetDir, { dryRun: false });
      toml = fs.readFileSync(configPath, 'utf8');
      assert.strictEqual(toml, 'model = "gpt-5"\n\n[mcp_servers.db]\ncommand = "user-db"\n');
    } finally {
      process.chdir(origCwd);
    }
  });

  // The fake CLI is a Node script with a shebang, which Windows cannot exec directly
  await t.test('claude provider installs through the claude plugin CLI instead of copying folders', { skip: process.platform === 'win32' }, () => {
    const repo = path.join(tmpDir, 'market');
    const source = path.join(repo, 'plugins', 'demo');
    writeJson(path.join(repo, '.claude-plugin', 'marketplace.json'), { name: 'AgentHaus', plugins: [] });
    writeJson(path.join(source, '.claude-plugin', 'plugin.json'), { name: 'demo', version: '1.0.0' });
    const logPath = path.join(tmpDir, 'claude-calls.log');
    const fakeClaude = path.join(tmpDir, 'fake-claude.js');
    fs.writeFileSync(fakeClaude, `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(logPath)}, JSON.stringify(args) + '\\n');
if (args[0] === 'plugin' && args[1] === 'marketplace' && args[2] === 'list') { console.log('[]'); process.exit(0); }
if (args[0] === 'plugin' && args[1] === 'list') { console.log(JSON.stringify([{ id: 'demo@AgentHaus', scope: 'user' }])); process.exit(0); }
if (args.includes('--json')) { console.log(JSON.stringify({ command: args[1], outcome: 'ok' })); }
`);
    fs.chmodSync(fakeClaude, 0o755);

    const claude = getProvider('claude');
    const origBin = process.env.AGENTHAUS_CLAUDE_BIN;
    const origHome = os.homedir;
    const fakeHome = path.join(tmpDir, 'home');
    try {
      process.env.AGENTHAUS_CLAUDE_BIN = fakeClaude;
      os.homedir = () => fakeHome;
      const targetDir = claude.getTargetDir(tmpDir, 'user');
      const res = installPlugin(source, targetDir, { provider: claude });
      assert.deepStrictEqual(res, { status: 'installed', method: 'claude-cli', path: 'demo@AgentHaus' });
      assert.strictEqual(fs.existsSync(path.join(targetDir, 'demo')), false, 'nothing is copied into ~/.claude/plugins');

      const calls = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(l => JSON.parse(l));
      assert.deepStrictEqual(calls[1], ['plugin', 'marketplace', 'add', repo, '--scope', 'user']);
      assert.deepStrictEqual(calls[2], ['plugin', 'install', 'demo@AgentHaus', '--scope', 'user', '--json']);

      const removed = uninstallPlugin(targetDir, 'demo', { provider: claude, sourceDir: source });
      assert.strictEqual(removed.status, 'removed');

      process.env.AGENTHAUS_CLAUDE_BIN = path.join(tmpDir, 'missing-claude');
      assert.throws(() => installPlugin(source, targetDir, { provider: claude }), /claude plugin install demo@AgentHaus/);
    } finally {
      if (origBin === undefined) delete process.env.AGENTHAUS_CLAUDE_BIN;
      else process.env.AGENTHAUS_CLAUDE_BIN = origBin;
      os.homedir = origHome;
    }
  });

  await t.test('installer rejects plugin names that escape the target directory', () => {
    const target = path.join(tmpDir, 'target', 'plugins');
    fs.mkdirSync(target, { recursive: true });
    assert.throws(() => resolvePluginPath(target, '../escape'), /Invalid plugin name/);
    assert.throws(() => uninstallPlugin(target, '../../etc'), /Invalid plugin name/);
    assert.strictEqual(resolvePluginPath(target, 'ok-name'), path.join(target, 'ok-name'));
  });

  await t.test('uninstall refuses to delete a user-managed directory with the plugin name', () => {
    const target = path.join(tmpDir, 'target', 'plugins');
    const source = path.join(tmpDir, 'plugins', 'mine');
    fs.mkdirSync(path.join(target, 'mine'), { recursive: true });
    fs.writeFileSync(path.join(target, 'mine', 'notes.txt'), 'user data');
    fs.mkdirSync(source, { recursive: true });
    const res = uninstallPlugin(target, 'mine', { sourceDir: source });
    assert.strictEqual(res.status, 'skipped');
    assert.ok(fs.existsSync(path.join(target, 'mine', 'notes.txt')));
  });

  await t.test('doctor validates Codex, Copilot, Antigravity configs, legacy markers, and state', () => {
    const home = path.join(tmpDir, 'home');
    const cwd = path.join(tmpDir, 'proj');
    fs.mkdirSync(path.join(home, '.codex'), { recursive: true });
    fs.writeFileSync(path.join(home, '.codex', 'config.toml'), '[mcp.servers.old]\ncommand = "x"\n');
    fs.mkdirSync(path.join(cwd, '.codex'), { recursive: true });
    fs.writeFileSync(path.join(cwd, '.codex', 'config.toml'), '[mcp_servers.a]\ncommand = "x"\n[mcp_servers.a]\ncommand = "y"\n');
    writeJson(path.join(cwd, '.vscode', 'mcp.json'), { servers: { s: 'bad' } });
    writeJson(path.join(home, '.gemini', 'config', 'mcp_config.json'), { mcpServers: { r: { url: 'https://x' } } });
    writeJson(path.join(home, '.cursor', 'mcp.json'), { mcpServers: {}, _agenthaus_mcp: { p: [] } });

    const results = checkProviderConfigs(
      ['codex', 'copilot', 'antigravity', 'cursor'].map(id => ({ id })), cwd, home
    );
    const has = (sev, text) => results.some(r => r.severity === sev && r.message.includes(text));
    assert.ok(has('WARN', "'[mcp.servers.*]'"));
    assert.ok(has('FAIL', 'duplicate table [mcp_servers.a]'));
    assert.ok(has('FAIL', "MCP server 's' in VS Code MCP config must be an object"));
    assert.ok(has('FAIL', "uses 'url'; Antigravity MCP config requires 'serverUrl'"));
    assert.ok(has('WARN', 'legacy agenthaus ownership markers'));

    fs.writeFileSync(process.env.AGENTHAUS_STATE_FILE, JSON.stringify({ mcp: { x: { p: { a: { key: 1 } } } } }));
    assert.strictEqual(checkOwnershipState()[0].severity, 'FAIL');
  });

  await t.test('sync helpers prune stale temp files and orphaned ownership records', () => {
    const configPath = path.join(tmpDir, 'cursor', 'mcp.json');
    syncPluginServers({ configPath, pluginName: 'p', label: 'x', servers: { a: { command: 'a' } } });
    const staleTmp = `${configPath}.123.deadbeef.tmp`;
    fs.writeFileSync(staleTmp, 'partial');
    const old = new Date(Date.now() - 2 * 3600000);
    fs.utimesSync(staleTmp, old, old);
    assert.deepStrictEqual(cleanStaleTempFiles([configPath]).map(a => a.path), [staleTmp]);
    assert.strictEqual(fs.existsSync(staleTmp), false);

    // User deletes the server by hand -> sync drops the orphaned record
    writeJson(configPath, { mcpServers: {} });
    const actions = pruneStaleOwnership();
    assert.strictEqual(actions.length, 1);
    assert.deepStrictEqual(loadState().mcp, {});
  });

  await t.test('generator maps Claude http servers to Gemini CLI httpUrl', () => {
    assert.deepStrictEqual(
      transformEnvVars({ a: { type: 'http', url: 'https://x' }, b: { type: 'sse', url: 'https://y' } }, 'gemini'),
      { a: { httpUrl: 'https://x' }, b: { url: 'https://y' } }
    );
  });

  await t.test('CLI fails fast on invalid --mode and --method, and supports uninstall', () => {
    const env = { ...process.env, HOME: tmpDir, USERPROFILE: tmpDir };
    const run = (args) => spawnSync(process.execPath, [BIN_PATH, ...args], { cwd: tmpDir, encoding: 'utf8', env });

    const badMode = run(['install', '--target', 'cursor', '--plugin', 'circuit-breaker', '--mode', 'global']);
    assert.strictEqual(badMode.status, 1);
    assert.ok(badMode.stderr.includes("Invalid --mode 'global'") || badMode.stdout.includes("Invalid --mode 'global'"));

    const badMethod = run(['install', '--target', 'cursor', '--plugin', 'circuit-breaker', '--method', 'hardlink']);
    assert.strictEqual(badMethod.status, 1);

    const installed = run(['install', '--target', 'cursor', '--plugin', 'circuit-breaker', '--mode', 'project', '--method', 'copy']);
    assert.strictEqual(installed.status, 0, installed.stderr);
    assert.ok(fs.existsSync(path.join(tmpDir, '.cursor', 'plugins', 'circuit-breaker')));

    const updated = run(['update', '--target', 'cursor', '--all', '--mode', 'project']);
    assert.strictEqual(updated.status, 0, updated.stderr);
    assert.ok(!updated.stdout.includes('not_found'), 'update --all only visits installed plugins');

    const removed = run(['uninstall', '--target', 'cursor', '--plugin', 'circuit-breaker', '--mode', 'project']);
    assert.strictEqual(removed.status, 0, removed.stderr);
    assert.ok(removed.stdout.includes('circuit-breaker: removed'));
    assert.strictEqual(fs.existsSync(path.join(tmpDir, '.cursor', 'plugins', 'circuit-breaker')), false);
  });
});
