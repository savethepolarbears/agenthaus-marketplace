'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

module.exports = {
  id: 'windsurf',
  name: 'Windsurf (Codeium)',
  detect(cwd) {
    return fs.existsSync(path.join(os.homedir(), '.codeium', 'windsurf')) ||
           fs.existsSync(path.join(cwd, '.codeium'));
  },
  getTargetDir(cwd, mode) {
    if (mode === 'project') return path.join(cwd, '.codeium', 'plugins');
    return path.join(os.homedir(), '.codeium', 'windsurf', 'plugins');
  },
  getCapabilities() {
    return { mcp: 'via mcp_config.json', hooks: false, commands: 'partial', skills: true };
  }
};
