import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';

test('QA-Droid serves tools over STDIO and survives invalid and failed calls', { timeout: 60000 }, async () => {
  const fixture = createServer((req, res) => {
    if (req.url === '/failure') {
      req.socket.destroy();
      return;
    }
    res.setHeader('Content-Type', 'text/html');
    res.end('<!doctype html><title>QA-Droid smoke fixture</title>');
  });
  await new Promise(resolve => fixture.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${fixture.address().port}`;
  const client = new Client({ name: 'qa-droid-smoke', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL('./index.js', import.meta.url))],
    stderr: 'pipe'
  });
  let stderr = '';
  transport.stderr.on('data', chunk => { stderr += chunk; });
  try {
    // connect performs the MCP initialize handshake against the actual entry point.
    await client.connect(transport);
    assert.equal(client.getServerVersion().name, 'qa-droid');
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map(tool => tool.name), ['visit_and_report']);
    assert.deepEqual(tools[0].inputSchema.required, ['url']);
    await assert.rejects(client.callTool({ name: 'unknown' }), { code: ErrorCode.MethodNotFound });
    for (const args of [undefined, {}, { url: 42 }, { url: 'invalid' }, { url: 'file:///tmp/example' }]) {
      await assert.rejects(client.callTool({ name: 'visit_and_report', arguments: args }), {
        code: ErrorCode.InvalidParams
      });
    }
    const failed = await client.callTool({ name: 'visit_and_report', arguments: { url: `${url}/failure` } });
    assert.equal(failed.isError, true);
    assert.match(failed.content[0].text, /Could not visit page/);
    const result = await client.callTool({ name: 'visit_and_report', arguments: { url } });
    assert.notEqual(result.isError, true);
    assert.deepEqual(result.content, [{ type: 'text', text: 'Visited page with title: QA-Droid smoke fixture' }]);
    assert.equal(stderr, '', `Unexpected server diagnostics: ${stderr}`);
  } finally {
    await client.close();
    fixture.closeAllConnections();
    await new Promise(resolve => fixture.close(resolve));
  }
});
