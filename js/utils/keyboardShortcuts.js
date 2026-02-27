// Extended Keyboard Shortcuts
// Additional shortcuts for power users

import { store } from './state/store.js'
import { toast } from './components/Toast.js'

class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map()
    this.isModalOpen = false
    this.init()
  }
  
  init() {
    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    
    // Track modal state
    const observer = new MutationObserver(() => {
      this.isModalOpen = document.querySelector('.modal-overlay.active') !== null
    })
    observer.observe(document.body, { childList: true, subtree: true })
  }
  
  register(key, handler, options = {}) {
    const { 
      ctrl = false, 
      shift = false, 
      alt = false,
      description = '',
      modal = false // Allow in modals?
    } = options
    
    this.shortcuts.set(this.getKey(key, ctrl, shift, alt), {
      handler,
      description,
      modal
    })
  }
  
  getKey(key, ctrl, shift, alt) {
    return `${ctrl ? 'ctrl+' : ''}${shift ? 'shift+' : ''}${alt ? 'alt+' : ''}${key.toLowerCase()}`
  }
  
  handleKeyDown(e) {
    // Skip if typing in input
    if (e.target.matches('input, textarea, select, [contenteditable]')) {
      // Allow Escape even in inputs
      if (e.key !== 'Escape') return
    }
    
    const key = this.getKey(
      e.key,
      e.ctrlKey || e.metaKey,
      e.shiftKey,
      e.altKey
    )
    
    const shortcut = this.shortcuts.get(key)
    if (!shortcut) return
    
    // Skip if modal is open (unless allowed)
    if (this.isModalOpen && !shortcut.modal) return
    
    e.preventDefault()
    shortcut.handler(e)
  }
  
  // Show help
  showHelp() {
    const shortcuts = Array.from(this.shortcuts.entries()).map(([key, data]) => ({
      key: key.replace(/\+/g, ' + ').toUpperCase(),
      description: data.description
    }))
    
    const modal = document.createElement('div')
    modal.className = 'modal-overlay active'
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <div class="modal-title">⌨️ Keyboard Shortcuts</div>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="shortcuts-grid">
            ${shortcuts.map(s => `
              <div class="shortcut-item">
                <kbd>${s.key}</kbd>
                <span>${s.description}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `
    
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove()
    }
    
    document.body.appendChild(modal)
  }
}

// Create singleton
const shortcuts = new KeyboardShortcuts()

// Register default shortcuts
export function registerDefaultShortcuts() {
  // Navigation
  shortcuts.register('d', () => showSection('dashboard'), { 
    description: 'Go to Dashboard' 
  })
  shortcuts.register('p', () => showSection('projects'), { 
    description: 'Go to Projects' 
  })
  shortcuts.register('t', () => showSection('priorities'), { 
    description: 'Go to Priorities' 
  })
  shortcuts.register('r', () => showSection('revenue'), { 
    description: 'Go to Revenue' 
  })
  shortcuts.register('l', () => showSection('leads'), { 
    description: 'Go to Leads' 
  })
  shortcuts.register('e', () => showSection('events'), { 
    description: 'Go to Events' 
  })
  shortcuts.register('c', () => showSection('calendar'), { 
    description: 'Go to Calendar' 
  })
  shortcuts.register('n', () => showSection('notes'), { 
    description: 'Go to Notes' 
  })
  shortcuts.register('s', () => showSection('settings'), { 
    description: 'Go to Settings' 
  })
  
  // Actions
  shortcuts.register('n', () => {
    const currentSection = document.querySelector('.section.active')?.dataset.section
    if (currentSection) openCreateModal(currentSection)
  }, { 
    ctrl: true,
    description: 'Create new item' 
  })
  
  shortcuts.register('f', () => {
    const searchInput = document.querySelector('.section.active .search-input')
    if (searchInput) searchInput.focus()
  }, { 
    ctrl: true,
    description: 'Search in current section' 
  })
  
  shortcuts.register('k', () => {
    document.getElementById('global-search')?.focus()
  }, { 
    ctrl: true,
    description: 'Global search' 
  })
  
  shortcuts.register('s', () => {
    const activeModal = document.querySelector('.modal-overlay.active')
    if (activeModal) {
      activeModal.querySelector('form')?.dispatchEvent(new Event('submit'))
    }
  }, { 
    ctrl: true,
    modal: true,
    description: 'Save (in modal)' 
  })
  
  shortcuts.register('Delete', () => {
    const selected = document.querySelector('.selected-item')
    if (selected && confirm('Delete selected item?')) {
      selected.dispatchEvent(new CustomEvent('delete'))
    }
  }, { 
    description: 'Delete selected item' 
  })
  
  shortcuts.register('Escape', () => {
    const modal = document.querySelector('.modal-overlay.active')
    if (modal) modal.remove()
  }, { 
    modal: true,
    description: 'Close modal' 
  })
  
  shortcuts.register('?', () => shortcuts.showHelp(), { 
    description: 'Show keyboard shortcuts' 
  })
  
  // Helpful shortcuts
  shortcuts.register('z', () => {
    // Undo last action
    if (window.undoManager) {
      window.undoManager.undo()
    }
  }, { 
    ctrl: true,
    description: 'Undo' 
  })
  
  shortcuts.register('/', () => {
    document.documentElement.classList.toggle('help-mode')
  }, { 
    description: 'Toggle help mode (show shortcuts)' 
  })
}

// Helper to open create modal
function openCreateModal(section) {
  const map = {
    projects: 'openProjectModal',
    priorities: 'openPriorityModal',
    leads: 'openLeadModal',
    events: 'openEventModal',
    notes: 'openNoteModal',
    skus: 'openSKUModal'
  }
  
  const fn = window[map[section]]
  if (fn) fn()
}

export { shortcuts }
export default shortcuts
