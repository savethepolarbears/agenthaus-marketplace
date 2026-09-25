'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { writeFileAtomic } = require('../fs-utils.js');
const { readServersSnippet, resolvePluginRoot, syncPluginServers, removePluginServers } = require('./mcp-ownership.js');

const LABEL = 'VS Code MCP config';

function getRepoRoot(targetDir) {
  const githubDir = path.dirname(targetDir);
  return path.basename(githubDir) === '.github' ? path.dirname(githubDir) : process.cwd();
}

function getConfigPath(targetDir) {
  return path.join(getRepoRoot(targetDir), '.vscode', 'mcp.json');
}

// VS Code shares Cursor's ${env:VAR} / ${workspaceFolder} syntax, so the generated
// .cursor/mcp.json is reused; VS Code additionally expects an explicit transport type.
function loadPluginServers(sourceDir, targetDir) {
  const pluginName = path.basename(sourceDir);
  const { servers, failed } = readServersSnippet(path.join(sourceDir, '.cursor', 'mcp.json'), 'Copilot');
  if (failed || !servers) return { servers, failed };
  const resolved = resolvePluginRoot(servers, [`\${workspaceFolder}/plugins/${pluginName}`], path.join(targetDir, pluginName));
  const typed = {};
  for (const [key, srv] of Object.entries(resolved)) {
    if (srv.type) typed[key] = srv;
    else typed[key] = { type: srv.command ? 'stdio' : 'http', ...srv };
  }
  return { servers: typed, failed: false };
}

module.exports = {
  id: 'copilot',
  name: 'GitHub Copilot',
  detect(cwd) {
    return fs.existsSync(path.join(cwd, '.github'));
  },
  getTargetDir(cwd, mode) {
    return path.join(cwd, '.github', 'plugins');
  },
  getConfigPaths(cwd) {
    return [path.join(cwd, '.vscode', 'mcp.json')];
  },
  getCapabilities() {
    return { mcp: 'via .vscode/mcp.json', hooks: false, commands: 'instructions', skills: true };
  },
  isMcpInSync(sourceDir, targetDir) {
    const { servers, failed } = loadPluginServers(sourceDir, targetDir);
    if (failed) return true;
    return !syncPluginServers({ configPath: getConfigPath(targetDir), pluginName: path.basename(sourceDir), servers, label: LABEL, serversKey: 'servers', dryRun: true }).changed;
  },
  postInstall(sourceDir, targetDir, { dryRun = false } = {}) {
    const pluginName = path.basename(sourceDir);
    const repoRoot = getRepoRoot(targetDir);
    const instructionsPath = path.join(repoRoot, '.github', 'copilot-instructions.md');

    const hasSkills = fs.existsSync(path.join(sourceDir, 'skills'));
    const hasCommands = fs.existsSync(path.join(sourceDir, 'commands'));

    if (hasSkills || hasCommands) {
      let content = '';
      if (fs.existsSync(instructionsPath)) {
        try {
          content = fs.readFileSync(instructionsPath, 'utf8');
        } catch {}
      } else {
        content = '# GitHub Copilot Instructions\n';
      }

      const marker = `<!-- agenthaus:copilot-plugin:${pluginName} -->`;
      if (!content.includes(marker)) {
        let refs = `${marker}\n`;
        if (hasSkills) {
          refs += `- Read skills from .github/plugins/${pluginName}/skills/\n`;
        }
        if (hasCommands) {
          refs += `- Read instructions and command workflows from .github/plugins/${pluginName}/commands/\n`;
        }
        const updated = content.trimEnd() + `\n\n${refs}`;
        if (!dryRun) {
          fs.mkdirSync(path.dirname(instructionsPath), { recursive: true });
          writeFileAtomic(instructionsPath, updated, { backup: false });
        }
        console.log(`[info] Copilot: Reference plugin in .github/copilot-instructions.md: '${pluginName}'`);
      }
    }

    // Install prompt files to .github/prompts/ if commands exist
    if (hasCommands) {
      const promptsDir = path.join(repoRoot, '.github', 'prompts');
      try {
        const cmdFiles = fs.readdirSync(path.join(sourceDir, 'commands'));
        for (const file of cmdFiles) {
          if (!file.endsWith('.md')) continue;
          const promptFileName = `${pluginName}-${file.replace(/\.md$/, '.prompt.md')}`;
          const promptFilePath = path.join(promptsDir, promptFileName);
          if (!dryRun) {
            fs.mkdirSync(promptsDir, { recursive: true });
            fs.copyFileSync(path.join(sourceDir, 'commands', file), promptFilePath);
          }
        }
      } catch {}
    }

    // Reconcile MCP servers into .vscode/mcp.json (top-level "servers")
    const { servers, failed } = loadPluginServers(sourceDir, targetDir);
    if (!failed) {
      syncPluginServers({ configPath: getConfigPath(targetDir), pluginName, servers, label: LABEL, serversKey: 'servers', dryRun });
    }
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    removePluginServers({ configPath: getConfigPath(targetDir), pluginName, label: LABEL, serversKey: 'servers', dryRun });
    const repoRoot = getRepoRoot(targetDir);
    const instructionsPath = path.join(repoRoot, '.github', 'copilot-instructions.md');

    if (fs.existsSync(instructionsPath)) {
      try {
        const content = fs.readFileSync(instructionsPath, 'utf8');
        const marker = `<!-- agenthaus:copilot-plugin:${pluginName} -->`;
        if (content.includes(marker)) {
          // Remove marker and following bullet lines
          const lines = content.split('\n');
          const filtered = [];
          let skipping = false;
          for (const line of lines) {
            if (line.includes(marker)) {
              skipping = true;
              continue;
            }
            if (skipping) {
              if (line.trim().startsWith('- ') || line.trim() === '') {
                continue;
              } else {
                skipping = false;
              }
            }
            filtered.push(line);
          }
          if (!dryRun) {
            writeFileAtomic(instructionsPath, filtered.join('\n').trimEnd() + '\n', { backup: false });
          }
        }
      } catch {}
    }

    const promptsDir = path.join(repoRoot, '.github', 'prompts');
    if (fs.existsSync(promptsDir)) {
      try {
        const promptFiles = fs.readdirSync(promptsDir);
        for (const file of promptFiles) {
          if (file.startsWith(`${pluginName}-`) && file.endsWith('.prompt.md')) {
            if (!dryRun) {
              fs.unlinkSync(path.join(promptsDir, file));
            }
          }
        }
      } catch {}
    }
  }
};
