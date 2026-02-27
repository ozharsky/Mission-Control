// Offline Detection and Handling
import { toast } from './Toast.js'

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.wasOffline = false
    this.offlineTimestamp = null
    this.listeners = new Set()
    
    this.init()
  }
  
  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
    
    // Check initial state
    if (!this.isOnline) {
      this.handleOffline()
    }
    
    // Periodic connectivity check
    setInterval(() => this.checkConnectivity(), 30000)
  }
  
  handleOnline() {
    this.isOnline = true
    
    if (this.wasOffline) {
      const duration = this.offlineTimestamp 
        ? Math.round((Date.now() - this.offlineTimestamp) / 1000)
        : 0
      
      toast.success(
        'Back Online',
        duration > 0 
          ? `Connection restored after ${this.formatDuration(duration)}`
          : 'Connection restored'
      )
      
      this.wasOffline = false
      this.offlineTimestamp = null
      
      // Notify listeners
      this.notifyListeners({ type: 'online', duration })
      
      // Trigger sync if needed
      this.syncOfflineData()
    }
  }
  
  handleOffline() {
    this.isOnline = false
    this.wasOffline = true
    this.offlineTimestamp = Date.now()
    
    toast.warning(
      'Offline',
      'You are offline. Changes will be saved locally.',
      5000
    )
    
    // Notify listeners
    this.notifyListeners({ type: 'offline' })
  }
  
  async checkConnectivity() {
    if (!navigator.onLine) return
    
    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/manifest.json', { 
        method: 'HEAD',
        cache: 'no-store',
        timeout: 5000
      })
      
      if (!response.ok && this.isOnline) {
        // Browser thinks we're online but we can't reach server
        this.handleOffline()
      }
    } catch (error) {
      if (this.isOnline) {
        this.handleOffline()
      }
    }
  }
  
  syncOfflineData() {
    // Trigger any pending sync operations
    console.log('Syncing offline data...')
    
    // Dispatch event for sections to handle
    window.dispatchEvent(new CustomEvent('app:sync'))
  }
  
  formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }
  
  subscribe(listener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  
  notifyListeners(data) {
    this.listeners.forEach(listener => {
      try {
        listener(data)
      } catch (e) {
        console.error('Error in offline listener:', e)
      }
    })
  }
  
  getStatus() {
    return {
      online: this.isOnline,
      wasOffline: this.wasOffline,
      offlineSince: this.offlineTimestamp
    }
  }
}

export const offlineManager = new OfflineManager()

// Network-aware fetch wrapper
export async function safeFetch(url, options = {}) {
  if (!offlineManager.isOnline) {
    throw new Error('Offline - cannot fetch')
  }
  
  try {
    const response = await fetch(url, options)
    return response
  } catch (error) {
    if (!navigator.onLine) {
      offlineManager.handleOffline()
    }
    throw error
  }
}

// Queue actions for when back online
class OfflineQueue {
  constructor() {
    this.queue = []
    this.storageKey = 'mc-offline-queue'
    this.loadQueue()
    
    // Process queue when back online
    offlineManager.subscribe((status) => {
      if (status.type === 'online') {
        this.processQueue()
      }
    })
  }
  
  loadQueue() {
    try {
      const saved = localStorage.getItem(this.storageKey)
      if (saved) {
        this.queue = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load offline queue:', e)
    }
  }
  
  saveQueue() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue))
    } catch (e) {
      console.error('Failed to save offline queue:', e)
    }
  }
  
  add(action) {
    this.queue.push({
      id: Date.now().toString(),
      action,
      timestamp: Date.now()
    })
    this.saveQueue()
  }
  
  async processQueue() {
    if (this.queue.length === 0) return
    
    console.log(`Processing ${this.queue.length} offline actions...`)
    
    const failed = []
    
    for (const item of this.queue) {
      try {
        await item.action()
      } catch (error) {
        console.error('Failed to process offline action:', error)
        failed.push(item)
      }
    }
    
    this.queue = failed
    this.saveQueue()
    
    if (failed.length > 0) {
      toast.warning(
        'Sync Issues',
        `${failed.length} actions failed to sync`
      )
    }
  }
  
  clear() {
    this.queue = []
    this.saveQueue()
  }
  
  get length() {
    return this.queue.length
  }
}

export const offlineQueue = new OfflineQueue()
