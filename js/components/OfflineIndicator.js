// Offline Indicator - Shows connection status

import { Toast } from './Toast.js'
import { icon } from '../utils/icons.js'

class OfflineIndicator {
  constructor() {
    this.isOnline = navigator.onLine
    this.wasOffline = false
    this.indicator = null
    this.init()
  }

  init() {
    // Create indicator element
    this.createIndicator()
    
    // Listen for connection changes
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
    
    // Check initial state
    if (!this.isOnline) {
      this.showOffline()
    }
  }

  createIndicator() {
    this.indicator = document.createElement('div')
    this.indicator.className = 'offline-indicator'
    this.indicator.innerHTML = `
      <span class="offline-icon">${icon('alert-triangle')}</span>
      <span class="offline-text">You're offline</span>
      <span class="offline-subtext">Changes will sync when connection is restored</span>
    `
    document.body.appendChild(this.indicator)
  }

  handleOnline() {
    this.isOnline = true
    this.hideOffline()
    
    if (this.wasOffline) {
      Toast.success('Back online', 'Your changes will now sync', 3000)
      this.wasOffline = false
      
      // Trigger sync
      this.triggerSync()
    }
  }

  handleOffline() {
    this.isOnline = false
    this.wasOffline = true
    this.showOffline()
    Toast.warning('You\'re offline', 'Changes saved locally', 3000)
  }

  showOffline() {
    this.indicator?.classList.add('visible')
  }

  hideOffline() {
    this.indicator?.classList.remove('visible')
  }

  triggerSync() {
    // Dispatch custom event for sync
    window.dispatchEvent(new CustomEvent('mc:sync'))
  }

  checkConnection() {
    // Additional check - ping a reliable endpoint
    return fetch('https://www.google.com/favicon.ico', { 
      mode: 'no-cors',
      cache: 'no-store'
    })
    .then(() => true)
    .catch(() => false)
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    this.indicator?.remove()
  }
}

export const offlineIndicator = new OfflineIndicator()
window.offlineIndicator = offlineIndicator