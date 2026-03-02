// Mission Control V5 Configuration
// These values are stored in localStorage, not in code

export const APP_VERSION = 'v121'

export const CONFIG = {
  // Firebase Realtime Database
  get firebase() {
    return {
      databaseURL: localStorage.getItem('mc_firebase_url') || '',
      secret: localStorage.getItem('mc_firebase_secret') || ''
    }
  },
  
  // GitHub Backup
  get github() {
    return {
      token: localStorage.getItem('mc_github_token') || '',
      gistId: localStorage.getItem('mc_gist_id') || ''
    }
  },
  
  // SimplyPrint API (via Vercel proxy)
  get simplyprint() {
    return {
      proxyUrl: localStorage.getItem('mc_printer_proxy') || 'https://mission-control-fawn-eight.vercel.app/api/printers'
    }
  }
}

// Configuration helpers
export function isFirebaseConfigured() {
  return !!CONFIG.firebase.secret && !!CONFIG.firebase.databaseURL
}

export function isGitHubConfigured() {
  return !!CONFIG.github.token && !!CONFIG.github.gistId
}

export function isPrinterConfigured() {
  return !!CONFIG.simplyprint.proxyUrl
}

// Save configuration
export function saveFirebaseConfig(url, secret) {
  localStorage.setItem('mc_firebase_url', url)
  localStorage.setItem('mc_firebase_secret', secret)
}

export function saveGitHubConfig(token, gistId) {
  localStorage.setItem('mc_github_token', token)
  localStorage.setItem('mc_gist_id', gistId)
}

export function savePrinterConfig(proxyUrl) {
  localStorage.setItem('mc_printer_proxy', proxyUrl)
}

// Test connections
export async function testFirebaseConnection() {
  if (!isFirebaseConfigured()) return { success: false, error: 'Not configured' }
  
  try {
    const res = await fetch(`${CONFIG.firebase.databaseURL}/.json?auth=${CONFIG.firebase.secret}`, { method: 'GET' })
    if (res.ok) return { success: true }
    return { success: false, error: `HTTP ${res.status}` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export async function testGitHubConnection() {
  if (!isGitHubConfigured()) return { success: false, error: 'Not configured' }
  
  try {
    const res = await fetch(`https://api.github.com/gists/${CONFIG.github.gistId}`, {
      headers: { 'Authorization': `token ${CONFIG.github.token}` }
    })
    if (res.ok) return { success: true }
    return { success: false, error: `HTTP ${res.status}` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

export async function testPrinterConnection() {
  if (!isPrinterConfigured()) return { success: false, error: 'Not configured' }
  
  try {
    const res = await fetch(`${CONFIG.simplyprint.proxyUrl}?action=get_printers`)
    if (res.ok) return { success: true }
    return { success: false, error: `HTTP ${res.status}` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}
