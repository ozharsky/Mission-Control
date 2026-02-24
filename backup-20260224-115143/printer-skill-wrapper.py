#!/usr/bin/env python3
"""
3DPrint API - JSON wrapper for 3dprint skill
Calls the skill and converts output to JSON
"""

import json
import subprocess
import sys
import re

def parse_skill_output():
    """Run the 3dprint skill and parse its output"""
    try:
        # Run the skill
        result = subprocess.run(
            ['python3', '/root/.openclaw/skills/3dprint/3dprint.py'],
            capture_output=True,
            text=True,
            timeout=15
        )
        
        output = result.stdout
        
        # Parse printer data from the ASCII output
        printers = []
        
        # Split by printer sections
        sections = output.split('+----------------------------------------------------------+')
        
        for section in sections:
            printer = {}
            
            # Extract name
            name_match = re.search(r'PRINTER \d+/\d+: (.+)', section)
            if name_match:
                printer['name'] = name_match.group(1).strip()
            else:
                continue
            
            # Extract state
            if '🟢 PRINTING' in section or '✅ IDLE' in section:
                state = 'operational'
            elif '⏸️ PAUSED' in section:
                state = 'paused'
            elif '🔴 OFFLINE' in section:
                state = 'offline'
            else:
                state = 'operational'
            printer['state'] = state
            
            # Extract temps
            temp_match = re.search(r'🔥 Nozzle: (\d+)°C.*🛏️ Bed: (\d+)°C', section)
            if temp_match:
                printer['temps'] = {
                    'tool0': {'actual': int(temp_match.group(1))},
                    'bed': {'actual': int(temp_match.group(2))}
                }
            else:
                printer['temps'] = {'tool0': {'actual': 0}, 'bed': {'actual': 0}}
            
            # Extract job info
            if '📭 No active job' in section:
                printer['job'] = None
            else:
                # Try to find job details
                file_match = re.search(r'📄 (.+)', section)
                progress_match = re.search(r'(\d+)%', section)
                time_match = re.search(r'⏳ Remaining: ([\dhms ]+)', section)
                
                printer['job'] = {
                    'file': file_match.group(1) if file_match else 'Unknown',
                    'percentage': int(progress_match.group(1)) if progress_match else 0,
                    'timeLeft': time_match.group(1) if time_match else None
                }
            
            # Extract filament
            fil_match = re.search(r'🧵 FILAMENT:[\s\S]+?([⚪⚫🔴🟠🟡🟢🔵🟣🟤].+?)\n', section)
            if fil_match:
                fil_line = fil_match.group(1)
                # Parse color and type
                color_map = {
                    '⚪': 'White', '⚫': 'Black', '🔴': 'Red', '🟠': 'Orange',
                    '🟡': 'Yellow', '🟢': 'Green', '🔵': 'Blue', '🟣': 'Purple',
                    '🟤': 'Brown'
                }
                color = 'Unknown'
                for emoji, name in color_map.items():
                    if emoji in fil_line:
                        color = name
                        break
                
                # Extract type (PLA, PETG, etc.)
                type_match = re.search(r'(PLA|PETG|ABS|TPU|ASA|PC|NYLON)', fil_line.upper())
                fil_type = type_match.group(1) if type_match else 'Unknown'
                
                printer['filament'] = {'type': fil_type, 'color': '#888888'}
            else:
                printer['filament'] = {'type': 'Unknown', 'color': '#888888'}
            
            printers.append(printer)
        
        return printers
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        return []

if __name__ == "__main__":
    printers = parse_skill_output()
    print(json.dumps(printers))