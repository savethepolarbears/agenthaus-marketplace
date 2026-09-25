'use strict';

const antigravity = require('./antigravity.js');
const claude = require('./claude.js');
const codex = require('./codex.js');
const cursor = require('./cursor.js');
const copilot = require('./copilot.js');
const windsurf = require('./windsurf.js');

const PROVIDERS = {
  antigravity,
  claude,
  codex,
  cursor,
  copilot,
  windsurf
};

function getAllProviders() {
  return Object.values(PROVIDERS);
}

function getProvider(id) {
  return PROVIDERS[id] || null;
}

function detectAll(cwd) {
  const detected = [];
  for (const provider of getAllProviders()) {
    if (provider.detect(cwd)) {
      detected.push(provider);
    }
  }
  return detected;
}

module.exports = { PROVIDERS, getAllProviders, getProvider, detectAll };
