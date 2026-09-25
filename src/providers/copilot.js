'use strict';

const fs = require('node:fs');
const path = require('node:path');

module.exports = {
  id: 'copilot',
  name: 'GitHub Copilot',
  detect(cwd) {
    return fs.existsSync(path.join(cwd, '.github'));
  },
  getTargetDir(cwd, mode) {
    return path.join(cwd, '.github', 'plugins');
  },
  getCapabilities() {
    return { mcp: false, hooks: false, commands: 'instructions', skills: true };
  },
  postInstall(sourceDir, targetDir, { dryRun = false } = {}) {
    const pluginName = path.basename(sourceDir);
    const githubDir = path.dirname(targetDir);
    const repoRoot = path.basename(githubDir) === '.github' ? path.dirname(githubDir) : process.cwd();
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
          fs.writeFileSync(instructionsPath, updated, 'utf8');
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
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    const githubDir = path.dirname(targetDir);
    const repoRoot = path.basename(githubDir) === '.github' ? path.dirname(githubDir) : process.cwd();
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
            fs.writeFileSync(instructionsPath, filtered.join('\n').trimEnd() + '\n', 'utf8');
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
