import { undoManager } from '../state/undo.js'
import { icon } from '../utils/icons.js'

export const keyboard = {
  _initialized: false,

  init() {
    if (this._initialized) return
    this._initialized = true
    document.addEventListener('keydown', this.handleKeydown.bind(this))
  },

  handleKeydown(e) {
    // Always allow typing in inputs/textareas (except Escape)
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      if (e.key === 'Escape') {
        this.closeAllModals()
      }
      return
    }

    // Handle undo (Ctrl+Z / Cmd+Z)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      this.undo()
      return
    }

    // Handle redo (Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y)
    if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
      e.preventDefault()
      toast.info('Redo not available')
      return
    }

    // Handle Ctrl/Cmd + shortcuts
    if (e.ctrlKey || e.metaKey) {
      const ctrlShortcuts = {
        'n': () => { e.preventDefault(); this.newPriority(); }
      }

      const key = e.key.toLowerCase()
      if (ctrlShortcuts[key]) {
        ctrlShortcuts[key]()
        return
      }
    }

    // Single key shortcuts (only when NOT in input)
    const shortcuts = {
      '?': () => this.showHelp(),
      'p': () => { e.preventDefault(); this.navigate('projects'); },
      't': () => { e.preventDefault(); this.navigate('priorities'); },
      'd': () => { e.preventDefault(); this.navigate('dashboard'); },
      'r': () => { e.preventDefault(); this.navigate('revenue'); },
      'i': () => { e.preventDefault(); this.navigate('inventory'); },
      'c': () => { e.preventDefault(); this.navigate('calendar'); },
      'Escape': () => this.closeAllModals()
    }

    const key = e.key.toLowerCase()
    if (shortcuts[key]) {
      shortcuts[key]()
    }
  },

  undo() {
    const recent = undoManager.getRecent(1)
    if (recent.length > 0) {
      undoManager.undo(recent[0].id)
    } else {
      toast.info('Nothing to undo')
    }
  },

  showHelp() {
    const help = document.createElement('div')
    help.className = 'modal-overlay active'
    help.id = 'keyboardHelpModal'
    help.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${icon('keyboard')} Keyboard Shortcuts</div>
          <button class="modal-close m-touch" onclick="document.getElementById('keyboardHelpModal').remove()">${icon('x')}</button>
        </div>
        <div class="modal-body">
          <div style="display: grid; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>Show this help</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">?</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>Undo last action</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">Cmd/Ctrl + Z</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>New priority</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">Cmd/Ctrl + N</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>Search</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">Cmd/Ctrl + K</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>Dashboard</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">D</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>Projects</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">P</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>Priorities</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">T</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>Revenue</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">R</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>Printers</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">I</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>Calendar</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">C</kbd>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 0.5rem; background: var(--bg-tertiary); border-radius: var(--radius-sm);">
              <span>Close modals</span>
              <kbd style="background: var(--bg-secondary); padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">Esc</kbd>
            </div>
          </div>
        </div>
      </div>
    `
    document.body.appendChild(help)
  },

  navigate(section) {
    if (window.mc?.showSection) {
      window.mc.showSection(section)
    }
  },

  newPriority() {
    if (window.openPriorityModal) {
      window.openPriorityModal()
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.remove())
  }
}
