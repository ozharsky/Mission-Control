const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8899;

app.use(cors());
app.use(express.json());

const execPromise = util.promisify(exec);

// Log ALL requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
    next();
});

app.get('/mc/printers', async (req, res) => {
    console.log('>>> PRINTER ENDPOINT CALLED');
    try {
        const scriptPath = path.join(__dirname, 'printer-api.py');
        console.log('Script path:', scriptPath);
        console.log('Exists:', fs.existsSync(scriptPath));
        
        if (!fs.existsSync(scriptPath)) {
            console.error('Script NOT FOUND');
            return res.status(500).json({ error: 'Script not found' });
        }
        
        console.log('Executing Python...');
        const { stdout, stderr } = await execPromise(`python3 "${scriptPath}"`, { timeout: 15000 });
        
        console.log('Python stdout length:', stdout.length);
        console.log('Python stdout (first 200 chars):', stdout.substring(0, 200));
        
        if (stderr) {
            console.error('Python stderr:', stderr);
        }
        
        const printers = JSON.parse(stdout);
        console.log('Parsed', printers.length, 'printers');
        console.log('First printer state:', printers[0]?.state);
        
        res.json(printers);
        console.log('<<< SENT REAL DATA');
        
    } catch (error) {
        console.error('!!! ERROR:', error.message);
        console.error('Stack:', error.stack);
        
        // Demo data on error
        const demo = [
            { name: "P2S", state: "printing", temps: { tool0: { actual: 215 }, bed: { actual: 60 } }, job: { file: "ZynCase_Black.gcode", percentage: 67, timeLeft: "1h 23m" }, filament: { type: "PLA", color: "#1a1a1a" } },
            { name: "P1S", state: "operational", temps: { tool0: { actual: 25 }, bed: { actual: 25 } }, job: null, filament: { type: "PLA", color: "#4a4a4a" } },
            { name: "Centauri Carbon", state: "offline", temps: { tool0: { actual: 0 }, bed: { actual: 0 } }, job: null, filament: { type: "PETG", color: "#ff6b6b" } }
        ];
        res.json(demo);
        console.log('<<< SENT DEMO DATA (due to error)');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mission-control.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('PID:', process.pid);
    console.log('CWD:', process.cwd());
});