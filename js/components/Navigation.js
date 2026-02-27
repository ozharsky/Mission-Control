import { createSettingsModal } from './SettingsModal.js'
import { createBackupModal } from './BackupModal.js'
import { createStatusIndicator } from './StatusIndicator.js'
import { store } from '../state/store.js'

export function createNavigation(containerId, options = {}) {
  const container = document.getElementById(containerId)
  if (!container) return
  
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
  
  // Bottom tabs for mobile - most used items
  const bottomTabs = [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'projects', icon: '📋', label: 'Projects' },
    { id: 'priorities', icon: '⭐', label: 'Tasks' },
    { id: 'revenue', icon: '💰', label: 'Revenue' },
    { id: 'notes', icon: '📝', label: 'Notes' }
  ]
  
  let activeSection = options.activeSection || 'dashboard'
  let collapsedGroups = new Set()
  let isMobileMenuOpen = false
  
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
        // Count non-closed/lost leads
        const active = leads.filter(l => l.status && !['closed', 'lost'].includes(l.status)).length
        return active > 0 ? active : null
      }
      case 'eventCount': {
        const events = state.events || []
        // Count upcoming events (not completed or cancelled)
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
  
  function render() {
    const state = store.getState()
    const currentBoard = state.currentBoard || 'all'
    
    container.innerHTML = `
      <!-- Mobile Menu Button -->
      <button class="mobile-menu-btn" onclick="toggleMobileMenu()" aria-label="Toggle menu">
        <span class="menu-icon">${isMobileMenuOpen ? '✕' : '☰'}</span>
      </button>
      
      <!-- Overlay -->
      <div class="nav-overlay ${isMobileMenuOpen ? 'active' : ''}" onclick="toggleMobileMenu()"></div>
      
      <!-- Sidebar Navigation -->
      <nav class="nav ${isMobileMenuOpen ? 'open' : ''}" aria-label="Main navigation">
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
              <button class="nav-group-header" onclick="toggleGroup('${group.title}')" aria-expanded="${!collapsedGroups.has(group.title)}">
                <span>${group.title}</span>
                <span class="nav-group-toggle">▼</span>
              </button>
              <div class="nav-items">
                ${group.items.map(item => {
                  const badge = getBadgeValue(item.badge)
                  return `
                    <button 
                      class="nav-item ${activeSection === item.id ? 'active' : ''}" 
                      onclick="handleNavClick('${item.id}')"
                      aria-current="${activeSection === item.id ? 'page' : 'false'}"
                    >
                      <span class="nav-item-icon">${item.icon}</span>
                      <span class="nav-item-label">${item.label}</span>
                      ${badge ? `<span class="nav-item-badge">${badge}</span>
                      ` : ''}
                    </button>
                  `
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="nav-footer">
          <button class="nav-footer-btn" onclick="createBackupModal()">
            <span>💾</span>
            <span>Backup</span>
          </button>
          <button class="nav-footer-btn" onclick="createSettingsModal()">
            <span>⚙️</span>
            <span>Settings</span>
          </button>
        </div>
      </nav>
      
      <!-- Bottom Tab Bar (Mobile) -->
      <div class="bottom-tabs" role="tablist">
        ${bottomTabs.map(tab => `
          <button 
            class="bottom-tab ${activeSection === tab.id ? 'active' : ''}"
            onclick="handleNavClick('${tab.id}')"
            role="tab"
            aria-selected="${activeSection === tab.id}"
            aria-label="${tab.label}"
          >
            <span class="bottom-tab-icon">${tab.icon}</span>
            <span class="bottom-tab-label">${tab.label}</span>
          </button>
        `).join('')}
      </div>
    `
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
  
  window.toggleGroup = (title) => {
    if (collapsedGroups.has(title)) {
      collapsedGroups.delete(title)
    } else {
      collapsedGroups.add(title)
    }
    render()
  }
  
  window.toggleMobileMenu = () => {
    isMobileMenuOpen = !isMobileMenuOpen
    render()
  }
  
  window.handleNavClick = (sectionId) => {
    activeSection = sectionId
    isMobileMenuOpen = false
    render()
    if (options.onNavigate) {
      options.onNavigate(sectionId)
    }
  }
  
  // Allow external navigation updates
  window.updateNavigation = (sectionId) => {
    activeSection = sectionId
    render()
  }
  
  window.navigateTo = window.handleNavClick
  
  // Initialize status indicator
  setTimeout(() => {
    createStatusIndicator('navStatus')
  }, 100)
  
  // Expose settings modal globally
  window.createSettingsModal = createSettingsModal
  window.createBackupModal = createBackupModal
  
  // Subscribe to store changes to update badges
  store.subscribe((state, path) => {
    if (!path || path.includes('priorities') || path.includes('projects') || 
        path.includes('leads') || path.includes('events') || 
        path.includes('skus') || path.includes('documents') || 
        path.includes('notes') || path.includes('currentBoard')) {
      render()
    }
  })
  
  render()
  return { render }
}