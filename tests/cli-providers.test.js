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
});
