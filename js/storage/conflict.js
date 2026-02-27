// Conflict resolution for concurrent edits
// Implements last-write-wins with field-level merging

import { store } from '../state/store.js'

export class ConflictResolver {
  constructor() {
    this.conflictLog = []
  }
  
  // Resolve conflict between local and remote data
  resolve(local, remote, path = '') {
    // If identical, no conflict
    if (JSON.stringify(local) === JSON.stringify(remote)) {
      return local
    }
    
    // If one is null/undefined, use the other
    if (local == null) return remote
    if (remote == null) return local
    
    // Get timestamps
    const localTime = local._lastModified || local.updatedAt || 0
    const remoteTime = remote._lastModified || remote.updatedAt || 0
    
    // If timestamps are available, use last-write-wins
    if (localTime && remoteTime) {
      if (remoteTime > localTime) {
        console.log(`[Conflict] Remote wins for ${path}`)
        this.logConflict(path, 'remote', local, remote)
        return this.mergePreservingLocalArrays(local, remote)
      } else {
        console.log(`[Conflict] Local wins for ${path}`)
        this.logConflict(path, 'local', local, remote)
        return local
      }
    }
    
    // No timestamps - do deep merge
    return this.deepMerge(local, remote, path)
  }
  
  // Deep merge two objects
  deepMerge(local, remote, path = '') {
    if (typeof local !== 'object' || typeof remote !== 'object') {
      return remote !== undefined ? remote : local
    }
    
    if (Array.isArray(local) || Array.isArray(remote)) {
      return this.mergeArrays(local, remote, path)
    }
    
    const result = { ...local }
    
    for (const key of Object.keys(remote)) {
      const localVal = local[key]
      const remoteVal = remote[key]
      
      if (localVal === undefined) {
        result[key] = remoteVal
      } else if (typeof localVal === 'object' && typeof remoteVal === 'object') {
        result[key] = this.deepMerge(localVal, remoteVal, `${path}.${key}`)
      } else {
        // Both exist - use timestamp or remote
        result[key] = remoteVal
      }
    }
    
    return result
  }
  
  // Merge arrays by ID
  mergeArrays(local, remote, path = '') {
    if (!Array.isArray(local)) return remote
    if (!Array.isArray(remote)) return local
    
    const result = [...remote]
    const remoteIds = new Set(remote.map(item => item?.id).filter(Boolean))
    
    // Add local items not in remote
    for (const localItem of local) {
      if (localItem?.id && !remoteIds.has(localItem.id)) {
        result.push(localItem)
      } else if (localItem?.id) {
        // Item exists in both - merge them
        const remoteItem = remote.find(r => r?.id === localItem.id)
        if (remoteItem) {
          const merged = this.resolve(localItem, remoteItem, `${path}[${localItem.id}]`)
          const index = result.findIndex(r => r?.id === localItem.id)
          if (index !== -1) {
            result[index] = merged
          }
        }
      }
    }
    
    return result
  }
  
  // Special merge that preserves local arrays but uses remote scalars
  mergePreservingLocalArrays(local, remote) {
    const result = { ...remote }
    
    for (const key of Object.keys(local)) {
      const localVal = local[key]
      const remoteVal = remote[key]
      
      // If local is array and remote is not, keep local array
      if (Array.isArray(localVal) && !Array.isArray(remoteVal)) {
        result[key] = localVal
      }
      // If both are arrays, merge them
      else if (Array.isArray(localVal) && Array.isArray(remoteVal)) {
        result[key] = this.mergeArrays(localVal, remoteVal, key)
      }
    }
    
    return result
  }
  
  // Log conflict for debugging
  logConflict(path, winner, local, remote) {
    this.conflictLog.push({
      timestamp: new Date().toISOString(),
      path,
      winner,
      local: JSON.stringify(local).slice(0, 200),
      remote: JSON.stringify(remote).slice(0, 200)
    })
    
    // Keep only last 50 conflicts
    if (this.conflictLog.length > 50) {
      this.conflictLog = this.conflictLog.slice(-50)
    }
  }
  
  // Get conflict history
  getConflictLog() {
    return [...this.conflictLog]
  }
  
  // Clear conflict log
  clearConflictLog() {
    this.conflictLog = []
  }
}

// Export singleton
export const conflictResolver = new ConflictResolver()

// Helper to add timestamps to data
export function withTimestamp(data) {
  return {
    ...data,
    _lastModified: Date.now()
  }
}