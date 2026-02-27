// IndexedDB Storage for Large Files
// Replaces localStorage for file storage to avoid quota issues

const DB_NAME = 'MissionControlFiles'
const DB_VERSION = 1
const STORE_NAME = 'files'

class IndexedDBStorage {
  constructor() {
    this.db = null
    this.initPromise = null
  }
  
  async init() {
    if (this.db) return this.db
    if (this.initPromise) return this.initPromise
    
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('category', 'category', { unique: false })
          store.createIndex('uploadedAt', 'uploadedAt', { unique: false })
        }
      }
    })
    
    return this.initPromise
  }
  
  async save(id, data) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put({ id, ...data, savedAt: Date.now() })
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  async get(id) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(id)
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  async delete(id) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async getAll() {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  async getByCategory(category) {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('category')
      const request = index.getAll(category)
      
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
  
  async clear() {
    const db = await this.init()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  // Get storage quota info
  async getQuotaInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percent: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
      }
    }
    return null
  }
  
  // Check if storage is near limit
  async isNearLimit(threshold = 80) {
    const quota = await this.getQuotaInfo()
    if (!quota) return false
    return quota.percent >= threshold
  }
}

export const fileStorage = new IndexedDBStorage()

// Storage quota warning utility
export async function checkStorageQuota() {
  const quota = await fileStorage.getQuotaInfo()
  if (!quota) return { ok: true }
  
  if (quota.percent >= 90) {
    return {
      ok: false,
      level: 'critical',
      message: `Storage ${quota.percent}% full. Please delete old files.`,
      ...quota
    }
  }
  
  if (quota.percent >= 80) {
    return {
      ok: false,
      level: 'warning',
      message: `Storage ${quota.percent}% full. Consider cleaning up.`,
      ...quota
    }
  }
  
  return { ok: true, ...quota }
}

// Format bytes for display
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}
