'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BACKUP_SUFFIX = '.agenthaus.bak';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Read a JSON object from disk.
 * Missing file -> {}. Malformed file -> timestamped backup (unless dryRun) and a thrown error,
 * so callers never overwrite a config they could not parse.
 */
function readJsonObject(filePath, label, { dryRun = false } = {}) {
  if (!fs.existsSync(filePath)) return {};
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw malformedError(filePath, label, err.message, dryRun);
  }
  if (!isPlainObject(parsed)) {
    throw malformedError(filePath, label, 'expected a JSON object', dryRun);
  }
  return parsed;
}

function malformedError(filePath, label, reason, dryRun) {
  let backupMsg = '';
  if (!dryRun) {
    const backupPath = `${filePath}.bak.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    backupMsg = ` (backed up to ${backupPath})`;
  }
  return new Error(`Malformed ${label} at ${filePath}${backupMsg}: ${reason}. Aborting to preserve existing configuration.`);
}

/**
 * Atomically replace a text file: keep a rolling backup of the previous contents
 * (user-owned configs), write to a sibling temp file, then rename over the destination.
 */
function writeFileAtomic(requestedPath, content, { backup = true } = {}) {
  // Write through symlinks (e.g. dotfile-managed configs) instead of replacing the link.
  let filePath = requestedPath;
  try { filePath = fs.realpathSync(requestedPath); } catch {}
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (backup && fs.existsSync(filePath)) {
    fs.copyFileSync(filePath, filePath + BACKUP_SUFFIX);
  }
  const tmpPath = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  try {
    const fd = fs.openSync(tmpPath, 'w');
    try {
      fs.writeFileSync(fd, content, 'utf8');
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch {}
    throw err;
  }
}

function writeJsonAtomic(filePath, data, options) {
  writeFileAtomic(filePath, JSON.stringify(data, null, 2) + '\n', options);
}

module.exports = { BACKUP_SUFFIX, isPlainObject, readJsonObject, writeFileAtomic, writeJsonAtomic };
