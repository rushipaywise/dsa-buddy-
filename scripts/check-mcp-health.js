#!/usr/bin/env node
// Simple health check for MCP Stitch integration.
// Reads the MCP_STITCH_API_KEY from environment and pings the Stitch endpoint.
async function main() {
  const key = process.env.MCP_STITCH_API_KEY;
  if (!key) {
    console.error('MCP_STITCH_API_KEY is not set in the environment. Aborting health check.');
    process.exit(2);
  }

  const url = 'https://stitch.googleapis.com/mcp';
  try {
    let resp = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': key,
      },
    });
    if (resp.status === 405) {
      // Try a POST if GET is not allowed for health check
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Goog-Api-Key': key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: true }),
      });
    }
    const ok = resp.ok;
    console.log(`Stitch MCP health check: ${resp.status} ${resp.statusText} (OK=${ok})`);
    const text = await resp.text();
    if (text) {
      console.log(`Response body (trimmed): ${text.slice(0, 500)}`);
    }
    process.exit(ok ? 0 : 1);
  } catch (err) {
    console.error('Health check failed:', err?.message || err);
    process.exit(1);
  }
}

// Run as an async IIFE to support top-level await in Node >=18
(async () => {
  // If global fetch is not available, try to require node-fetch (older environments)
  if (typeof fetch === 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const f = await import('node-fetch');
      globalThis.fetch = f.default;
    } catch {
      console.error('Fetch API is not available. Run with Node 18+ or install node-fetch.');
      process.exit(3);
    }
  }
  await main();
})();
