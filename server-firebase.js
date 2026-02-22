/**
 * Mission Control Server - Firebase Edition
 * Real-time bidirectional sync with Firebase Realtime Database
 * 
 * Setup:
 * 1. npm install
 * 2. Add your firebase-service-account.json file
 * 3. node server-firebase.js
 */

const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8899;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
    next();
});

// ==================== STEP 1: LOAD FIREBASE CREDENTIALS ====================
// You should have downloaded a file like: mission-control-sy-12345-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
// Rename it to: firebase-service-account.json and put it in this folder

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'firebase-service-account.json');
const LOCAL_BACKUP_PATH = path.join(__dirname, 'mc-data-backup.json');

let db;
let firebaseInitialized = false;

// Try to connect to Firebase
try {
  // Check if service account file exists
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ ERROR: firebase-service-account.json not found!');
    console.log('');
    console.log('📋 To fix this:');
    console.log('   1. Go to https://console.firebase.google.com/');
    console.log('   2. Click the gear icon ⚙️ → Project settings');
    console.log('   3. Click "Service accounts" tab');
    console.log('   4. Click "Generate new private key"');
    console.log('   5. Save the file to this folder as: firebase-service-account.json');
    console.log('');
    throw new Error('Firebase credentials not found');
  }

  // Load the service account
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);
  
  // Initialize Firebase
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com/`
  });
  
  db = getDatabase();
  firebaseInitialized = true;
  
  console.log('✅ Firebase connected successfully!');
  console.log(`   Project: ${serviceAccount.project_id}`);
  
} catch (err) {
  console.warn('⚠️  Firebase not connected:', err.message);
  console.log('   Running in LOCAL MODE (data will not sync to cloud)');
}

// ==================== STEP 2: DATA OPERATIONS ====================

// Default empty data structure
const defaultData = {
  orders: 10,
  ordersTarget: 20,
  goalDate: '2026-05-01',
  revenueGoal: 3000,
  priorities: [],
  projects: { backlog: [], inprogress: [], done: [] },
  timeline: [],
  agents: [],
  decisions: [],
  intel: [],
  activities: [],
  documents: [],
  lastUpdated: Date.now()
};

// Load data from Firebase (or local backup if Firebase fails)
async function loadData() {
  if (firebaseInitialized) {
    try {
      const snapshot = await db.ref('missionControl').get();
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Also save to local file as backup
        fs.writeFileSync(LOCAL_BACKUP_PATH, JSON.stringify(data, null, 2));
        return data;
      }
    } catch (err) {
      console.error('Firebase read failed:', err.message);
    }
  }
  
  // Try local backup
  if (fs.existsSync(LOCAL_BACKUP_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_BACKUP_PATH, 'utf8'));
    } catch (e) {
      console.error('Local backup corrupt, using defaults');
    }
  }
  
  // Return defaults
  return defaultData;
}

// Save data to Firebase AND local backup
async function saveData(data) {
  data.lastUpdated = Date.now();
  
  // Always save locally first (as backup)
  try {
    fs.writeFileSync(LOCAL_BACKUP_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save local backup:', e.message);
  }
  
  // Save to Firebase
  if (firebaseInitialized) {
    try {
      await db.ref('missionControl').set(data);
      console.log('✅ Saved to Firebase');
    } catch (err) {
      console.error('❌ Firebase save failed:', err.message);
    }
  }
  
  return data;
}

// ==================== STEP 3: REAL-TIME LISTENER ====================
// This listens for changes from Firebase (when AI updates data)

if (firebaseInitialized) {
  db.ref('missionControl').on('value', (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      // Update local backup when Firebase changes
      fs.writeFileSync(LOCAL_BACKUP_PATH, JSON.stringify(data, null, 2));
      console.log('🔄 Firebase update received at:', new Date().toLocaleTimeString());
    }
  });
  console.log('👂 Listening for real-time updates...');
}

// ==================== STEP 4: API ENDPOINTS ====================

// Health check
app.get('/mc/status', async (req, res) => {
  res.json({
    status: 'online',
    firebase: firebaseInitialized ? 'connected' : 'local-only',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// Get all data
app.get('/mc/data', async (req, res) => {
  const data = await loadData();
  res.json(data);
});

// Save all data (called when user makes changes)
app.post('/mc/data', async (req, res) => {
  const newData = req.body;
  await saveData(newData);
  res.json({ success: true, timestamp: Date.now() });
});

// Update a single priority (for checkbox toggles)
app.patch('/mc/priorities/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const data = await loadData();
  const priorityIndex = data.priorities.findIndex(p => p.id == id);
  
  if (priorityIndex >= 0) {
    data.priorities[priorityIndex] = { 
      ...data.priorities[priorityIndex], 
      ...updates,
      updatedAt: Date.now()
    };
    await saveData(data);
    res.json({ success: true, priority: data.priorities[priorityIndex] });
  } else {
    res.status(404).json({ error: 'Priority not found' });
  }
});

// AI endpoint - Get current state
app.get('/mc/ai/sync', async (req, res) => {
  const data = await loadData();
  res.json({
    ...data,
    source: firebaseInitialized ? 'firebase' : 'local'
  });
});

// AI endpoint - Update tasks
app.post('/mc/ai/update', async (req, res) => {
  const { priorities, projects, activities } = req.body;
  
  const data = await loadData();
  
  if (priorities) data.priorities = priorities;
  if (projects) data.projects = projects;
  if (activities) data.activities = activities;
  
  await saveData(data);
  res.json({ success: true, timestamp: Date.now() });
});

// Open file endpoint (for Documents tab)
app.post('/mc/open-file', async (req, res) => {
  const { path: filePath } = req.body;
  
  // Since we can't actually open files from the server, return success
  // and let the frontend handle it via clipboard
  res.json({ 
    success: true, 
    path: filePath,
    message: 'Path ready for clipboard copy'
  });
});

// 3D Printer Status endpoint
app.get('/mc/printers', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    // Run the printer API script
    const scriptPath = path.join(__dirname, 'printer-api.py');
    
    console.log('Printer endpoint called');
    console.log('Script path:', scriptPath);
    console.log('Script exists:', fs.existsSync(scriptPath));
    
    // Check if script exists
    if (!fs.existsSync(scriptPath)) {
      console.error('Script not found!');
      return res.status(500).json({ error: 'Printer API script not found' });
    }
    
    // Execute and get JSON output
    console.log('Executing Python script...');
    const { stdout, stderr } = await execPromise(`python3 "${scriptPath}"`, { timeout: 15000 });
    
    console.log('Python stdout:', stdout.substring(0, 200));
    if (stderr) {
      console.error('Python stderr:', stderr);
    }
    
    // Parse the JSON output
    const printers = JSON.parse(stdout);
    console.log('Parsed printers count:', printers.length);
    res.json(printers);
    
  } catch (error) {
    console.error('Printer API error:', error.message);
    console.error('Stack:', error.stack);
    // Return demo data on error
    res.json([
      {
        name: "P2S",
        state: "printing",
        temps: { tool0: { actual: 215 }, bed: { actual: 60 } },
        job: { file: "ZynCase_Black.gcode", percentage: 67, timeLeft: "1h 23m" },
        filament: { type: "PLA", color: "#1a1a1a" }
      },
      {
        name: "P1S", 
        state: "operational",
        temps: { tool0: { actual: 25 }, bed: { actual: 25 } },
        job: null,
        filament: { type: "PLA", color: "#4a4a4a" }
      },
      {
        name: "Centauri Carbon",
        state: "offline",
        temps: { tool0: { actual: 0 }, bed: { actual: 0 } },
        job: null,
        filament: { type: "PETG", color: "#ff6b6b" }
      }
    ]);
  }
});

// Serve the dashboard HTML
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, 'mission-control.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.send('<h1>Mission Control</h1><p>Dashboard HTML not found</p>');
  }
});

// ==================== STEP 5: START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              MISSION CONTROL SERVER (FIREBASE)               ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Status:    ${firebaseInitialized ? '🟢 ONLINE + FIREBASE' : '🟡 ONLINE (LOCAL ONLY)'}                    ║`);
  console.log(`║  Port:      ${PORT}                                              ║`);
  console.log(`║  Local:     http://localhost:${PORT}                            ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  Endpoints:                                                  ║');
  console.log('║    GET  /                    → Dashboard                     ║');
  console.log('║    GET  /mc/status           → System status                 ║');
  console.log('║    GET  /mc/data             → Load all data                 ║');
  console.log('║    POST /mc/data             → Save all data                 ║');
  console.log('║    GET  /mc/ai/sync          → AI sync endpoint              ║');
  console.log('║    POST /mc/ai/update        → AI update endpoint            ║');
  console.log('║    GET  /mc/printers         → 3D Printer status             ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  if (!firebaseInitialized) {
    console.log('⚠️  WARNING: Running in LOCAL MODE');
    console.log('   To enable Firebase sync:');
    console.log('   1. Add firebase-service-account.json to this folder');
    console.log('   2. Restart the server');
    console.log('');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Mission Control Server...');
  process.exit(0);
});
