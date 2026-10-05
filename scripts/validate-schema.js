#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Lightweight, zero-dependency JSON Schema validator for Draft-07 schemas
 * used across AgentHaus marketplace plugin manifests.
 */
function validateValue(val, schema, jsonPath = '') {
  const errors = [];
  if (!schema || typeof schema !== 'object') return errors;

  // 1. Type validation
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const match = types.some(t => {
      if (t === 'string') return typeof val === 'string';
      if (t === 'number') return typeof val === 'number' && !Number.isNaN(val);
      if (t === 'integer') return Number.isInteger(val);
      if (t === 'boolean') return typeof val === 'boolean';
      if (t === 'array') return Array.isArray(val);
      if (t === 'object') return typeof val === 'object' && val !== null && !Array.isArray(val);
      if (t === 'null') return val === null;
      return false;
    });
    if (!match) {
      errors.push(`${jsonPath || 'root'}: expected type ${types.join('|')}, got ${Array.isArray(val) ? 'array' : typeof val}`);
      return errors;
    }
  }

  // 2. String constraints
  if (typeof val === 'string') {
    if (schema.minLength !== undefined && val.length < schema.minLength) {
      errors.push(`${jsonPath || 'root'}: string length ${val.length} is less than minLength ${schema.minLength}`);
    }
    if (schema.pattern) {
      const re = new RegExp(schema.pattern);
      if (!re.test(val)) {
        errors.push(`${jsonPath || 'root'}: string "${val}" does not match pattern ${schema.pattern}`);
      }
    }
    if (schema.format) {
      if (schema.format === 'email') {
        const emailRe = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (!emailRe.test(val)) {
          errors.push(`${jsonPath || 'root'}: "${val}" is not a valid email address`);
        }
      } else if (schema.format === 'uri') {
        try {
          const u = new URL(val);
          if (!u.protocol) throw new Error();
        } catch {
          errors.push(`${jsonPath || 'root'}: "${val}" is not a valid URI`);
        }
      }
    }
    if (schema.enum && !schema.enum.includes(val)) {
      errors.push(`${jsonPath || 'root'}: value "${val}" not in enum [${schema.enum.join(', ')}]`);
    }
  }

  // 3. Number constraints
  if (typeof val === 'number') {
    if (schema.exclusiveMinimum !== undefined && val <= schema.exclusiveMinimum) {
      errors.push(`${jsonPath || 'root'}: value ${val} must be greater than ${schema.exclusiveMinimum}`);
    }
    if (schema.minimum !== undefined && val < schema.minimum) {
      errors.push(`${jsonPath || 'root'}: value ${val} must be at least ${schema.minimum}`);
    }
  }

  // 4. Array constraints
  if (Array.isArray(val)) {
    if (schema.items) {
      val.forEach((item, idx) => {
        errors.push(...validateValue(item, schema.items, `${jsonPath}[${idx}]`));
      });
    }
  }

  // 5. Object constraints
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    if (schema.required) {
      for (const req of schema.required) {
        if (!Object.prototype.hasOwnProperty.call(val, req) || val[req] === undefined) {
          errors.push(`${jsonPath || 'root'}: missing required property '${req}'`);
        }
      }
    }
    if (schema.properties) {
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (Object.prototype.hasOwnProperty.call(val, prop) && val[prop] !== undefined) {
          errors.push(...validateValue(val[prop], propSchema, jsonPath ? `${jsonPath}.${prop}` : prop));
        }
      }
    }
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties || {}));
      for (const key of Object.keys(val)) {
        if (!allowed.has(key)) {
          errors.push(`${jsonPath || 'root'}: unexpected property '${key}' (additionalProperties: false)`);
        }
      }
    } else if (typeof schema.additionalProperties === 'object' && schema.additionalProperties !== null) {
      const allowed = new Set(Object.keys(schema.properties || {}));
      for (const [key, propVal] of Object.entries(val)) {
        if (!allowed.has(key)) {
          errors.push(...validateValue(propVal, schema.additionalProperties, jsonPath ? `${jsonPath}.${key}` : key));
        }
      }
    }
  }

  // 6. oneOf constraints
  if (schema.oneOf) {
    let matchCount = 0;
    const subErrors = [];
    for (let i = 0; i < schema.oneOf.length; i++) {
      const errs = validateValue(val, schema.oneOf[i], jsonPath);
      if (errs.length === 0) {
        matchCount++;
      } else {
        subErrors.push(`option ${i}: ${errs.join('; ')}`);
      }
    }
    if (matchCount !== 1) {
      errors.push(`${jsonPath || 'root'}: must match exactly one of the schemas in oneOf (matched ${matchCount}): ${subErrors.join(' | ')}`);
    }
  }

  return errors;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/validate-schema.js <manifest.json> <schema.json>');
    process.exit(2);
  }

  const [manifestPath, schemaPath] = args;
  let manifest, schema;

  try {
    manifest = JSON.parse(fs.readFileSync(path.resolve(manifestPath), 'utf8'));
  } catch (err) {
    console.error(`Failed to parse manifest at ${manifestPath}: ${err.message}`);
    process.exit(1);
  }

  try {
    schema = JSON.parse(fs.readFileSync(path.resolve(schemaPath), 'utf8'));
  } catch (err) {
    console.error(`Failed to parse schema at ${schemaPath}: ${err.message}`);
    process.exit(1);
  }

  const errors = validateValue(manifest, schema);
  if (errors.length > 0) {
    for (const e of errors) {
      console.error(e);
    }
    process.exit(1);
  }

  console.log('VALID');
  process.exit(0);
}

module.exports = { validateValue };
