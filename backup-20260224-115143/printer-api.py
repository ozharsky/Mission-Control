#!/usr/bin/env python3
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

def format_time(seconds):
    if not seconds:
        return None
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours > 0:
        return f"{hours}h {minutes}m"
    return f"{minutes}m"

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
                job = p.get("job", {})
                filament = p.get("filament", {})
                temps = printer_info.get("temps", {})
                current = temps.get("current", {}) if temps else {}
                target = temps.get("target", {}) if temps else {}
                model = printer_info.get("model", {})
                
                # Job info with more details
                job_data = None
                if job and job.get("file"):
                    layer_data = job.get("layer")
                    if isinstance(layer_data, dict):
                        layer_current = layer_data.get("current")
                        layer_total = layer_data.get("total")
                    else:
                        layer_current = None
                        layer_total = None
                    
                    job_data = {
                        "file": job.get("file", "Unknown"),
                        "percentage": job.get("percentage", 0),
                        "timeLeft": format_time(job.get("timeLeft")),
                        "timeElapsed": format_time(job.get("time")),
                        "layer": layer_current,
                        "totalLayers": layer_total
                    }
                
                # All filament spools with details
                filaments = []
                if filament:
                    for key in sorted(filament.keys()):
                        spool = filament.get(key)
                        if spool and isinstance(spool, dict):
                            fil_type = spool.get("type", "Unknown")
                            if isinstance(fil_type, dict):
                                fil_type = fil_type.get("name", "Unknown")
                            
                            total = spool.get("total", 1)
                            left = spool.get("left", total)
                            
                            filaments.append({
                                "slot": key,
                                "type": fil_type,
                                "color": spool.get("colorHex", "#888888"),
                                "colorName": spool.get("colorName", "Unknown"),
                                "brand": spool.get("brand", ""),
                                "leftPercent": round((left / total) * 100, 1) if total else 100,
                                "diameter": spool.get("dia", 1.75)
                            })
                
                if not filaments:
                    filaments = [{"type": "Unknown", "color": "#888888", "colorName": "Unknown"}]
                
                # Nozzle info
                nozzle_data = model.get("nozzleData", [{}])[0] if model.get("nozzleData") else {}
                
                printers.append({
                    "id": p.get("id"),
                    "name": printer_info.get("name", "Unknown"),
                    "state": printer_info.get("state", "unknown"),
                    "model": model.get("name", ""),
                    "brand": model.get("brand", ""),
                    "online": printer_info.get("online", False),
                    "firmware": printer_info.get("firmwareVersion", ""),
                    "ip": printer_info.get("ip", ""),
                    "temps": {
                        "tool0": {
                            "actual": current.get("tool", [0])[0] if current else 0,
                            "target": target.get("tool", [0])[0] if target else 0
                        },
                        "bed": {
                            "actual": current.get("bed", 0) if current else 0,
                            "target": target.get("bed", 0) if target else 0
                        }
                    },
                    "job": job_data,
                    "filaments": filaments,
                    "hasAMS": len(filaments) > 1,
                    "nozzle": {
                        "type": nozzle_data.get("type", ""),
                        "size": nozzle_data.get("size", 0.4),
                        "count": model.get("nozzles", 1)
                    },
                    "bedSize": model.get("bedSize", [256, 256]),
                    "maxHeight": model.get("maxHeight", 256),
                    "image": model.get("image", "")
                })
            return printers
    except Exception as e:
        print(f"Error: {e}", file=__import__('sys').stderr)
    
    return []

if __name__ == "__main__":
    printers = get_printers()
    print(json.dumps(printers))
