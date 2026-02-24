# Mission Control Server - Setup Guide

## Quick Start

### 1. Save Files
Save these files to a folder (e.g., `~/MissionControl/`):
- `server.mjs` - The Node.js server
- `mission-control.html` - Your dashboard (copy from Google Drive)

### 2. Start the Server

```bash
cd ~/MissionControl
node server.mjs
```

You should see:
```
╔══════════════════════════════════════════════════════════════╗
║                    MISSION CONTROL SERVER                    ║
╠══════════════════════════════════════════════════════════════╣
║  Status:    🟢 ONLINE                                        ║
║  Port:      8899                                             ║
║  URL:       http://localhost:8899                            ║
╚══════════════════════════════════════════════════════════════╝
```

### 3. Open Dashboard
Open your browser to: **http://localhost:8899**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Mission Control Dashboard |
| GET | `/mc/status` | Server uptime, health, timestamp |
| GET | `/mc/data` | Read all dashboard data from mc-data.json |
| POST | `/mc/data` | Save dashboard data to mc-data.json |
| GET | `/mc/weather?city=Kent` | Current weather from wttr.in |
| GET | `/mc/activity` | Last 50 activity entries |
| POST | `/mc/activity` | Add new activity entry |

### Example API Calls

```bash
# Check status
curl http://localhost:8899/mc/status

# Get weather
curl http://localhost:8899/mc/weather?city=Seattle

# Read data
curl http://localhost:8899/mc/data

# Save data
curl -X POST http://localhost:8899/mc/data \
  -H "Content-Type: application/json" \
  -d '{"orders": 15, "revenueGoal": 6000}'

# Add activity
curl -X POST http://localhost:8899/mc/activity \
  -H "Content-Type: application/json" \
  -d '{"icon": "🎯", "text": "New order received"}'
```

---

## Auto-Start on macOS (LaunchAgent)

### Option A: Manual Setup

1. **Create logs directory:**
```bash
mkdir -p ~/MissionControl/logs
```

2. **Copy the plist template:**
```bash
# Edit the plist file first - replace {{SERVER_PATH}} with your actual path
sed 's|{{SERVER_PATH}}|'"$HOME"'/MissionControl|g' com.missioncontrol.server.plist > ~/Library/LaunchAgents/com.missioncontrol.server.plist
```

3. **Load the LaunchAgent:**
```bash
launchctl load ~/Library/LaunchAgents/com.missioncontrol.server.plist
```

4. **Verify it's running:**
```bash
launchctl list | grep missioncontrol
```

### Option B: One-Liner Setup Script

```bash
# Run this from your MissionControl folder
mkdir -p logs && \
sed "s|{{SERVER_PATH}}|$(pwd)|g" com.missioncontrol.server.plist > ~/Library/LaunchAgents/com.missioncontrol.server.plist && \
launchctl load ~/Library/LaunchAgents/com.missioncontrol.server.plist && \
echo "✅ Mission Control Server auto-start enabled!"
```

### Managing the LaunchAgent

```bash
# Start
launchctl start com.missioncontrol.server

# Stop
launchctl stop com.missioncontrol.server

# Unload (disable auto-start)
launchctl unload ~/Library/LaunchAgents/com.missioncontrol.server.plist

# View logs
tail -f ~/MissionControl/logs/server.out.log
tail -f ~/MissionControl/logs/server.err.log
```

---

## Data Files

The server creates these JSON files automatically:

| File | Purpose |
|------|---------|
| `mc-data.json` | Dashboard state (orders, goals, clients, etc.) |
| `mc-activity.json` | Activity log entries |

Both files are human-readable and editable.

---

## Troubleshooting

### Port already in use
```bash
# Find process using port 8899
lsof -i :8899

# Kill it
kill -9 $(lsof -t -i :8899)
```

### Permission denied
```bash
# Make sure Node is installed
node --version

# If needed, install Node via Homebrew
brew install node
```

### Server won't start
Check logs in `~/MissionControl/logs/` for errors.

---

## Next Steps: Connect Mission Control

Add this JavaScript to your Mission Control to sync with the server:

```javascript
// Sync localStorage to server
async function syncToServer() {
  const data = JSON.parse(localStorage.getItem('mc_data') || '{}');
  await fetch('http://localhost:8899/mc/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

// Load from server
async function loadFromServer() {
  const res = await fetch('http://localhost:8899/mc/data');
  const data = await res.json();
  localStorage.setItem('mc_data', JSON.stringify(data));
}

// Fetch weather
async function updateWeather() {
  const res = await fetch('http://localhost:8899/mc/weather?city=Kent');
  const weather = await res.json();
  console.log(`${weather.temperature}°F - ${weather.condition}`);
}
```

---

## File Structure

```
~/MissionControl/
├── server.mjs                          # Server code
├── mission-control.html                # Dashboard
├── com.missioncontrol.server.plist     # LaunchAgent template
├── README.md                           # This file
├── mc-data.json                        # Auto-created: dashboard data
├── mc-activity.json                    # Auto-created: activity log
└── logs/
    ├── server.out.log                  # Server output
    └── server.err.log                  # Error log
```

---

**Mission Control Server v1.0** | Built for OZ3DPrint
