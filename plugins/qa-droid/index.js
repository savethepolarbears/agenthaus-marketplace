#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { chromium } from 'playwright';

// Create an MCP server with one custom tool: visit_and_report.  When
// called, this tool navigates to a URL in a headless browser and
// returns the page title.  It could easily be extended to capture
// screenshots or assert page state.
const server = new Server({ name: 'qa-droid', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'visit_and_report',
      description: 'Visit a URL and report the page title',
      inputSchema: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] }
    }
  ]
}));

server.setRequestHandler('tools/call', async (req) => {
  if (req.params.name === 'visit_and_report') {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(req.params.arguments.url);
    const title = await page.title();
    await browser.close();
    return { content: [ { type: 'text', text: `Visited page with title: ${title}` } ] };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);