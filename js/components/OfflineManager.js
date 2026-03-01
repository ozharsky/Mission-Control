/**
 * Offline Manager
 * Handle online/offline state, sync queue, and connectivity monitoring
 */

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine
    this.syncQueue = []
    this.listeners = new Set()
    this.connectionQuality = 'unknown'
    this.lastSyncTime = null
    this.syncInProgress = false
    
    this.init()
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
    
    // Monitor connection quality
    this.monitorConnectionQuality()
    
    // Initial state
    this.updateConnectionQuality()
  }

  /**
   * Handle going online
   */
  handleOnline() {
    this.isOnline = true
    this.notifyListeners({ type: 'online', wasOffline: true })
    
    // Show toast
    if (window.toast) {
      window.toast.success('Back Online', 'Syncing your changes...', 3000)
    }
    
    // Process sync queue
    this.processSyncQueue()
  }

  /**
   * Handle going offline
   */
  handleOffline() {
    this.isOnline = false
    this.notifyListeners({ type: 'offline' })
    
    // Show toast
    if (window.toast) {
      window.toast.warning('Offline Mode', 'Changes will sync when you\'re back online', 5000)
    }
  }

  /**
   * Add item to sync queue
   * @param {Object} item - Sync item
   */
  queueForSync(item) {
    this.syncQueue.push({
      ...item,
      timestamp: Date.now(),
      retries: 0
    })
    
    // Persist queue
    this.persistQueue()
    
    // Try to sync if online
    if (this.isOnline) {
      this.processSyncQueue()
    }
  }

  /**
   * Process the sync queue
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return
    }

    this.syncInProgress = true
    const processed = []
    const failed = []

    for (const item of this.syncQueue) {
      try {
        await this.syncItem(item)
        processed.push(item)
      } catch (error) {
        item.retries++
        if (item.retries >= 3) {
          failed.push(item)
        }
      }
    }

    // Remove processed items
    this.syncQueue = this.syncQueue.filter(item => 
      !processed.includes(item) && !failed.includes(item)
    )

    // Persist updated queue
    this.persistQueue()

    // Update last sync time
    this.lastSyncTime = Date.now()

    // Notify about results
    if (processed.length > 0) {
      this.notifyListeners({ 
        type: 'syncComplete', 
        processed: processed.length,
        failed: failed.length 
      })
    }

    this.syncInProgress = false
  }

  /**
   * Sync a single item
   * @param {Object} item - Item to sync
   */
  async syncItem(item) {
    // This would integrate with your actual sync logic
    // For now, just simulate success
    return new Promise((resolve, reject) => {
      if (item.action && typeof item.action === 'function') {
        Promise.resolve(item.action())
          .then(resolve)
          .catch(reject)
      } else {
        resolve()
      }
    })
  }

  /**
   * Persist queue to localStorage
   */
  persistQueue() {
    try {
      localStorage.setItem('mc_sync_queue', JSON.stringify(this.syncQueue))
    } catch (e) {
      console.warn('Failed to persist sync queue:', e)
    }
  }

  /**
   * Restore queue from localStorage
   */
  restoreQueue() {
    try {
      const stored = localStorage.getItem('mc_sync_queue')
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to restore sync queue:', e)
      this.syncQueue = []
    }
  }

  /**
   * Monitor connection quality
   */
  monitorConnectionQuality() {
    // Use Network Information API if available
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', () => {
        this.updateConnectionQuality()
      })
    }

    // Periodic check
    setInterval(() => this.updateConnectionQuality(), 30000)
  }

  /**
   * Update connection quality assessment
   */
  updateConnectionQuality() {
    if (!this.isOnline) {
      this.connectionQuality = 'offline'
      return
    }

    if ('connection' in navigator) {
      const connection = navigator.connection
      
      if (connection.effectiveType) {
        this.connectionQuality = connection.effectiveType // '4g', '3g', '2g', 'slow-2g'
      } else if (connection.downlink) {
        if (connection.downlink > 1.5) {
          this.connectionQuality = '4g'
        } else if (connection.downlink > 0.4) {
          this.connectionQuality = '3g'
        } else {
          this.connectionQuality = '2g'
        }
      }
    } else {
      // Fallback: use online status
      this.connectionQuality = this.isOnline ? 'unknown' : 'offline'
    }

    this.notifyListeners({ 
      type: 'qualityChange', 
      quality: this.connectionQuality 
    })
  }

  /**
   * Check if connection is slow
   * @returns {boolean}
   */
  isSlowConnection() {
    return ['2g', 'slow-2g'].includes(this.connectionQuality)
  }

  /**
   * Subscribe to offline manager events
   * @param {Function} callback - Event callback
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notify all listeners
   * @param {Object} event - Event object
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Offline manager listener error:', error)
      }
    })
  }

  /**
   * Get current status
   * @returns {Object} Status object
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      connectionQuality: this.connectionQuality,
      queueSize: this.syncQueue.length,
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress
    }
  }

  /**
   * Create an offline-aware fetch wrapper
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise} Fetch promise
   */
  async fetch(url, options = {}) {
    if (!this.isOnline) {
      // Queue for later if it's a mutating request
      if (options.method && options.method !== 'GET') {
        this.queueForSync({
          type: 'fetch',
          url,
          options,
          action: () => fetch(url, options)
        })
        throw new Error('Offline: Request queued for sync')
      }
      
      // Try to get from cache
      const cached = await this.getCachedResponse(url)
      if (cached) {
        return cached
      }
      
      throw new Error('Offline: No cached response available')
    }

    try {
      const response = await fetch(url, options)
      
      // Cache successful GET requests
      if (options.method === 'GET' || !options.method) {
        await this.cacheResponse(url, response.clone())
      }
      
      return response
    } catch (error) {
      // Try cache as fallback
      const cached = await this.getCachedResponse(url)
      if (cached) {
        return cached
      }
      throw error
    }
  }

  /**
   * Cache a response
   * @param {string} url - URL
   * @param {Response} response - Response to cache
   */
  async cacheResponse(url, response) {
    try {
      const cache = await caches.open('mc-offline-cache')
      await cache.put(url, response)
    } catch (e) {
      console.warn('Failed to cache response:', e)
    }
  }

  /**
   * Get cached response
   * @param {string} url - URL
   * @returns {Promise<Response|null>}
   */
  async getCachedResponse(url) {
    try {
      const cache = await caches.open('mc-offline-cache')
      return await cache.match(url)
    } catch (e) {
      return null
    }
  }

  /**
   * Clear offline cache
   */
  async clearCache() {
    try {
      await caches.delete('mc-offline-cache')
    } catch (e) {
      console.warn('Failed to clear cache:', e)
    }
  }
}

// Create singleton instance
export const offlineManager = new OfflineManager()

// Restore queue on load
offlineManager.restoreQueue()

// Expose globally
window.offlineManager = offlineManager
