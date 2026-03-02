// Import page transitions
import { pageTransition } from './js/utils/pageTransition.js'

// Import animation controller
import { animationController } from './js/components/ui/Animations.js'

// Import new utilities
import { lazyLoader } from './js/utils/lazyLoader-v2.js'
import { diagnoseDatabaseConnection } from './js/utils/dbDiagnostics.js'

// Cache-busting version - increment when deploying updates
const APP_VERSION = 'v129'

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

// Import keyboard shortcuts
import { initKeyboardShortcuts } from './js/utils/keyboardShortcuts.js'
import { viewportObserver } from './js/utils/viewportObserver.js'
import { isLowPowerDevice } from './js/utils/performance.js'

// Import new utilities
import { initFocusManagement } from './js/utils/focusManager.js'
import { performanceMonitor, memoryMonitor } from './js/utils/performanceMonitor.js'
import { globalEvents, addPassiveListener } from './js/utils/events.js'
import { $, $$, ready } from './js/utils/dom.js'
// Import new UI utilities
import { initTouchFeedback, animateCards } from './js/utils/touchFeedback.js'
import { initScrollAnimations } from './js/utils/scrollAnimations.js'
import { initMobileInteractions, applyTouchFeedbackToAll, initPullToRefresh as initMobilePullToRefresh, initSwipeActions } from './js/utils/mobileInteractions.js'

// Import new components
import { loadingStates } from './js/components/LoadingStates.js'
import { commandPalette } from './js/components/CommandPalette.js'
import { offlineManager } from './js/components/OfflineManager.js'
import { dashboardWidgets } from './js/components/DashboardWidgets.js'
import { dataManager } from './js/components/DataManager.js'

// Import sanitization
import { escapeHtml, sanitizeInput } from './js/utils/sanitize.js'

import { store } from './js/state/store.js'
import { storageAdapter } from './js/state/local.js'
import { syncStorage } from './js/storage/sync.js'
import { keyboard } from './js/components/Keyboard.js'
import { Toast } from './js/components/Toast.js'
import { bulk } from './js/components/Bulk.js'
import { createMobileNav } from './js/components/MobileNav.js'

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
window.toast = Toast  // Global toast access

