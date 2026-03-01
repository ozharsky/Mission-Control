// Navigation Guard
// Prevents accidental navigation with unsaved changes

import { toast } from './components/Toast.js'

class NavigationGuard {
  constructor() {
    this.forms = new Map()
    this.isEnabled = true
    this.setupEventListeners()
  }
  
  // Register a form to watch
  watch(formId, options = {}) {
    const {
      onChange = null,
      onNavigate = null,
      message = 'You have unsaved changes. Are you sure you want to leave?'
    } = options
    
    const form = document.getElementById(formId)
    if (!form) {
      console.warn(`Form #${formId} not found`)
      return
    }
    
    const formData = new FormState(form, onChange)
    this.forms.set(formId, {
      state: formData,
      onNavigate,
      message
    })
    
    return {
      markClean: () => formData.markClean(),
      markDirty: () => formData.markDirty(),
      isDirty: () => formData.isDirty(),
      destroy: () => this.unwatch(formId)
    }
  }
  
  // Stop watching a form
  unwatch(formId) {
    const form = this.forms.get(formId)
    if (form) {
      form.state.destroy()
      this.forms.delete(formId)
    }
  }
  
  // Check if any forms have unsaved changes
  hasUnsavedChanges() {
    for (const [_, form] of this.forms) {
      if (form.state.isDirty()) {
        return true
      }
    }
    return false
  }
  
  // Get all dirty forms
  getDirtyForms() {
    const dirty = []
    for (const [id, form] of this.forms) {
      if (form.state.isDirty()) {
        dirty.push({ id, ...form })
      }
    }
    return dirty
  }
  
  // Prompt user about unsaved changes
  async confirmNavigation() {
    const dirtyForms = this.getDirtyForms()
    
    if (dirtyForms.length === 0) {
      return true
    }
    
    // Call custom handlers first
    for (const form of dirtyForms) {
      if (form.onNavigate) {
        const result = await form.onNavigate()
        if (result === false) {
          return false
        }
      }
    }
    
    // Show confirmation dialog
    const message = dirtyForms[0].message
    return confirm(`⚠️ ${message}`)
  }
  
  // Setup event listeners
  setupEventListeners() {
    // Handle beforeunload (browser close/refresh)
    window.addEventListener('beforeunload', (e) => {
      if (this.isEnabled && this.hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    })
    
    // Handle navigation attempts
    this.setupNavigationInterceptors()
  }
  
  // Intercept navigation attempts
  setupNavigationInterceptors() {
    // Intercept link clicks
    document.addEventListener('click', async (e) => {
      if (!this.isEnabled) return
      
      const link = e.target.closest('a[href]')
      if (!link) return
      
      // Skip external links and anchors
      const href = link.getAttribute('href')
      if (href.startsWith('http') || href.startsWith('#')) return
      
      if (this.hasUnsavedChanges()) {
        e.preventDefault()
        
        const confirmed = await this.confirmNavigation()
        if (confirmed) {
          window.location.href = href
        }
      }
    })
    
    // Intercept section navigation
    const originalShowSection = window.showSection
    if (originalShowSection) {
      window.showSection = async (sectionId) => {
        if (this.isEnabled && this.hasUnsavedChanges()) {
          const confirmed = await this.confirmNavigation()
          if (!confirmed) return
        }
        
        return originalShowSection(sectionId)
      }
    }
  }
  
  // Enable/disable guard
  enable() {
    this.isEnabled = true
  }
  
  disable() {
    this.isEnabled = false
  }
}

// Form state tracker
class FormState {
  constructor(formElement, onChangeCallback) {
    this.form = formElement
    this.initialData = this.serialize()
    this.currentData = this.initialData
    this.isDirty = false
    this.onChange = onChangeCallback
    
    this.attachListeners()
  }
  
  attachListeners() {
    this.handler = () => this.checkForChanges()
    this.form.addEventListener('input', this.handler)
    this.form.addEventListener('change', this.handler)
  }
  
  serialize() {
    const formData = new FormData(this.form)
    const data = {}
    for (const [key, value] of formData) {
      data[key] = value
    }
    return JSON.stringify(data)
  }
  
  checkForChanges() {
    const newData = this.serialize()
    const wasDirty = this.isDirty
    this.isDirty = newData !== this.initialData
    this.currentData = newData
    
    if (wasDirty !== this.isDirty && this.onChange) {
      this.onChange(this.isDirty)
    }
  }
  
  markClean() {
    this.initialData = this.currentData
    this.isDirty = false
  }
  
  markDirty() {
    this.isDirty = true
  }
  
  isDirty() {
    return this.isDirty
  }
  
  destroy() {
    this.form.removeEventListener('input', this.handler)
    this.form.removeEventListener('change', this.handler)
  }
}

export const navigationGuard = new NavigationGuard()

// Helper for modals
export function watchModalForm(modalId, formId, options = {}) {
  const guard = navigationGuard.watch(formId, {
    ...options,
    onNavigate: async () => {
      const confirmed = await navigationGuard.confirmNavigation()
      if (!confirmed) {
        return false
      }
      // Close modal if navigation confirmed
      const modal = document.getElementById(modalId)
      if (modal) modal.remove()
      return true
    }
  })
  
  return guard
}
