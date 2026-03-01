// SimplyPrint API integration via Vercel proxy
import { CONFIG, isPrinterConfigured } from '../config.js'

export const printerAPI = {
  getProxyUrl() {
    return CONFIG.simplyprint.proxyUrl
  },
  
  async getPrinters() {
    if (!isPrinterConfigured()) {
      console.warn('[Printers] API not configured')
      return getMockPrinters()
    }
    
    try {
      const url = `${this.getProxyUrl()}?action=get_printers`
      console.log('[Printers] Fetching from:', url)
      
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      console.log('[Printers] Response status:', res.status, res.ok)
      
      if (!res.ok) {
        console.warn('[Printers] API error (status:', res.status, '), using mock data')
        return getMockPrinters()
      }
      
      const data = await res.json()
      console.log('[Printers] Response data:', data)
      
      // Check if API returned an error
      if (data.error) {
        console.warn('[Printers] API returned error:', data.error)
        return getMockPrinters()
      }
      
      // Check if printers array is empty
      if (!data.printers || data.printers.length === 0) {
        console.warn('[Printers] API returned empty printers array, using mock data')
        return getMockPrinters()
      }
      
      return data.printers
    } catch (e) {
      console.warn('[Printers] API unavailable (CORS/network error):', e.message)
      return getMockPrinters()
    }
  },
  
  async getPrinterStatus(printerId) {
    if (!isPrinterConfigured()) return null
    
    try {
      const res = await fetch(`${this.getProxyUrl()}?action=get_status&printer_id=${printerId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!res.ok) throw new Error('Printer status failed')
      return await res.json()
    } catch (e) {
      console.error('Printer status error:', e)
      return null
    }
  },
  
  startPolling(callback, interval = 30000) {
    // Polling disabled due to CORS issues with Vercel proxy
    console.log('[Printers] Polling disabled - using manual refresh only')
    return null
  },
  
  stopPolling(intervalId) {
    clearInterval(intervalId)
  }
}

// Mock data for testing
function getMockPrinters() {
  return [
    {
      id: 1,
      name: 'P1S',
      status: 'operational',
      temp: 215,
      targetTemp: 215,
      bedTemp: 60,
      targetBedTemp: 60,
      progress: 0,
      job: null
    },
    {
      id: 2,
      name: 'P2S',
      status: 'printing',
      temp: 220,
      targetTemp: 220,
      bedTemp: 65,
      targetBedTemp: 65,
      progress: 45,
      job: { name: 'Test Print.gcode', timeLeft: 3600 }
    }
  ]
}
