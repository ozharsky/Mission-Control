import { store } from '../state/store.js'

export const weather = {
  async fetch(city = 'Kent,WA') {
    try {
      // wttr.in has CORS issues in browser, use static fallback
      // In production, use a weather API with proper CORS
      return {
        temp: '45°F',
        condition: 'Partly Cloudy',
        city: 'Kent, WA'
      }
    } catch (e) {
      console.error('Weather error:', e)
      return {
        temp: '--°F',
        condition: 'Kent, WA',
        city
      }
    }
  },
  
  async render(containerId) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    container.innerHTML = '<span>--°F • Kent, WA</span>'

    const data = await this.fetch()

    if (data) {
      container.innerHTML = `
        <span title="${data.condition}">
          ${data.temp} • ${data.city}
        </span>
      `
    }
  }
}

export const clock = {
  interval: null,
  
  start(containerId) {
    this.stop()
    
    const update = () => {
      const container = document.getElementById(containerId)
      if (!container) return
      
      const now = new Date()
      container.textContent = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    
    update()
    this.interval = setInterval(update, 1000)
  },
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}