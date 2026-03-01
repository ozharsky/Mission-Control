import { createBackupModal } from './BackupModal.js'
import { createStatusIndicator } from './StatusIndicator.js'
import { store } from '../state/store.js'

// Navigation groups configuration
const groups = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '🏠', badge: null },
      { id: 'projects', label: 'Projects', icon: '📋', badge: 'projectCount' },
      { id: 'priorities', label: 'Priorities', icon: '⭐', badge: 'priorityCount' }
    ]
  },
  {
    title: 'Business',
    items: [
      { id: 'revenue', label: 'Revenue', icon: '💰', badge: null },
      { id: 'leads', label: 'Leads', icon: '🎯', badge: 'leadCount' },
      { id: 'events', label: 'Events', icon: '📅', badge: 'eventCount' }
    ]
  },
  {
    title: 'Operations',
    items: [
      { id: 'inventory', label: 'Printers', icon: '🖨️', badge: null },
      { id: 'skus', label: 'SKU Stock', icon: '📦', badge: 'lowStockCount' },
      { id: 'calendar', label: 'Calendar', icon: '🗓️', badge: null }
    ]
  },
  {
    title: 'Planning',
    items: [
      { id: 'timeline', label: 'Timeline', icon: '📍', badge: null },
      { id: 'review', label: 'Review', icon: '📈', badge: null },
      { id: 'docs', label: 'Docs', icon: '📁', badge: 'docCount' },
      { id: 'notes', label: 'Notes', icon: '📝', badge: 'noteCount' }
    ]
  },
  {
    title: 'System',
    items: [
      { id: 'settings', label: 'Settings', icon: '⚙️', badge: null }
    ]
  }
]

let activeSection = 'dashboard'
let collapsedGroups = new Set()

export function createNavigation() {
  renderDesktopNav()
  
  // Initialize status indicator
  setTimeout(() => {
    createStatusIndicator('navStatus')
  }, 100)
  
  // Subscribe to store changes to update badges
  store.subscribe((state, path) => {
    if (!path || path.includes('priorities') || path.includes('projects') || 
        path.includes('leads') || path.includes('events') || 
        path.includes('skus') || path.includes('documents') || 
        path.includes('notes') || path.includes('currentBoard')) {
      renderDesktopNav()
    }
  })
  
  // Expose global functions
  window.toggleGroup = toggleGroup
  window.handleNavClick = handleNavClick
  window.navigateTo = handleNavClick
  window.updateNavigation = (sectionId) => {
    activeSection = sectionId
    renderDesktopNav()
  }
  window.createBackupModal = createBackupModal
}

function renderDesktopNav() {
  const container = document.getElementById('mainNav')
  if (!container) return
  
  // Only render if not already rendered
  if (container.dataset.rendered === 'desktop') return
  container.dataset.rendered = 'desktop'
  
  const state = store.getState()
  const currentBoard = state.currentBoard || 'all'
  
  // Clear and render desktop sidebar
  container.innerHTML = `
    <div class="nav-header">
      <div class="nav-logo">
        <div class="nav-logo-icon">🚀</div>
        <div class="nav-logo-text">
          <span class="nav-logo-title">Mission Control</span>
          <span class="nav-logo-version">v4</span>
        </div>
      </div>
      <div id="navStatus"></div>
    </div>
    
    <div class="nav-board-indicator">
      <span class="board-dot ${currentBoard}"></span>
      <span class="board-name">${getBoardLabel(currentBoard)}</span>
    </div>
    
    <div class="nav-menu">
      ${groups.map(group => `
        <div class="nav-group ${collapsedGroups.has(group.title) ? 'collapsed' : ''}">
          <button class="nav-group-header" aria-expanded="${!collapsedGroups.has(group.title)}">
            <span>${group.title}</span>
            <span class="nav-group-toggle">▼</span>
          </button>
          <div class="nav-items">
            ${group.items.map(item => {
              const badge = getBadgeValue(item.badge)
              return `
                <button 
                  class="nav-item ${activeSection === item.id ? 'active' : ''}" 
                  data-nav-id="${item.id}"
                  aria-current="${activeSection === item.id ? 'page' : 'false'}"
                >
                  <span class="nav-item-icon">${item.icon}</span>
                  <span class="nav-item-label">${item.label}</span>
                  ${badge ? `<span class="nav-item-badge">${badge}</span>` : ''}
                </button>
              `
            }).join('')}
          </div>
        </div>
      `).join('')}
    </div>
    
    <div class="nav-footer">
      <button class="nav-footer-btn backup-btn">
        <span>💾</span>
        <span>Backup</span>
      </button>
      <button class="nav-footer-btn settings-btn">
        <span>⚙️</span>
        <span>Settings</span>
      </button>
    </div>
  `
  
  // Attach desktop event listeners
  attachDesktopListeners()
}

function attachDesktopListeners() {
  const container = document.getElementById('mainNav')
  if (!container) return
  
  // Group toggle listeners
  container.querySelectorAll('.nav-group-header').forEach(header => {
    header.addEventListener('click', () => {
      const title = header.querySelector('span').textContent
      toggleGroup(title)
    })
  })
  
  // Nav item listeners
  container.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.navId
      handleNavClick(sectionId)
    })
  })
  
  // Footer button listeners
  const backupBtn = container.querySelector('.backup-btn')
  if (backupBtn) {
    backupBtn.addEventListener('click', () => createBackupModal())
  }
  
  const settingsBtn = container.querySelector('.settings-btn')
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => handleNavClick('settings'))
  }
}

function toggleGroup(title) {
  if (collapsedGroups.has(title)) {
    collapsedGroups.delete(title)
  } else {
    collapsedGroups.add(title)
  }
  renderDesktopNav()
}

function handleNavClick(sectionId) {
  activeSection = sectionId
  renderDesktopNav()
  
  if (window.showSection) {
    window.showSection(sectionId)
  }
}

function getBadgeValue(badgeType) {
  const state = store.getState()
  switch (badgeType) {
    case 'projectCount': {
      const projects = state.projects || {}
      const allProjects = Object.values(projects).flat()
      const active = allProjects.filter(p => p.status !== 'done').length
      return active > 0 ? active : null
    }
    case 'priorityCount': {
      const priorities = state.priorities || []
      const active = priorities.filter(p => !p.completed).length
      return active > 0 ? active : null
    }
    case 'leadCount': {
      const leads = state.leads || []
      const active = leads.filter(l => l.status && !['closed', 'lost'].includes(l.status)).length
      return active > 0 ? active : null
    }
    case 'eventCount': {
      const events = state.events || []
      const upcoming = events.filter(e => e.status && !['completed', 'cancelled'].includes(e.status)).length
      return upcoming > 0 ? upcoming : null
    }
    case 'lowStockCount': {
      const skus = state.skus || []
      const low = skus.filter(s => (s.stock || 0) <= 5).length
      return low > 0 ? low : null
    }
    case 'docCount': {
      const docs = state.documents || []
      return docs.length > 0 ? docs.length : null
    }
    case 'noteCount': {
      const notes = state.notes || []
      return notes.length > 0 ? notes.length : null
    }
    default:
      return null
  }
}

function getBoardLabel(boardId) {
  const labels = {
    'all': 'All Boards',
    'etsy': '🛒 Etsy Shop',
    'photography': '📸 Photography',
    '3dprint': '🖨️ 3D Printing',
    'wholesale': '🏢 Wholesale'
  }
  return labels[boardId] || boardId
}
