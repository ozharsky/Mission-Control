#!/bin/bash
# Mission Control Setup Script
# Run this after downloading 00-Mission-Control to Downloads

echo "🚀 Mission Control Setup"
echo "========================"
echo ""

# Check if we're in the right folder
if [ ! -f "server.mjs" ]; then
    echo "❌ Error: server.mjs not found"
    echo "Please run this script from the 00-Mission-Control folder"
    echo ""
    echo "Example:"
    echo "  cd ~/Downloads/00-Mission-Control"
    echo "  ./setup.sh"
    exit 1
fi

# Get username
USERNAME=$(whoami)
echo "👤 Username detected: $USERNAME"

# Create logs folder
echo "📁 Creating logs folder..."
mkdir -p logs

# Check if Node is installed
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    echo ""
    echo "Install Node.js:"
    echo "  brew install node"
    echo ""
    echo "Or download from: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js found: $NODE_VERSION"

# Find Node path
NODE_PATH=$(which node)
echo "📍 Node location: $NODE_PATH"

# Create LaunchAgent plist
echo ""
echo "⚙️  Creating auto-start configuration..."

cat > ~/Library/LaunchAgents/com.missioncontrol.server.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.missioncontrol.server</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>/Users/$USERNAME/Downloads/00-Mission-Control/server.mjs</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>/Users/$USERNAME/Downloads/00-Mission-Control</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>/Users/$USERNAME/Downloads/00-Mission-Control/logs/server.out.log</string>
    
    <key>StandardErrorPath</key>
    <string>/Users/$USERNAME/Downloads/00-Mission-Control/logs/server.err.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
EOF

echo "✅ LaunchAgent created"

# Load the LaunchAgent
echo ""
echo "🔄 Loading auto-start service..."
launchctl load ~/Library/LaunchAgents/com.missioncontrol.server.plist 2>/dev/null || {
    echo "⚠️  Service already loaded, unloading first..."
    launchctl unload ~/Library/LaunchAgents/com.missioncontrol.server.plist 2>/dev/null
    launchctl load ~/Library/LaunchAgents/com.missioncontrol.server.plist
}

# Wait a moment
sleep 2

# Check if server is running
echo ""
echo "🔍 Checking server status..."
if curl -s http://localhost:8899/mc/status > /dev/null 2>&1; then
    echo "✅ Server is running!"
    echo ""
    echo "🌐 Open: http://localhost:8899"
else
    echo "⚠️  Server may still be starting..."
    echo "   Check logs: tail -f logs/server.out.log"
fi

echo ""
echo "========================"
echo "✅ Setup complete!"
echo ""
echo "Commands:"
echo "  launchctl stop com.missioncontrol.server   # Stop server"
echo "  launchctl start com.missioncontrol.server  # Start server"
echo "  tail -f logs/server.out.log                # View logs"
echo ""
echo "The server will auto-start when you log in."
