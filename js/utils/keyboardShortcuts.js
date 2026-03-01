// Keyboard shortcut manager
// Centralized keyboard handling for Mission Control V5

import { debounce } from './performance.js'

const shortcuts = new Map()
let enabled = true
let helpModal = null
let isProcessing = false

// Default shortcuts configuration
const defaultShortcuts = {
  // Navigation
  'g d': { action: () => showSection('dashboard'), description: 'Go to Dashboard', category: 'Navigation' },
  'g p': { action: () => showSection('priorities'), description: 'Go to Priorities', category: 'Navigation' },
  'g r': { action: () => showSection('projects'), description: 'Go to Projects', category: 'Navigation' },
  'g v': { action: () => showSection('revenue'), description: 'Go to Revenue', category: 'Navigation' },
  'g c': { action: () => showSection('calendar'), description: 'Go to Calendar', category: 'Navigation' },
  'g s': { action: () => showSection('settings'), description: 'Go to Settings', category: 'Navigation' },
  'g l': { action: () => showSection('leads'), description: 'Go to Leads', category: 'Navigation' },
  'g i': { action: () => showSection('inventory'), description: 'Go to Inventory', category: 'Navigation' },
  'g n': { action: () => showSection('notes'), description: 'Go to Notes', category: 'Navigation' },
  
  // Actions
  'n p': { action: () => openPriorityModal?.(), description: 'New Priority', category: 'Actions' },
  'n r': { action: () => openProjectModal?.(), description: 'New Project', category: 'Actions' },
  'n e': { action: () => openEventModal?.(), description: 'New Event', category: 'Actions' },
  'n l': { action: () => openLeadModal?.(), description: 'New Lead', category: 'Actions' },
  
  // Search
  '/': { action: () => focusSearch?.(), description: 'Focus Search', category: 'Search' },
  'cmd+k': { action: () => openCommandPalette?.(), description: 'Command Palette', category: 'Search' },
  'ctrl+k': { action: () => openCommandPalette?.(), description: 'Command Palette', category: 'Search' },
  
  // Misc
  '?': { action: () => showHelp(), description: 'Show Keyboard Shortcuts', category: 'Help' },
  'esc': { action: () => closeModals?.(), description: 'Close Modals/Dialogs', category: 'Help' },
  'cmd+shift+e': { action: () => dataManager?.exportAll(), description: 'Export Data', category: 'Data' },
  'ctrl+shift+e': { action: () => dataManager?.exportAll(), description: 'Export Data', category: 'Data' },
  'cmd+s': { action: () => { event.preventDefault(); syncStorage?.syncNow(); }, description: 'Sync Now', category: 'Data' },
  'ctrl+s': { action: () => { event.preventDefault(); syncStorage?.syncNow(); }, description: 'Sync Now', category: 'Data' }
}

// Key sequence tracking
let keyBuffer = ''
let keyBufferTimeout = null
const KEY_BUFFER_TIMEOUT = 1000 // Reset buffer after 1 second

function resetKeyBuffer() {
  keyBuffer = ''
  if (keyBufferTimeout) {
    clearTimeout(keyBufferTimeout)
    keyBufferTimeout = null
  }
}

function addToKeyBuffer(key) {
  keyBuffer += key
  
  if (keyBufferTimeout) {
    clearTimeout(keyBufferTimeout)
  }
  
  keyBufferTimeout = setTimeout(resetKeyBuffer, KEY_BUFFER_TIMEOUT)
}

// Parse key combination from event
function getKeyCombo(event) {
  const parts = []
  
  if (event.ctrlKey) parts.push('ctrl')
  if (event.altKey) parts.push('alt')
  if (event.metaKey) parts.push('cmd')
  if (event.shiftKey) parts.push('shift')
  
  // Get the key
  let key = event.key.toLowerCase()
  
  // Handle special keys
  if (key === ' ') key = 'space'
  if (key === 'escape') key = 'esc'
  if (key === 'enter') key = 'return'
  
  parts.push(key)
  
  return parts.join('+')
}

// Check if element is an input field
function isInputElement(element) {
  if (!element) return false
  const tagName = element.tagName?.toLowerCase()
  const inputTypes = ['input', 'textarea', 'select']
  const editable = element.isContentEditable
  
  return inputTypes.includes(tagName) || editable
}

