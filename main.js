// Cache-busting version - increment when deploying updates
const APP_VERSION = 'v29''

// Initialize namespace first (replaces global window pollution)
import './js/namespace.js'

// Import error handling
import { setupGlobalErrorHandler } from './js/utils/errors.js'
import { errorBoundary } from './js/components/ErrorBoundary.js'
import { offlineIndicator } from './js/components/OfflineIndicator.js'
import { initPullToRefresh } from './js/components/PullToRefresh.js'
import { syncStatus } from './js/components/SyncStatus.js'
import { initScrollToTop } from './js/components/ScrollToTop.js'
import './js/components/KeyboardShortcutsHelp.js'

// Import sanitization
import { escapeHtml, sanitizeInput } from './js/utils/sanitize.js'

import { store } from './js/state/store.js'
import { storageAdapter } from './js/state/local.js'
import { keyboard } from './js/components/Keyboard.js'
import { toast } from './js/components/Toast.js'
import { search } from './js/components/Search.js'
import { bulk } from './js/components/Bulk.js'
import { createNavigation } from './js/components/Navigation.js'
import { notifications } from './js/utils/notifications.js'
import { backupScheduler } from './js/utils/backupScheduler.js'
import { createDashboardSection } from './js/sections/Dashboard.js'
import { createProjectsSection } from './js/sections/Projects.js'
import { createPrioritiesSection } from './js/sections/Priorities.js'
import { createRevenueSection } from './js/sections/Revenue.js'
import { createLeadsSection } from './js/sections/Leads.js'
import { createEventsSection } from './js/sections/Events.js'
import { createCalendarSection } from './js/sections/Calendar.js'
import { createInventorySection } from './js/sections/Inventory.js'
import { createSKUsSection } from './js/sections/SKUs.js'
import { createTimelineSection } from './js/sections/Timeline.js'
import { createReviewSection } from './js/sections/Review.js'
import { createDocsSection } from './js/sections/Docs.js'
import { createNotesSection } from './js/sections/Notes.js'
import { createSettingsSection } from './js/sections/Settings.js'

// Setup global error handling
setupGlobalErrorHandler()

// Initialize error boundary, offline indicator, and sync status
window.errorBoundary = errorBoundary
window.offlineIndicator = offlineIndicator
window.syncStatus = syncStatus

const DEMO_DATA = {
  priorities: [
    { id: 1, text: 'Fix printer', status: 'now', completed: false, dueDate: '2026-02-26' },
    { id: 2, text: 'Update listings', status: 'later', completed: false },
    { id: 3, text: 'Order filament', status: 'done', completed: true },
  ],
  projects: {
    backlog: [{ id: 1, title: 'Website', desc: 'New landing page', status: 'backlog' }],
    todo: [{ id: 2, title: 'Planning', desc: 'Q1 goals', status: 'todo' }],
    inprogress: [{ id: 3, title: 'Photos', desc: 'Product images', status: 'inprogress' }],
    done: [{ id: 4, title: 'Taxes', desc: '2025 filing', status: 'done' }]
  },
  revenue: 3281.77,
  revenueGoal: 5400,
  orders: 127,
  ordersTarget: 150,
  leads: [],
  events: [],
  skus: [],
  notes: [],
  timeline: [
    { id: 1, title: 'V4 Rebuild Started', date: '2026-02-25', desc: 'New architecture with Vite', status: 'completed' },
    { id: 2, title: 'Launch V4', date: '2026-03-01', desc: 'Deploy to GitHub Pages', status: 'pending' }
  ]
}

// Check if mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768

