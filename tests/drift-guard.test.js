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

        // Run cross-platform generator
        execSync('node scripts/generate-cross-platform.js', {
            cwd: repoRoot,
            stdio: 'pipe'
        });

        // Get status and verify no generated files are untracked
        const status = execSync('git status --porcelain --untracked-files=all', {
            cwd: repoRoot,
            encoding: 'utf8'
        });

        const lines = status ? status.trim().split('\n') : [];
        const generatedPatterns = [
            'claude-desktop-snippet.json',
            'gemini-settings-snippet.json',
            'windsurf-mcp-snippet.json',
            'codex-mcp-config.toml',
            '.cursor/mcp.json',
            '.cursor/rules/',
            'GEMINI.md',
            'AGENTS.md'
        ];

        const untrackedGenerated = lines.filter(line => {
            if (!line.startsWith('??')) return false;
            const file = line.substring(3).trim();
            return generatedPatterns.some(pat => file.endsWith(pat) || file.includes(pat));
        });

        assert.deepStrictEqual(untrackedGenerated, [], 'No generated artifact should be left untracked');
    });
});
