// Keyboard Shortcuts Help - Show available keyboard shortcuts

import { toast } from './Toast.js'

class KeyboardShortcutsHelp {
  constructor() {
    this.modal = null
    this.shortcuts = []
  }

  show() {
    if (this.modal) {
      this.close()
      return
    }

    this.createModal()
    this.populateShortcuts()
  }

  createModal() {
    this.modal = document.createElement('div')
    this.modal.className = 'modal-overlay active'
    this.modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <div class="modal-title">⌨️ Keyboard Shortcuts</div>
          <button class="modal-close" onclick="keyboardShortcutsHelp.close()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="shortcuts-grid">
            ${this.renderShortcuts()}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="keyboardShortcutsHelp.close()">Close</button>
        </div>
      </div>
    `

    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close()
    })

    // Close on Escape
    document.addEventListener('keydown', this.handleEscape)

    document.body.appendChild(this.modal)
  }

  renderShortcuts() {
    const shortcuts = [
      { key: '?', description: 'Show this help' },
      { key: '/', description: 'Toggle help mode' },
      { key: 'Ctrl + Z', description: 'Undo last action' },
      { key: 'Ctrl + Shift + Z', description: 'Redo action' },
      { key: 'Ctrl + K', description: 'Open search' },
      { key: 'Ctrl + N', description: 'Create new item' },
      { key: 'Ctrl + S', description: 'Save current form' },
      { key: 'Esc', description: 'Close modal/cancel' },
      { key: '1-9', description: 'Switch to section 1-9' },
      { key: 'G then D', description: 'Go to Dashboard' },
      { key: 'G then P', description: 'Go to Projects' },
      { key: 'G then R', description: 'Go to Priorities' }
    ]

    return shortcuts.map(s => `
      <div class="shortcut-item">
        <kbd class="shortcut-key">${s.key}</kbd>
        <span class="shortcut-desc">${s.description}</span>
      </div>
    `).join('')
  }

  populateShortcuts() {
    // Could dynamically load from keyboardShortcuts.js
  }

  handleEscape = (e) => {
    if (e.key === 'Escape') this.close()
  }

  close() {
    if (this.modal) {
      this.modal.remove()
      this.modal = null
      document.removeEventListener('keydown', this.handleEscape)
    }
  }
}

// Add styles
const style = document.createElement('style')
style.textContent = `
  .shortcuts-grid {
    display: grid;
    gap: 0.75rem;
  }

  .shortcut-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem;
    border-radius: var(--radius-sm);
    transition: background 0.2s;
  }

  .shortcut-item:hover {
    background: var(--bg-tertiary);
  }

  .shortcut-key {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
    padding: 0.375rem 0.75rem;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    font-family: monospace;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-primary);
    box-shadow: 0 2px 0 var(--border-color);
  }

  .shortcut-desc {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }
`
document.head.appendChild(style)

export const keyboardShortcutsHelp = new KeyboardShortcutsHelp()
window.keyboardShortcutsHelp = keyboardShortcutsHelp

// Register '?' shortcut to show help
document.addEventListener('keydown', (e) => {
  // Don't trigger if in input
  if (e.target.matches('input, textarea, select')) return
  
  if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
    keyboardShortcutsHelp.show()
  }
})