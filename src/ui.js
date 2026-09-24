'use strict';

const util = require('node:util');

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

function info(msg) {
  console.log(`${style('blue', '[INFO]')} ${msg}`);
}

function success(msg) {
  console.log(`${style('green', '[SUCCESS]')} ${msg}`);
}

function warn(msg) {
  console.warn(`${style('yellow', '[WARN]')} ${msg}`);
}

function error(msg) {
  console.error(`${style('red', '[ERROR]')} ${msg}`);
}

function skip(msg) {
  console.log(`${style('cyan', '[SKIP]')} ${msg}`);
}

module.exports = { style, info, success, warn, error, skip };
