'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function findOrCreateAgentsPath(cwd) {
  let cur = path.resolve(cwd);
  while (true) {
    const candidate = path.join(cur, 'AGENTS.md');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return path.join(cwd, 'AGENTS.md');
}

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
      const skillsDest = path.join(targetDir, pluginName, 'skills');
      let skillPath;

      const realpathDeep = (p) => {
        let cur = path.resolve(p);
        const parts = [];
        while (!fs.existsSync(cur)) {
          const parent = path.dirname(cur);
          if (parent === cur) break;
          parts.unshift(path.basename(cur));
          cur = parent;
        }
        try {
          const realBase = fs.realpathSync(cur);
          return path.join(realBase, ...parts);
        } catch {
          return path.resolve(p);
        }
      };

      const realCwd = realpathDeep(process.cwd());
      const realHome = realpathDeep(os.homedir());
      const realDest = realpathDeep(skillsDest);

      const relCwd = path.relative(realCwd, realDest);
      const isInsideCwd = !relCwd.startsWith('..') && !path.isAbsolute(relCwd);

      const relHome = path.relative(realHome, realDest);
      const isInsideHome = !relHome.startsWith('..') && !path.isAbsolute(relHome);

      if (isInsideCwd) {
        skillPath = relCwd.replace(/\\/g, '/');
      } else if (isInsideHome) {
        skillPath = `~/${relHome.replace(/\\/g, '/')}`;
      } else {
        skillPath = skillsDest.replace(/\\/g, '/');
      }
      if (!skillPath.endsWith('/')) skillPath += '/';

      const skillRef = `Read skills from ${skillPath}`;
      const agentsPath = findOrCreateAgentsPath(process.cwd());
      let content = '';
      if (fs.existsSync(agentsPath)) {
        try {
          content = fs.readFileSync(agentsPath, 'utf8');
        } catch {}
      } else {
        content = '# Project Guidelines\n';
      }

      if (!content.includes(skillRef)) {
        const updated = content.trimEnd() + `\n\n<!-- agenthaus:codex-skills -->\n- ${skillRef}\n`;
        if (!dryRun) {
          fs.writeFileSync(agentsPath, updated, 'utf8');
        }
      }
      console.log(`[info] Codex: Reference skills in AGENTS.md: '${skillRef}'`);
    }

    if (fs.existsSync(path.join(sourceDir, 'codex-mcp-config.toml'))) {
      console.log(`[info] Codex: For MCP servers, add entries from ${pluginName}/codex-mcp-config.toml to config.toml`);
    }
  },
  postUninstall(pluginName, targetDir, { dryRun = false } = {}) {
    const agentsPath = findOrCreateAgentsPath(process.cwd());
    const skillPattern = `${pluginName}/skills/`;
    if (fs.existsSync(agentsPath)) {
      try {
        const content = fs.readFileSync(agentsPath, 'utf8');
        if (content.includes(skillPattern)) {
          const updated = content
            .split('\n')
            .filter(line => !line.includes(skillPattern))
            .join('\n');
          if (!dryRun) {
            fs.writeFileSync(agentsPath, updated, 'utf8');
          }
        }
      } catch {}
    }
  }
};
