'use strict';

const crypto = require('node:crypto');
const { isPlainObject } = require('./fs-utils.js');

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isPlainObject(value)) return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}

function digest(value) { return crypto.createHash('sha256').update(canonical(value)).digest('hex'); }

function validatePolicy(policy) {
  if (!isPlainObject(policy) || policy.version !== 1 || !Array.isArray(policy.rules) || policy.rules.length > 256 ||
      Object.keys(policy).some(k => !['version', 'rules'].includes(k))) throw new Error('Invalid safety policy');
  const ids = new Set();
  for (const rule of policy.rules) {
    if (!isPlainObject(rule) || typeof rule.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(rule.id) || ids.has(rule.id) ||
        typeof rule.tool !== 'string' || !/^[a-zA-Z0-9_./:-]{1,128}\*?$|^\*$/.test(rule.tool) ||
        !['deny', 'require-approval', 'allow-read'].includes(rule.action) ||
        Object.keys(rule).some(k => !['id', 'tool', 'action', 'resource_scope'].includes(k)) ||
        (rule.resource_scope !== undefined && (typeof rule.resource_scope !== 'string' || !rule.resource_scope.length || rule.resource_scope.length > 512))) {
      throw new Error('Invalid safety policy rule');
    }
    ids.add(rule.id);
  }
  return policy;
}

// Exact identifiers and one trailing wildcard only: no untrusted regex execution.
function matches(pattern, tool) {
  return pattern.endsWith('*') ? tool.startsWith(pattern.slice(0, -1)) : pattern === tool;
}

function evaluate(policy, params) {
  validatePolicy(policy);
  if (!isPlainObject(params) || typeof params.name !== 'string' || params.name.length > 128 ||
      (params.arguments !== undefined && !isPlainObject(params.arguments))) return { action: 'deny', rule_id: 'INVALID_TOOL_CALL' };
  const hits = policy.rules.filter(r => matches(r.tool, params.name));
  if (hits.length !== 1) return { action: 'deny', rule_id: hits.length ? 'AMBIGUOUS_POLICY' : 'DEFAULT_DENY' };
  return { action: hits[0].action, rule_id: hits[0].id, resource_scope: hits[0].resource_scope || 'unspecified' };
}

module.exports = { canonical, digest, validatePolicy, evaluate };