// Detect low-power devices and adjust animations
const isLowPower = isLowPowerDevice()
if (isLowPower) {
  document.documentElement.classList.add('reduce-motion')
  console.log('📱 Low-power device detected: animations reduced')
}

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
    // Expose showSection globally for Navigation.js
    window.showSection = showSection
    
    // Initialize navigation based on viewport
    if (window.innerWidth < 1024) {
      // Mobile: use new mobile nav
      const bottomNav = document.getElementById('bottomNav')
      if (bottomNav) {
        const mobileNav = createMobileNav()
        // Insert mobile nav before bottomNav and hide bottomNav
        if (bottomNav.parentNode) {
          bottomNav.parentNode.insertBefore(mobileNav, bottomNav)
          bottomNav.style.display = 'none'
        }
      }
    } else {
      // Desktop: use existing sidebar nav
      const sidebarNav = document.getElementById('sidebarNav')
      if (sidebarNav) {
        // Clear existing content
        sidebarNav.innerHTML = ''
        
        // Create navigation items
        const navItems = [
          { id: 'dashboard', label: 'Dashboard', icon: 'home', active: true },
          { id: 'projects', label: 'Projects', icon: 'folder-kanban' },
          { id: 'priorities', label: 'Priorities', icon: 'star' },
          { id: 'revenue', label: 'Revenue', icon: 'dollar-sign' },
          { id: 'inventory', label: 'Printers', icon: 'printer' },
          { id: 'calendar', label: 'Calendar', icon: 'calendar' },
          { id: 'events', label: 'Events', icon: 'calendar-days' },
          { id: 'notes', label: 'Notes', icon: 'file-text' },
          { id: 'skus', label: 'SKUs', icon: 'package' },
          { id: 'leads', label: 'Leads', icon: 'users' },
          { id: 'timeline', label: 'Timeline', icon: 'clock' },
          { id: 'review', label: 'Review', icon: 'clipboard-check' },
          { id: 'docs', label: 'Docs', icon: 'folder' },
          { id: 'settings', label: 'Settings', icon: 'settings' }
        ]
        
        // Create navigation using Navigation component
        const { Navigation } = await import('./js/components/Navigation.js')
        const nav = Navigation({
          items: navItems,
          mode: 'sidebar',
          onNavigate: (itemId) => {
            if (window.showSection) {
              window.showSection(itemId)
            }
          }
        })
        
        if (nav) {
          sidebarNav.appendChild(nav)
        }
      }
    }
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
    initKeyboardShortcuts()
  } catch (err) {
    console.error('Keyboard shortcuts failed:', err)
  }
  
  // Initialize keyboard shortcuts (legacy)
  try {
    keyboard.init()
  } catch (err) {
    console.error('Keyboard failed:', err)
  }

  // Initialize command palette
  try {
    commandPalette.init()
  } catch (err) {
    console.error('Command palette failed:', err)
  }

  // Expose loading states globally
  window.loadingStates = loadingStates
  
  // Expose animation controller globally
  window.animationController = animationController
  
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

  // Initialize Discord webhook polling
  try {
    syncStorage.startDiscordPolling(30000) // Check every 30 seconds
  } catch (err) {
    console.error('Discord polling failed:', err)
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
    
    // Add passive touch listeners for better scroll performance
    document.addEventListener('touchstart', () => {}, { passive: true })
    document.addEventListener('touchmove', () => {}, { passive: true })
  }
  
  // Initialize focus management
  try {
    initFocusManagement()
  } catch (err) {
    console.error('Focus management failed:', err)
  }

  // Start performance monitoring in development
  if (location.hostname === 'localhost' || location.search.includes('debug')) {
    performanceMonitor.start()
    setTimeout(() => {
      performanceMonitor.logReport()
      memoryMonitor.log()
    }, 5000)
  }

  // Initialize scroll reveal animations (skip on low-power devices)
  if (!isLowPower) {
    try {
      initScrollAnimations()
    } catch (err) {
      console.error('Scroll animations failed:', err)
    }
  }
  
  // Initialize touch feedback for mobile
  try {
    initTouchFeedback()
  } catch (err) {
    console.error('Touch feedback failed:', err)
  }
  
  // Initialize mobile interactions (touch feedback, haptic, etc.)
  try {
    initMobileInteractions()
  } catch (err) {
    console.error('Mobile interactions failed:', err)
  }
  
  // Apply touch feedback to dynamically rendered elements after each section render
  window.applyTouchFeedbackToAll = applyTouchFeedbackToAll
  
  // Initialize lazy loader for images
  try {
    lazyLoader.autoDetectElements()
  } catch (err) {
    console.error('Lazy loader failed:', err)
  }
  
  // Animate cards on initial load
  setTimeout(() => {
    animateCards()
  }, 100)
  
  // Show welcome toast
  Toast.success('Mission Control V5', 'App loaded successfully!', 3000)
}

function createSectionContainers() {
  const content = document.getElementById('mainContent')
  content.innerHTML = `
    <div id="dashboardSection" class="section" style="display: none;" data-reveal><div id="dashboardContent"></div></div>
    <div id="projectsSection" class="section" style="display: none;" data-reveal><div id="projectsContent"></div></div>
    <div id="prioritiesSection" class="section" style="display: none;" data-reveal><div id="prioritiesContent"></div></div>
    <div id="revenueSection" class="section" style="display: none;" data-reveal><div id="revenueContent"></div></div>
    <div id="leadsSection" class="section" style="display: none;" data-reveal><div id="leadsContent"></div></div>
    <div id="eventsSection" class="section" style="display: none;" data-reveal><div id="eventsContent"></div></div>
    <div id="calendarSection" class="section" style="display: none;" data-reveal><div id="calendarContent"></div></div>
    <div id="inventorySection" class="section" style="display: none;" data-reveal><div id="inventoryContent"></div></div>
    <div id="skusSection" class="section" style="display: none;" data-reveal><div id="skusContent"></div></div>
    <div id="timelineSection" class="section" style="display: none;" data-reveal><div id="timelineContent"></div></div>
    <div id="reviewSection" class="section" style="display: none;" data-reveal><div id="reviewContent"></div></div>
    <div id="docsSection" class="section" style="display: none;" data-reveal><div id="docsContent"></div></div>
    <div id="notesSection" class="section" style="display: none;" data-reveal><div id="notesContent"></div></div>
    <div id="settingsSection" class="section" style="display: none;" data-reveal><div id="settingsContent"></div></div>
  `
}

