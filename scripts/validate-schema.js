#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const net = require('net');

/**
 * Component-aware RFC 3986 URI syntax validation.
 * URI = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
 * Strictly validates authority, IP-literal (IPv6/IPvFuture), reg-name, and path grammar.
 */
function isValidRfc3986Uri(val) {
  if (typeof val !== 'string' || val.length === 0) return false;
  // RFC 3986 strictly prohibits whitespace anywhere in a URI
  if (/\s/.test(val)) return false;

  // Verify all percent encodings in the entire string are strictly %HEXDIG HEXDIG
  if (/%(?![0-9a-fA-F]{2})/.test(val)) return false;

  // Split scheme
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/.exec(val);
  if (!schemeMatch) return false;
  let rest = schemeMatch[2];

  // Split fragment
  const hashIdx = rest.indexOf('#');
  if (hashIdx !== -1) {
    const fragment = rest.slice(hashIdx + 1);
    rest = rest.slice(0, hashIdx);
    // Fragment: *( pchar / "/" / "?" ) - cannot contain [ or ]
    if (!/^(?:[a-zA-Z0-9-._~:!$&'()*+,;=@/?]|%[0-9a-fA-F]{2})*$/.test(fragment)) {
      return false;
    }
  }

  // Split query
  const qIdx = rest.indexOf('?');
  if (qIdx !== -1) {
    const query = rest.slice(qIdx + 1);
    rest = rest.slice(0, qIdx);
    // Query: *( pchar / "/" / "?" ) - cannot contain [ or ]
    if (!/^(?:[a-zA-Z0-9-._~:!$&'()*+,;=@/?]|%[0-9a-fA-F]{2})*$/.test(query)) {
      return false;
    }
  }

  // hier-part validation
  if (rest.startsWith('//')) {
    // Authority form: //authority[path]
    const afterSlashes = rest.slice(2);
    const slashIdx = afterSlashes.indexOf('/');
    const authority = slashIdx !== -1 ? afterSlashes.slice(0, slashIdx) : afterSlashes;
    const pathPart = slashIdx !== -1 ? afterSlashes.slice(slashIdx) : '';

    // Authority: [ userinfo "@" ] host [ ":" port ]
    let hostAndPort = authority;
    const atIdx = authority.indexOf('@');
    if (atIdx !== -1) {
      const userinfo = authority.slice(0, atIdx);
      hostAndPort = authority.slice(atIdx + 1);
      // userinfo = *( unreserved / pct-encoded / sub-delims / ":" )
      if (!/^(?:[a-zA-Z0-9-._~:!$&'()*+,;=]|%[0-9a-fA-F]{2})*$/.test(userinfo)) {
        return false;
      }
    }

    // Host and Port
    if (hostAndPort.startsWith('[')) {
      // IP-literal: "[" ( IPv6address / IPvFuture ) "]"
      const closeBracket = hostAndPort.indexOf(']');
      if (closeBracket === -1) return false;
      const ip = hostAndPort.slice(1, closeBracket);
      const afterBracket = hostAndPort.slice(closeBracket + 1);
      if (afterBracket.length > 0) {
        if (!/^:[0-9]*$/.test(afterBracket)) return false;
      }
      // Validate IP-literal: IPv6address or IPvFuture
      // RFC 3986 Section 3.2.2 does not support scoped IPv6 addresses / zone identifiers (%scope).
      // Node's net.isIPv6() permits scoped addresses; reject them before delegating.
      if (ip.includes('%')) return false;
      const isIpv6 = net.isIPv6(ip);
      const isIpvFuture = /^[vV][0-9a-fA-F]+\.[a-zA-Z0-9-._~:!$&'()*+,;=]+$/.test(ip);
      if (!isIpv6 && !isIpvFuture) return false;
    } else {
      // reg-name or IPv4address [ ":" port ]
      let host, port;
      const colonIdx = hostAndPort.lastIndexOf(':');
      if (colonIdx !== -1) {
        host = hostAndPort.slice(0, colonIdx);
        port = hostAndPort.slice(colonIdx + 1);
        if (!/^[0-9]*$/.test(port)) return false;
      } else {
        host = hostAndPort;
      }
      // reg-name: *( unreserved / pct-encoded / sub-delims )
      // Square brackets [ or ] are strictly forbidden in reg-name or IPv4
      if (!/^(?:[a-zA-Z0-9-._~!$&'()*+,;=]|%[0-9a-fA-F]{2})*$/.test(host)) {
        return false;
      }
    }

    // Path abempty: *( "/" segment )
    if (pathPart.length > 0) {
      // segment: *pchar (NO [ or ])
      if (!/^(?:\/(?:[a-zA-Z0-9-._~:!$&'()*+,;=@]|%[0-9a-fA-F]{2})*)*$/.test(pathPart)) {
        return false;
      }
    }
  } else {
    // Non-authority path: path-absolute, path-rootless, or path-empty
    // RFC 3986:
    // path-absolute = "/" [ segment-nz *( "/" segment ) ]
    // path-rootless = segment-nz *( "/" segment )
    // path-empty    = 0<pchar>
    // segment       = *pchar
    // segment-nz    = 1*pchar
    if (rest.length > 0) {
      if (rest === '/') {
        // Single slash is valid path-absolute
      } else {
        const segmentsStr = rest.startsWith('/') ? rest.slice(1) : rest;
        const segments = segmentsStr.split('/');
        // First segment must be segment-nz
        if (segments[0].length === 0) return false;
        const pcharRe = /^(?:[a-zA-Z0-9-._~:!$&'()*+,;=@]|%[0-9a-fA-F]{2})*$/;
        for (const seg of segments) {
          if (!pcharRe.test(seg)) return false;
        }
      }
    }
  }

  return true;
}

/**
 * RFC 5322 Section 3.2.4 & Section 4.1 quoted-string content parser.
 * Scans *([FWS] qcontent) [FWS] linearly in O(N) time with zero backtracking.
 */
function isValidQuotedStringContent(str) {
  let idx = 0;
  while (idx < str.length) {
    if (str[idx] === ' ' || str[idx] === '\t') {
      idx++;
      continue;
    }
    if (str.slice(idx, idx + 2) === '\r\n') {
      if (idx + 2 < str.length && (str[idx + 2] === ' ' || str[idx + 2] === '\t')) {
        idx += 3;
        while (idx < str.length && (str[idx] === ' ' || str[idx] === '\t')) idx++;
        continue;
      }
      return false;
    }
    if (str[idx] === '\\') {
      if (idx + 1 >= str.length) return false;
      const escCode = str.charCodeAt(idx + 1);
      if (escCode >= 0 && escCode <= 127) {
        idx += 2;
        continue;
      }
      return false;
    }
    const c = str.charCodeAt(idx);
    // RFC 5322 Section 3.2.4 & Section 4.1:
    // qtext: %d33 / %d35-91 / %d93-126
    // obs-qtext (obs-NO-WS-CTL): %d1-8 / %d11 / %d12 / %d14-31 / %d127
    if (
      c === 33 ||
      (c >= 35 && c <= 91) ||
      (c >= 93 && c <= 126) ||
      (c >= 1 && c <= 8) ||
      c === 11 ||
      c === 12 ||
      (c >= 14 && c <= 31) ||
      c === 127
    ) {
      idx++;
      continue;
    }
    return false;
  }
  return true;
}

/**
 * RFC 5322 Section 3.4.1 & Section 4.4 domain-literal content parser.
 * Scans *([FWS] dtext) [FWS] linearly in O(N) time with zero backtracking.
 */
function isValidDomainLiteral(str) {
  let idx = 0;
  while (idx < str.length) {
    if (str[idx] === ' ' || str[idx] === '\t') {
      idx++;
      continue;
    }
    if (str.slice(idx, idx + 2) === '\r\n') {
      if (idx + 2 < str.length && (str[idx + 2] === ' ' || str[idx + 2] === '\t')) {
        idx += 3;
        while (idx < str.length && (str[idx] === ' ' || str[idx] === '\t')) idx++;
        continue;
      }
      return false;
    }
    if (str[idx] === '\\') {
      if (idx + 1 >= str.length) return false;
      const escCode = str.charCodeAt(idx + 1);
      if (escCode >= 0 && escCode <= 127) {
        idx += 2;
        continue;
      }
      return false;
    }
    const c = str.charCodeAt(idx);
    // RFC 5322 Section 3.4.1 & Section 4.4:
    // dtext: %d33-90 / %d94-126
    // obs-dtext (obs-NO-WS-CTL): %d1-8 / %d11 / %d12 / %d14-31 / %d127
    if (
      (c >= 33 && c <= 90) ||
      (c >= 94 && c <= 126) ||
      (c >= 1 && c <= 8) ||
      c === 11 ||
      c === 12 ||
      (c >= 14 && c <= 31) ||
      c === 127
    ) {
      idx++;
      continue;
    }
    return false;
  }
  return true;
}

/**
 * Consumes optional RFC 5322 CFWS (comments and folding white space) starting at idx.
 * Returns the index of the first character following CFWS, or -1 if an unclosed comment is encountered.
 */
function consumeCFWS(str, idx) {
  while (idx < str.length) {
    if (str[idx] === ' ' || str[idx] === '\t') {
      idx++;
      continue;
    }
    if (str.slice(idx, idx + 2) === '\r\n' && idx + 2 < str.length && (str[idx + 2] === ' ' || str[idx + 2] === '\t')) {
      idx += 3;
      continue;
    }
    if (str[idx] === '(') {
      let depth = 1;
      let j = idx + 1;
      while (j < str.length && depth > 0) {
        if (str[j] === ' ' || str[j] === '\t') {
          j++;
          continue;
        }
        if (str.slice(j, j + 2) === '\r\n' && j + 2 < str.length && (str[j + 2] === ' ' || str[j + 2] === '\t')) {
          j += 3;
          continue;
        }
        if (str[j] === '\\') {
          if (j + 1 >= str.length) return -1;
          const escCode = str.charCodeAt(j + 1);
          if (escCode >= 0 && escCode <= 127) {
            j += 2;
            continue;
          }
          return -1;
        }
        if (str[j] === '(') {
          depth++;
          j++;
          continue;
        }
        if (str[j] === ')') {
          depth--;
          j++;
          continue;
        }
        const c = str.charCodeAt(j);
        // RFC 5322 ctext: %d33-39 / %d42-91 / %d93-126 / obs-ctext (obs-NO-WS-CTL)
        if (
          (c >= 33 && c <= 39) ||
          (c >= 42 && c <= 91) ||
          (c >= 93 && c <= 126) ||
          (c >= 1 && c <= 8) ||
          c === 11 ||
          c === 12 ||
          (c >= 14 && c <= 31) ||
          c === 127
        ) {
          j++;
          continue;
        }
        return -1;
      }
      if (depth !== 0) return -1;
      idx = j;
      continue;
    }
    break;
  }
  return idx;
}

/**
 * Consumes an RFC 5322 atom = [CFWS] 1*atext [CFWS] starting at idx.
 * Returns the index following the atom and optional trailing CFWS, or -1 on invalid syntax.
 */
function consumeAtom(str, idx) {
  idx = consumeCFWS(str, idx);
  if (idx === -1 || idx >= str.length) return -1;

  const atextMatch = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+/.exec(str.slice(idx));
  if (!atextMatch) return -1;

  return consumeCFWS(str, idx + atextMatch[0].length);
}

/**
 * Consumes an RFC 5322 word = atom / quoted-string starting at idx.
 * Returns the index following the word and optional trailing CFWS, or -1 on invalid syntax.
 */
function consumeWord(str, idx) {
  idx = consumeCFWS(str, idx);
  if (idx === -1 || idx >= str.length) return -1;

  if (str[idx] === '"') {
    // Quoted-string: RFC 5322 Section 3.2.4
    // quoted-string = [CFWS] DQUOTE *([FWS] qcontent) [FWS] DQUOTE [CFWS]
    let i = idx + 1;
    let closed = false;
    while (i < str.length) {
      const ch = str[i];
      if (ch === '\\') {
        i += 2;
      } else if (ch === '"') {
        closed = true;
        break;
      } else {
        i++;
      }
    }
    if (!closed) return -1;

    const qContent = str.slice(idx + 1, i);
    if (!isValidQuotedStringContent(qContent)) return -1;

    return consumeCFWS(str, i + 1);
  }

  return consumeAtom(str, idx);
}

/**
 * Standards-compliant RFC 5321/5322 and JSON Schema Draft-07 email address validation.
 * Accepts:
 * - dot-atom / quoted-string / obs-local-part (e.g. user@example.com, "John Doe"@example.com, user."tag"@example.com)
 * - dot-atom / domain-literal / obs-domain (e.g. user@localhost, user@[127.0.0.1], user@[foo bar], user@example.com)
 */
function isValidEmail(val) {
  if (typeof val !== 'string' || val.length === 0) return false;

  // Local-part: RFC 5322 Section 3.4.1 & Section 4.4
  // local-part = dot-atom / quoted-string / obs-local-part
  // obs-local-part = word *("." word)
  // word = atom / quoted-string
  let idx = consumeWord(val, 0);
  if (idx === -1) return false;

  while (idx < val.length && val[idx] === '.') {
    idx = consumeWord(val, idx + 1);
    if (idx === -1) return false;
  }

  if (idx >= val.length || val[idx] !== '@') return false;

  // Domain validation: RFC 5322 Section 3.4.1 & Section 4.4
  // domain = dot-atom / domain-literal / obs-domain
  idx = consumeCFWS(val, idx + 1);
  if (idx === -1 || idx >= val.length) return false;

  const domain = val.slice(idx);

  if (domain.startsWith('[')) {
    // Domain-literal: RFC 5322 Section 3.4.1 & Section 4.4
    // domain-literal = [CFWS] "[" *([FWS] dtext) [FWS] "]" [CFWS]
    // Scan for unescaped closing ']'
    let i = 1;
    let closed = false;
    while (i < domain.length) {
      if (domain[i] === '\\') {
        i += 2;
      } else if (domain[i] === ']') {
        closed = true;
        break;
      } else {
        i++;
      }
    }
    if (!closed) return false;

    const literal = domain.slice(1, i);
    if (!isValidDomainLiteral(literal)) return false;
    const afterBracket = consumeCFWS(domain, i + 1);
    return afterBracket === domain.length;
  }

  // Domain name: RFC 5322 dot-atom / obs-domain = atom *("." atom)
  let dIdx = consumeAtom(domain, 0);
  if (dIdx === -1) return false;

  while (dIdx < domain.length && domain[dIdx] === '.') {
    dIdx = consumeAtom(domain, dIdx + 1);
    if (dIdx === -1) return false;
  }

  return dIdx === domain.length;
}

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
    const codePointLength = Array.from(val).length;
    if (schema.minLength !== undefined && codePointLength < schema.minLength) {
      errors.push(`${jsonPath || 'root'}: string length ${codePointLength} is less than minLength ${schema.minLength}`);
    }
    if (schema.maxLength !== undefined && codePointLength > schema.maxLength) {
      errors.push(`${jsonPath || 'root'}: string length ${codePointLength} is greater than maxLength ${schema.maxLength}`);
    }
    if (schema.pattern) {
      const re = new RegExp(schema.pattern);
      if (!re.test(val)) {
        errors.push(`${jsonPath || 'root'}: string "${val}" does not match pattern ${schema.pattern}`);
      }
    }
    if (schema.format) {
      if (schema.format === 'email') {
        if (!isValidEmail(val)) {
          errors.push(`${jsonPath || 'root'}: "${val}" is not a valid email address`);
        }
      } else if (schema.format === 'uri') {
        if (!isValidRfc3986Uri(val)) {
          errors.push(`${jsonPath || 'root'}: "${val}" is not a valid RFC-compliant URI`);
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

module.exports = { validateValue, isValidRfc3986Uri, isValidEmail };
