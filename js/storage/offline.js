// Offline queue and sync manager
// Handles offline changes and syncs when back online

import { store } from '../state/store.js'
import { Toast } from '../components/Toast.js'

const QUEUE_KEY = 'mc-offline-queue'
const SYNC_INTERVAL = 30000 // 30 seconds

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.syncInProgress = false
    this.queue = this.loadQueue()
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
    
    // Start periodic sync
    setInterval(() => this.processQueue(), SYNC_INTERVAL)
  }
  
  loadQueue() {
    try {
      const saved = localStorage.getItem(QUEUE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Failed to load offline queue:', e)
      return []
    }
  }
  
  saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue))
    } catch (e) {
      console.error('Failed to save offline queue:', e)
      // Queue might be too large - remove oldest items
      if (this.queue.length > 50) {
        this.queue = this.queue.slice(-50)
        localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue))
      }
    }
  }
  
  handleOnline() {
    this.isOnline = true
    console.log('🌐 Back online')
    Toast.success('Back online', 'Syncing changes...')
    this.processQueue()
  }
  
  handleOffline() {
    this.isOnline = false
    console.log('📴 Gone offline')
    Toast.info('Offline mode', 'Changes will sync when back online')
  }
  
  // Add operation to queue
  queueOperation(type, path, data) {
    const operation = {
      id: Date.now() + Math.random(),
      type, // 'set', 'update', 'delete'
      path,
      data,
      timestamp: Date.now(),
      retries: 0
    }
    
    this.queue.push(operation)
    this.saveQueue()
    
    // Try to sync immediately if online
    if (this.isOnline) {
      this.processQueue()
    }
    
    return operation.id
  }
  
  // Process queued operations
  async processQueue() {
    if (!this.isOnline || this.syncInProgress || this.queue.length === 0) {
      return
    }
    
    this.syncInProgress = true
    const processed = []
    const failed = []
    
    for (const op of this.queue) {
      try {
        await this.executeOperation(op)
        processed.push(op.id)
      } catch (e) {
        op.retries++
        if (op.retries > 3) {
          failed.push(op)
          processed.push(op.id)
        }
      }
    }
    
    // Remove processed items from queue
    this.queue = this.queue.filter(op => !processed.includes(op.id))
    this.saveQueue()
    
    if (processed.length > 0) {
      console.log(`✅ Synced ${processed.length} operations`)
    }
    
    if (failed.length > 0) {
      console.error(`❌ Failed to sync ${failed.length} operations`)
      Toast.error('Sync failed', `${failed.length} changes could not be synced`)
    }
    
    this.syncInProgress = false
  }
  
  async executeOperation(op) {
    // Apply to local store
    if (op.type === 'set') {
      store.set(op.path, op.data)
    } else if (op.type === 'update') {
      const current = store.get(op.path) || {}
      store.set(op.path, { ...current, ...op.data })
    } else if (op.type === 'delete') {
      store.set(op.path, null)
    }
    
    // In a real implementation, this would also sync to Firebase
    // For now, we just apply locally
    return true
  }
  
  // Get queue status
  getStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      syncInProgress: this.syncInProgress
    }
  }
  
  // Clear queue (use with caution)
  clearQueue() {
    this.queue = []
    this.saveQueue()
  }
}

// Export singleton
export const offlineManager = new OfflineManager()

// Wrapper for store operations that adds offline support
export function offlineSafeSet(path, value) {
  // Always set locally first
  store.set(path, value)
  
  // Queue for sync if offline
  if (!navigator.onLine) {
    offlineManager.queueOperation('set', path, value)
  }
}

// Wrapper for store operations
export function offlineSafeUpdate(path, updates) {
  const current = store.get(path) || {}
  const newValue = { ...current, ...updates }
  store.set(path, newValue)
  
  if (!navigator.onLine) {
    offlineManager.queueOperation('update', path, updates)
  }
}