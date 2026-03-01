// Keyboard Shortcuts Help
// Accessible, discoverable keyboard shortcuts

import { KEYBOARD_SHORTCUTS } from '../utils/constants.js'
import { lockBodyScroll, unlockBodyScroll } from '../utils/modalScrollLock.js'

export function createShortcutsHelp() {
  const existing = document.getElementById('shortcuts-help-modal')
  if (existing) {
    existing.remove()
    return
  }
  
  const modal = document.createElement('div')
  modal.id = 'shortcuts-help-modal'
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal" style="max-width: 600px;">
      <div class="modal-header">
        <div class="modal-title">⌨️ Keyboard Shortcuts</div>
        <button class="modal-close" onclick="closeShortcutsHelp()">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="shortcuts-grid">
          
          <div class="shortcuts-section">
            <h4>Navigation</h4>
            <div class="shortcut-item">
              <kbd>?</kbd>
              <span>Show this help</span>
            </div>
            <div class="shortcut-item">
              <kbd>D</kbd>
              <span>Dashboard</span>
            </div>
            <div class="shortcut-item">
              <kbd>P</kbd>
              <span>Projects</span>
            </div>
            <div class="shortcut-item">
              <kbd>T</kbd>
              <span>Priorities</span>
            </div>
            <div class="shortcut-item">
              <kbd>R</kbd>
              <span>Revenue</span>
            </div>
            <div class="shortcut-item">
              <kbd>C</kbd>
              <span>Calendar</span>
            </div>
          </div>
          
          <div class="shortcuts-section">
            <h4>Actions</h4>
            <div class="shortcut-item">
              <kbd>Cmd/Ctrl + N</kbd>
              <span>New Priority</span>
            </div>
            <div class="shortcut-item">
              <kbd>Cmd/Ctrl + K</kbd>
              <span>Search</span>
            </div>
            <div class="shortcut-item">
              <kbd>Cmd/Ctrl + Z</kbd>
              <span>Undo</span>
            </div>
            <div class="shortcut-item">
              <kbd>Esc</kbd>
              <span>Close modal</span>
            </div>
          </div>
          
        </div>
        
        <div class="shortcuts-tip">
          💡 Press <strong>?</strong> anytime to show this help
        </div>
        
      </div>
    </div>
  `
  
  modal.onclick = (e) => {
    if (e.target === modal) closeShortcutsHelp()
  }
  
  document.body.appendChild(modal)
  
  // Lock body scroll on mobile
  if (window.innerWidth <= 768) {
    lockBodyScroll()
  }
  
  // Add escape handler
  const escapeHandler = (e) => {
    if (e.key === 'Escape') {
      closeShortcutsHelp()
      document.removeEventListener('keydown', escapeHandler)
    }
  }
  document.addEventListener('keydown', escapeHandler)
}

export function closeShortcutsHelp() {
  const modal = document.getElementById('shortcuts-help-modal')
  if (modal) {
    modal.remove()
    unlockBodyScroll()
  }
}

// Add keyboard shortcut indicator to UI
export function addShortcutIndicator(element, key) {
  const indicator = document.createElement('span')
  indicator.className = 'shortcut-indicator'
  indicator.textContent = key
  element.appendChild(indicator)
}

// Create floating help button
export function createShortcutsButton() {
  const btn = document.createElement('button')
  btn.className = 'shortcuts-floating-btn'
  btn.innerHTML = '⌨️'
  btn.title = 'Keyboard Shortcuts (?)'
  btn.onclick = createShortcutsHelp
  
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--accent-primary);
    color: white;
    border: none;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    z-index: 100;
    transition: transform 0.2s, box-shadow 0.2s;
  `
  
  btn.onmouseenter = () => {
    btn.style.transform = 'scale(1.1)'
    btn.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.5)'
  }
  
  btn.onmouseleave = () => {
    btn.style.transform = 'scale(1)'
    btn.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)'
  }
  
  document.body.appendChild(btn)
}

// Initialize shortcuts help
export function initShortcutsHelp() {
  // Create floating button
  createShortcutsButton()
  
  // Add CSS
  const style = document.createElement('style')
  style.textContent = `
    .shortcuts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }
    
    .shortcuts-section h4 {
      margin: 0 0 1rem 0;
      color: var(--text-primary);
      font-size: 1rem;
    }
    
    .shortcut-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border);
    }
    
    .shortcut-item:last-child {
      border-bottom: none;
    }
    
    .shortcut-item kbd {
      background: var(--bg-tertiary);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 0.25rem 0.5rem;
      font-family: monospace;
      font-size: 0.875rem;
      min-width: 80px;
      text-align: center;
    }
    
    .shortcut-item span {
      color: var(--text-secondary);
    }
    
    .shortcuts-tip {
      margin-top: 1.5rem;
      padding: 1rem;
      background: var(--bg-tertiary);
      border-radius: var(--radius);
      text-align: center;
      color: var(--text-muted);
    }
    
    @media (max-width: 768px) {
      .shortcuts-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      
      .shortcuts-floating-btn {
        display: none;
      }
    }
  `
  document.head.appendChild(style)
}

// Expose globally
window.createShortcutsHelp = createShortcutsHelp
window.closeShortcutsHelp = closeShortcutsHelp
