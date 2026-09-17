const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const BUDGET_GUARD_SCRIPT = path.join(
    REPO_ROOT,
    'plugins',
    'circuit-breaker',
    'hooks',
    'scripts',
    'budget-guard.sh'
);
const RESET_SCRIPT = path.join(
    REPO_ROOT,
    'plugins',
    'circuit-breaker',
    'hooks',
    'scripts',
    'reset-counter.sh'
);

describe('Circuit Breaker Budget Guard & Reset Hardening', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cb-test-'));
    });

    afterEach(() => {
        if (tmpDir && fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('increments counter normally in isolated state directory', () => {
        const env = { ...process.env, TMPDIR: tmpDir };

        // First run
        execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });

        const userId = process.getuid ? process.getuid() : 0;
        const stateDir = path.join(tmpDir, `circuit-breaker-${userId}`);
        const counterFile = path.join(stateDir, 'counter');

        assert.ok(fs.existsSync(stateDir), 'State directory should exist');
        assert.ok(fs.existsSync(counterFile), 'Counter file should exist');

        const firstCount = fs.readFileSync(counterFile, 'utf8').trim();
        assert.strictEqual(firstCount, '1');

        // Verify directory mode is 0700
        const stat = fs.statSync(stateDir);
        // Mask with 0777 to check directory permissions
        assert.strictEqual(stat.mode & 0o777, 0o700);

        // Second run
        execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });
        const secondCount = fs.readFileSync(counterFile, 'utf8').trim();
        assert.strictEqual(secondCount, '2');
    });

    test('aborts write and exits 0 when state directory is a symlink', () => {
        const userId = process.getuid ? process.getuid() : 0;
        const symlinkTarget = path.join(tmpDir, 'target-dir');
        fs.mkdirSync(symlinkTarget);

        const stateDir = path.join(tmpDir, `circuit-breaker-${userId}`);
        fs.symlinkSync(symlinkTarget, stateDir);

        const env = { ...process.env, TMPDIR: tmpDir };

        // Should exit 0 gracefully without writing into target
        const output = execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });
        assert.strictEqual(output.toString(), '');
        assert.strictEqual(fs.existsSync(path.join(symlinkTarget, 'counter')), false);
    });

    test('aborts write and exits 0 when counter file is a symlink', () => {
        const userId = process.getuid ? process.getuid() : 0;
        const stateDir = path.join(tmpDir, `circuit-breaker-${userId}`);
        fs.mkdirSync(stateDir, { mode: 0o700 });

        const sentinelFile = path.join(tmpDir, 'sentinel.txt');
        fs.writeFileSync(sentinelFile, 'ORIGINAL_CONTENT');

        const counterFile = path.join(stateDir, 'counter');
        fs.symlinkSync(sentinelFile, counterFile);

        const env = { ...process.env, TMPDIR: tmpDir };

        const output = execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });
        assert.strictEqual(output.toString(), '');

        // Sentinel should NOT have been overwritten
        const content = fs.readFileSync(sentinelFile, 'utf8');
        assert.strictEqual(content, 'ORIGINAL_CONTENT');
    });

    test('reset-counter.sh clears the active counter and resets count to 1', () => {
        const env = { ...process.env, TMPDIR: tmpDir };

        // Run budget guard three times
        execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });
        execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });
        execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });

        const userId = process.getuid ? process.getuid() : 0;
        const counterFile = path.join(tmpDir, `circuit-breaker-${userId}`, 'counter');
        assert.strictEqual(fs.readFileSync(counterFile, 'utf8').trim(), '3');

        // Verify config reset in addition to counter reset
        const configPath = path.join(tmpDir, '.circuit-breaker-config.json');
        fs.writeFileSync(configPath, '{"breakers":{"budget-guard":{"enabled":false}}}');

        // Execute reset script from tmpDir
        execFileSync('bash', [RESET_SCRIPT], { env, cwd: tmpDir, stdio: 'pipe' });
        assert.strictEqual(fs.existsSync(counterFile), false, 'Counter file should be removed');
        assert.strictEqual(fs.existsSync(configPath), false, 'Config file should be reset/removed');

        // Next run starts back at 1
        execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });
        assert.strictEqual(fs.readFileSync(counterFile, 'utf8').trim(), '1');
    });

    test('reset-counter.sh does not delete counter when state directory is a symlink', () => {
        const userId = process.getuid ? process.getuid() : 0;
        const targetDir = path.join(tmpDir, 'symlink-target-dir');
        fs.mkdirSync(targetDir);

        const sentinelCounter = path.join(targetDir, 'counter');
        fs.writeFileSync(sentinelCounter, 'PRESERVE_ME');

        const stateDir = path.join(tmpDir, `circuit-breaker-${userId}`);
        fs.symlinkSync(targetDir, stateDir);

        const env = { ...process.env, TMPDIR: tmpDir };

        execFileSync('bash', [RESET_SCRIPT], { env, stdio: 'pipe' });

        // Sentinel counter file inside symlinked target directory must NOT be deleted
        assert.ok(fs.existsSync(sentinelCounter), 'Target counter should not be deleted via symlinked state directory');
        assert.strictEqual(fs.readFileSync(sentinelCounter, 'utf8'), 'PRESERVE_ME');
    });

    test('exits 0 with warning-only and unchanged counter on non-writable counter file', () => {
        const userId = process.getuid ? process.getuid() : 0;
        const stateDir = path.join(tmpDir, `circuit-breaker-${userId}`);
        fs.mkdirSync(stateDir, { mode: 0o700 });

        const counterFile = path.join(stateDir, 'counter');
        fs.writeFileSync(counterFile, '5\n');
        fs.chmodSync(counterFile, 0o444); // Read-only file: write denied to owner

        const env = { ...process.env, TMPDIR: tmpDir };

        // Should exit 0 without failing despite non-writable counter file
        assert.doesNotThrow(() => {
            execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });
        });

        // Counter must remain unchanged at 5
        assert.strictEqual(fs.readFileSync(counterFile, 'utf8').trim(), '5');
    });

    test('exits 0 gracefully without loosening permissions when state directory is non-writable (mode 0500)', () => {
        const userId = process.getuid ? process.getuid() : 0;
        const stateDir = path.join(tmpDir, `circuit-breaker-${userId}`);
        fs.mkdirSync(stateDir, { mode: 0o500 }); // Read-only directory

        const env = { ...process.env, TMPDIR: tmpDir };

        assert.doesNotThrow(() => {
            execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });
        });

        // Directory permissions must remain 0500 (not mutated back to 0700)
        const stat = fs.statSync(stateDir);
        assert.strictEqual(stat.mode & 0o777, 0o500);
    });
});
