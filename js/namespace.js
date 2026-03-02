// Centralized namespace for global functions
// Replaces window pollution with single mc namespace

import { store } from './state/store.js'
import { Toast } from './components/Toast.js'
import { keyboard } from './components/Keyboard.js'
import { bulk } from './components/Bulk.js'
import { undoManager } from './state/undo.js'
import { pomodoro } from './utils/pomodoro.js'
import { backupScheduler } from './utils/backupScheduler.js'
import { activityFeed } from './utils/activityFeed.js'
import { analytics } from './utils/analytics.js'
import { filterManager } from './utils/filters.js'
import { customFields } from './utils/customFields.js'
import { webhooks } from './utils/webhooks.js'
import { automation } from './utils/automation.js'
import { openPriorityModal } from './components/PriorityModal.js'
import { openProjectModal } from './components/ProjectModal.js'
import { openEditProjectModal } from './components/EditProjectModal.js'

// Navigation handlers
const navigation = {
  currentSection: 'dashboard',
  
  goTo(sectionId) {
    this.currentSection = sectionId
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none')
    const map = {
      dashboard: 'dashboardSection',
      projects: 'projectsSection',
      priorities: 'prioritiesSection',
      revenue: 'revenueSection',
      leads: 'leadsSection',
      events: 'eventsSection',
      calendar: 'calendarSection',
      inventory: 'inventorySection',
      skus: 'skusSection',
      timeline: 'timelineSection',
      review: 'reviewSection',
      docs: 'docsSection',
      notes: 'notesSection',
      settings: 'settingsSection'
    }
    const el = document.getElementById(map[sectionId])
    if (el) el.style.display = 'block'
    
    if (window.updateNavigation) {
      window.updateNavigation(sectionId)
    }
  }
}

// Modal handlers
const modals = {
  priority: {
    open: openPriorityModal,
    edit: null // Will be set when EditPriorityModal is imported
  },
  project: {
    open: openProjectModal,
    edit: openEditProjectModal
  }
}

// Utility functions
const utils = {
  // Escape HTML to prevent XSS
  escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  },
  
  // Format currency
  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0)
  },
  
  // Format date
  formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  },
  
  // Debounce function
  debounce(fn, delay) {
    let timeout
    return (...args) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => fn(...args), delay)
    }
  },
  
  // Throttle function
  throttle(fn, limit) {
    let inThrottle
    return (...args) => {
      if (!inThrottle) {
        fn(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },
  
  // Haptic feedback for mobile
  haptic(type = 'light') {
    if (navigator.vibrate) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 30,
        success: [10, 50, 10],
        error: [30, 50, 30]
      }
      navigator.vibrate(patterns[type] || 10)
    }
  }
}

// Main namespace
export const mc = {
  // Core
  store,
  toast,
  
  // Navigation
  navigate: navigation.goTo.bind(navigation),
  get currentSection() { return navigation.currentSection },
  
  // Modals
  modals,
  
  // Utils
  utils,
  
  // Features
  keyboard,
  bulk,
  undo: undoManager,
  pomodoro,
  backupScheduler,
  activityFeed,
  analytics,
  filterManager,
  customFields,
  webhooks,
  automation,
  
  // Migration
  // migrateV3ToV4, // Removed - migration complete
  
  // Legacy compatibility - expose commonly used functions
  showSection: navigation.goTo.bind(navigation)
}

// Expose to window (single namespace instead of 50+ globals)
window.mc = mc

// For backward compatibility during transition
// These will be removed in future versions
Object.defineProperty(window, 'showSection', {
  get() { return mc.showSection },
  set(fn) { mc.showSection = fn }
})

console.log('✅ Mission Control namespace initialized')