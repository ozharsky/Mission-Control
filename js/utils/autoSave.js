// Auto-save functionality for forms
// Saves form data to localStorage periodically

import { Toast } from './components/Toast.js'

class AutoSave {
  constructor(options = {}) {
    this.interval = options.interval || 30000 // 30 seconds
    this.keyPrefix = options.keyPrefix || 'autosave-'
    this.forms = new Map()
    this.intervals = new Map()
  }
  
  // Enable auto-save for a form
  enable(formId, options = {}) {
    const {
      storageKey = null,
      onSave = null,
      onRestore = null,
      showToast = true
    } = options
    
    const form = document.getElementById(formId)
    if (!form) {
      return null
    }
    
    const key = storageKey || `${this.keyPrefix}${formId}`
    
    // Check for saved data on enable
    this.restore(formId, key, onRestore, showToast)
    
    // Setup auto-save interval
    const intervalId = setInterval(() => {
      this.save(formId, key, onSave, false)
    }, this.interval)
    
    this.forms.set(formId, { key, onSave, showToast })
    this.intervals.set(formId, intervalId)
    
    // Save on input (debounced)
    let debounceTimer
    form.addEventListener('input', () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        this.save(formId, key, onSave, false)
      }, 1000)
    })
    
    // Save on blur
    form.addEventListener('focusout', () => {
      this.save(formId, key, onSave, false)
    })
    
    return {
      save: () => this.save(formId, key, onSave, showToast),
      restore: () => this.restore(formId, key, onRestore, showToast),
      clear: () => this.clear(formId, key),
      disable: () => this.disable(formId)
    }
  }
  
  // Disable auto-save for a form
  disable(formId) {
    const intervalId = this.intervals.get(formId)
    if (intervalId) {
      clearInterval(intervalId)
      this.intervals.delete(formId)
    }
    
    this.forms.delete(formId)
  }
  
  // Save form data
  save(formId, key, onSave, showToast) {
    const form = document.getElementById(formId)
    if (!form) return
    
    const data = this.serializeForm(form)
    
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
        url: window.location.href
      }))
      
      if (onSave) {
        onSave(data)
      }
      
      if (showToast) {
        Toast.success('Auto-saved', 'Form data saved', 2000)
      }
    } catch (e) {
      console.error('Auto-save failed:', e)
    }
  }
  
  // Restore form data
  restore(formId, key, onRestore, showToast) {
    try {
      const saved = localStorage.getItem(key)
      if (!saved) return false
      
      const { data, timestamp, url } = JSON.parse(saved)
      
      // Check if saved for current page
      if (url && !window.location.href.includes(url.split('?')[0])) {
        return false
      }
      
      // Check if not too old (7 days)
      const age = Date.now() - timestamp
      if (age > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(key)
        return false
      }
      
      const form = document.getElementById(formId)
      if (!form) return false
      
      // Populate form
      this.populateForm(form, data)
      
      if (onRestore) {
        onRestore(data)
      }
      
      if (showToast) {
        const timeAgo = this.formatTimeAgo(timestamp)
        Toast.info('Restored', `Form restored from ${timeAgo}`, 3000)
      }
      
      return true
    } catch (e) {
      console.error('Auto-restore failed:', e)
      return false
    }
  }
  
  // Clear saved data
  clear(formId, key) {
    localStorage.removeItem(key)
  }
  
  // Serialize form data
  serializeForm(form) {
    const data = {}
    const elements = form.querySelectorAll('input, textarea, select')
    
    elements.forEach(el => {
      if (el.name) {
        if (el.type === 'checkbox') {
          data[el.name] = el.checked
        } else if (el.type === 'radio') {
          if (el.checked) {
            data[el.name] = el.value
          }
        } else if (el.type === 'file') {
          // Skip files
        } else {
          data[el.name] = el.value
        }
      }
    })
    
    return data
  }
  
  // Populate form with data
  populateForm(form, data) {
    Object.entries(data).forEach(([name, value]) => {
      const elements = form.querySelectorAll(`[name="${name}"]`)
      
      elements.forEach(el => {
        if (el.type === 'checkbox') {
          el.checked = Boolean(value)
        } else if (el.type === 'radio') {
          el.checked = el.value === value
        } else {
          el.value = value || ''
        }
        
        // Trigger change event
        el.dispatchEvent(new Event('change', { bubbles: true }))
      })
    })
  }
  
  // Format time ago
  formatTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }
  
  // Get all saved forms
  getSavedForms() {
    const saved = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(this.keyPrefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          saved.push({
            key,
            formId: key.replace(this.keyPrefix, ''),
            timestamp: data.timestamp,
            url: data.url
          })
        } catch (e) {
          // Invalid data
        }
      }
    }
    return saved.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  // Clear old auto-saves
  clearOld(maxAge = 7 * 24 * 60 * 60 * 1000) {
    const now = Date.now()
    let cleared = 0
    
    this.getSavedForms().forEach(({ key, timestamp }) => {
      if (now - timestamp > maxAge) {
        localStorage.removeItem(key)
        cleared++
      }
    })
    
    return cleared
  }
}

export const autoSave = new AutoSave()

// Helper for common use case
export function enableAutoSave(formId, options = {}) {
  return autoSave.enable(formId, options)
}
