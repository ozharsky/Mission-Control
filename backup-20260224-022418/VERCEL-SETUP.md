# Vercel Proxy Setup (No Local Server Needed!)

This lets you fetch SimplyPrint data through Vercel's free serverless functions.

## Setup Steps

### 1. Create Vercel Account
Go to https://vercel.com and sign up (free)

### 2. Install Vercel CLI
```bash
npm i -g vercel
```

### 3. Deploy the Proxy
```bash
cd ~/Mission-Control
vercel
```

Follow the prompts:
- Link to existing project? **No**
- Project name: **mission-control-proxy**
- Directory: **./** (current)

### 4. Add Environment Variable
```bash
vercel env add SIMPLYPRINT_API_KEY
```
Paste your SimplyPrint API key when prompted.

### 5. Redeploy
```bash
vercel --prod
```

Vercel will give you a URL like:
```
https://mission-control-proxy-xyz.vercel.app
```

### 6. Update Mission Control
In your Mission Control `index.html`, find this line in `updatePrinterStatus()`:

```javascript
const PROXY_URL = 'http://localhost:8899/mc/printers';
```

Change it to:
```javascript
const PROXY_URL = 'https://mission-control-proxy-xyz.vercel.app/api/printers';
```

(Use your actual Vercel URL)

### 7. Done!
Push the updated Mission Control to GitHub and the printer update button will work!

## How It Works

```
Mission Control (GitHub Pages)
    ↓ (CORS allowed - different domains OK)
Vercel Function (Serverless)
    ↓ (API call with secret key)
SimplyPrint API
    ↓ (printer data)
Vercel Function
    ↓ (JSON response)
Mission Control
```

## Free Tier Limits
- 100GB bandwidth/month
- 1000 function invocations/day
- More than enough for printer status updates!

## Security
Your API key is stored in Vercel's encrypted environment variables.
It's never exposed in the browser or GitHub repo.