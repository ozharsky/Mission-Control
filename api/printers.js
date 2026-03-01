// Vercel Serverless API for SimplyPrint Proxy
// Handles CORS and forwards requests to SimplyPrint API

export default async function handler(req, res) {
  // Set CORS headers FIRST (before any other code)
  res.setHeader('Access-Control-Allow-Origin', 'https://ozharsky.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY');
  
  // Handle preflight OPTIONS request immediately
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { action, printer_id, test, debug } = req.query;
  
    // Handle test request
    if (test === 'env') {
      return res.status(200).json({
        hasApiKey: !!process.env.SIMPLYPRINT_API_KEY,
        hasCompanyId: !!process.env.SIMPLYPRINT_COMPANY_ID,
        companyId: process.env.SIMPLYPRINT_COMPANY_ID ? process.env.SIMPLYPRINT_COMPANY_ID.substring(0, 5) + '...' : null
      });
    }
    
    // Get SimplyPrint credentials from environment variables
    const apiKey = process.env.SIMPLYPRINT_API_KEY;
    const companyId = process.env.SIMPLYPRINT_COMPANY_ID;
    
    console.log('[Vercel API] Env vars:', { 
      hasApiKey: !!apiKey, 
      hasCompanyId: !!companyId,
      companyId: companyId ? companyId.substring(0, 5) + '...' : null
    });
    
    if (!apiKey || !companyId) {
      return res.status(500).json({ 
        error: 'SimplyPrint not configured',
        message: 'API key or Company ID missing'
      });
    }
    
    // SimplyPrint API uses POST not GET
    const simplyPrintUrl = `https://api.simplyprint.io/${companyId}/printers/Get`;
    
    const response = await fetch(simplyPrintUrl, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        page: 1,
        page_size: 100
      })
    });
    
    console.log('[Vercel API] SimplyPrint response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('[Vercel API] SimplyPrint error:', errorText);
      throw new Error(`SimplyPrint API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[Vercel API] SimplyPrint raw response:', JSON.stringify(data));
    
    // Return the raw response for debugging
    if (debug === 'raw') {
      return res.status(200).json({ 
        simplyPrintResponse: data,
        endpointUsed: simplyPrintUrl,
        companyId: companyId.substring(0, 5) + '...'
      });
    }
    
    // Transform SimplyPrint data to frontend format
    // SimplyPrint returns { status: true, data: [{ printer: { name, state, temps, ... }, job: {...} }] }
    let printers = [];
    if (data.status && Array.isArray(data.data)) {
      printers = data.data.map((item, index) => {
        const p = item.printer || {};
        const job = item.job || {};
        
        return {
          id: item.id || index + 1,
          name: p.name || `Printer ${index + 1}`,
          status: p.state === 'printing' ? 'printing' : 
                  p.state === 'paused' ? 'paused' :
                  p.state === 'error' ? 'error' :
                  p.online ? 'operational' : 'offline',
          temp: p.temps?.current?.tool?.[0] || 0,
          targetTemp: p.temps?.target?.tool?.[0] || 0,
          bedTemp: p.temps?.current?.bed || 0,
          targetBedTemp: p.temps?.target?.bed || 0,
          progress: job.percentage || 0,
          job: job.state ? {
            name: job.file || 'Unknown',
            timeLeft: job.time ? Math.max(0, job.time - (job.time * (job.percentage || 0) / 100)) : 0
          } : null,
          hasAMS: false,
          filaments: []
        };
      });
    }
    
    console.log('[Vercel API] Transformed printers:', printers.length);
    
    return res.status(200).json({ printers });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch from SimplyPrint',
      message: error.message
    });
  }
}
