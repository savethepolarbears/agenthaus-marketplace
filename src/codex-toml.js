'use strict';

/**
 * Render Claude-format MCP server definitions as Codex CLI `[mcp_servers.<name>]` TOML.
 *
 * Codex does not interpolate `${VAR}` in any field, so:
 * - env entries that forward a variable become `env_vars` (Codex passes them through by name);
 * - args that embed variables are wrapped in a POSIX `sh -c` so the shell expands them;
 * - HTTP servers use `bearer_token_env_var` / `env_http_headers` for secrets;
 * - servers whose URL embeds a variable cannot be expressed and are reported as unsupported.
 */

const PLUGIN_ROOT_VAR = 'CLAUDE_PLUGIN_ROOT';
const WHOLE_VAR = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\}$/;
const ANY_VAR = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g;
const BEARER_VAR = /^Bearer \$\{([A-Za-z_][A-Za-z0-9_]*)\}$/;

function tomlString(value) {
  // JSON string escapes (\" \\ \n \t \uXXXX) are all valid TOML basic-string escapes.
  return JSON.stringify(String(value));
}

function tomlKey(key) {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : tomlString(key);
}

function tomlInlineTable(obj) {
  return `{ ${Object.entries(obj).map(([k, v]) => `${tomlKey(k)} = ${tomlString(v)}`).join(', ')} }`;
}

function substitutePluginRoot(value, pluginRoot) {
  if (!pluginRoot || typeof value !== 'string') return value;
  return value.split(`\${${PLUGIN_ROOT_VAR}}`).join(pluginRoot);
}

function referencedVars(value, { includePluginRoot = false } = {}) {
  return [...String(value).matchAll(ANY_VAR)].map(m => m[1]).filter(v => includePluginRoot || v !== PLUGIN_ROOT_VAR);
}

// Quote one argv word for sh: literal text single-quoted, ${VAR} expanded as "$VAR".
function shellWord(value) {
  let out = '';
  let last = 0;
  for (const m of String(value).matchAll(ANY_VAR)) {
    const literal = value.slice(last, m.index);
    if (literal) out += `'${literal.replace(/'/g, `'\\''`)}'`;
    out += `"$${m[1]}"`;
    last = m.index + m[0].length;
  }
  const rest = value.slice(last);
  if (rest || out === '') out += `'${rest.replace(/'/g, `'\\''`)}'`;
  return out;
}

/**
 * @returns {{ key: string, lines: string[], notes: string[], supported: boolean }}
 */
function renderCodexServer(key, server, { pluginRoot = null } = {}) {
  const header = `[mcp_servers.${tomlKey(key)}]`;
  const notes = [];
  const lines = [header];

  if (server.command) {
    const command = substitutePluginRoot(server.command, pluginRoot);
    const args = (server.args || []).map(a => substitutePluginRoot(a, pluginRoot));
    const envVars = [];
    const staticEnv = {};

    for (const [envKey, envValue] of Object.entries(server.env || {})) {
      const whole = WHOLE_VAR.exec(envValue);
      if (whole) {
        envVars.push(envKey);
        if (whole[1] !== envKey) notes.push(`export ${envKey}="$${whole[1]}" before starting Codex`);
      } else if (referencedVars(envValue, { includePluginRoot: true }).length > 0) {
        const resolved = substitutePluginRoot(envValue, pluginRoot);
        if (referencedVars(resolved).length > 0) {
          envVars.push(envKey);
          notes.push(`export ${envKey} (Codex cannot compose '${envValue}')`);
        } else {
          staticEnv[envKey] = resolved;
        }
      } else {
        staticEnv[envKey] = envValue;
      }
    }

    const argVars = [...new Set([command, ...args].flatMap(a => referencedVars(a)))];
    if (argVars.length > 0) {
      lines.push(`command = "sh"`);
      lines.push(`args = [${['-c', `exec ${[command, ...args].map(shellWord).join(' ')}`].map(tomlString).join(', ')}]`);
      for (const v of argVars) if (!envVars.includes(v)) envVars.push(v);
      notes.push('POSIX sh wrapper expands variables in args');
    } else {
      lines.push(`command = ${tomlString(command)}`);
      if (args.length > 0) lines.push(`args = [${args.map(tomlString).join(', ')}]`);
    }
    if (server.cwd) lines.push(`cwd = ${tomlString(substitutePluginRoot(server.cwd, pluginRoot))}`);
    if (!pluginRoot && [command, ...args].some(a => String(a).includes(`\${${PLUGIN_ROOT_VAR}}`))) {
      notes.push(`replace \${${PLUGIN_ROOT_VAR}} with the plugin's install path`);
    }
    if (envVars.length > 0) lines.push(`env_vars = [${envVars.map(tomlString).join(', ')}]`);
    if (Object.keys(staticEnv).length > 0) {
      lines.push('', `[mcp_servers.${tomlKey(key)}.env]`);
      for (const [k, v] of Object.entries(staticEnv)) lines.push(`${tomlKey(k)} = ${tomlString(v)}`);
    }
    return { key, lines, notes, supported: true };
  }

  if (server.url) {
    if (referencedVars(server.url).length > 0) {
      return {
        key,
        lines: [],
        notes: [`'${key}' embeds a variable in its URL, which Codex cannot expand; add it to config.toml manually`],
        supported: false
      };
    }
    lines.push(`url = ${tomlString(server.url)}`);
    const staticHeaders = {};
    const envHeaders = {};
    for (const [name, value] of Object.entries(server.headers || {})) {
      const bearer = BEARER_VAR.exec(value);
      const whole = WHOLE_VAR.exec(value);
      if (name.toLowerCase() === 'authorization' && bearer) {
        lines.push(`bearer_token_env_var = ${tomlString(bearer[1])}`);
      } else if (whole) {
        envHeaders[name] = whole[1];
      } else if (referencedVars(value).length > 0) {
        return {
          key,
          lines: [],
          notes: [`'${key}' header '${name}' composes variables, which Codex cannot expand; add it manually`],
          supported: false
        };
      } else {
        staticHeaders[name] = value;
      }
    }
    if (Object.keys(staticHeaders).length > 0) lines.push(`http_headers = ${tomlInlineTable(staticHeaders)}`);
    if (Object.keys(envHeaders).length > 0) lines.push(`env_http_headers = ${tomlInlineTable(envHeaders)}`);
    return { key, lines, notes, supported: true };
  }

  return { key, lines: [], notes: [`'${key}' has neither command nor url`], supported: false };
}

