'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

module.exports = {
  id: 'claude',
  name: 'Claude Code',
  detect(cwd) {
    return fs.existsSync(path.join(os.homedir(), '.claude')) ||
           fs.existsSync(path.join(os.homedir(), '.claude.json')) ||
           fs.existsSync(path.join(cwd, '.claude')) ||
           fs.existsSync(path.join(cwd, '.claude.json')) ||
           fs.existsSync(path.join(cwd, '.mcp.json'));
  },
  getTargetDir(cwd, mode) {
    if (mode === 'project') return path.join(cwd, '.claude', 'plugins');
    return path.join(os.homedir(), '.claude', 'plugins');
  },
  getCapabilities() {
    return { mcp: 'full', hooks: 'full', commands: 'full', skills: 'full' };
  }
};
