const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const INSTALLER_SCRIPT = path.join(REPO_ROOT, 'scripts', 'install-plugins.sh');

describe('Universal Plugin Installer Filesystem Safety', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'installer-test-'));
    });

    afterEach(() => {
        if (tmpDir && fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    test('uninstall_from refuses to uninstall when HOME is a symlink and preserves matching children', () => {
        const homeReal = path.join(tmpDir, 'home-real');
        const homeLink = path.join(tmpDir, 'home-link');

        fs.mkdirSync(homeReal, { recursive: true });
        fs.symlinkSync(homeReal, homeLink);

        // Pre-create matching plugin directory with sentinel file
        const pluginDir = path.join(homeReal, 'circuit-breaker');
        fs.mkdirSync(pluginDir, { recursive: true });
        const sentinelFile = path.join(pluginDir, 'KEEP');
        fs.writeFileSync(sentinelFile, 'DO_NOT_DELETE');

        const res = spawnSync('bash', ['-c', `
            source "${INSTALLER_SCRIPT}"
            uninstall_from "$HOME" "Custom"
        `], {
            env: {
                ...process.env,
                HOME: homeLink
            },
            encoding: 'utf8'
        });

        // Must reject uninstallation
        assert.strictEqual(res.status, 1, 'uninstall_from must exit with code 1 on symlinked HOME');
        assert.match(
            res.stdout + res.stderr,
            /Refusing to uninstall from root, home, or shallow directory/,
            'Expected refusal error message'
        );

        // Sentinel file and plugin directory inside real home must NOT be deleted
        assert.ok(fs.existsSync(sentinelFile), 'Sentinel file in symlinked home must be preserved');
        assert.strictEqual(fs.readFileSync(sentinelFile, 'utf8'), 'DO_NOT_DELETE');
        assert.ok(fs.existsSync(pluginDir), 'Plugin directory in symlinked home must be preserved');
    });

    test('uninstall_from refuses to uninstall when target is canonical HOME directory', () => {
        const homeDir = path.join(tmpDir, 'canonical-home');
        fs.mkdirSync(homeDir, { recursive: true });

        const pluginDir = path.join(homeDir, 'circuit-breaker');
        fs.mkdirSync(pluginDir, { recursive: true });
        const sentinelFile = path.join(pluginDir, 'KEEP');
        fs.writeFileSync(sentinelFile, 'DO_NOT_DELETE');

        const res = spawnSync('bash', ['-c', `
            source "${INSTALLER_SCRIPT}"
            uninstall_from "$HOME" "Custom"
        `], {
            env: {
                ...process.env,
                HOME: homeDir
            },
            encoding: 'utf8'
        });

        assert.strictEqual(res.status, 1, 'uninstall_from must exit with code 1 on direct HOME target');
        assert.match(
            res.stdout + res.stderr,
            /Refusing to uninstall from root, home, or shallow directory/
        );
        assert.ok(fs.existsSync(sentinelFile), 'Sentinel file in canonical home must be preserved');
    });

    test('uninstall_from refuses to uninstall from root or shallow directories', () => {
        const res = spawnSync('bash', ['-c', `
            source "${INSTALLER_SCRIPT}"
            uninstall_from "/" "Custom"
        `], {
            env: process.env,
            encoding: 'utf8'
        });

        assert.strictEqual(res.status, 1, 'uninstall_from must reject root directory');
        assert.match(
            res.stdout + res.stderr,
            /Refusing to uninstall from root, home, or shallow directory/
        );
    });
});
