# SimplyPrint Proxy for Mission Control

This proxy server solves the CORS issue by running locally on your machine.
It fetches printer data from SimplyPrint API and serves it to Mission Control.

## Quick Start

### 1. Save your SimplyPrint API Key

Create a `.env` file in this folder:

```bash
cd ~/Mission-Control
echo "SIMPLYPRINT_API_KEY=your_api_key_here" > .env
```

Replace `your_api_key_here` with your actual SimplyPrint API key.

### 2. Start the Proxy Server

```bash
node simplyprint-proxy.js
```

You should see:
```
╔══════════════════════════════════════════════════════════════╗
║            SIMPLYPRINT PROXY SERVER                          ║
╠══════════════════════════════════════════════════════════════╣
║  Status:    🟢 API KEY CONFIGURED                            ║
║  Port:      8899                                             ║
╚══════════════════════════════════════════════════════════════╝
```

### 3. Open Mission Control

Go to your Mission Control dashboard (GitHub Pages or local).

Click **🔄 Update** in the Inventory → Printers section.

The proxy server will fetch live data from SimplyPrint and display it!

## How It Works

```
Mission Control (Browser)
    ↓ (requests to localhost:8899)
SimplyPrint Proxy (Your computer)
    ↓ (API call with your key)
SimplyPrint API
    ↓ (printer data)
SimplyPrint Proxy
    ↓ (transformed data)
Mission Control (Display)
```

Since the browser talks to `localhost` (same origin), there's no CORS issue.

## Troubleshooting

### "API KEY MISSING"
Make sure you created the `.env` file with your API key.

### "Connection refused"
Make sure the proxy server is running (`node simplyprint-proxy.js`)

### "Failed to fetch"
Check that the proxy server shows 🟢 and not 🟡

## Auto-start (Optional)

To start the proxy automatically when you log in:

### Mac:
```bash
# Create a LaunchAgent
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/com.simplyprint.proxy.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.simplyprint.proxy</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>~/Mission-Control/simplyprint-proxy.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

launchctl load ~/Library/LaunchAgents/com.simplyprint.proxy.plist
```

## Security Note

Your API key is stored only in the `.env` file on your local machine.
It's never sent to GitHub or any external server except SimplyPrint's API.