async function init() {
  try {
    await storageAdapter.load()
  } catch (err) {
    console.error('Storage load failed:', err)
  }
  
  const state = store.getState()
  
  if (state.priorities.length === 0) {
    store.replace({ ...state, ...DEMO_DATA })
  }
  
  try {
    storageAdapter.initAutoSave()
  } catch (err) {
    console.error('Auto-save failed:', err)
  }
  
  try {
    createNavigation('mainNav', {
      activeSection: 'dashboard',
      onNavigate: showSection
    })
  } catch (err) {
    console.error('Navigation failed:', err)
  }
  
  createSectionContainers()
  
  // Wrap section creation with error boundary
  const sections = [
    { name: 'Dashboard', fn: createDashboardSection, id: 'dashboardContent' },
    { name: 'Projects', fn: createProjectsSection, id: 'projectsContent' },
    { name: 'Priorities', fn: createPrioritiesSection, id: 'prioritiesContent' },
    { name: 'Revenue', fn: createRevenueSection, id: 'revenueContent' },
    { name: 'Leads', fn: createLeadsSection, id: 'leadsContent' },
    { name: 'Events', fn: createEventsSection, id: 'eventsContent' },
    { name: 'Calendar', fn: createCalendarSection, id: 'calendarContent' },
    { name: 'Inventory', fn: createInventorySection, id: 'inventoryContent' },
    { name: 'SKUs', fn: createSKUsSection, id: 'skusContent' },
    { name: 'Timeline', fn: createTimelineSection, id: 'timelineContent' },
    { name: 'Review', fn: createReviewSection, id: 'reviewContent' },
    { name: 'Docs', fn: createDocsSection, id: 'docsContent' },
    { name: 'Notes', fn: createNotesSection, id: 'notesContent' },
    { name: 'Settings', fn: createSettingsSection, id: 'settingsContent' }
  ]
  
  sections.forEach(({ name, fn, id }) => {
    try {
      fn(id)
    } catch (err) {
      errorBoundary.handleError(err, `create${name}Section`)
      document.getElementById(id).innerHTML = errorBoundary.createErrorUI(err)
    }
  })
  
  showSection('dashboard')
  
  // Initialize keyboard shortcuts
  try {
    keyboard.init()
  } catch (err) {
    console.error('Keyboard failed:', err)
  }
  
  // Initialize bulk operations
  try {
    bulk.init()
  } catch (err) {
    console.error('Bulk operations failed:', err)
  }
  
  // Initialize new features
  try {
    backupScheduler.start()
  } catch (err) {
    console.error('Backup scheduler failed:', err)
  }
  
  // Initialize notifications (desktop only)
  if (!isMobile) {
    try {
      notifications.requestPermission()
    } catch (err) {
      console.error('Notifications failed:', err)
    }
    
    // Schedule priority reminders (desktop only)
    try {
      const priorities = store.get('priorities') || []
      notifications.schedulePriorityReminders(priorities)
    } catch (err) {
      console.error('Priority reminders failed:', err)
    }
  }
  
  // Initialize pull-to-refresh and scroll-to-top (mobile only)
  if (isMobile) {
    initPullToRefresh(() => {
      // Custom refresh action
      return storageAdapter.load().then(() => {
        showSection('dashboard')
        return Promise.resolve()
      })
    })
    initScrollToTop()
  }
  
  // Show welcome toast
  toast.success('Mission Control V4', 'App loaded successfully!', 3000)
}

function createSectionContainers() {
  const content = document.getElementById('mainContent')
  content.innerHTML = `
    <div id="dashboardSection" class="section" style="display: none;"><div id="dashboardContent"></div></div>
    <div id="projectsSection" class="section" style="display: none;"><div id="projectsContent"></div></div>
    <div id="prioritiesSection" class="section" style="display: none;"><div id="prioritiesContent"></div></div>
    <div id="revenueSection" class="section" style="display: none;"><div id="revenueContent"></div></div>
    <div id="leadsSection" class="section" style="display: none;"><div id="leadsContent"></div></div>
    <div id="eventsSection" class="section" style="display: none;"><div id="eventsContent"></div></div>
    <div id="calendarSection" class="section" style="display: none;"><div id="calendarContent"></div></div>
    <div id="inventorySection" class="section" style="display: none;"><div id="inventoryContent"></div></div>
    <div id="skusSection" class="section" style="display: none;"><div id="skusContent"></div></div>
    <div id="timelineSection" class="section" style="display: none;"><div id="timelineContent"></div></div>
    <div id="reviewSection" class="section" style="display: none;"><div id="reviewContent"></div></div>
    <div id="docsSection" class="section" style="display: none;"><div id="docsContent"></div></div>
    <div id="notesSection" class="section" style="display: none;"><div id="notesContent"></div></div>
    <div id="settingsSection" class="section" style="display: none;"><div id="settingsContent"></div></div>
  `
}

function showSection(sectionId) {
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
  
  // Update navigation active state
  if (window.updateNavigation) {
    window.updateNavigation(sectionId)
  }
}

// Initialize app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
