'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { getAllProviders, detectAll, getProvider } = require('../src/providers/index.js');

test('CLI Providers', async (t) => {
  let tmpDir;
  
  t.beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agenthaus-test-'));
  });

  t.afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  await t.test('getAllProviders returns all 6 providers', () => {
    const providers = getAllProviders();
    assert.strictEqual(providers.length, 6);
    const ids = providers.map(p => p.id).sort();
    assert.deepStrictEqual(ids, ['antigravity', 'claude', 'codex', 'copilot', 'cursor', 'windsurf']);
  });

  await t.test('detects simulated environments', () => {
    // Create markers for copilot and cursor in tmpDir
    fs.mkdirSync(path.join(tmpDir, '.github'));
    fs.mkdirSync(path.join(tmpDir, '.cursor'));

    // Override os.homedir for other providers if we wanted to be strictly isolated, 
    // but we can just rely on cwd checks for cursor and copilot.
    const copilot = getProvider('copilot');
    const cursor = getProvider('cursor');

    assert.ok(copilot.detect(tmpDir));
    assert.ok(cursor.detect(tmpDir));
  });

  await t.test('getTargetDir resolution', () => {
    const cursor = getProvider('cursor');
    const projectDir = cursor.getTargetDir(tmpDir, 'project');
    assert.strictEqual(projectDir, path.join(tmpDir, '.cursor', 'plugins'));
    
    const globalDir = cursor.getTargetDir(tmpDir, 'global');
    assert.strictEqual(globalDir, path.join(os.homedir(), '.cursor', 'plugins'));

    const antigravity = getProvider('antigravity');
    const agProjectDir = antigravity.getTargetDir(tmpDir, 'project');
    assert.strictEqual(agProjectDir, path.join(tmpDir, '.gemini', 'extensions'));

    const agGlobalDir = antigravity.getTargetDir(tmpDir, 'global');
    assert.strictEqual(agGlobalDir, path.join(os.homedir(), '.gemini', 'extensions'));
  });

  await t.test('antigravity postInstall and postUninstall settings integration', () => {
    const antigravity = getProvider('antigravity');
    const fakeSource = path.join(tmpDir, 'fake-plugin');
    const fakeTargetDir = path.join(tmpDir, 'gemini-root', 'extensions');
    const settingsPath = path.join(tmpDir, 'gemini-root', 'settings.json');

    fs.mkdirSync(fakeSource, { recursive: true });
    fs.mkdirSync(fakeTargetDir, { recursive: true });

    fs.writeFileSync(path.join(fakeSource, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        'test-server': {
          command: 'node',
          args: ['index.js']
        }
      }
    }));

    // Test dryRun: true does not write file
    antigravity.postInstall(fakeSource, fakeTargetDir, { dryRun: true });
    assert.strictEqual(fs.existsSync(settingsPath), false);

    // Test normal postInstall writes and merges settings
    antigravity.postInstall(fakeSource, fakeTargetDir, { dryRun: false });
    assert.strictEqual(fs.existsSync(settingsPath), true);
    let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(settings.mcpServers['test-server']);

    // Test postUninstall removes server
    antigravity.postUninstall('test-server', fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.strictEqual(settings.mcpServers['test-server'], undefined);
  });

  await t.test('antigravity postInstall generates gemini-extension.json manifest without dirtying sourceDir', () => {
    const antigravity = getProvider('antigravity');
    const fakeSource = path.join(tmpDir, 'manifest-plugin');
    const fakeTargetDir = path.join(tmpDir, 'gemini-root', 'extensions');

    fs.mkdirSync(path.join(fakeSource, '.claude-plugin'), { recursive: true });
    fs.mkdirSync(path.join(fakeSource, 'commands'), { recursive: true });
    fs.writeFileSync(path.join(fakeSource, '.claude-plugin', 'plugin.json'), JSON.stringify({
      name: 'manifest-plugin',
      version: '1.2.3',
      description: 'Test extension'
    }));
    fs.writeFileSync(path.join(fakeSource, 'commands', 'cmd.md'), '# Command');

    // Simulate symlink install created by installPlugin
    fs.mkdirSync(fakeTargetDir, { recursive: true });
    const destPath = path.join(fakeTargetDir, 'manifest-plugin');
    fs.symlinkSync(fakeSource, destPath, process.platform === 'win32' ? 'junction' : 'dir');

    antigravity.postInstall(fakeSource, fakeTargetDir, { dryRun: false });

    // destPath should now be an installation-owned directory, NOT a whole-directory symlink
    assert.strictEqual(fs.lstatSync(destPath).isDirectory(), true);
    assert.strictEqual(fs.lstatSync(destPath).isSymbolicLink(), false);

    const extPath = path.join(destPath, 'gemini-extension.json');
    assert.strictEqual(fs.existsSync(extPath), true);
    const ext = JSON.parse(fs.readFileSync(extPath, 'utf8'));
    assert.strictEqual(ext.name, 'manifest-plugin');
    assert.strictEqual(ext.version, '1.2.3');
    assert.strictEqual(ext.description, 'Test extension');
    assert.strictEqual(ext.contextFileName, 'GEMINI.md');

    // Source repo is NOT dirtied! No gemini-extension.json inside fakeSource
    assert.strictEqual(fs.existsSync(path.join(fakeSource, 'gemini-extension.json')), false);

    // Commands entry is accessible via item-level symlink
    assert.strictEqual(fs.existsSync(path.join(destPath, 'commands', 'cmd.md')), true);
  });

  await t.test('antigravity postInstall preserves malformed settings.json and creates backup', () => {
    const antigravity = getProvider('antigravity');
    const fakeSource = path.join(tmpDir, 'malformed-plugin');
    const fakeTargetDir = path.join(tmpDir, 'gemini-root-malformed', 'extensions');
    const settingsPath = path.join(tmpDir, 'gemini-root-malformed', 'settings.json');

    fs.mkdirSync(fakeSource, { recursive: true });
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(path.join(fakeSource, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: { 'test': { command: 'node' } }
    }));
    fs.writeFileSync(settingsPath, '{ malformed json');

    // With dryRun: true, it throws but does NOT create backup file
    assert.throws(() => {
      antigravity.postInstall(fakeSource, fakeTargetDir, { dryRun: true });
    }, /Malformed Gemini settings/);
    let files = fs.readdirSync(path.dirname(settingsPath));
    assert.strictEqual(files.some(f => f.startsWith('settings.json.bak.')), false);

    // With dryRun: false, it throws AND creates backup file
    assert.throws(() => {
      antigravity.postInstall(fakeSource, fakeTargetDir, { dryRun: false });
    }, /Malformed Gemini settings/);

    // Verify original content was not overwritten
    assert.strictEqual(fs.readFileSync(settingsPath, 'utf8'), '{ malformed json');

    // Verify backup was created
    files = fs.readdirSync(path.dirname(settingsPath));
    assert.ok(files.some(f => f.startsWith('settings.json.bak.')));
  });

  await t.test('codex postInstall registers skills in AGENTS.md for global and project flows', () => {
    const codex = getProvider('codex');
    const fakeSource = path.join(tmpDir, 'codex-plugin');

    fs.mkdirSync(path.join(fakeSource, 'skills'), { recursive: true });
    fs.writeFileSync(path.join(fakeSource, 'codex-mcp-config.toml'), '# toml config');

    // Case A: cwd does NOT have AGENTS.md initially - postInstall should create it!
    const origCwd = process.cwd();
    const workDirA = path.join(tmpDir, 'workdir-missing-agents');
    fs.mkdirSync(workDirA, { recursive: true });
    process.chdir(workDirA);
    try {
      const targetDir = path.join(workDirA, '.codex', 'agenthaus-skills');
      codex.postInstall(fakeSource, targetDir, { dryRun: false });
      const agentsPathA = path.join(workDirA, 'AGENTS.md');
      assert.strictEqual(fs.existsSync(agentsPathA), true);
      assert.ok(fs.readFileSync(agentsPathA, 'utf8').includes('Read skills from .codex/agenthaus-skills/codex-plugin/skills/'));
    } finally {
      process.chdir(origCwd);
    }

    // Case B: cwd has existing AGENTS.md
    const workDir = path.join(tmpDir, 'workdir');
    fs.mkdirSync(workDir, { recursive: true });
    const agentsPath = path.join(workDir, 'AGENTS.md');
    fs.writeFileSync(agentsPath, '# Project Guidelines\n');

    process.chdir(workDir);
    try {
      // 1. Global flow: targetDir in os.homedir()
      const globalTargetDir = path.join(os.homedir(), '.codex', 'agenthaus-skills');
      codex.postInstall(fakeSource, globalTargetDir, { dryRun: false });
      let updated = fs.readFileSync(agentsPath, 'utf8');
      assert.ok(updated.includes('Read skills from ~/.codex/agenthaus-skills/codex-plugin/skills/'));

      codex.postUninstall('codex-plugin', globalTargetDir, { dryRun: false });
      let uninstalled = fs.readFileSync(agentsPath, 'utf8');
      assert.ok(!uninstalled.includes('codex-plugin/skills/'));

      // 2. Project flow: targetDir in cwd
      const projectTargetDir = path.join(workDir, '.codex', 'agenthaus-skills');
      codex.postInstall(fakeSource, projectTargetDir, { dryRun: false });
      updated = fs.readFileSync(agentsPath, 'utf8');
      assert.ok(updated.includes('Read skills from .codex/agenthaus-skills/codex-plugin/skills/'));

      codex.postUninstall('codex-plugin', projectTargetDir, { dryRun: false });
      uninstalled = fs.readFileSync(agentsPath, 'utf8');
      assert.ok(!uninstalled.includes('codex-plugin/skills/'));
    } finally {
      process.chdir(origCwd);
    }
  });

  await t.test('windsurf postInstall merges mcp_config.json', () => {
    const windsurf = getProvider('windsurf');
    const fakeSource = path.join(tmpDir, 'windsurf-plugin');
    const fakeTargetDir = path.join(tmpDir, 'codeium', 'windsurf', 'plugins');

    fs.mkdirSync(fakeSource, { recursive: true });
    fs.writeFileSync(path.join(fakeSource, 'windsurf-mcp-snippet.json'), JSON.stringify({
      mcpServers: {
        'windsurf-server': {
          command: 'node',
          args: ['server.js']
        }
      }
    }));

    windsurf.postInstall(fakeSource, fakeTargetDir, { dryRun: false });
    const configPath = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.ok(config.mcpServers['windsurf-server']);

      // Cleanup
      windsurf.postUninstall('windsurf-server', fakeTargetDir, { dryRun: false });
      const cleaned = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.strictEqual(cleaned.mcpServers['windsurf-server'], undefined);
    }
  });

  await t.test('windsurf postInstall merges marked section into .windsurfrules and postUninstall removes it', () => {
    const windsurf = getProvider('windsurf');
    const origCwd = process.cwd();
    const workDir = path.join(tmpDir, 'windsurf-workspace');
    fs.mkdirSync(workDir, { recursive: true });
    fs.mkdirSync(path.join(workDir, '.codeium'), { recursive: true });

    const plugin1 = path.join(tmpDir, 'plugin-one');
    fs.mkdirSync(plugin1, { recursive: true });
    fs.writeFileSync(path.join(plugin1, 'AGENTS.md'), '# Plugin One Rules\nDo thing 1.');

    const plugin2 = path.join(tmpDir, 'plugin-two');
    fs.mkdirSync(plugin2, { recursive: true });
    fs.writeFileSync(path.join(plugin2, 'AGENTS.md'), '# Plugin Two Rules\nDo thing 2.');

    process.chdir(workDir);
    try {
      const targetDir = path.join(workDir, '.codeium', 'plugins');
      windsurf.postInstall(plugin1, targetDir, { dryRun: false });
      const rulesPath = path.join(workDir, '.windsurfrules');
      assert.strictEqual(fs.existsSync(rulesPath), true);
      let content = fs.readFileSync(rulesPath, 'utf8');
      assert.ok(content.includes('<!-- agenthaus:windsurf-plugin:plugin-one -->'));
      assert.ok(content.includes('# Plugin One Rules'));

      // Install second plugin into existing .windsurfrules
      windsurf.postInstall(plugin2, targetDir, { dryRun: false });
      content = fs.readFileSync(rulesPath, 'utf8');
      assert.ok(content.includes('<!-- agenthaus:windsurf-plugin:plugin-one -->'));
      assert.ok(content.includes('<!-- agenthaus:windsurf-plugin:plugin-two -->'));
      assert.ok(content.includes('# Plugin Two Rules'));

      // Uninstall plugin 1 - plugin 2 remains
      windsurf.postUninstall('plugin-one', targetDir, { dryRun: false });
      content = fs.readFileSync(rulesPath, 'utf8');
      assert.strictEqual(content.includes('plugin-one'), false);
      assert.ok(content.includes('plugin-two'));

      // Uninstall plugin 2
      windsurf.postUninstall('plugin-two', targetDir, { dryRun: false });
      assert.strictEqual(fs.existsSync(rulesPath), false);
    } finally {
      process.chdir(origCwd);
    }
  });

  await t.test('copilot postInstall registers instructions and prompt files', () => {
    const copilot = getProvider('copilot');
    const fakeRepo = path.join(tmpDir, 'copilot-repo');
    const fakeSource = path.join(tmpDir, 'copilot-plugin');
    const fakeTargetDir = path.join(fakeRepo, '.github', 'plugins');

    fs.mkdirSync(fakeRepo, { recursive: true });
    fs.mkdirSync(path.join(fakeSource, 'skills', 'my-skill'), { recursive: true });
    fs.writeFileSync(path.join(fakeSource, 'skills', 'my-skill', 'SKILL.md'), '# Skill');
    fs.mkdirSync(path.join(fakeSource, 'commands'), { recursive: true });
    fs.writeFileSync(path.join(fakeSource, 'commands', 'audit.md'), '# Command');

    // Run postInstall
    copilot.postInstall(fakeSource, fakeTargetDir, { dryRun: false });

    // Check .github/copilot-instructions.md
    const instructionsPath = path.join(fakeRepo, '.github', 'copilot-instructions.md');
    assert.strictEqual(fs.existsSync(instructionsPath), true);
    const content = fs.readFileSync(instructionsPath, 'utf8');
    assert.ok(content.includes('Read skills from .github/plugins/copilot-plugin/skills/'));
    assert.ok(content.includes('Read instructions and command workflows from .github/plugins/copilot-plugin/commands/'));

    // Check .github/prompts/
    const promptPath = path.join(fakeRepo, '.github', 'prompts', 'copilot-plugin-audit.prompt.md');
    assert.strictEqual(fs.existsSync(promptPath), true);
    assert.strictEqual(fs.readFileSync(promptPath, 'utf8'), '# Command');

    // Run postUninstall
    copilot.postUninstall('copilot-plugin', fakeTargetDir, { dryRun: false });

    const updatedContent = fs.readFileSync(instructionsPath, 'utf8');
    assert.ok(!updatedContent.includes('copilot-plugin'));
    assert.strictEqual(fs.existsSync(promptPath), false);
  });

  await t.test('cursor postInstall copies rules and merges mcp.json, postUninstall cleans them up', () => {
    const cursor = getProvider('cursor');
    const fakeRepo = path.join(tmpDir, 'cursor-repo');
    const fakeSource = path.join(tmpDir, 'cursor-plugin');
    const fakeTargetDir = path.join(fakeRepo, '.cursor', 'plugins');

    fs.mkdirSync(path.join(fakeSource, '.cursor', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(fakeSource, '.cursor', 'rules', 'cursor-plugin.mdc'), '# Rule');
    fs.writeFileSync(path.join(fakeSource, '.cursor', 'mcp.json'), JSON.stringify({
      mcpServers: {
        'my-server': { command: 'node', args: ['server.js'] }
      }
    }));

    cursor.postInstall(fakeSource, fakeTargetDir, { dryRun: false });

    // Check .cursor/rules/
    const mdcPath = path.join(fakeRepo, '.cursor', 'rules', 'cursor-plugin.mdc');
    assert.strictEqual(fs.existsSync(mdcPath), true);
    assert.strictEqual(fs.readFileSync(mdcPath, 'utf8'), '# Rule');

    // Check .cursor/mcp.json
    const mcpPath = path.join(fakeRepo, '.cursor', 'mcp.json');
    assert.strictEqual(fs.existsSync(mcpPath), true);
    const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
    assert.ok(mcpConfig.mcpServers['my-server']);

    // Uninstall
    cursor.postUninstall('cursor-plugin', fakeTargetDir, { dryRun: false });
    assert.strictEqual(fs.existsSync(mdcPath), false);
    const uninstalledMcp = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
    assert.strictEqual(uninstalledMcp.mcpServers, undefined);
  });

  await t.test('antigravity postInstall preserves conflicting MCP servers via namespacing', () => {
    const antigravity = getProvider('antigravity');
    const fakeRepo = path.join(tmpDir, 'gemini-repo');
    const fakeTargetDir = path.join(fakeRepo, '.gemini', 'extensions');
    const settingsPath = path.join(fakeRepo, '.gemini', 'settings.json');

    // Existing postgres server (e.g. from user or agent-memory)
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({
      mcpServers: {
        postgres: { command: 'npx', args: ['-y', 'server-postgres'] }
      }
    }, null, 2));

    // Plugin 1: identical postgres server (e.g. data-core)
    const plugin1 = path.join(tmpDir, 'data-core');
    fs.mkdirSync(plugin1, { recursive: true });
    fs.writeFileSync(path.join(plugin1, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        postgres: { command: 'npx', args: ['-y', 'server-postgres'] }
      }
    }));

    antigravity.postInstall(plugin1, fakeTargetDir, { dryRun: false });
    let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.strictEqual(settings.mcpServers.postgres.command, 'npx');
    assert.strictEqual(settings.mcpServers['data-core-postgres'], undefined);

    // Plugin 2: conflicting postgres server (e.g. neon-db with different shape)
    const plugin2 = path.join(tmpDir, 'neon-db');
    fs.mkdirSync(plugin2, { recursive: true });
    fs.writeFileSync(path.join(plugin2, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        postgres: { command: 'docker', args: ['run', 'neon-proxy'] }
      }
    }));

    antigravity.postInstall(plugin2, fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    // Original postgres server preserved intact
    assert.strictEqual(settings.mcpServers.postgres.command, 'npx');
    // Conflicting server namespaced safely
    assert.ok(settings.mcpServers['neon-db-postgres']);
    assert.strictEqual(settings.mcpServers['neon-db-postgres'].command, 'docker');

    // Uninstall plugin 2: neon-db-postgres removed, original postgres preserved
    antigravity.postUninstall('neon-db', fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.strictEqual(settings.mcpServers['neon-db-postgres'], undefined);
    assert.ok(settings.mcpServers.postgres);
  });

  await t.test('postInstall replaces owned MCP entries when their configuration changes on update', () => {
    const antigravity = getProvider('antigravity');
    const cursor = getProvider('cursor');
    const fakeGeminiDir = path.join(tmpDir, 'gemini-update-test');
    const fakeTargetDir = path.join(fakeGeminiDir, 'extensions');
    fs.mkdirSync(fakeTargetDir, { recursive: true });
    const settingsPath = path.join(fakeGeminiDir, 'settings.json');

    const pluginDir = path.join(tmpDir, 'test-plugin');
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(path.join(pluginDir, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        srv: { command: 'old-command', args: ['arg1'] }
      }
    }));

    // 1. Initial install
    antigravity.postInstall(pluginDir, fakeTargetDir, { dryRun: false });
    let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.strictEqual(settings.mcpServers.srv.command, 'old-command');
    assert.strictEqual(settings.mcpServers['test-plugin-srv'], undefined);

    // 2. Plugin updates its srv command to new-command
    fs.writeFileSync(path.join(pluginDir, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        srv: { command: 'new-command', args: ['arg2'] }
      }
    }));

    antigravity.postInstall(pluginDir, fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    // Replaced in place under owned key without collision namespacing
    assert.strictEqual(settings.mcpServers.srv.command, 'new-command');
    assert.strictEqual(settings.mcpServers['test-plugin-srv'], undefined);

    // 3. Same behavior in Cursor
    const fakeCursorDir = path.join(tmpDir, 'cursor-update-test');
    const cursorTargetDir = path.join(fakeCursorDir, 'plugins');
    fs.mkdirSync(cursorTargetDir, { recursive: true });
    const cursorMcpPath = path.join(fakeCursorDir, 'mcp.json');

    fs.mkdirSync(path.join(pluginDir, '.cursor'), { recursive: true });
    fs.writeFileSync(path.join(pluginDir, '.cursor', 'mcp.json'), JSON.stringify({
      mcpServers: {
        srv: { command: 'old-cursor', args: [] }
      }
    }));

    cursor.postInstall(pluginDir, cursorTargetDir, { dryRun: false });
    let cursorConfig = JSON.parse(fs.readFileSync(cursorMcpPath, 'utf8'));
    assert.strictEqual(cursorConfig.mcpServers.srv.command, 'old-cursor');

    fs.writeFileSync(path.join(pluginDir, '.cursor', 'mcp.json'), JSON.stringify({
      mcpServers: {
        srv: { command: 'new-cursor', args: [] }
      }
    }));

    cursor.postInstall(pluginDir, cursorTargetDir, { dryRun: false });
    cursorConfig = JSON.parse(fs.readFileSync(cursorMcpPath, 'utf8'));
    assert.strictEqual(cursorConfig.mcpServers.srv.command, 'new-cursor');
    assert.strictEqual(cursorConfig.mcpServers['test-plugin-srv'], undefined);
  });

  await t.test('postInstall namespaces diverging MCP configuration when other owners exist', () => {
    const antigravity = getProvider('antigravity');
    const fakeGeminiDir = path.join(tmpDir, 'gemini-shared-diverge-test');
    const fakeTargetDir = path.join(fakeGeminiDir, 'extensions');
    fs.mkdirSync(fakeTargetDir, { recursive: true });
    const settingsPath = path.join(fakeGeminiDir, 'settings.json');

    const plugin1 = path.join(tmpDir, 'shared-plugin-1');
    fs.mkdirSync(plugin1, { recursive: true });
    fs.writeFileSync(path.join(plugin1, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        shared_db: { command: 'node', args: ['shared.js'] }
      }
    }));

    const plugin2 = path.join(tmpDir, 'shared-plugin-2');
    fs.mkdirSync(plugin2, { recursive: true });
    fs.writeFileSync(path.join(plugin2, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        shared_db: { command: 'node', args: ['shared.js'] }
      }
    }));

    // Install both plugins sharing identical shared_db
    antigravity.postInstall(plugin1, fakeTargetDir, { dryRun: false });
    antigravity.postInstall(plugin2, fakeTargetDir, { dryRun: false });

    let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.strictEqual(settings.mcpServers.shared_db.command, 'node');
    assert.deepStrictEqual(settings._agenthaus_mcp['shared-plugin-1'], ['shared_db']);
    assert.deepStrictEqual(settings._agenthaus_mcp['shared-plugin-2'], ['shared_db']);

    // Now plugin 1 changes shared_db configuration (diverges)
    fs.writeFileSync(path.join(plugin1, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        shared_db: { command: 'python', args: ['diverged.py'] }
      }
    }));

    antigravity.postInstall(plugin1, fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    // Original shared_db preserved intact for plugin 2
    assert.strictEqual(settings.mcpServers.shared_db.command, 'node');
    assert.deepStrictEqual(settings._agenthaus_mcp['shared-plugin-2'], ['shared_db']);

    // Plugin 1's diverging configuration is namespaced safely
    assert.ok(settings.mcpServers['shared-plugin-1-shared_db']);
    assert.strictEqual(settings.mcpServers['shared-plugin-1-shared_db'].command, 'python');
    assert.deepStrictEqual(settings._agenthaus_mcp['shared-plugin-1'], ['shared-plugin-1-shared_db']);

    // Now plugin 1 update removes its MCP snippet entirely: obsolete namespaced server is pruned
    fs.unlinkSync(path.join(plugin1, 'gemini-settings-snippet.json'));
    antigravity.postInstall(plugin1, fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    assert.strictEqual(settings.mcpServers['shared-plugin-1-shared_db'], undefined);
    assert.strictEqual(settings._agenthaus_mcp['shared-plugin-1'], undefined);
    // Plugin 2's shared server remains intact
    assert.ok(settings.mcpServers.shared_db);
    assert.deepStrictEqual(settings._agenthaus_mcp['shared-plugin-2'], ['shared_db']);
  });

  await t.test('postInstall preserves registrations when plugin source snippet is malformed', () => {
    const antigravity = getProvider('antigravity');
    const fakeGeminiDir = path.join(tmpDir, 'gemini-parse-fail-test');
    const fakeTargetDir = path.join(fakeGeminiDir, 'extensions');
    fs.mkdirSync(fakeTargetDir, { recursive: true });
    const settingsPath = path.join(fakeGeminiDir, 'settings.json');

    const pluginDir = path.join(tmpDir, 'test-plugin-parse-fail');
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(path.join(pluginDir, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        important_srv: { command: 'node', args: ['server.js'] }
      }
    }));

    // 1. Initial install succeeds
    antigravity.postInstall(pluginDir, fakeTargetDir, { dryRun: false });
    let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(settings.mcpServers.important_srv);
    assert.deepStrictEqual(settings._agenthaus_mcp['test-plugin-parse-fail'], ['important_srv']);

    // 2. Plugin snippet becomes corrupted/malformed
    fs.writeFileSync(path.join(pluginDir, 'gemini-settings-snippet.json'), '{ malformed json');

    // postInstall should not prune or overwrite existing registrations on parse failure
    antigravity.postInstall(pluginDir, fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(settings.mcpServers.important_srv);
    assert.deepStrictEqual(settings._agenthaus_mcp['test-plugin-parse-fail'], ['important_srv']);

    // 3. Plugin snippet has string shape: { "mcpServers": "bad" }
    fs.writeFileSync(path.join(pluginDir, 'gemini-settings-snippet.json'), JSON.stringify({ mcpServers: 'bad' }));
    antigravity.postInstall(pluginDir, fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(settings.mcpServers.important_srv);
    assert.deepStrictEqual(settings._agenthaus_mcp['test-plugin-parse-fail'], ['important_srv']);

    // 4. Plugin snippet has array shape: { "mcpServers": [1, 2, 3] }
    fs.writeFileSync(path.join(pluginDir, 'gemini-settings-snippet.json'), JSON.stringify({ mcpServers: [1, 2, 3] }));
    antigravity.postInstall(pluginDir, fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.ok(settings.mcpServers.important_srv);
    assert.deepStrictEqual(settings._agenthaus_mcp['test-plugin-parse-fail'], ['important_srv']);
  });

  await t.test('cursor postInstall preserves registrations for invalid mcpServers shapes', () => {
    const cursor = getProvider('cursor');
    const origCwd = process.cwd();
    const workDir = path.join(tmpDir, 'cursor-invalid-shape-work');
    fs.mkdirSync(workDir, { recursive: true });
    process.chdir(workDir);

    try {
      const targetDir = path.join(workDir, '.cursor', 'plugins');
      const pluginDir = path.join(tmpDir, 'cursor-test-plugin');
      fs.mkdirSync(pluginDir, { recursive: true });
      fs.mkdirSync(path.join(pluginDir, '.cursor'), { recursive: true });

      // Initial valid install
      fs.writeFileSync(path.join(pluginDir, '.cursor', 'mcp.json'), JSON.stringify({
        mcpServers: {
          my_cursor_srv: { command: 'node', args: ['server.js'] }
        }
      }));

      cursor.postInstall(pluginDir, targetDir, { dryRun: false });
      const mcpConfigPath = path.join(workDir, '.cursor', 'mcp.json');
      let config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      assert.ok(config.mcpServers.my_cursor_srv);

      // Now set mcpServers to string "bad"
      fs.writeFileSync(path.join(pluginDir, '.cursor', 'mcp.json'), JSON.stringify({ mcpServers: 'bad' }));
      cursor.postInstall(pluginDir, targetDir, { dryRun: false });
      config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      assert.ok(config.mcpServers.my_cursor_srv, 'Registration should be preserved on string mcpServers');

      // Now set mcpServers to array
      fs.writeFileSync(path.join(pluginDir, '.cursor', 'mcp.json'), JSON.stringify({ mcpServers: ['bad'] }));
      cursor.postInstall(pluginDir, targetDir, { dryRun: false });
      config = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      assert.ok(config.mcpServers.my_cursor_srv, 'Registration should be preserved on array mcpServers');
    } finally {
      process.chdir(origCwd);
    }
  });

  await t.test('windsurf postInstall continues .windsurfrules generation when MCP snippet has invalid shape', () => {
    const windsurf = getProvider('windsurf');
    const origCwd = process.cwd();
    const workDir = path.join(tmpDir, 'windsurf-rules-continue-work');
    fs.mkdirSync(workDir, { recursive: true });
    fs.mkdirSync(path.join(workDir, '.codeium'), { recursive: true });
    process.chdir(workDir);

    try {
      const targetDir = path.join(workDir, '.codeium', 'plugins');
      const pluginDir = path.join(tmpDir, 'windsurf-rule-plugin');
      fs.mkdirSync(pluginDir, { recursive: true });
      fs.writeFileSync(path.join(pluginDir, 'AGENTS.md'), '# Windsurf Rules\nAlways run tests.');

      // Snippet has invalid shape: { "mcpServers": "bad" }
      fs.writeFileSync(path.join(pluginDir, 'windsurf-mcp-snippet.json'), JSON.stringify({ mcpServers: 'bad' }));

      windsurf.postInstall(pluginDir, targetDir, { dryRun: false });

      // Despite invalid MCP snippet, .windsurfrules must be created
      const rulesPath = path.join(workDir, '.windsurfrules');
      assert.strictEqual(fs.existsSync(rulesPath), true);
      const rulesContent = fs.readFileSync(rulesPath, 'utf8');
      assert.ok(rulesContent.includes('# Windsurf Rules'));
      assert.ok(rulesContent.includes('Always run tests.'));
    } finally {
      process.chdir(origCwd);
    }
  });

  await t.test('postInstall avoids overwriting occupied namespaced server key and preserves unowned servers on uninstall', () => {
    const antigravity = getProvider('antigravity');
    const fakeGeminiDir = path.join(tmpDir, 'gemini-occupied-namespace-test');
    const fakeTargetDir = path.join(fakeGeminiDir, 'extensions');
    fs.mkdirSync(fakeTargetDir, { recursive: true });
    const settingsPath = path.join(fakeGeminiDir, 'settings.json');

    // Pre-existing unowned user server named 'occupied-plugin-1-shared_db'
    fs.writeFileSync(settingsPath, JSON.stringify({
      mcpServers: {
        'occupied-plugin-1-shared_db': { command: 'user-tool', args: ['stay-alive'] }
      }
    }));

    const plugin1 = path.join(tmpDir, 'occupied-plugin-1');
    fs.mkdirSync(plugin1, { recursive: true });
    fs.writeFileSync(path.join(plugin1, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        shared_db: { command: 'node', args: ['shared.js'] }
      }
    }));

    const plugin2 = path.join(tmpDir, 'occupied-plugin-2');
    fs.mkdirSync(plugin2, { recursive: true });
    fs.writeFileSync(path.join(plugin2, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        shared_db: { command: 'node', args: ['shared.js'] }
      }
    }));

    // Install both plugins sharing shared_db
    antigravity.postInstall(plugin1, fakeTargetDir, { dryRun: false });
    antigravity.postInstall(plugin2, fakeTargetDir, { dryRun: false });

    let settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    assert.strictEqual(settings.mcpServers.shared_db.command, 'node');
    assert.strictEqual(settings.mcpServers['occupied-plugin-1-shared_db'].command, 'user-tool');

    // Plugin 1 diverges
    fs.writeFileSync(path.join(plugin1, 'gemini-settings-snippet.json'), JSON.stringify({
      mcpServers: {
        shared_db: { command: 'python', args: ['diverged.py'] }
      }
    }));

    antigravity.postInstall(plugin1, fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    // Unowned server must NOT be overwritten
    assert.strictEqual(settings.mcpServers['occupied-plugin-1-shared_db'].command, 'user-tool');
    // Plugin 1 must be registered under unique free key -2
    assert.strictEqual(settings.mcpServers['occupied-plugin-1-shared_db-2'].command, 'python');
    assert.deepStrictEqual(settings._agenthaus_mcp['occupied-plugin-1'], ['occupied-plugin-1-shared_db-2']);
    // Plugin 2 preserved
    assert.strictEqual(settings.mcpServers.shared_db.command, 'node');

    // Uninstall plugin 1: must delete only occupied-plugin-1-shared_db-2, preserving unowned user server
    antigravity.postUninstall('occupied-plugin-1', fakeTargetDir, { dryRun: false });
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

    assert.strictEqual(settings.mcpServers['occupied-plugin-1-shared_db-2'], undefined);
    assert.strictEqual(settings.mcpServers['occupied-plugin-1-shared_db'].command, 'user-tool');
    assert.strictEqual(settings.mcpServers.shared_db.command, 'node');
  });
});