// Handle keydown events
function handleKeydown(event) {
  if (!enabled || isProcessing) return
  
  const combo = getKeyCombo(event)
  
  // Don't trigger shortcuts when typing in input fields (except Esc and Cmd/Ctrl combos)
  if (isInputElement(event.target)) {
    if (combo !== 'esc' && !combo.includes('cmd') && !combo.includes('ctrl')) {
      return
    }
  }
  
  // Check for direct shortcuts (with modifiers)
  if (shortcuts.has(combo)) {
    event.preventDefault()
    isProcessing = true
    const shortcut = shortcuts.get(combo)
    try {
      shortcut.action()
    } catch (err) {
      console.error('Keyboard shortcut error:', err)
    }
    resetKeyBuffer()
    // Reset processing flag after a short delay to prevent rapid-fire
    setTimeout(() => { isProcessing = false }, 100)
    return
  }
  
  // Handle sequence shortcuts (like 'g d')
  const key = event.key.toLowerCase()
  
  // Single character keys for sequences (no modifiers)
  if (key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
    addToKeyBuffer(key)
    
    const sequence = keyBuffer.trim()
    if (shortcuts.has(sequence)) {
      event.preventDefault()
      isProcessing = true
      const shortcut = shortcuts.get(sequence)
      try {
        shortcut.action()
      } catch (err) {
        console.error('Keyboard shortcut error:', err)
      }
      resetKeyBuffer()
      setTimeout(() => { isProcessing = false }, 100)
    }
  }
}

// Show help modal
function showHelp() {
  if (helpModal) {
    helpModal.remove()
    helpModal = null
    return
  }
  
  // Group shortcuts by category
  const categories = new Map()
  
  shortcuts.forEach((shortcut, key) => {
    const category = shortcut.category || 'Other'
    if (!categories.has(category)) {
      categories.set(category, [])
    }
    categories.get(category).push({ key, description: shortcut.description })
  })
  
  helpModal = document.createElement('div')
  helpModal.className = 'modal-overlay active keyboard-help'
  helpModal.innerHTML = `
    <div class="modal" style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
      <div class="modal-header">
        <div class="modal-title">⌨️ Keyboard Shortcuts</div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body">
        ${Array.from(categories.entries()).map(([category, items]) => `
          <div class="shortcut-category">
            <h4 style="margin: 1rem 0 0.5rem; color: var(--accent-primary); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.05em;">${category}</h4>
            <div class="shortcut-list" style="display: grid; gap: 0.5rem;">
              ${items.map(item => `
                <div class="shortcut-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
                  <span style="color: var(--text-secondary);">${item.description}</span>
                  <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-family: monospace; font-size: 0.875rem; border: 1px solid var(--border-color);">${formatKey(item.key)}</kbd>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="modal-footer" style="text-align: center; color: var(--text-muted); font-size: 0.875rem;">
        Press <kbd>?</kbd> to close this help
      </div>
    </div>
  `
  
  document.body.appendChild(helpModal)
  
  // Close on overlay click
  helpModal.addEventListener('click', (e) => {
    if (e.target === helpModal) {
      helpModal.remove()
      helpModal = null
    }
  })
}

// Format key for display
function formatKey(key) {
  return key
    .replace('cmd', '⌘')
    .replace('ctrl', 'Ctrl')
    .replace('alt', 'Alt')
    .replace('shift', 'Shift')
    .replace('return', 'Enter')
    .replace('esc', 'Esc')
    .replace(/\+/g, ' ')
}

// Initialize keyboard shortcuts
export function initKeyboardShortcuts() {
  // Register default shortcuts
  Object.entries(defaultShortcuts).forEach(([key, config]) => {
    shortcuts.set(key, config)
  })
  
  // Add event listener
  document.addEventListener('keydown', handleKeydown)
  
  console.log('⌨️ Keyboard shortcuts initialized')
}

// Register a custom shortcut
export function registerShortcut(key, action, description, category = 'Custom') {
  shortcuts.set(key.toLowerCase(), { action, description, category })
}

// Unregister a shortcut
export function unregisterShortcut(key) {
  shortcuts.delete(key.toLowerCase())
}

// Enable/disable shortcuts
export function setShortcutsEnabled(value) {
  enabled = value
}

// Get all registered shortcuts
export function getShortcuts() {
  return Array.from(shortcuts.entries()).map(([key, config]) => ({
    key,
    description: config.description,
    category: config.category
  }))
}

// Cleanup
export function destroyKeyboardShortcuts() {
  document.removeEventListener('keydown', handleKeydown)
  shortcuts.clear()
  resetKeyBuffer()
}
