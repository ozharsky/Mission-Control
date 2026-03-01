// Command Palette - Quick access to all actions
// Inspired by VS Code's Cmd+Shift+P

import { store } from '../state/store.js'
import { createFocusTrap } from '../utils/focusManager.js'

export const commandPalette = {
  isOpen: false,
  commands: [],
  selectedIndex: 0,
  filteredCommands: [],
  focusTrap: null,
  overlay: null,
  _keydownHandler: null,
  _handleResize: null,

  init() {
    this.registerCommands()
    this._keydownHandler = this.handleKeydown.bind(this)
    document.addEventListener('keydown', this._keydownHandler)
  },

  /**
   * Clean up event listeners and resources
   */
  destroy() {
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler)
      this._keydownHandler = null
    }
    this.close()
  },

  registerCommands() {
    this.commands = [
      // Navigation
      { id: 'nav-dashboard', label: 'Go to Dashboard', category: 'Navigation', shortcut: 'D', action: () => this.navigate('dashboard') },
      { id: 'nav-projects', label: 'Go to Projects', category: 'Navigation', shortcut: 'P', action: () => this.navigate('projects') },
      { id: 'nav-priorities', label: 'Go to Priorities', category: 'Navigation', shortcut: 'T', action: () => this.navigate('priorities') },
      { id: 'nav-revenue', label: 'Go to Revenue', category: 'Navigation', shortcut: 'R', action: () => this.navigate('revenue') },
      { id: 'nav-calendar', label: 'Go to Calendar', category: 'Navigation', shortcut: 'C', action: () => this.navigate('calendar') },
      { id: 'nav-inventory', label: 'Go to Inventory', category: 'Navigation', shortcut: 'I', action: () => this.navigate('inventory') },
      { id: 'nav-leads', label: 'Go to Leads', category: 'Navigation', action: () => this.navigate('leads') },
      { id: 'nav-events', label: 'Go to Events', category: 'Navigation', action: () => this.navigate('events') },
      
      // Actions
      { id: 'action-new-priority', label: 'New Priority', category: 'Actions', shortcut: 'Ctrl+N', action: () => this.newPriority() },
      { id: 'action-undo', label: 'Undo', category: 'Actions', shortcut: 'Ctrl+Z', action: () => this.undo() },
      
      // Quick Filters
      { id: 'filter-today', label: 'Show Today\'s Tasks', category: 'Filters', action: () => this.filterByDate('today') },
      { id: 'filter-week', label: 'Show This Week', category: 'Filters', action: () => this.filterByDate('week') },
      { id: 'filter-overdue', label: 'Show Overdue', category: 'Filters', action: () => this.filterByDate('overdue') },
      { id: 'filter-completed', label: 'Show Completed', category: 'Filters', action: () => this.filterCompleted() },
      { id: 'filter-mine', label: 'Show My Tasks', category: 'Filters', action: () => this.filterMine() },
      
      // Boards
      { id: 'board-etsy', label: 'Etsy Board', category: 'Boards', action: () => this.filterBoard('etsy') },
      { id: 'board-photo', label: 'Photography Board', category: 'Boards', action: () => this.filterBoard('photography') },
      { id: 'board-wholesale', label: 'Wholesale Board', category: 'Boards', action: () => this.filterBoard('wholesale') },
      { id: 'board-3dprint', label: '3D Print Board', category: 'Boards', action: () => this.filterBoard('3dprint') },
      
      // Settings
      { id: 'settings-theme', label: 'Toggle Theme', category: 'Settings', action: () => this.toggleTheme() },
      { id: 'settings-help', label: 'Keyboard Shortcuts', category: 'Settings', shortcut: '?', action: () => this.showHelp() },
      { id: 'settings-sync', label: 'Force Sync', category: 'Settings', action: () => this.forceSync() }
    ]
  },

  handleKeydown(e) {
    // Cmd/Ctrl + Shift + P to open command palette
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
      e.preventDefault()
      this.open()
      return
    }

    // Cmd/Ctrl + P as alternative
    if ((e.ctrlKey || e.metaKey) && e.key === 'p' && !e.shiftKey) {
      e.preventDefault()
      this.open()
      return
    }

    // Handle palette navigation when open
    if (!this.isOpen) return

    switch(e.key) {
      case 'Escape':
        e.preventDefault()
        this.close()
        break
      case 'ArrowDown':
        e.preventDefault()
        this.selectNext()
        break
      case 'ArrowUp':
        e.preventDefault()
        this.selectPrevious()
        break
      case 'Enter':
        e.preventDefault()
        this.executeSelected()
        break
    }
  },

  open() {
    if (this.isOpen) return
    this.isOpen = true
    this.selectedIndex = 0
    this.filteredCommands = [...this.commands]

    const overlay = document.createElement('div')
    overlay.id = 'commandPalette'
    overlay.className = 'command-palette-overlay'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', 'Command Palette')
    
    const isMobile = window.innerWidth <= 768

    overlay.innerHTML = `
      <div class="command-palette ${isMobile ? 'command-palette-mobile' : ''}">
        <div class="command-palette-input-wrapper">
          <span class="command-palette-icon" aria-hidden="true">⌘</span>
          <input type="text" 
                 class="command-palette-input" 
                 placeholder="Type a command or search..."
                 autocomplete="off"
                 spellcheck="false"
                 aria-label="Search commands"
                 id="commandPaletteInput">
          <button class="command-palette-close" onclick="commandPalette.close()" aria-label="Close command palette">✕</button>
        </div>
        <div class="command-palette-results" role="listbox" aria-label="Commands">
          ${this.renderCommands()}
        </div>
        <div class="command-palette-footer">
          <span class="command-hint"><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
          <span class="command-hint"><kbd>↵</kbd> to select</span>
          <span class="command-hint"><kbd>esc</kbd> to close</span>
        </div>
      </div>
    `

    document.body.appendChild(overlay)
    this.addEnhancedStyles()

    // Setup focus trap
    const paletteElement = overlay.querySelector('.command-palette')
    this.focusTrap = createFocusTrap(paletteElement, {
      escapeDeactivates: true
    })
    this.focusTrap.activate()

    // Focus input with animation
    requestAnimationFrame(() => {
      overlay.classList.add('active')
      const input = document.getElementById('commandPaletteInput')
      if (input) input.focus()
    })

    // Handle input
    const input = overlay.querySelector('.command-palette-input')
    input.addEventListener('input', (e) => this.filter(e.target.value))

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close()
    })

    // Handle resize - use bound handler
    this._handleResize = () => {
      const palette = overlay.querySelector('.command-palette')
      if (palette) {
        const isMobile = window.innerWidth <= 768
        palette.classList.toggle('command-palette-mobile', isMobile)
      }
    }
    window.addEventListener('resize', this._handleResize)

    // Update reference
    this.overlay = overlay
  },

  close() {
    if (!this.isOpen) return
    this.isOpen = false
    
    // Deactivate focus trap
    if (this.focusTrap) {
      this.focusTrap.deactivate()
      this.focusTrap = null
    }
    
    // Remove resize listener using the bound handler
    if (this._handleResize) {
      window.removeEventListener('resize', this._handleResize)
      this._handleResize = null
    }
    
    const overlay = document.getElementById('commandPalette')
    if (overlay) {
      // Add exit animation
      overlay.classList.remove('active')
      overlay.classList.add('closing')
      
      setTimeout(() => {
        overlay.remove()
      }, 200)
    }
  },

  filter(query) {
    const lower = query.toLowerCase().trim()
    
    // Use requestIdleCallback for better performance on large command lists
    const doFilter = () => {
      this.filteredCommands = this.commands.filter(cmd => 
        cmd.label.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower)
      )
      this.selectedIndex = 0
      this.render()
    }

    if ('requestIdleCallback' in window && this.commands.length > 50) {
      requestIdleCallback(doFilter, { timeout: 50 })
    } else {
      doFilter()
    }
  },

  render() {
    const results = this.overlay.querySelector('.command-palette-results')
    results.innerHTML = this.renderCommands()
  },

  renderCommands() {
    if (this.filteredCommands.length === 0) {
      return `<div class="command-palette-empty">No commands found</div>`
    }

    // Group by category
    const grouped = this.filteredCommands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = []
      acc[cmd.category].push(cmd)
      return acc
    }, {})

    return Object.entries(grouped).map(([category, commands]) => `
      <div class="command-category">
        <div class="command-category-header">${category}</div>
        ${commands.map((cmd, i) => {
          const globalIndex = this.filteredCommands.indexOf(cmd)
          const selected = globalIndex === this.selectedIndex
          return `
            <div class="command-item ${selected ? 'selected' : ''}" 
                 data-index="${globalIndex}"
                 onclick="commandPalette.executeByIndex(${globalIndex})"
                 role="option"
                 aria-selected="${selected}"
                 tabindex="${selected ? 0 : -1}">
              <span class="command-label">${cmd.label}</span>
              ${cmd.shortcut ? `<span class="command-shortcut">${cmd.shortcut}</span>` : ''}
            </div>
          `
        }).join('')}
      </div>
    `).join('')
  },

  selectNext() {
    this.selectedIndex = (this.selectedIndex + 1) % this.filteredCommands.length
    this.render()
    this.scrollToSelected()
  },

  selectPrevious() {
    this.selectedIndex = (this.selectedIndex - 1 + this.filteredCommands.length) % this.filteredCommands.length
    this.render()
    this.scrollToSelected()
  },

  scrollToSelected() {
    const selected = this.overlay.querySelector('.command-item.selected')
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' })
    }
  },

  executeSelected() {
    const cmd = this.filteredCommands[this.selectedIndex]
    if (cmd) {
      this.close()
      cmd.action()
    }
  },

  executeByIndex(index) {
    const cmd = this.filteredCommands[index]
    if (cmd) {
      this.close()
      cmd.action()
    }
  },

  // Action handlers
  navigate(section) {
    if (window.showSection) {
      window.showSection(section)
    }
  },

  newPriority() {
    if (window.openPriorityModal) {
      window.openPriorityModal()
    }
  },

  undo() {
    if (window.undoManager?.undo) {
      window.undoManager.undo()
    }
  },

  filterByDate(range) {
    // Dispatch custom event for section to handle
    window.dispatchEvent(new CustomEvent('filterDate', { detail: range }))
  },

  filterCompleted() {
    window.dispatchEvent(new CustomEvent('filterStatus', { detail: 'completed' }))
  },

  filterMine() {
    window.dispatchEvent(new CustomEvent('filterAssignee', { detail: 'Oleg' }))
  },

  filterBoard(board) {
    window.dispatchEvent(new CustomEvent('filterBoard', { detail: board }))
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme')
    const next = current === 'light' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  },

  showHelp() {
    if (window.keyboard?.showHelp) {
      window.keyboard.showHelp()
    }
  },

  forceSync() {
    if (window.syncStatus?.sync) {
      window.syncStatus.sync()
    }
  },

  addEnhancedStyles() {
    if (document.getElementById('commandPaletteStyles')) return

    const styles = document.createElement('style')
    styles.id = 'commandPaletteStyles'
    styles.textContent = `
      .command-palette-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 10vh;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease, visibility 0.2s ease;
      }

      .command-palette-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      .command-palette-overlay.closing {
        opacity: 0;
        visibility: hidden;
      }

      .command-palette {
        width: 600px;
        max-width: 90vw;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        overflow: hidden;
        transform: scale(0.95) translateY(-10px);
        opacity: 0;
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                    opacity 0.2s ease;
      }

      .command-palette-overlay.active .command-palette {
        transform: scale(1) translateY(0);
        opacity: 1;
      }

      .command-palette-mobile {
        width: 100%;
        max-width: 100%;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        position: fixed;
        bottom: 0;
        top: auto;
        transform: translateY(100%);
      }

      .command-palette-overlay.active .command-palette-mobile {
        transform: translateY(0);
      }

      .command-palette-input-wrapper {
        display: flex;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      .command-palette-icon {
        font-size: 1.25rem;
        margin-right: 0.75rem;
        color: var(--text-secondary);
      }

      .command-palette-input {
        flex: 1;
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-size: 1rem;
        outline: none;
      }

      .command-palette-input::placeholder {
        color: var(--text-secondary);
      }

      .command-palette-close {
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.5rem;
        margin-left: 0.5rem;
        border-radius: var(--radius-sm);
        transition: all 0.2s;
        display: none;
      }

      .command-palette-close:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }

      @media (max-width: 768px) {
        .command-palette-close {
          display: block;
        }
        .command-palette-overlay {
          padding-top: 0;
          align-items: flex-end;
        }
      }

      .command-palette-results {
        max-height: 400px;
        overflow-y: auto;
      }

      @media (max-width: 768px) {
        .command-palette-results {
          max-height: 50vh;
        }
      }

      .command-category {
        padding: 0.5rem 0;
      }

      .command-category-header {
        padding: 0.5rem 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
      }

      .command-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: all 0.15s ease;
        border-left: 3px solid transparent;
      }

      .command-item:hover,
      .command-item.selected {
        background: var(--bg-secondary);
        border-left-color: var(--accent-primary);
      }

      .command-item.selected {
        background: var(--bg-tertiary);
      }

      .command-label {
        color: var(--text-primary);
      }

      .command-shortcut {
        font-size: 0.75rem;
        color: var(--text-secondary);
        background: var(--bg-tertiary);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
      }

      .command-palette-empty {
        padding: 2rem;
        text-align: center;
        color: var(--text-secondary);
      }

      .command-palette-footer {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--border-color);
        font-size: 0.75rem;
        color: var(--text-secondary);
        background: var(--bg-tertiary);
      }

      @media (max-width: 768px) {
        .command-palette-footer {
          display: none;
        }
      }

      .command-hint {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .command-hint kbd {
        background: var(--bg-secondary);
        padding: 0.125rem 0.375rem;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
        font-family: inherit;
        font-size: 0.6875rem;
      }
    `
    document.head.appendChild(styles)
  },

  addStyles() {
    // Backwards compatibility - now calls addEnhancedStyles
    this.addEnhancedStyles()
  }
}

// Expose globally
window.commandPalette = commandPalette
