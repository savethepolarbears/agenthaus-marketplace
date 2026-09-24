'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

module.exports = {
  id: 'cursor',
  name: 'Cursor IDE',
  detect(cwd) {
    return fs.existsSync(path.join(os.homedir(), '.cursor')) ||
           fs.existsSync(path.join(cwd, '.cursor'));
  },
  getTargetDir(cwd, mode) {
    return path.join(mode === 'project' ? cwd : os.homedir(), '.cursor', 'plugins');
  },
  getCapabilities() {
    return { mcp: 'via .cursor/mcp.json', hooks: false, commands: 'partial', skills: true };
  }
};
