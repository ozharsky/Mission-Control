# Mission Control - Quick Start Guide

## Download Location
Save the `00-Mission-Control` folder to your **Downloads**:
```
/Users/YOUR_USERNAME/Downloads/00-Mission-Control/
```

## Option 1: Just Open the Dashboard (No Server)

Double-click `mission-control.html` or:
```bash
open ~/Downloads/00-Mission-Control/mission-control.html
```

Works offline with localStorage.

---

## Option 2: Run With Server (Live Data + Backup)

### Step 1: Update the Path

**Edit the plist file** - replace `YOUR_USERNAME` with your actual Mac username:

```bash
# Find your username
whoami  # e.g., "oleg"

# Edit the plist (replace YOUR_USERNAME with the result above)
open ~/Downloads/00-Mission-Control/com.missioncontrol.server.plist
```

In the file, replace all instances of `YOUR_USERNAME` with your actual username.

### Step 2: Start the Server

```bash
cd ~/Downloads/00-Mission-Control
node server.mjs
```

### Step 3: Open Dashboard

Go to: **http://localhost:8899**

---

## Auto-Start on Login (macOS)

### One-time setup:

```bash
# 1. Go to the folder
cd ~/Downloads/00-Mission-Control

# 2. Create logs folder
mkdir -p logs

# 3. Get your username
USERNAME=$(whoami)

# 4. Replace placeholder in plist
sed "s/YOUR_USERNAME/$USERNAME/g" com.missioncontrol.server.plist > ~/Library/LaunchAgents/com.missioncontrol.server.plist

# 5. Load the LaunchAgent
launchctl load ~/Library/LaunchAgents/com.missioncontrol.server.plist

echo "✅ Mission Control will auto-start on login"
```

### Check if it's running:
```bash
launchctl list | grep missioncontrol
```

### Stop the server:
```bash
launchctl stop com.missioncontrol.server
```

### Start it again:
```bash
launchctl start com.missioncontrol.server
```

### Disable auto-start:
```bash
launchctl unload ~/Library/LaunchAgents/com.missioncontrol.server.plist
```

---

## Manual Path Setup (If Auto Doesn't Work)

If the sed command doesn't work, manually edit `com.missioncontrol.server.plist`:

Find and replace:
- `YOUR_USERNAME` → your actual username (e.g., `oleg`)

So paths look like:
```
/Users/oleg/Downloads/00-Mission-Control/server.mjs
```

Then run:
```bash
cp ~/Downloads/00-Mission-Control/com.missioncontrol.server.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.missioncontrol.server.plist
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Permission denied" | Run `chmod +x server.mjs` |
| "Port 8899 in use" | `lsof -i :8899` then `kill -9 <PID>` |
| "Cannot find module" | Make sure you're in `~/Downloads/00-Mission-Control` |
| Weather not showing | Check internet connection |
| Auto-start not working | Verify username in plist file is correct |

---

## File Structure (in Downloads)

```
~/Downloads/00-Mission-Control/
├── mission-control.html      ← Open this (or go to localhost:8899)
├── server.mjs                ← Run this: node server.mjs
├── com.missioncontrol.server.plist  ← Auto-start config
├── README.md                 ← This file
├── mc-data.json              ← Auto-created
├── mc-activity.json          ← Auto-created
└── logs/                     ← Auto-created
    ├── server.out.log
    └── server.err.log
```

---

## Quick Commands Reference

```bash
# Start server manually
cd ~/Downloads/00-Mission-Control && node server.mjs

# View logs
tail -f ~/Downloads/00-Mission-Control/logs/server.out.log

# Check server status
curl http://localhost:8899/mc/status

# Stop auto-start server
launchctl stop com.missioncontrol.server

# Start auto-start server
launchctl start com.missioncontrol.server
```

---

**Questions?** Check `README-SERVER.md` for full API documentation.
