#!/bin/bash
# Mission Control Launcher - One command to start everything
# Usage: ./start-mission-control.sh

echo "🚀 Starting Mission Control..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -f "server-firebase.js" ]; then
    echo "❌ Error: server-firebase.js not found"
    echo "Please run this script from your Mission Control folder:"
    echo "  cd ~/My Drive/OpenClaw-Workspace/00-Mission-Control"
    echo "  ./start-mission-control.sh"
    exit 1
fi

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install with: brew install node"
    exit 1
fi

echo -e "${GREEN}✅${NC} Node.js found: $(node --version)"

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "⚠️  ngrok not found. Install with: brew install ngrok"
    echo "   (Optional - only needed for external access)"
    echo ""
fi

# Kill any existing node servers on port 8899
echo -e "${BLUE}🧹${NC} Cleaning up existing servers..."
lsof -ti:8899 | xargs kill -9 2>/dev/null

# Create logs directory
mkdir -p logs

# Start the Mission Control server
echo -e "${BLUE}🖥️ ${NC} Starting Mission Control server on port 8899..."
node server-firebase.js > logs/server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Check if server is running
if curl -s http://localhost:8899/mc/status > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Mission Control server is running!"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║              🚀 MISSION CONTROL IS ONLINE 🚀                 ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  📱 Local URL:     http://localhost:8899                     ║"
    echo "║  📊 Status:        http://localhost:8899/mc/status           ║"
    echo "╠══════════════════════════════════════════════════════════════╣"
    echo "║  Server PID: $SERVER_PID                                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""
    
    # Start ngrok if available
    if command -v ngrok &> /dev/null; then
        echo -e "${BLUE}🌐${NC} Starting ngrok tunnel..."
        ngrok http 8899 --log=stdout > logs/ngrok.log 2>&1 &
        NGROK_PID=$!
        echo -e "${GREEN}✅${NC} ngrok started (PID: $NGROK_PID)"
        echo ""
        echo "⏳  Waiting for ngrok URL..."
        sleep 5
        
        # Try to get ngrok URL
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
        if [ ! -z "$NGROK_URL" ]; then
            echo ""
            echo "╔══════════════════════════════════════════════════════════════╗"
            echo "║              🌐 EXTERNAL ACCESS ENABLED 🌐                   ║"
            echo "╠══════════════════════════════════════════════════════════════╣"
            echo "║  External URL: $NGROK_URL"
            echo "╚══════════════════════════════════════════════════════════════╝"
        else
            echo "⚠️  ngrok URL not ready yet. Check: http://localhost:4040"
        fi
    else
        echo "💡 To expose to internet, install ngrok: brew install ngrok"
    fi
    
    echo ""
    echo -e "${YELLOW}📋 Quick Commands:${NC}"
    echo "  View server logs:   tail -f logs/server.log"
    echo "  View ngrok logs:    tail -f logs/ngrok.log"
    echo "  Stop servers:       kill $SERVER_PID $NGROK_PID 2>/dev/null"
    echo ""
    echo -e "${GREEN}✨ Mission Control is ready! Open http://localhost:8899${NC}"
    
else
    echo "❌ Server failed to start. Check logs/server.log"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# Keep script running to show it's active
echo ""
echo "Press Ctrl+C to stop all servers..."
wait $SERVER_PID