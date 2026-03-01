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
  
  const { action, printer_id, test } = req.query;
  
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
    if (req.query.debug === 'raw') {
      return res.status(200).json({ 
        simplyPrintResponse: data,
        endpointUsed: simplyPrintUrl,
        companyId: companyId.substring(0, 5) + '...'
      });
    }
    
    // Transform SimplyPrint data to expected format
    // SimplyPrint returns { status: true, data: [...] }
    let printers = [];
    if (data.status && Array.isArray(data.data)) {
      printers = data.data;
    } else if (Array.isArray(data)) {
      printers = data;
    } else if (data.printers) {
      printers = data.printers;
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
