'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

module.exports = {
  id: 'antigravity',
  name: 'Antigravity (Gemini CLI)',
  detect(cwd) {
    const home = os.homedir();
    return fs.existsSync(path.join(home, '.gemini', 'antigravity')) ||
           fs.existsSync(path.join(home, '.gemini', 'extensions')) ||
           fs.existsSync(path.join(cwd, '.agent'));
  },
  getTargetDir(cwd, mode) {
    if (mode === 'project') return path.join(cwd, '.agent', 'plugins');
    return path.join(os.homedir(), '.gemini', 'antigravity');
  },
  getCapabilities() {
    return { mcp: 'via gemini-settings', hooks: false, commands: 'partial', skills: true };
  }
};
