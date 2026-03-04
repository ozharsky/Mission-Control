// LocalStorage quota management and optimization

const STORAGE_KEY = 'mc-data'
const MAX_SIZE = 4.5 * 1024 * 1024 // 4.5MB (leaving 0.5MB buffer)
const COMPRESSION_THRESHOLD = 3 * 1024 * 1024 // Compress when over 3MB

export const quotaManager = {
  // Check current usage
  getUsage() {
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length * 2 // UTF-16 = 2 bytes per char
      }
    }
    return {
      used: total,
      max: 5 * 1024 * 1024, // 5MB typical limit
      percent: Math.round((total / (5 * 1024 * 1024)) * 100)
    }
  },
  
  // Check if we have space for data
  hasSpace(data) {
    const size = JSON.stringify(data).length * 2
    const usage = this.getUsage()
    return (usage.used + size) < MAX_SIZE
  },
  
  // Compress data if needed
  compress(data) {
    const json = JSON.stringify(data)
    const size = json.length * 2
    
    if (size < COMPRESSION_THRESHOLD) {
      return { data: json, compressed: false }
    }
    
    // Simple compression: remove null/undefined values and empty arrays
    const compressed = this.removeEmptyValues(data)
    const compressedJson = JSON.stringify(compressed)
    
    console.log(`Compressed data: ${size} → ${compressedJson.length * 2} bytes`)
    
    return { 
      data: compressedJson, 
      compressed: true,
      originalSize: size,
      compressedSize: compressedJson.length * 2
    }
  },
  
  // Remove empty/null values recursively
  removeEmptyValues(obj) {
    if (Array.isArray(obj)) {
      return obj
        .map(item => this.removeEmptyValues(item))
        .filter(item => item != null)
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result = {}
      for (const [key, value] of Object.entries(obj)) {
        if (value == null) continue
        if (Array.isArray(value) && value.length === 0) continue
        if (typeof value === 'object') {
          const cleaned = this.removeEmptyValues(value)
          if (Object.keys(cleaned).length > 0) {
            result[key] = cleaned
          }
        } else {
          result[key] = value
        }
      }
      return result
    }
    
    return obj
  },
  
  // Save with quota check
  save(key, data) {
    try {
      const { data: json, compressed } = this.compress(data)
      
      localStorage.setItem(key, json)
      
      if (compressed) {
        console.log('[Storage] Data saved with compression')
      }
      
      return { success: true, compressed }
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded')
        return { 
          success: false, 
          error: 'QUOTA_EXCEEDED',
          message: 'Storage is full. Please export and clear old data.'
        }
      }
      throw e
    }
  },
  
  // Load and decompress if needed
  load(key) {
    try {
      const json = localStorage.getItem(key)
      if (!json) return null
      
      return JSON.parse(json)
    } catch (e) {
      console.error('Failed to load data:', e)
      return null
    }
  },
  
  // Clear old data to free space
  async clearOldData() {
    const keysToRemove = []
    
    // Find old backup files
    for (let key in localStorage) {
      if (key.startsWith('mc-backup-')) {
        keysToRemove.push(key)
      }
    }
    
    // Sort by date and keep only last 5
    keysToRemove.sort().reverse()
    const toDelete = keysToRemove.slice(5)
    
    toDelete.forEach(key => localStorage.removeItem(key))
    
    return toDelete.length
  },
  
  // Get storage info for display
  getInfo() {
    const usage = this.getUsage()
    const data = localStorage.getItem(STORAGE_KEY)
    const dataSize = data ? data.length * 2 : 0
    
    return {
      ...usage,
      dataSize,
      available: usage.max - usage.used
    }
  }
}

// Async wrapper for localStorage operations
export const asyncStorage = {
  async get(key) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(quotaManager.load(key))
      }, 0)
    })
  },
  
  async set(key, value) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const result = quotaManager.save(key, value)
        if (result.success) {
          resolve(result)
        } else {
          reject(new Error(result.message))
        }
      }, 0)
    })
  },
  
  async remove(key) {
    return new Promise(resolve => {
      setTimeout(() => {
        localStorage.removeItem(key)
        resolve()
      }, 0)
    })
  }
}