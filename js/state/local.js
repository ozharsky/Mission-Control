import { store } from './store.js'
import { syncStorage } from '../storage/sync.js'

// Batched save queue for performance
const saveQueue = {
  data: null,
  timeout: null,
  pending: false,
  
  queue(data) {
    this.data = data
    this.pending = true
    
    // Flush on next tick if not already scheduled
    if (!this.timeout) {
      this.timeout = setTimeout(() => this.flush(), 100)
    }
  },
  
  async flush() {
    if (!this.pending || !this.data) {
      this.timeout = null
      return
    }
    
    const dataToSave = this.data
    this.data = null
    this.pending = false
    this.timeout = null
    
    try {
      localStorage.setItem('mc-data', JSON.stringify(dataToSave))
    } catch (e) {
      // If quota exceeded, try to save without some data
      console.error('Save failed:', e)
    }
  }
}

const localStorageAdapter = {
  async load() {
    const local = localStorage.getItem('mc-data')
    if (local) {
      try {
        return JSON.parse(local)
      } catch (e) {
        console.error('Failed to parse localStorage:', e)
      }
    }
    return store.getState()
  },
  
  async save(data) {
    saveQueue.queue(data)
    return true
  }
}

// Migration: Add new fields to old data
function migrateData(data) {
  const defaults = {
    priorities: [],
    projects: { backlog: [], todo: [], inprogress: [], done: [] },
    revenue: 0,
    revenueGoal: 5400,
    orders: 0,
    ordersTarget: 150,
    leads: [],
    events: [],
    skus: [],
    notes: [],
    timeline: [],
    revenueHistory: [],
    printers: [
      { id: 1, name: 'P2S', status: 'operational', temp: 16, progress: 0 },
      { id: 2, name: 'P1S', status: 'operational', temp: 18, progress: 0 },
      { id: 3, name: 'Centauri Carbon', status: 'operational', temp: 19, progress: 0 }
    ]
  }
  
  // Deep merge with defaults
  const migrated = { ...defaults, ...data }
  
  // Ensure projects has all columns
  if (!migrated.projects) migrated.projects = {}
  const projectCols = ['backlog', 'todo', 'inprogress', 'done']
  projectCols.forEach(col => {
    if (!migrated.projects[col] || !Array.isArray(migrated.projects[col])) {
      migrated.projects[col] = []
    }
  })
  
  // Ensure arrays exist
  const arrayFields = ['priorities', 'leads', 'events', 'skus', 'notes', 'docs', 'timeline', 'revenueHistory']
  arrayFields.forEach(field => {
    if (!Array.isArray(migrated[field])) {
      migrated[field] = []
    }
  })
  
  // Migrate old priorities to new format with new fields
  if (migrated.priorities) {
    migrated.priorities = migrated.priorities.map(p => ({
      ...p,
      status: p.status || (p.completed ? 'done' : 'later'),
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
      // New fields for Phase 2
      timeEstimate: p.timeEstimate || 0,
      timeSpent: p.timeSpent || 0,
      recurring: p.recurring || 'none',
      blockedBy: p.blockedBy || [],
      activityLog: p.activityLog || [],
      notes: p.notes || '',
      desc: p.desc || ''
    }))
  }
  
  return migrated
}

export const storageAdapter = {
  async load() {
    try {
      // Try hybrid storage first (Firebase/GitHub)
      const cloudData = await syncStorage.load()
      
      // Load local data
      const localData = await localStorageAdapter.load()
      
      // Use cloud data if newer, otherwise local
      let data = cloudData || localData
      
      // If both exist, merge (cloud takes precedence)
      if (cloudData && localData) {
        data = { ...localData, ...cloudData }
      }
      
      const migrated = migrateData(data)
      store.replace(migrated)
      
      // Save to local
      await localStorageAdapter.save(migrated)
      
      return migrated
    } catch (e) {
      console.error('Failed to load:', e)
      return store.getState()
    }
  },
  
  async save() {
    try {
      const data = store.getState()
      
      // Save to localStorage (batched)
      await localStorageAdapter.save(data)
      
      // Save to cloud (Firebase/GitHub)
      await syncStorage.save(data)
      
      return true
    } catch (e) {
      console.error('Failed to save:', e)
      return false
    }
  },
  
  initAutoSave(delay = 5000) {
    let timeout
    let lastSave = 0
    let saveCount = 0
    
    store.subscribe((state, path) => {
      // Skip auto-save for printer data (updated too frequently)
      if (path && (path.includes('printers') || path.includes('lastPrinterUpdate'))) {
        return
      }
      
      clearTimeout(timeout)
      const now = Date.now()
      saveCount++
      
      // Debounce: wait at least 10 seconds between saves
      const timeSinceLastSave = now - lastSave
      const waitTime = timeSinceLastSave < 10000 ? 10000 - timeSinceLastSave : delay
      
      timeout = setTimeout(() => {
        lastSave = Date.now()
        this.save()
        saveCount = 0
      }, waitTime)
    })
    
    // Flush on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && saveCount > 0) {
        saveQueue.flush()
        this.save()
      }
    })
    
    // Start Firebase sync
    syncStorage.startSync()
  }
}
