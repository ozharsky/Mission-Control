#!/bin/bash
# Mission Control Launcher
# Usage: ./start-mc.sh

echo "🚀 Starting Mission Control..."
echo ""

# Check if running from correct directory
if [ ! -f "server.mjs" ]; then
    echo "❌ Error: server.mjs not found"
    echo "Please run this script from your Mission Control folder:"
    echo "  cd ~/My Drive/OpenClaw-Workspace/00-Mission-Control"
    echo "  ./start-mc.sh"
    exit 1
fi

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install with: brew install node"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "⚠️  ngrok not found. Install with: brew install ngrok"
    echo "   (Optional - only needed for external access)"
    echo ""
fi

# Create logs directory if needed
mkdir -p logs

# Start the server
echo "🖥️  Starting server on port 8899..."
node server.mjs &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check if server is running
if curl -s http://localhost:8899/mc/status > /dev/null 2>&1; then
    echo "✅ Server is running!"
    echo ""
    echo "📱 Local URL: http://localhost:8899"
    echo ""
    
    # Start ngrok if available
    if command -v ngrok &> /dev/null; then
        echo "🌐 Starting ngrok tunnel..."
        echo ""
        ngrok http 8899
    else
        echo "💡 To expose to internet, install ngrok: brew install ngrok"
        echo "   Then run: ngrok http 8899"
        echo ""
        echo "Press Ctrl+C to stop the server"
        wait $SERVER_PID
    fi
else
    echo "❌ Server failed to start"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi
