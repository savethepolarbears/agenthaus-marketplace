'use strict';
const path = require('node:path');
function issue(code, message) { const e = new Error(message); e.code = code; return e; }
function controlCategory(cp) {
  if (cp === 0x061c || cp === 0x200e || cp === 0x200f || (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x206f)) return 'bidi-control';
  if (cp >= 0xe0000 && cp <= 0xe007f) return 'hidden-tag';
  if ([0x00ad, 0x200b, 0x200c, 0x200d, 0x2060, 0xfeff].includes(cp)) return 'zero-width-control';
  return null;
}
function safeRelative(value) {
  return typeof value === 'string' && value.length > 0 && !path.posix.isAbsolute(value) && !/^[A-Za-z]:/.test(value) &&
    !/[\\\x00-\x1f\x7f*?\[\]]/.test(value) && !value.split('/').some(p => !p || p === '.' || p === '..');
}
function validateCanonicalPaths(paths) {
  const seen = new Set();
  for (const value of paths) {
    if (!safeRelative(value) || [...value].some(c => controlCategory(c.codePointAt(0)))) throw issue('INVALID_PATH', 'Noncanonical payload path');
    const key = value.normalize('NFC').toLowerCase();
    if (seen.has(key)) throw issue('NORMALIZED_PATH_COLLISION', 'Payload paths collide after normalization');
    seen.add(key);
  }
  return [...paths].sort((a,b) => Buffer.compare(Buffer.from(a),Buffer.from(b)));
}
function validateExceptions(exceptions = []) {
  if (!Array.isArray(exceptions) || exceptions.length > 256) throw issue('INVALID_UNICODE_EXCEPTION', 'Invalid Unicode exception list');
  const seen = new Set();
  return exceptions.map(entry => {
    if (!entry || Object.keys(entry).sort().join(',') !== 'code_point,path,reason' || !safeRelative(entry.path) ||
        !/^U\+[0-9A-F]{4,6}$/.test(entry.code_point || '') || !controlCategory(parseInt(entry.code_point.slice(2),16)) ||
        typeof entry.reason !== 'string' || !entry.reason.trim() || entry.reason.length > 512 || /[\x00-\x1f\x7f]/.test(entry.reason) || [...entry.reason].some(c => controlCategory(c.codePointAt(0)))) throw issue('INVALID_UNICODE_EXCEPTION', 'Unicode exceptions require exact path, control code point and reason');
    const key = entry.path + ':' + entry.code_point;
    if (seen.has(key)) throw issue('INVALID_UNICODE_EXCEPTION', 'Duplicate Unicode exception');
    seen.add(key); return { path: entry.path, code_point: entry.code_point, reason: entry.reason };
  }).sort((a,b) => (a.path + a.code_point).localeCompare(b.path + b.code_point));
}
function location(text, index) {
  const before = text.slice(0,index), lineStart = before.lastIndexOf('\n');
  return { line: before.split('\n').length, column: [...before.slice(lineStart+1)].length+1 };
}
function scanText(file, text, { exceptions = [] } = {}) {
  const reviewed = validateExceptions(exceptions), diagnostics = [];
  let line = 1, column = 1;
  for (const c of text) {
    const cp = c.codePointAt(0), category = controlCategory(cp);
    if (category) {
      if (diagnostics.length >= 1024) throw issue('UNICODE_DIAGNOSTIC_LIMIT','Too many Unicode controls');
      const code_point = 'U+' + cp.toString(16).toUpperCase().padStart(4,'0');
      const approved = reviewed.some(e => e.path === file && e.code_point === code_point);
      diagnostics.push({ path: file, line, column, code_point, category, severity: approved ? 'exception' : 'error' });
    }
    if (c === '\n') { line++; column = 1; } else column++;
  }
  // Conservative mixed-script identifier diagnosis; not a complete UTS-39 confusable database.
  if (/\.(?:[cm]?js|jsx|tsx?|py|sh|json|ya?ml|toml|mdc)$/i.test(file)) {
    for (const match of text.matchAll(/[\p{L}_$][\p{L}\p{N}_$]*/gu)) {
      const word = match[0];
      if (/\p{Script=Latin}/u.test(word) && /[\p{Script=Cyrillic}\p{Script=Greek}]/u.test(word)) {
        const c = [...word].find(value => /[\p{Script=Cyrillic}\p{Script=Greek}]/u.test(value));
        diagnostics.push({ path: file, ...location(text,match.index), code_point:'U+'+c.codePointAt(0).toString(16).toUpperCase().padStart(4,'0'), category:'identifier-confusable', severity:'warning' });
      }
    }
  }
  return diagnostics;
}
function scanUnicode(root, { exceptions = [] } = {}) {
  const snapshot = require('./integrity.js').validatedSourceSnapshot(root, { unicodeExceptions: exceptions, permitUnicodeErrors: true });
  return { ok: !snapshot.unicode.some(d => d.severity === 'error'), diagnostics: snapshot.unicode, files: snapshot.files.length, coverage: { text_scanned: snapshot.unicodeCoverage.filter(f => f.status === 'text-scanned').length, binary_hashed: snapshot.unicodeCoverage.filter(f => f.status === 'binary-hashed').length } };
}
module.exports = { controlCategory, safeRelative, validateCanonicalPaths, validateExceptions, scanText, scanUnicode };
