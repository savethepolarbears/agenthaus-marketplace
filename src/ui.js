'use strict';

const util = require('node:util');
const { stableStringify } = require('./catalog.js');

const hasColor = !process.env.NO_COLOR && process.stdout.isTTY;

function style(format, text) {
  if (!hasColor) return text;
  if (util.styleText) {
    return util.styleText(format, text);
  }
  const codes = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    reset: '\x1b[0m'
  };
  const code = codes[format];
  if (code) {
    return `${code}${text}${codes.reset}`;
  }
  return text;
}

function info(msg) { console.log(`${style('blue', '[INFO]')} ${msg}`); }
function success(msg) { console.log(`${style('green', '[SUCCESS]')} ${msg}`); }
function warn(msg) { console.warn(`${style('yellow', '[WARN]')} ${msg}`); }
function error(msg) { console.error(`${style('red', '[ERROR]')} ${msg}`); }
function skip(msg) { console.log(`${style('cyan', '[SKIP]')} ${msg}`); }

function renderTable(headers, rows, options = {}) {
  const colWidths = headers.map((h, i) => {
    return Math.max(h.length, ...rows.map(r => (r[i] ? r[i].replace(/\x1b\[[0-9;]*m/g, '').length : 0)));
  });

  const printRow = (row) => {
    return row.map((cell, i) => {
      const stripped = cell ? cell.replace(/\x1b\[[0-9;]*m/g, '') : '';
      const pad = ' '.repeat(Math.max(0, colWidths[i] - stripped.length));
      return cell + pad;
    }).join('  ');
  };

  console.log(printRow(headers));
  console.log(colWidths.map(w => '-'.repeat(w)).join('  '));
  rows.forEach(r => console.log(printRow(r)));
}

function renderPluginList(plugins, { json, verbose } = {}) {
  if (json) {
    process.stdout.write(stableStringify(plugins));
    return;
  }
  const rows = plugins.map(p => {
    const badges = [];
    if (p.badges.mcp) badges.push(style('cyan', '[MCP]'));
    if (p.badges.hooks) badges.push(style('yellow', '[Hooks]'));
    if (p.badges.commands) badges.push(style('blue', '[Cmds]'));
    if (p.badges.skills) badges.push(style('green', '[Skills]'));
    return [p.name, p.version, badges.join(' '), p.description];
  });
  renderTable(['Plugin', 'Version', 'Capabilities', 'Description'], rows);
}

module.exports = { style, info, success, warn, error, skip, renderTable, renderPluginList };

const readline = require('node:readline/promises');

async function promptSelect(question, choices) {
  if (!process.stdin.isTTY) {
    throw new Error('Interactive selection is unavailable in non-interactive CI environments. Please supply explicit flags.');
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(question);
  choices.forEach((c, i) => console.log(`${i + 1}) ${c.name || c}`));
  
  while (true) {
    const answer = await rl.question('Select a number: ');
    const num = parseInt(answer, 10);
    if (!isNaN(num) && num > 0 && num <= choices.length) {
      rl.close();
      return choices[num - 1].value !== undefined ? choices[num - 1].value : choices[num - 1];
    }
    console.log('Invalid selection, try again.');
  }
}

async function promptConfirm(question, defaultYes = true) {
  if (!process.stdin.isTTY) {
    throw new Error('Interactive selection is unavailable in non-interactive CI environments. Please supply explicit flags.');
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const hint = defaultYes ? '(Y/n)' : '(y/N)';
  const answer = await rl.question(`${question} ${hint}: `);
  rl.close();
  
  const trimmed = answer.trim().toLowerCase();
  if (trimmed === 'y' || trimmed === 'yes') return true;
  if (trimmed === 'n' || trimmed === 'no') return false;
  return defaultYes;
}

module.exports.promptSelect = promptSelect;
module.exports.promptConfirm = promptConfirm;
