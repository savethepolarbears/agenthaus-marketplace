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
  }
};
