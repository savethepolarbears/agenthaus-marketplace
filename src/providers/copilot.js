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
  }
};
