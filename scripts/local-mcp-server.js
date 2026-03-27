#!/usr/bin/env node
// Minimal local MCP server stub for OpenCode compatibility tests.
// You can run this alongside OpenCode to provide a fake MCP API.
const http = require('http');
const port = process.env.LOCAL_MCP_PORT ? Number(process.env.LOCAL_MCP_PORT) : 8123;

const server = http.createServer((req, res) => {
  const now = new Date().toISOString();
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, time: now, path: req.url }));
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Local MCP server listening on port ${port}`);
});
