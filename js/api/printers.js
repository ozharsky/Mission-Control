// SimplyPrint API integration via Vercel proxy
import { CONFIG, isPrinterConfigured } from '../config.js'

export const printerAPI = {
  getProxyUrl() {
    return CONFIG.simplyprint.proxyUrl
  },
  
  async getPrinters() {
    if (!isPrinterConfigured()) {
      console.warn('Printer API not configured')
      return getMockPrinters()
    }
    
    try {
      const res = await fetch(`${this.getProxyUrl()}?action=get_printers`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!res.ok) {
        console.warn('Printer API error, using mock data')
        return getMockPrinters()
      }
      
      const data = await res.json()
      return data.printers || getMockPrinters()
    } catch (e) {
      console.error('Printer API error:', e)
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
    const poll = async () => {
      const printers = await this.getPrinters()
      if (printers) callback(printers)
    }
    
    poll()
    return setInterval(poll, interval)
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
