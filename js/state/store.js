// State Manager - Centralized state management with debounced notifications
// Optimized for performance with batched updates and memory management

import { dashboardCache } from '../utils/cache.js'

function debounce(fn, delay) {
  let timeoutId
  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

export const store = {
  data: {
    priorities: [],
    projects: { backlog: [], todo: [], inprogress: [], done: [] },
    revenueHistory: [],
    leads: [],
    events: [],
    skus: [],
    docs: [],
    notes: [],
    printers: [],
    orders: 0,
    ordersTarget: 150,
    revenueGoal: 5400,
    goalDate: '2026-05-01',
    currentBoard: 'all',
    _version: '4.0'
  },

  listeners: new Set(),
  pendingPath: '',
  maxListeners: 100, // Prevent memory leaks
  _debugMode: false,
  _updateQueue: [],
  _isBatching: false,

  subscribe(fn, options = {}) {
    // Callback validation before subscription
    if (typeof fn !== 'function') {
      console.warn('Store.subscribe: expected function, got', typeof fn)
      return () => {}
    }
    
    // Validate callback name for debugging
    if (this._debugMode && !fn.name) {
      console.warn('Store.subscribe: anonymous functions make debugging harder. Consider naming your callback.')
    }
    
    // Memory leak detection - warn at 100 listeners
    if (this.listeners.size >= 100) {
      console.warn(`⚠️ Store has ${this.listeners.size} listeners. Potential memory leak detected!`)
      if (this._debugMode) {
        console.log('Current listeners:', Array.from(this.listeners).map(l => l.name || 'anonymous'))
        console.trace('Subscription trace:')
      }
    } else if (this.listeners.size >= this.maxListeners) {
      console.warn(`Store has ${this.listeners.size} listeners. Potential memory leak?`)
      if (this._debugMode) {
        console.log('Current listeners:', Array.from(this.listeners).map(l => l.name || 'anonymous'))
      }
    }
    
    this.listeners.add(fn)
    
    // Auto-unsubscribe after timeout if specified
    let autoUnsubscribeTimer
    if (options.timeout) {
      autoUnsubscribeTimer = setTimeout(() => {
        this.unsubscribe(fn)
        if (this._debugMode) {
          console.log('Auto-unsubscribed listener after timeout:', options.timeout)
        }
      }, options.timeout)
    }
    
    return () => {
      if (autoUnsubscribeTimer) clearTimeout(autoUnsubscribeTimer)
      this.listeners.delete(fn)
    }
  },

  unsubscribe(fn) {
    if (typeof fn !== 'function') {
      console.warn('Store.unsubscribe: expected function, got', typeof fn)
      return false
    }
    return this.listeners.delete(fn)
  },

  notify(path = '') {
    // Debounce notifications to batch rapid updates
    this.pendingPath = path
    this._debouncedNotify()
  },

  _debouncedNotify: debounce(function() {
    const path = this.pendingPath
    this.pendingPath = ''
    
    // Clear dashboard cache on state change
    if (path) {
      dashboardCache.delete(path)
    }
    
    // Use requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
      const state = this.getState()
      this.listeners.forEach(fn => {
        try {
          fn(state, path)
        } catch (e) {
          console.error('Error in store listener:', e)
        }
      })
    })
  }, 16), // 16ms = 1 frame at 60fps

  // Start batching updates
  startBatch() {
    this._isBatching = true
    this._updateQueue = []
  },

  // End batching and apply all updates
  endBatch() {
    this._isBatching = false
    if (this._updateQueue.length === 0) return

    const previousState = JSON.parse(JSON.stringify(this.data))
    
    try {
      // Apply all queued updates
      this._updateQueue.forEach(({ path, value }) => {
        const keys = path.split('.')
        let target = this.data
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) target[keys[i]] = {}
          target = target[keys[i]]
        }
        target[keys[keys.length - 1]] = value
      })
      
      this._updateQueue = []
      this.notify('batch')
    } catch (e) {
      // Rollback on error
      this.data = previousState
      console.error('Batch update failed:', e)
      throw e
    }
  },

  // Batch multiple updates into a single notification
  batch(updates) {
    const previousState = JSON.parse(JSON.stringify(this.data))
    try {
      updates.forEach(({ path, value }) => {
        const keys = path.split('.')
        let target = this.data
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) target[keys[i]] = {}
          target = target[keys[i]]
        }
        target[keys[keys.length - 1]] = value
      })
      this.notify()
    } catch (e) {
      // Rollback on error
      this.data = previousState
      console.error('Batch update failed:', e)
      throw e
    }
  },

  // Deep equality check to avoid unnecessary updates
  _isEqual(a, b) {
    if (a === b) return true
    if (typeof a !== typeof b) return false
    if (typeof a !== 'object' || a === null || b === null) return false
    
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    if (keysA.length !== keysB.length) return false
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!this._isEqual(a[key], b[key])) return false
    }
    return true
  },

  // Reset store to initial state
  reset() {
    this.data = {
      priorities: [],
      projects: { backlog: [], todo: [], inprogress: [], done: [] },
      revenueHistory: [],
      leads: [],
      events: [],
      skus: [],
      docs: [],
      notes: [],
      printers: [],
      orders: 0,
      ordersTarget: 150,
      revenueGoal: 5400,
      goalDate: '2026-05-01',
      currentBoard: 'all',
      _version: '4.0'
    }
    // Clear all caches
    dashboardCache.clear()
    this.notify()
  },

  // Get state snapshot for debugging
  getSnapshot() {
    return {
      timestamp: new Date().toISOString(),
      data: this.getState(),
      listenerCount: this.listeners.size
    }
  },

  // Debug: log current state
  debug() {
    console.log('Store Debug:', this.getSnapshot())
    return this.getSnapshot()
  },

  getState() {
    return JSON.parse(JSON.stringify(this.data))
  },

  get(path) {
    const keys = path.split('.')
    let value = this.data
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined) return undefined
    }
    return JSON.parse(JSON.stringify(value))
  },

  set(path, value) {
    // If batching, queue the update
    if (this._isBatching) {
      this._updateQueue.push({ path, value })
      return
    }

    const keys = path.split('.')
    let target = this.data
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) target[keys[i]] = {}
      target = target[keys[i]]
    }
    const oldValue = target[keys[keys.length - 1]]
    target[keys[keys.length - 1]] = value
    // Only notify if value actually changed
    if (!this._isEqual(oldValue, value)) {
      this.notify(path)
    }
  },

  replace(newState) {
    this.data = JSON.parse(JSON.stringify(newState))
    // Clear all caches on full replace
    dashboardCache.clear()
    this.notify()
  }
}

window.store = store