async function showSection(sectionId) {
  const sections = document.querySelectorAll('.section')
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
  
  const targetId = map[sectionId]
  if (!targetId) return
  
  const targetEl = document.getElementById(targetId)
  if (!targetEl) return

  // Find currently visible section
  const currentEl = Array.from(sections).find(s => s.style.display === 'block')
  
  // Hide all sections
  sections.forEach(s => s.style.display = 'none')
  
  // Show target with enhanced animation
  if (currentEl && currentEl !== targetEl) {
    targetEl.style.display = 'block'
    await animationController.animateIn(targetEl, 'slide')
    
    // Stagger animate cards in the new section
    const cards = targetEl.querySelectorAll('.m-card, .card, .metric-card')
    if (cards.length > 0) {
      await animationController.stagger(Array.from(cards), 'slideUp', { initialDelay: 100 })
    }
  } else {
    targetEl.style.display = 'block'
  }
  
  // Update navigation active state
  if (window.updateNavigation) {
    window.updateNavigation(sectionId)
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Expose showSection globally for navigation
window.showSection = showSection

// Global navigation update function
window.updateNavigation = function(sectionId) {
  // Update sidebar nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    const itemId = item.getAttribute('data-nav-id')
    if (itemId === sectionId) {
      item.classList.add('nav-item--active')
      item.setAttribute('aria-current', 'page')
    } else {
      item.classList.remove('nav-item--active')
      item.setAttribute('aria-current', 'false')
    }
  })
  
  // Update bottom nav items
  document.querySelectorAll('.bottom-nav__item').forEach(item => {
    const itemId = item.getAttribute('data-nav-id')
    if (itemId === sectionId) {
      item.classList.add('bottom-nav__item--active')
      item.setAttribute('aria-current', 'page')
    } else {
      item.classList.remove('bottom-nav__item--active')
      item.setAttribute('aria-current', 'false')
    }
  })
  
  // Update page title
  const pageTitle = document.getElementById('pageTitle')
  if (pageTitle) {
    const titleMap = {
      dashboard: 'Dashboard',
      projects: 'Projects',
      priorities: 'Priorities',
      revenue: 'Revenue',
      leads: 'Leads',
      events: 'Events',
      calendar: 'Calendar',
      inventory: 'Printers',
      skus: 'SKUs',
      timeline: 'Timeline',
      review: 'Review',
      docs: 'Docs',
      notes: 'Notes',
      settings: 'Settings'
    }
    pageTitle.textContent = titleMap[sectionId] || 'Mission Control'
  }
}

// Initialize app with error boundary
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init().catch(err => {
      console.error('App initialization failed:', err)
      document.body.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-primary);">
          <h2>⚠️ Failed to load Mission Control</h2>
          <p>Please refresh the page or clear your browser cache.</p>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--accent-primary); border: none; border-radius: var(--radius-md); color: white; cursor: pointer;">
            🔄 Reload Page
          </button>
        </div>
      `
    })
  })
} else {
  init().catch(err => {
    console.error('App initialization failed:', err)
    document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: var(--text-primary);">
        <h2>⚠️ Failed to load Mission Control</h2>
        <p>Please refresh the page or clear your browser cache.</p>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: var(--accent-primary); border: none; border-radius: var(--radius-md); color: white; cursor: pointer;">
          🔄 Reload Page
        </button>
      </div>
    `
  })
}
