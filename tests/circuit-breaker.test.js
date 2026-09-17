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

        // Execute reset script
        execFileSync('bash', [RESET_SCRIPT], { env, stdio: 'pipe' });
        assert.strictEqual(fs.existsSync(counterFile), false, 'Counter file should be removed');

        // Next run starts back at 1
        execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });
        assert.strictEqual(fs.readFileSync(counterFile, 'utf8').trim(), '1');
    });

    test('exits 0 with warning-only on non-writable directory storage failure', () => {
        const userId = process.getuid ? process.getuid() : 0;
        const stateDir = path.join(tmpDir, `circuit-breaker-${userId}`);
        fs.mkdirSync(stateDir, { mode: 0o500 }); // read-only directory

        const env = { ...process.env, TMPDIR: tmpDir };

        // Should exit 0 without failing despite chmod or write error
        assert.doesNotThrow(() => {
            execFileSync('bash', [BUDGET_GUARD_SCRIPT], { env, stdio: 'pipe' });
        });
    });
});
