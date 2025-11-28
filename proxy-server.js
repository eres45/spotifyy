const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3002;

// List of verified public Invidious instances from official list (tested 2024)
// Source: https://api.invidious.io/instances.json
const INVIDIOUS_INSTANCES = [
  'https://inv.perditum.com',
];

let currentInstanceIndex = 0;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    currentInstance: INVIDIOUS_INSTANCES[currentInstanceIndex],
    timestamp: new Date().toISOString()
  });
});

// Generic proxy endpoint for audio/video streams
app.get('/proxy', async (req, res) => {
  const { url } = req.query;

  console.log('[PROXY] /proxy endpoint hit');
  console.log('[PROXY] URL param length:', url ? url.length : 0);

  if (!url) {
    console.log('[PROXY] ERROR: Missing url parameter');
    return res.status(400).send('Missing url parameter');
  }

  try {
    console.log('[PROXY] Fetching audio from:', url.substring(0, 100) + '...');

    const response = await axios({
      method: 'GET',
      url: decodeURIComponent(url),
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
        'Sec-Fetch-Dest': 'audio',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Range': req.headers.range || 'bytes=0-',
      },
      validateStatus: (status) => status < 500,
    });

    console.log('[PROXY] Response status:', response.status);
    console.log('[PROXY] Content-Type:', response.headers['content-type']);

    if (response.status === 403) {
      console.error('[PROXY] 403 Forbidden - Google is blocking the request');
      return res.status(403).send('Audio source blocked by provider');
    }

    // Set CORS headers explicitly
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

    // Forward headers
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['accept-ranges']) {
      res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
    }
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
    }

    // Set response status
    res.status(response.status);

    // Pipe the stream
    response.data.pipe(res);

    console.log('[PROXY] Streaming audio...');

  } catch (error) {
    console.error(`[PROXY] Error:`, error.message);
    res.status(500).send('Proxy error: ' + error.message);
  }
});

// Proxy all Invidious API requests
app.use('/api/invidious', async (req, res) => {
  const maxRetries = INVIDIOUS_INSTANCES.length;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const instance = INVIDIOUS_INSTANCES[currentInstanceIndex];
    const targetUrl = `${instance}${req.url}`;

    try {
      console.log(`Attempt ${attempt + 1}: Proxying to ${targetUrl}`);

      const response = await axios({
        method: req.method,
        url: targetUrl,
        params: req.query,
        data: req.body,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
      });

      // Success! Return the response
      console.log(`✓ Success from ${instance}`);
      return res.status(response.status).json(response.data);

    } catch (error) {
      lastError = error;
      console.log(`✗ Failed from ${instance}: ${error.message}`);

      // Try next instance
      currentInstanceIndex = (currentInstanceIndex + 1) % INVIDIOUS_INSTANCES.length;

      // If this was the last attempt, break and return error
      if (attempt === maxRetries - 1) {
        break;
      }
    }
  }

  // All instances failed
  console.error('All Invidious instances failed');
  res.status(503).json({
    error: 'All Invidious instances are unavailable',
    message: lastError?.message || 'Unknown error',
    tried: INVIDIOUS_INSTANCES,
  });
});

// Start the server
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   🎵 Invidious CORS Proxy Server                  ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Proxying requests to: ${INVIDIOUS_INSTANCES[currentInstanceIndex]}`);
  console.log(`✓ CORS enabled for: http://localhost:3000`);
  console.log('');
  console.log('Available instances:');
  INVIDIOUS_INSTANCES.forEach((instance, index) => {
    const marker = index === currentInstanceIndex ? '→' : ' ';
    console.log(`  ${marker} ${instance}`);
  });
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('════════════════════════════════════════════════════');
});
