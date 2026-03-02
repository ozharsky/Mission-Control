// Data Import/Export Manager
// Backup and restore functionality

import { store } from '../state/store.js'
import { Toast } from './Toast.js'
import { loadingStates } from './LoadingStates.js'
import { icon } from '../utils/icons.js'

export const dataManager = {
  // Export all data to JSON file
  async exportAll() {
    const loader = loadingStates.showOverlay('body', { text: 'Preparing export...' })
    
    try {
      const state = store.getState()
      
      // Create export object with metadata
      const exportData = {
        version: '5.3',
        exportedAt: new Date().toISOString(),
        app: 'Mission Control',
        data: state
      }
      
      // Convert to JSON
      const json = JSON.stringify(exportData, null, 2)
      
      // Create blob and download
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const filename = `mission-control-backup-${new Date().toISOString().split('T')[0]}.json`
      
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)
      
      loader.hide()
      Toast.success('Export complete', `Saved as ${filename}`)
      
      // Log activity
      this.logActivity('Data exported', filename)
      
    } catch (err) {
      loader.hide()
      Toast.error('Export failed', err.message)
      console.error('Export error:', err)
    }
  },
  
  // Export specific sections
  async exportSection(section) {
    const state = store.getState()
    const data = state[section]
    
    if (!data) {
      Toast.error('Export failed', `Section "${section}" not found`)
      return
    }
    
    const exportData = {
      version: '5.3',
      exportedAt: new Date().toISOString(),
      app: 'Mission Control',
      section: section,
      data: data
    }
    
    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const filename = `mission-control-${section}-${new Date().toISOString().split('T')[0]}.json`
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
    Toast.success('Export complete', `Saved as ${filename}`)
  },
  
  // Import data from JSON file
  async importFile(file) {
    const loader = loadingStates.showOverlay('body', { text: 'Reading file...' })
    
    try {
      // Validate file size (max 50MB)
      const MAX_FILE_SIZE = 50 * 1024 * 1024
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum size is 50MB.`)
      }
      
      // Validate file type
      if (!file.type.match(/json/i) && !file.name.endsWith('.json')) {
        throw new Error('Invalid file type. Please select a JSON file.')
      }
      
      const text = await file.text()
      
      // Check for empty file
      if (!text || text.trim().length === 0) {
        throw new Error('File is empty.')
      }
      
      let importData
      
      try {
        importData = JSON.parse(text)
      } catch (parseErr) {
        console.error('JSON parse error:', parseErr)
        throw new Error('Invalid JSON file. Please select a valid Mission Control backup file.')
      }
      
      // Validate required fields
      if (!importData || typeof importData !== 'object') {
        throw new Error('Invalid file format: data is not an object')
      }
      
      if (!importData.data) {
        throw new Error('Invalid file format: missing data property')
      }
      
      // Validate version compatibility
      const fileVersion = importData.version
      if (fileVersion) {
        const majorVersion = parseInt(fileVersion.split('.')[0])
        if (majorVersion > 6) {
          console.warn('Import file is from a newer version, some features may not work')
        } else if (majorVersion < 4) {
          console.warn('Import file is from an older version, some data may need migration')
        }
      }
      
      loader.updateMessage('Validating data...')
      
      // Validate data structure
      const validation = this._validateImportData(importData.data)
      if (!validation.valid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`)
      }
      
      loader.hide()
      this.showImportDialog(importData)
      
    } catch (err) {
      loader.hide()
      Toast.error('Import failed', err.message)
      console.error('Import error:', err)
    }
  },

  /**
   * Validate import data structure
   * @private
   */
  _validateImportData(data) {
    const errors = []
    
    // Check for required arrays
    const arrayFields = ['priorities', 'projects', 'skus', 'events', 'notes']
    arrayFields.forEach(field => {
      if (data[field] !== undefined && !Array.isArray(data[field])) {
        errors.push(`${field} must be an array`)
      }
    })
    
    // Validate projects structure if present
    if (data.projects && typeof data.projects === 'object') {
      const validStatuses = ['backlog', 'todo', 'inprogress', 'done']
      const projectKeys = Object.keys(data.projects)
      const invalidKeys = projectKeys.filter(k => !validStatuses.includes(k))
      if (invalidKeys.length > 0) {
        errors.push(`Invalid project statuses: ${invalidKeys.join(', ')}`)
      }
    }
    
    // Validate priorities if present
    if (Array.isArray(data.priorities)) {
      const validStatuses = ['now', 'next', 'later', 'done']
      data.priorities.forEach((p, i) => {
        if (p.status && !validStatuses.includes(p.status)) {
          errors.push(`Priority ${i} has invalid status: ${p.status}`)
        }
      })
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  },
  
  // Show import confirmation dialog
  showImportDialog(importData) {
    const { version, exportedAt, section, data } = importData
    
    const modal = document.createElement('div')
    modal.className = 'modal-overlay active'
    modal.id = 'importDialog'
    
    // Calculate stats
    const stats = this.calculateImportStats(data)
    
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <div class="modal-title">${icon('download', 'm-icon')} Import Data</div>
          <button class="modal-close m-touch" onclick="document.getElementById('importDialog').remove()" aria-label="Close">${icon('x', 'm-icon-sm')}</button>
        </div>
        
        <div class="modal-body">
          <div class="import-info">
            <div class="import-info-row">
              <span class="import-info-label">Version:</span>
              <span class="import-info-value">${version || 'Unknown'}</span>
            </div>
            <div class="import-info-row">
              <span class="import-info-label">Exported:</span>
              <span class="import-info-value">${exportedAt ? new Date(exportedAt).toLocaleString() : 'Unknown'}</span>
            </div>
            ${section ? `
            <div class="import-info-row">
              <span class="import-info-label">Section:</span>
              <span class="import-info-value">${section}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="import-stats">
            <h4>Contents:</h4>
            ${stats.map(s => `
              <div class="import-stat">
                <span class="import-stat-icon">${s.icon}</span>
                <span class="import-stat-label">${s.label}</span>
                <span class="import-stat-count">${s.count}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="import-warning">
            ${icon('alert-triangle', 'm-icon-sm')} This will ${section ? 'replace' : 'merge with'} your current data. 
            Consider exporting a backup first.
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary m-touch" onclick="document.getElementById('importDialog').remove()">Cancel</button>
          <button class="btn btn-primary m-touch" onclick="dataManager.confirmImport()">${icon('download', 'm-icon-sm')} Import Data</button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Store import data for confirmation
    this.pendingImport = importData
  },
  
  // Calculate import statistics
  calculateImportStats(data) {
    const stats = []
    
    if (data.priorities) {
      stats.push({ icon: icon('hourglass', 'm-icon-sm'), label: 'Priorities', count: data.priorities.length })
    }
    if (data.projects) {
      const projectCount = Object.values(data.projects).flat().length
      stats.push({ icon: icon('folder-kanban', 'm-icon-sm'), label: 'Projects', count: projectCount })
    }
    if (data.skus) {
      stats.push({ icon: icon('package', 'm-icon-sm'), label: 'SKUs', count: data.skus.length })
    }
    if (data.events) {
      stats.push({ icon: icon('calendar-days', 'm-icon-sm'), label: 'Events', count: data.events.length })
    }
    if (data.notes) {
      stats.push({ icon: icon('file-text', 'm-icon-sm'), label: 'Notes', count: data.notes.length })
    }
    
    return stats
  },
  
  // Confirm and execute import
  async confirmImport() {
    if (!this.pendingImport) return
    
    document.getElementById('importDialog')?.remove()
    
    const loader = loadingStates.showOverlay('body', { text: 'Importing data...' })
    loader.showProgress()
    
    try {
      const { section, data } = this.pendingImport
      
      if (section) {
        // Import single section
        store.set(section, data)
      } else {
        // Import all data
        const currentState = store.getState()
        
        // Merge data
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key])) {
            // For arrays, merge unique items by ID
            const existing = currentState[key] || []
            const newItems = data[key].filter(item => 
              !existing.find(e => e.id === item.id)
            )
            store.set(key, [...existing, ...newItems])
          } else if (typeof data[key] === 'object') {
            // For objects, merge
            store.set(key, { ...currentState[key], ...data[key] })
          } else {
            // For primitives, replace
            store.set(key, data[key])
          }
          
          loader.updateProgress((Object.keys(data).indexOf(key) + 1) / Object.keys(data).length * 100)
        })
      }
      
      loader.hide()
      Toast.success('Import complete', 'Data has been imported successfully')
      
      // Log activity
      this.logActivity('Data imported', section || 'All data')
      
      // Refresh page after short delay
      setTimeout(() => window.location.reload(), 1500)
      
    } catch (err) {
      loader.hide()
      Toast.error('Import failed', err.message)
      console.error('Import error:', err)
    }
    
    this.pendingImport = null
  },
  
  // Show file picker for import
  showImportPicker() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (file) {
        this.importFile(file)
      }
    }
    input.click()
  },
  
  // Log activity
  logActivity(action, details) {
    const activityLog = store.get('activityLog') || []
    activityLog.unshift({
      timestamp: new Date().toISOString(),
      action,
      details,
      type: 'system'
    })
    store.set('activityLog', activityLog.slice(0, 100))
  },
  
  // Clear all data (with confirmation)
  async clearAll() {
    const confirmed = confirm(
      icon('alert-triangle', 'm-icon') + ' WARNING: This will delete ALL data!\n\n' +
      'This action cannot be undone.\n\n' +
      'Make sure you have exported a backup first.\n\n' +
      'Click OK to proceed with deletion.'
    )
    
    if (!confirmed) return
    
    const doubleConfirmed = prompt(
      'Type "DELETE" to confirm complete data removal:'
    )
    
    if (doubleConfirmed !== 'DELETE') {
      Toast.info('Deletion cancelled')
      return
    }
    
    const loader = loadingStates.showOverlay('body', { text: 'Clearing data...' })
    
    try {
      // Clear all store data
      const keys = Object.keys(store.getState())
      keys.forEach(key => store.set(key, null))
      
      // Clear localStorage
      localStorage.clear()
      
      loader.hide()
      Toast.success('Data cleared', 'All data has been removed')
      
      setTimeout(() => window.location.reload(), 1500)
      
    } catch (err) {
      loader.hide()
      Toast.error('Clear failed', err.message)
    }
  }
}

// Expose globally
window.dataManager = dataManager
