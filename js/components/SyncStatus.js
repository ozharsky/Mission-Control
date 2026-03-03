// Sync Status Indicator - Shows Firebase/GitHub sync status

import { store } from '../state/store.js'
import { icon } from '../utils/icons.js'

class SyncStatus {
  constructor() {
    this.status = 'idle' // idle, syncing, synced, error
    this.lastSync = null
    this.indicator = null
    this.init()
  }

  init() {
    this.createIndicator()
    this.listenForChanges()
  }

  createIndicator() {
    this.indicator = document.createElement('div')
    this.indicator.className = 'sync-status m-touch'
    this.indicator.innerHTML = `
      <span class="sync-icon">${icon('cloud', 'sync-status-icon')}</span>
      <span class="sync-text">Synced</span>
      <span class="sync-time"></span>
    `
    
    // Add to nav footer or header
    const navFooter = document.querySelector('.nav-footer')
    if (navFooter) {
      navFooter.insertBefore(this.indicator, navFooter.firstChild)
    }
  }

  listenForChanges() {
    // Listen for storage changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'mc-data') {
        this.setStatus('synced')
      }
    })

    // Listen for custom sync events
    window.addEventListener('mc:sync-start', () => this.setStatus('syncing'))
    window.addEventListener('mc:sync-success', () => this.setStatus('synced'))
    window.addEventListener('mc:sync-error', () => this.setStatus('error'))

    // Subscribe to store changes
    store.subscribe(() => {
      this.setStatus('syncing')
      // Debounce the synced status
      clearTimeout(this.syncTimeout)
      this.syncTimeout = setTimeout(() => {
        this.setStatus('synced')
      }, 1000)
    })
  }

  setStatus(status) {
    this.status = status
    this.updateUI()
  }

  updateUI() {
    if (!this.indicator) return

    const iconEl = this.indicator.querySelector('.sync-icon')
    const text = this.indicator.querySelector('.sync-text')
    const time = this.indicator.querySelector('.sync-time')

    this.indicator.className = `sync-status sync-${this.status} m-touch`

    switch (this.status) {
      case 'idle':
        iconEl.innerHTML = icon('cloud', 'sync-status-icon')
        text.textContent = 'Ready'
        break
      case 'syncing':
        iconEl.innerHTML = icon('refresh-cw', 'sync-status-icon sync-spin')
        text.textContent = 'Syncing...'
        break
      case 'synced':
        iconEl.innerHTML = icon('check-circle', 'sync-status-icon')
        text.textContent = 'Synced'
        this.lastSync = new Date()
        break
      case 'error':
        iconEl.innerHTML = icon('alert-triangle', 'sync-status-icon')
        text.textContent = 'Sync failed'
        break
    }

    if (this.lastSync) {
      time.textContent = this.formatTime(this.lastSync)
    }
  }

  formatTime(date) {
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)

    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  destroy() {
    this.indicator?.remove()
  }
}

export const syncStatus = new SyncStatus()
window.syncStatus = syncStatus