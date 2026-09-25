const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

describe('Drift Guard & Untracked Files Check', () => {
    let fixtureDir;

    beforeEach(() => {
        fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'drift-fixture-'));
    });

    afterEach(() => {
        if (fixtureDir && fs.existsSync(fixtureDir)) {
            fs.rmSync(fixtureDir, { recursive: true, force: true });
        }
    });

    test('reproduced false negative: git diff --exit-code misses regenerated untracked artifact', () => {
        // Initialize git repo in fixture
        execSync('git init -b main', { cwd: fixtureDir, stdio: 'ignore' });
        execSync('git config user.email "test@example.com"', { cwd: fixtureDir, stdio: 'ignore' });
        execSync('git config user.name "Test"', { cwd: fixtureDir, stdio: 'ignore' });
            // Detached auto-maintenance (commit-graph writes) would race the fixture cleanup
            execSync('git config gc.auto 0 && git config maintenance.auto false', { cwd: fixtureDir, stdio: 'ignore' });

        // Commit a generated artifact
        const testArtifact = path.join(fixtureDir, 'GEMINI.md');
        fs.writeFileSync(testArtifact, '# Test Gemini Documentation\n');
        execSync('git add GEMINI.md && git commit -m "initial"', { cwd: fixtureDir, stdio: 'ignore' });

        // Simulate PR that deletes the artifact and commits the deletion
        fs.unlinkSync(testArtifact);
        execSync('git commit -am "delete generated artifact"', { cwd: fixtureDir, stdio: 'ignore' });

        // Simulate writeIfChanged recreating the artifact as untracked file
        fs.writeFileSync(testArtifact, '# Test Gemini Documentation\n');

        // False negative: git diff --exit-code exits 0 because it only checks tracked files
        let gitDiffExitCode = 0;
        try {
            execSync('git diff --exit-code', { cwd: fixtureDir, stdio: 'pipe' });
        } catch (err) {
            gitDiffExitCode = err.status;
        }
        assert.strictEqual(gitDiffExitCode, 0, 'git diff --exit-code falsely returns 0 on untracked regenerated files');

        // Correct detection: git status --porcelain --untracked-files=all catches it!
        const statusOutput = execSync('git status --porcelain --untracked-files=all', {
            cwd: fixtureDir,
            encoding: 'utf8'
        }).trim();

        assert.ok(statusOutput.includes('?? GEMINI.md'), 'git status --porcelain --untracked-files=all successfully catches untracked regenerated artifact');
    });

    test('clean repository exhibits no untracked generated files after generator run', () => {
        const repoRoot = path.resolve(__dirname, '..');
        const cleanFixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'drift-clean-'));

        try {
            // Copy generator inputs to isolated fixture excluding node_modules
            fs.cpSync(path.join(repoRoot, 'plugins'), path.join(cleanFixtureDir, 'plugins'), {
                recursive: true,
                filter: (src) => !src.includes('node_modules')
            });
            fs.cpSync(path.join(repoRoot, 'scripts'), path.join(cleanFixtureDir, 'scripts'), {
                recursive: true
            });
            // The generator renders Codex TOML with the shared src/codex-toml.js module
            fs.mkdirSync(path.join(cleanFixtureDir, 'src'), { recursive: true });
            fs.copyFileSync(path.join(repoRoot, 'src', 'codex-toml.js'), path.join(cleanFixtureDir, 'src', 'codex-toml.js'));
            if (fs.existsSync(path.join(repoRoot, 'skills_index.json'))) {
                fs.copyFileSync(path.join(repoRoot, 'skills_index.json'), path.join(cleanFixtureDir, 'skills_index.json'));
            }
            fs.copyFileSync(path.join(repoRoot, 'AGENTS.md'), path.join(cleanFixtureDir, 'AGENTS.md'));
            fs.copyFileSync(path.join(repoRoot, 'GEMINI.md'), path.join(cleanFixtureDir, 'GEMINI.md'));
            fs.copyFileSync(path.join(repoRoot, '.gitignore'), path.join(cleanFixtureDir, '.gitignore'));

            execSync('git init -b main', { cwd: cleanFixtureDir, stdio: 'ignore' });
            execSync('git config user.email "test@example.com"', { cwd: cleanFixtureDir, stdio: 'ignore' });
            execSync('git config user.name "Test"', { cwd: cleanFixtureDir, stdio: 'ignore' });
            // Detached auto-maintenance (commit-graph writes) would race the fixture cleanup
            execSync('git config gc.auto 0 && git config maintenance.auto false', { cwd: cleanFixtureDir, stdio: 'ignore' });
            execSync('git add -A && git commit -m "initial"', { cwd: cleanFixtureDir, stdio: 'ignore' });

            // Run generator in isolated fixture
            execSync('node scripts/generate-cross-platform.js', {
                cwd: cleanFixtureDir,
                stdio: 'pipe'
            });

            // Assert against generator artifact pathspecs
            const status = execSync(
                'git status --porcelain --untracked-files=all -- ' +
                '"*claude-desktop-snippet.json" "*gemini-settings-snippet.json" ' +
                '"*windsurf-mcp-snippet.json" "*codex-mcp-config.toml" ' +
                '".cursor" "GEMINI.md" "AGENTS.md"',
                {
                    cwd: cleanFixtureDir,
                    encoding: 'utf8'
                }
            ).trim();

            const lines = status ? status.split('\n') : [];
            const untracked = lines.filter(l => l.startsWith('??'));
            assert.deepStrictEqual(untracked, [], 'Generator should not produce untracked artifacts');
        } finally {
            fs.rmSync(cleanFixtureDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
        }
    });
});
