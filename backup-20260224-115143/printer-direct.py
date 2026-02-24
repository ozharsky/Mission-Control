#!/usr/bin/env python3
"""
Direct SimplyPrint API access for Mac
"""

import json
import requests

API_KEY = "a7b83b12-7a19-49e7-988e-b90cc19b08b8"
COMPANY_ID = "40432"
BASE_URL = f"https://api.simplyprint.io/{COMPANY_ID}"

HEADERS = {
    "accept": "application/json",
    "X-API-KEY": API_KEY,
    "Content-Type": "application/json"
}

def get_printers():
    url = f"{BASE_URL}/printers/Get"
    payload = {"page": 1, "page_size": 10}
    
    try:
        response = requests.post(url, headers=HEADERS, json=payload, timeout=10)
        data = response.json()
        
        if data.get("status"):
            printers = []
            for p in data.get("data", []):
                printer_info = p.get("printer", {})
                temps = printer_info.get("temps", {})
                current = temps.get("current", {}) if temps else {}
                
                printers.append({
                    "name": printer_info.get("name", "Unknown"),
                    "state": printer_info.get("state", "unknown"),
                    "temps": {
                        "tool0": {"actual": current.get("tool", [0])[0] if current else 0},
                        "bed": {"actual": current.get("bed", 0) if current else 0}
                    },
                    "job": None,
                    "filament": {"type": "Unknown", "color": "#888888"}
                })
            return printers
    except Exception as e:
        print(f"Error: {e}", file=__import__('sys').stderr)
    
    return []

if __name__ == "__main__":
    printers = get_printers()
    print(json.dumps(printers))
