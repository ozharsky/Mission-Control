# Connect Kimi to Your Mission Control (Live Data)

## Overview
This setup allows me (Kimi) to connect to your local Mission Control server in real-time, so I can:
- See your live dashboard data
- Update tasks and priorities for you
- Monitor your progress
- Add intel and insights directly

## How It Works

```
Your Mac (localhost:8899) 
    ↓
ngrok tunnel (public URL)
    ↓
Kimi connects via HTTPS
```

## Step 1: Install ngrok

```bash
# macOS with Homebrew
brew install ngrok

# Or download from https://ngrok.com/download
```

## Step 2: Start Your Mission Control Server

```bash
cd ~/Downloads/00-Mission-Control
node server.mjs
```

## Step 3: Expose to Internet with ngrok

In a **new terminal window**:

```bash
ngrok http 8899
```

You'll see something like:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123-def456.ngrok-free.app -> http://localhost:8899
```

**Copy the HTTPS URL** (e.g., `https://abc123-def456.ngrok-free.app`)

## Step 4: Share URL with Kimi

Send me this message:

```
My Mission Control is live at: https://YOUR-URL.ngrok-free.app
```

I'll connect and can:
- Read your dashboard data via `/mc/data`
- Add activity logs via `/mc/activity`
- Check server status via `/mc/status`

## Step 5: Keep It Running

**Important:** The ngrok URL changes every time you restart ngrok (on free plan).

### Option A: Keep terminal open
Just leave both terminals running:
- Terminal 1: `node server.mjs`
- Terminal 2: `ngrok http 8899`

### Option B: Get a static URL (paid ngrok)
```bash
ngrok http 8899 --subdomain=yourname-mission-control
```

Requires ngrok paid plan (~$5/month)

### Option C: Use localtunnel (free static-ish)
```bash
npx localtunnel --port 8899 --subdomain yourname-mc
```

## Security Notes

- ngrok URLs are random and hard to guess
- Anyone with the URL can access your dashboard
- Don't share the URL publicly
- The tunnel closes when you stop ngrok

## What I Can Do Once Connected

| Action | Endpoint | Example |
|--------|----------|---------|
| View your data | GET /mc/data | See all your tasks, priorities, revenue |
| Add activity | POST /mc/activity | Log "Completed Etsy SEO update" |
| Check status | GET /mc/status | Server health, uptime |
| Get weather | GET /mc/weather?city=Kent | Current conditions |

## Example: I Update Your Task

When you give me the URL, I can:

```bash
# 1. Fetch your current data
curl https://your-url.ngrok-free.app/mc/data

# 2. See you have 3 priorities

# 3. Add activity when I complete something
curl -X POST https://your-url.ngrok-free.app/mc/activity \
  -H "Content-Type: application/json" \
  -d '{"icon": "✅", "text": "Updated Portfolio.tsx Etsy links", "source": "Kimi"}'
```

## Troubleshooting

### "ngrok command not found"
```bash
brew install ngrok
# or
npm install -g ngrok
```

### "Cannot connect to server"
1. Make sure `node server.mjs` is running
2. Check ngrok shows "online"
3. Try: `curl http://localhost:8899/mc/status`

### "URL expired"
Free ngrok URLs last ~2 hours. Just restart ngrok and send me the new URL.

### "Connection refused"
Your server might have crashed. Restart it:
```bash
cd ~/Downloads/00-Mission-Control
node server.mjs
```

## Quick Commands Reference

```bash
# Start server
cd ~/Downloads/00-Mission-Control && node server.mjs

# Expose to internet (new terminal)
ngrok http 8899

# Check if it's working
curl https://YOUR-URL.ngrok-free.app/mc/status

# View ngrok web interface
open http://localhost:4040
```

---

**Ready?** Start the server, run ngrok, and send me the URL!