function renderServerBlock(rendered) {
  const comments = rendered.notes.map(n => `# NOTE: ${n}`);
  return [...comments, ...rendered.lines].join('\n');
}

/** Documentation snippet shipped next to each plugin (codex-mcp-config.toml). */
function renderCodexSnippet(servers) {
  const blocks = Object.entries(servers).map(([key, server]) => {
    const rendered = renderCodexServer(key, server);
    if (!rendered.supported) return rendered.notes.map(n => `# UNSUPPORTED: ${n}`).join('\n');
    return renderServerBlock(rendered);
  });
  return `# Add to ~/.codex/config.toml (or .codex/config.toml in a trusted project),\n` +
         `# or run: agenthaus install --target codex --plugin <name>\n\n` +
         blocks.join('\n\n') + '\n';
}

/**
 * Lightweight TOML syntax check (the CLI stays zero-dependency): strings, comments,
 * bracket balance in values, table headers, and `key = value` statements.
 * Returns an error message, or null when no syntax problem was found.
 */
function findTomlSyntaxError(text) {
  const KEY = '(?:[A-Za-z0-9_-]+|S)';
  const keyPath = `${KEY}(?:\\s*\\.\\s*${KEY})*`;
  const tableRe = new RegExp(`^\\[\\s*${keyPath}\\s*\\]$`);
  const arrayTableRe = new RegExp(`^\\[\\[\\s*${keyPath}\\s*\\]\\]$`);
  const keyValueRe = new RegExp(`^${keyPath}\\s*=\\s*\\S`);

  let stmt = '';
  let stmtLine = 1;
  let line = 1;
  let depth = 0;
  let afterEquals = false;

  const flush = () => {
    const s = stmt.trim();
    stmt = '';
    afterEquals = false;
    if (!s) return null;
    if (s.startsWith('[[')) return arrayTableRe.test(s) ? null : `line ${stmtLine}: malformed array-of-tables header`;
    if (s.startsWith('[')) return tableRe.test(s) ? null : `line ${stmtLine}: malformed table header`;
    return keyValueRe.test(s) ? null : `line ${stmtLine}: expected 'key = value'`;
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '#') {
      while (i + 1 < text.length && text[i + 1] !== '\n') i++;
      continue;
    }
    if (c === '"' || c === "'") {
      const triple = text.startsWith(c.repeat(3), i);
      const delim = triple ? c.repeat(3) : c;
      let j = i + delim.length;
      for (;;) {
        if (j >= text.length || (!triple && text[j] === '\n')) return `line ${line}: unterminated string`;
        if (c === '"' && text[j] === '\\') { j += 2; continue; }
        if (text.startsWith(delim, j)) break;
        if (text[j] === '\n') line++;
        j++;
      }
      i = j + delim.length - 1;
      stmt += 'S';
      continue;
    }
    if (c === '\n') {
      line++;
      if (depth === 0) {
        const err = flush();
        if (err) return err;
        stmtLine = line;
      } else {
        stmt += ' ';
      }
      continue;
    }
    if (afterEquals) {
      if (c === '[' || c === '{') depth++;
      else if (c === ']' || c === '}') {
        depth--;
        if (depth < 0) return `line ${line}: unbalanced '${c}'`;
      }
    } else if (c === '=') {
      afterEquals = true;
    }
    stmt += c;
  }
  if (depth !== 0) return `line ${stmtLine}: unclosed array or inline table`;
  return flush();
}

module.exports = { renderCodexServer, renderServerBlock, renderCodexSnippet, findTomlSyntaxError };
