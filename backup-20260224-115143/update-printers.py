#!/usr/bin/env python3
"""
Update Mission Control with printer data
Called by cron to keep printer status fresh
"""

import json
import subprocess
import sys

def get_printer_data():
    """Get printer data from 3dprint skill"""
    try:
        result = subprocess.run(
            ['python3', '/root/.openclaw/skills/3dprint/3dprint.py'],
            capture_output=True,
            text=True,
            timeout=15
        )
        
        output = result.stdout
        printers = []
        current = None
        
        for line in output.split('\n'):
            if 'PRINTER' in line and ':' in line:
                if current:
                    printers.append(current)
                name = line.split(':')[-1].strip().replace('|', '').strip()
                current = {
                    'name': name,
                    'state': 'operational',
                    'temps': {'tool0': {'actual': 0}, 'bed': {'actual': 0}},
                    'job': None,
                    'filament': {'type': 'Unknown', 'color': '#888888'}
                }
            
            if not current:
                continue
                
            if 'PRINTING' in line:
                current['state'] = 'printing'
            elif 'PAUSED' in line:
                current['state'] = 'paused'
            elif 'OFFLINE' in line:
                current['state'] = 'offline'
            
            # Temps
            import re
            temp_match = re.search(r'(\d+)°C.*?(\d+)°C', line)
            if temp_match:
                current['temps'] = {
                    'tool0': {'actual': int(temp_match.group(1))},
                    'bed': {'actual': int(temp_match.group(2))}
                }
        
        if current:
            printers.append(current)
        
        return printers
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return []

def update_mission_control():
    """Update MC data file with printer status"""
    printers = get_printer_data()
    
    # Read current MC data
    mc_path = '/root/.openclaw/workspace/00-Mission-Control/mc-data-backup.json'
    try:
        with open(mc_path, 'r') as f:
            data = json.load(f)
    except:
        data = {}
    
    # Update printers
    data['printers'] = printers
    data['lastPrinterUpdate'] = json.dumps({'iso': subprocess.run(['date', '-Iseconds'], capture_output=True, text=True).stdout.strip()})
    
    # Save back
    with open(mc_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Updated {len(printers)} printers")

if __name__ == '__main__':
    update_mission_control()