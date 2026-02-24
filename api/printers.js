// Vercel Serverless Function - SimplyPrint Proxy
// Deploy this to Vercel and Mission Control can call it without CORS issues

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const API_KEY = process.env.SIMPLYPRINT_API_KEY;
  const COMPANY_ID = process.env.SIMPLYPRINT_COMPANY_ID || '40432';
  
  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'SIMPLYPRINT_API_KEY not configured',
      message: 'Add SIMPLYPRINT_API_KEY to Vercel environment variables'
    });
  }
  
  try {
    const response = await fetch(`https://api.simplyprint.io/${COMPANY_ID}/printers/Get`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ page: 1, page_size: 10 })
    });
    
    if (!response.ok) {
      throw new Error(`SimplyPrint API error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.status) {
      throw new Error(result.message || 'API returned error');
    }
    
    // Transform data - include ALL available printer information
    const printers = (result.data || []).map(printer => {
      const p = printer.printer || {};
      const job = printer.job;
      const filament = printer.filament;
      const tags = printer.tags;
      
      // Build filaments array from filament object
      const filaments = [];
      if (filament) {
        Object.values(filament).forEach(f => {
          filaments.push({
            slot: f.slot || 0,
            colorName: f.colorName || 'Unknown',
            colorHex: f.colorHex || '#808080',
            type: f.type?.name || 'PLA',
            typeId: f.type?.id,
            leftPercent: f.leftPercent,
            leftMm: f.left,
            totalMm: f.total,
            brand: f.brand,
            dia: f.dia,
            nozzle: f.nozzle,
            extruder: f.extruder
          });
        });
      }
      
      // Build tags/material info
      const materialTags = [];
      if (tags?.material) {
        tags.material.forEach(m => {
          materialTags.push({
            extruder: m.ext,
            type: m.type,
            color: m.color,
            hex: m.hex
          });
        });
      }
      
      return {
        // Basic Info
        id: printer.id,
        name: p.name || `Printer ${printer.id}`,
        state: p.state || 'unknown',
        online: p.online || false,
        
        // Connection & API
        api: p.api,
        ui: p.ui,
        ip: p.ip,
        firmware: p.firmware,
        spVersion: p.spVersion,
        region: p.region,
        latency: p.latency,
        
        // Model & Hardware
        model: p.model ? {
          id: p.model.id,
          name: p.model.name,
          brand: p.model.brand,
          bedSize: p.model.bedSize,
          bedType: p.model.bedType,
          maxHeight: p.model.maxHeight,
          image: p.model.image,
          hasHeatedBed: p.model.hasHeatedBed,
          extruders: p.model.extruders,
          maxToolTemp: p.model.maxToolTemp,
          maxBedTemp: p.model.maxBedTemp,
          filamentWidth: p.model.filamentWidth,
          nozzleDia: p.model.nozzleDia
        } : null,
        
        // Temperatures
        temps: {
          ambient: p.temps?.ambient,
          current: {
            tool: p.temps?.current?.tool,
            tool0: p.temps?.current?.tool?.[0],
            bed: p.temps?.current?.bed
          },
          target: {
            tool: p.temps?.target?.tool,
            bed: p.temps?.target?.bed
          }
        },
        
        // PSU & Sensors
        hasPSU: p.hasPSU,
        psuOn: p.psuOn,
        hasFilSensor: p.hasFilSensor,
        filSensor: p.filSensor,
        filamentRetraction: p.filamentRetraction,
        
        // Status & Health
        hasCam: p.hasCam,
        cameraUrl: p.webcam?.snapshotUrl || p.webcam?.url || p.webcam?.streamUrl || null,
        webcam: p.webcam ? {
          snapshotUrl: p.webcam.snapshotUrl,
          streamUrl: p.webcam.streamUrl,
          url: p.webcam.url
        } : null,
        health: p.health ? {
          usage: p.health.usage,
          temp: p.health.temp,
          memory: p.health.memory
        } : null,
        unsupported: p.unsupported,
        outOfOrder: p.outOfOrder,
        
        // Queue Info
        hasQueue: p.hasQueue ? {
          items: p.hasQueue.items,
          fits: p.hasQueue.fits
        } : null,
        
        // Current Job
        job: job ? {
          id: job.id,
          uid: job.uid,
          state: job.state,
          file: job.file || job.filename,
          percentage: job.percentage,
          time: job.time,
          timeLeft: job.timeLeft,
          printTime: job.printTime,
          printTimeLeft: job.printTimeLeft,
          layer: job.layer,
          canPreview: job.canPreview
        } : null,
        
        // Filament / AMS
        filaments: filaments,
        hasAMS: filaments.length > 1,
        
        // Tags
        tags: {
          nozzle: tags?.nozzle,
          material: materialTags,
          custom: tags?.custom
        },
        
        // Sort/Group
        sortOrder: printer.sort_order,
        group: p.group,
        position: p.position
      };
    });
    
    return res.status(200).json(printers);
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}