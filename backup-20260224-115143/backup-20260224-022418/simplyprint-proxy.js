#!/usr/bin/env node
/**
 * SimplyPrint Proxy Server for Mission Control
 * 
 * This server runs locally and proxies requests to SimplyPrint API,
 * avoiding CORS issues since the browser talks to localhost.
 * 
 * Setup:
 * 1. Save your SimplyPrint API key to .env file:
 *    SIMPLYPRINT_API_KEY=your_api_key_here
 * 
 * 2. Run: node simplyprint-proxy.js
 * 
 * 3. Mission Control will auto-detect this server at http://localhost:8899
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 8899;
const COMPANY_ID = '40432';

// Load API key from .env file
let API_KEY = '';
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/SIMPLYPRINT_API_KEY=(.+)/);
    if (match) API_KEY = match[1].trim();
  }
} catch (e) {
  console.log('No .env file found');
}

// CORS headers
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Fetch printers from SimplyPrint API
async function fetchPrinters() {
  return new Promise((resolve, reject) => {
    if (!API_KEY) {
      reject(new Error('SIMPLYPRINT_API_KEY not configured. Create .env file with: SIMPLYPRINT_API_KEY=your_key'));
      return;
    }

    const postData = JSON.stringify({ page: 1, page_size: 10 });
    
    const options = {
      hostname: 'api.simplyprint.io',
      path: `/${COMPANY_ID}/printers/Get`,
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.status) {
            resolve(result.data || []);
          } else {
            reject(new Error(result.message || 'API error'));
          }
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Transform SimplyPrint data to Mission Control format
function transformPrinters(printers) {
  return printers.map(printer => {
    const p = printer.printer || {};
    const job = printer.job;
    const filament = printer.filament;
    
    // Get filament info
    const filaments = [];
    if (filament) {
      Object.values(filament).forEach(f => {
        filaments.push({
          colorName: f.colorName || 'Unknown',
          type: f.type?.name || 'PLA',
          leftPercent: f.leftPercent
        });
      });
    }
    
    return {
      name: p.name || `Printer ${printer.id}`,
      state: p.state || 'unknown',
      temps: {
        nozzle: p.temps?.current?.tool?.[0] || p.temps?.current?.tool0,
        bed: p.temps?.current?.bed
      },
      job: job ? {
        file: job.file || job.filename || 'Unknown',
        percentage: job.percentage || 0,
        timeLeft: formatDuration(job.timeLeft || job.printTimeLeft)
      } : null,
      filaments: filaments
    };
  });
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Create server
const server = http.createServer(async (req, res) => {
  setCORS(res);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  try {
    // Printer status endpoint
    if (req.url === '/mc/printers' && req.method === 'GET') {
      const printers = await fetchPrinters();
      const transformed = transformPrinters(printers);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(transformed));
      return;
    }
    
    // Health check
    if (req.url === '/mc/status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'online',
        simplyprint: API_KEY ? 'configured' : 'not_configured',
        timestamp: new Date().toISOString()
      }));
      return;
    }
    
    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    
  } catch (error) {
    console.error('Error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║            SIMPLYPRINT PROXY SERVER                          ║
╠══════════════════════════════════════════════════════════════╣
║  Status:    ${API_KEY ? '🟢 API KEY CONFIGURED' : '🟡 API KEY MISSING'}                    ║
║  Port:      ${PORT}                                              ║
║  URL:       http://localhost:${PORT}                            ║
╠══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                  ║
║    GET /mc/status    → Server status                         ║
║    GET /mc/printers  → Printer data from SimplyPrint         ║
╠══════════════════════════════════════════════════════════════╣
║  Setup:                                                      ║
║  1. Create .env file with:                                   ║
║     SIMPLYPRINT_API_KEY=your_api_key_here                    ║
║  2. Restart this server                                      ║
║  3. Open Mission Control and click "Update" in Inventory     ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  if (!API_KEY) {
    console.log('\n⚠️  WARNING: SIMPLYPRINT_API_KEY not set!');
    console.log('   Create a .env file in this folder with:');
    console.log('   SIMPLYPRINT_API_KEY=your_api_key_here\n');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down SimplyPrint Proxy Server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
