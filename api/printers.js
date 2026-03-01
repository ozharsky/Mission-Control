// Vercel Serverless API for SimplyPrint Proxy
// Handles CORS and forwards requests to SimplyPrint API

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://ozharsky.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { action, printer_id } = req.query;
  
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
  
  try {
    let simplyPrintUrl;
    
    switch (action) {
      case 'get_printers':
        simplyPrintUrl = `https://api.simplyprint.io/${companyId}/printers`;
        break;
      case 'get_status':
        if (!printer_id) {
          return res.status(400).json({ error: 'printer_id required' });
        }
        simplyPrintUrl = `https://api.simplyprint.io/${companyId}/printers/${printer_id}/status`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Forward request to SimplyPrint
    // SimplyPrint uses X-API-KEY header
    const response = await fetch(simplyPrintUrl, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      }
    });
    
    console.log('[Vercel API] SimplyPrint response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('[Vercel API] SimplyPrint error:', errorText);
      throw new Error(`SimplyPrint API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[Vercel API] SimplyPrint raw response:', JSON.stringify(data));
    
    // Transform SimplyPrint data to expected format
    let printers = [];
    if (Array.isArray(data)) {
      printers = data;
    } else if (data.printers) {
      printers = data.printers;
    } else if (data.data) {
      printers = data.data;
    }
    
    console.log('[Vercel API] Transformed printers count:', printers.length);
    
    return res.status(200).json({ printers });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch from SimplyPrint',
      message: error.message
    });
  }
}
