'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

module.exports = {
  id: 'codex',
  name: 'Codex CLI',
  detect(cwd) {
    return fs.existsSync(path.join(os.homedir(), '.codex')) ||
           fs.existsSync(path.join(cwd, '.codex'));
  },
  getTargetDir(cwd, mode) {
    return path.join(mode === 'project' ? cwd : os.homedir(), '.codex', 'agenthaus-skills');
  },
  getCapabilities() {
    return { mcp: 'via config.toml', hooks: false, commands: 'partial', skills: true };
  },
  postInstall(sourceDir, targetDir, { dryRun = false } = {}) {
    const pluginName = path.basename(sourceDir);
    const hasSkills = fs.existsSync(path.join(sourceDir, 'skills'));
    
    if (hasSkills) {
      const agentsPath = path.join(process.cwd(), 'AGENTS.md');
      const skillRef = `Read skills from .codex/agenthaus-skills/${pluginName}/skills/`;
      if (fs.existsSync(agentsPath)) {
        try {
          const content = fs.readFileSync(agentsPath, 'utf8');
          if (!content.includes(skillRef)) {
            const updated = content.trimEnd() + `\n\n<!-- agenthaus:codex-skills -->\n- ${skillRef}\n`;
            if (!dryRun) {
              fs.writeFileSync(agentsPath, updated, 'utf8');
            }
          }
        } catch {}
      }
      console.log(`[info] Codex: Reference skills in AGENTS.md: '${skillRef}'`);
    }

    if (fs.existsSync(path.join(sourceDir, 'codex-mcp-config.toml'))) {
      console.log(`[info] Codex: For MCP servers, add entries from ${pluginName}/codex-mcp-config.toml to config.toml`);
    }
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    const agentsPath = path.join(process.cwd(), 'AGENTS.md');
    const skillRef = `Read skills from .codex/agenthaus-skills/${pluginName}/skills/`;
    if (fs.existsSync(agentsPath)) {
      try {
        const content = fs.readFileSync(agentsPath, 'utf8');
        if (content.includes(skillRef)) {
          const updated = content
            .split('\n')
            .filter(line => !line.includes(skillRef))
            .join('\n');
          if (!dryRun) {
            fs.writeFileSync(agentsPath, updated, 'utf8');
          }
        }
      } catch {}
    }
  }
};
