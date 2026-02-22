#!/usr/bin/env node
/**
 * Mission Control Server
 * Lightweight local server for Mission Control dashboard
 * Port: 8899
 */

import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8899;
const DATA_FILE = path.join(__dirname, 'mc-data.json');
const ACTIVITY_FILE = path.join(__dirname, 'mc-activity.json');

// Default data structure
const defaultData = {
  orders: 10,
  ordersTarget: 20,
  goalDate: '2026-05-01',
  revenueGoal: 5000,
  clients: [],
  agents: [],
  decisions: [],
  intel: [],
  priorities: [],
  projects: { backlog: [], inprogress: [], done: [] },
  lastUpdated: new Date().toISOString()
};

// Ensure data files exist
async function initDataFiles() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
  }
  
  try {
    await fs.access(ACTIVITY_FILE);
  } catch {
    await fs.writeFile(ACTIVITY_FILE, JSON.stringify([], null, 2));
  }
}

// CORS headers
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Fetch weather from wttr.in
async function getWeather(city = 'Kent') {
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    const data = await response.json();
    const current = data.current_condition[0];
    return {
      temperature: current.temp_F,
      condition: current.weatherDesc[0].value,
      feels_like: current.FeelsLikeF,
      humidity: current.humidity,
      city: city
    };
  } catch (error) {
    return { error: 'Weather fetch failed', message: error.message };
  }
}

// Request handler
async function handleRequest(req, res) {
  setCORS(res);
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  
  console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);
  
  try {
    // Serve Mission Control HTML at root
    if (pathname === '/' || pathname === '/index.html') {
      const htmlPath = path.join(__dirname, 'mission-control.html');
      const html = await fs.readFile(htmlPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }
    
    // GET /mc/status - System status
    if (pathname === '/mc/status' && req.method === 'GET') {
      const status = {
        status: 'online',
        uptime: process.uptime(),
        lastRefresh: new Date().toISOString(),
        version: '1.0.0',
        port: PORT
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(status));
      return;
    }
    
    // GET /mc/data - Read dashboard data
    if (pathname === '/mc/data' && req.method === 'GET') {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
      return;
    }
    
    // POST /mc/data - Save dashboard data
    if (pathname === '/mc/data' && req.method === 'POST') {
      const body = await parseBody(req);
      body.lastUpdated = new Date().toISOString();
      await fs.writeFile(DATA_FILE, JSON.stringify(body, null, 2));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Data saved' }));
      return;
    }
    
    // GET /mc/weather - Fetch weather
    if (pathname === '/mc/weather' && req.method === 'GET') {
      const city = url.searchParams.get('city') || 'Kent';
      const weather = await getWeather(city);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(weather));
      return;
    }
    
    // GET /mc/activity - Read activity log
    if (pathname === '/mc/activity' && req.method === 'GET') {
      const data = await fs.readFile(ACTIVITY_FILE, 'utf-8');
      const activities = JSON.parse(data);
      // Return last 50
      const last50 = activities.slice(-50).reverse();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(last50));
      return;
    }
    
    // POST /mc/activity - Add activity entry
    if (pathname === '/mc/activity' && req.method === 'POST') {
      const body = await parseBody(req);
      const data = await fs.readFile(ACTIVITY_FILE, 'utf-8');
      const activities = JSON.parse(data);
      
      const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        icon: body.icon || '📌',
        text: body.text || 'Activity logged',
        source: body.source || 'manual'
      };
      
      activities.push(entry);
      await fs.writeFile(ACTIVITY_FILE, JSON.stringify(activities, null, 2));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, entry }));
      return;
    }
    
    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', path: pathname }));
    
  } catch (error) {
    console.error('Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Server error', message: error.message }));
  }
}

// Start server
async function start() {
  await initDataFiles();
  
  const server = http.createServer(handleRequest);
  
  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    MISSION CONTROL SERVER                    ║
╠══════════════════════════════════════════════════════════════╣
║  Status:    🟢 ONLINE                                        ║
║  Port:      ${PORT}                                              ║
║  URL:       http://localhost:${PORT}                            ║
╠══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                  ║
║    GET  /                    → Mission Control Dashboard     ║
║    GET  /mc/status           → System status                 ║
║    GET  /mc/data             → Dashboard data                ║
║    POST /mc/data             → Save dashboard data           ║
║    GET  /mc/weather?city=... → Weather (wttr.in)             ║
║    GET  /mc/activity         → Activity log (last 50)        ║
║    POST /mc/activity         → Add activity                  ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down Mission Control Server...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

start();
