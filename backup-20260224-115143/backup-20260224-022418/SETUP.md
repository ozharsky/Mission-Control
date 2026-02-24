# Mission Control - Complete Setup Guide

## Prerequisites

1. **macOS** (these instructions are for Mac)
2. **Node.js** installed

### Check if Node is installed:
```bash
node --version
```

If not installed:
```bash
brew install node
```

---

## Download

1. Download `00-Mission-Control` folder from Google Drive
2. Move it to your **Downloads** folder
3. You should have:
   ```
   ~/Downloads/00-Mission-Control/
   ├── mission-control.html
   ├── server.mjs
   ├── com.missioncontrol.server.plist
   ├── setup.sh
   └── README.md
   ```

---

## Setup (Choose One Method)

### Method 1: Automatic Setup (Recommended)

Open Terminal and run:

```bash
cd ~/Downloads/00-Mission-Control
chmod +x setup.sh
./setup.sh
```

This will:
- Detect your username
- Create the logs folder
- Set up auto-start
- Start the server

Then open: **http://localhost:8899**

---

### Method 2: Manual Setup

#### Step 1: Create logs folder
```bash
cd ~/Downloads/00-Mission-Control
mkdir -p logs
```

#### Step 2: Get your username
```bash
whoami
# Example output: oleg
```

#### Step 3: Edit the plist file
Open `com.missioncontrol.server.plist` in a text editor and replace `YOUR_USERNAME` with your actual username.

Example:
```xml
<string>/Users/oleg/Downloads/00-Mission-Control/server.mjs</string>
```

#### Step 4: Copy to LaunchAgents
```bash
cp ~/Downloads/00-Mission-Control/com.missioncontrol.server.plist ~/Library/LaunchAgents/
```

#### Step 5: Load the service
```bash
launchctl load ~/Library/LaunchAgents/com.missioncontrol.server.plist
```

#### Step 6: Verify it's running
```bash
curl http://localhost:8899/mc/status
```

---

### Method 3: Just Run Manually (No Auto-Start)

If you don't want auto-start, just run:

```bash
cd ~/Downloads/00-Mission-Control
node server.mjs
```

Then open: **http://localhost:8899**

Press `Ctrl+C` to stop.

---

## Verify It's Working

### Check server status:
```bash
curl http://localhost:8899/mc/status
```

Should return:
```json
{"status":"online","uptime":...}
```

### Open the dashboard:
- Go to: http://localhost:8899
- Or open `mission-control.html` directly

---

## Common Issues

### "Permission denied" when running setup.sh
```bash
chmod +x ~/Downloads/00-Mission-Control/setup.sh
```

### "Port 8899 already in use"
```bash
# Find what's using it
lsof -i :8899

# Kill it
kill -9 $(lsof -t -i :8899)

# Or use a different port (edit server.mjs, change PORT = 8899 to something else)
```

### "Node not found"
Install Node.js:
```bash
brew install node
```

### Server not starting after setup
Check the logs:
```bash
tail -f ~/Downloads/00-Mission-Control/logs/server.err.log
```

### Auto-start not working
Try reloading:
```bash
launchctl unload ~/Library/LaunchAgents/com.missioncontrol.server.plist
launchctl load ~/Library/LaunchAgents/com.missioncontrol.server.plist
```

---

## Managing the Server

### Stop the server:
```bash
launchctl stop com.missioncontrol.server
```

### Start the server:
```bash
launchctl start com.missioncontrol.server
```

### Disable auto-start:
```bash
launchctl unload ~/Library/LaunchAgents/com.missioncontrol.server.plist
```

### Re-enable auto-start:
```bash
launchctl load ~/Library/LaunchAgents/com.missioncontrol.server.plist
```

### View logs:
```bash
# Server output
tail -f ~/Downloads/00-Mission-Control/logs/server.out.log

# Errors
tail -f ~/Downloads/00-Mission-Control/logs/server.err.log
```

---

## Using Without the Server

The dashboard works fine without the server:

1. Just double-click `mission-control.html`
2. All data saves to browser localStorage
3. You just won't have:
   - Weather widget
   - Server backup
   - Activity logging

---

## File Locations

| File | Location |
|------|----------|
| Dashboard | `~/Downloads/00-Mission-Control/mission-control.html` |
| Server | `~/Downloads/00-Mission-Control/server.mjs` |
| Auto-start config | `~/Library/LaunchAgents/com.missioncontrol.server.plist` |
| Your data | `~/Downloads/00-Mission-Control/mc-data.json` |
| Activity log | `~/Downloads/00-Mission-Control/mc-activity.json` |
| Server logs | `~/Downloads/00-Mission-Control/logs/` |

---

## Quick Reference

```bash
# Start manually
cd ~/Downloads/00-Mission-Control && node server.mjs

# Check status
curl http://localhost:8899/mc/status

# Stop auto-start
launchctl stop com.missioncontrol.server

# Start auto-start
launchctl start com.missioncontrol.server

# View logs
tail -f ~/Downloads/00-Mission-Control/logs/server.out.log
```

---

**Still having issues?** 
1. Check logs: `tail -f logs/server.err.log`
2. Try manual method (Method 3 above)
3. Or just use the HTML file without the server
