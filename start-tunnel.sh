#!/bin/bash
# SSH Tunnel script for Mission Control
# This creates a tunnel from your Mac's localhost:8899 to the remote server

SERVER_IP="47.84.125.113"

echo "Setting up SSH tunnel to $SERVER_IP:8899..."
echo "You may need to enter your SSH password"

# Kill any existing tunnels
pkill -f "ssh.*8899:localhost:8899" 2>/dev/null

# Create tunnel
ssh -N -L 8899:localhost:8899 root@$SERVER_IP

echo "Tunnel closed"