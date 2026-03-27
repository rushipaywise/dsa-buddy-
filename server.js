import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware to parse JSON bodies
app.use(express.json());

// MCP Stitch endpoint and API key from environment
const STITCH_ENDPOINT = 'https://stitch.googleapis.com/mcp';
const STITCH_API_KEY = process.env.MCP_STITCH_API_KEY || '';

app.post('/mcp', async (req, res) => {
  try {
    const response = await fetch(STITCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': STITCH_API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('MCP proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

app.get('/mcp/health', async (req, res) => {
  if (!STITCH_API_KEY) {
    return res.status(400).json({ error: 'MCP_STITCH_API_KEY not set' });
  }
  try {
    const response = await fetch(STITCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': STITCH_API_KEY,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 'health-check',
      }),
    });
    const data = await response.json();
    res.json({ ok: true, data });
  } catch (err) {
    res.status(500).json({ error: 'Health check failed', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`MCP proxy server running on http://localhost:${PORT}`);
  console.log(`Forwarding to ${STITCH_ENDPOINT} with API key: ${STITCH_API_KEY ? 'set' : 'missing'}`);
});

export default app;