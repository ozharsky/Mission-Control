# Install ngrok on macOS

## Option 1: Homebrew (Recommended)
```bash
brew install ngrok
```

## Option 2: Direct Download
```bash
# Download
 curl -O https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip

# Unzip
unzip ngrok-v3-stable-darwin-amd64.zip

# Move to PATH
sudo mv ngrok /usr/local/bin/

# Verify
ngrok --version
```

## Option 3: Use localtunnel instead (no install)
```bash
npx localtunnel --port 8899
```

## After Install
```bash
# Start ngrok
ngrok http 8899

# Copy the https URL and send to Kimi
```
