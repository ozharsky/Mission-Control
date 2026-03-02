// Enhanced Bulk Operations Manager
import { store } from '../state/store.js'
import { Toast } from './Toast.js'
import { confirmDelete } from './ConfirmDialog.js'

class BulkManager {
  constructor() {
    this.isActive = false
    this.selected = new Set()
    this.bar = null
    this.menuOpen = false
  }
  
  init() {
    // Add keyboard shortcut
    document.addEventListener('keydown', (e) => {
      // Shift + B to toggle bulk mode
      if (e.shiftKey && e.key === 'B') {
        e.preventDefault()
        this.toggle()
      }
      // Escape to close bulk mode
      if (e.key === 'Escape' && this.isActive) {
        this.toggle()
      }
    })
  }
  
  toggle() {
    this.isActive = !this.isActive
    
    if (this.isActive) {
      this.showBar()
      Toast.info('Bulk mode active', 'Click items to select, then choose an action')
    } else {
      this.hideBar()
      this.clearSelection()
    }
    
    this.refreshUI()
  }
  
  showBar() {
    if (this.bar) return
    
    this.bar = document.createElement('div')
    this.bar.className = 'bulk-bar'
    this.bar.id = 'bulkActionBar'
    this.updateBarContent()
    
    document.body.appendChild(this.bar)
    
    // Add slide-in animation
    requestAnimationFrame(() => {
      this.bar.classList.add('visible')
    })
  }
  
  hideBar() {
    if (!this.bar) return
    this.bar.classList.remove('visible')
    setTimeout(() => {
      this.bar?.remove()
      this.bar = null
    }, 300)
  }
  
  updateBarContent() {
    if (!this.bar) return
    
    const count = this.selected.size
    
    this.bar.innerHTML = `
      <div class="bulk-bar-content">
        <div class="bulk-selection-info">
          <input type="checkbox" class="bulk-master-checkbox" 
                 ${count > 0 ? 'checked' : ''} 
                 ${count === 0 ? 'indeterminate' : ''}
                 onclick="bulk.toggleAll()">
          <span class="bulk-count">${count} selected</span>
        </div>
        
        <div class="bulk-actions">
          <button class="bulk-btn" onclick="bulk.showMoreMenu()" title="More actions">
            ⋮ More
          </button>
          
          <button class="bulk-btn primary" onclick="bulk.completeSelected()" 
                  ${count === 0 ? 'disabled' : ''}>
            ✅ Complete
          </button>
          
          <button class="bulk-btn danger" onclick="bulk.deleteSelected()" 
                  ${count === 0 ? 'disabled' : ''}>
            🗑️ Delete
          </button>
          
          <button class="bulk-btn" onclick="bulk.clearSelection()" 
                  ${count === 0 ? 'disabled' : ''}>
            Clear
          </button>
          
          <button class="bulk-btn" onclick="bulk.toggle()">
            ✕ Close
          </button>
        </div>
      </div>
      
      ${this.menuOpen ? this.renderMoreMenu() : ''}
    `
  }
  
  renderMoreMenu() {
    return `
      <div class="bulk-more-menu">
        <div class="bulk-menu-section">
          <div class="bulk-menu-title">Status</div>
          <button class="bulk-menu-item" onclick="bulk.moveSelected('now')">⚡ Move to Now</button>
          <button class="bulk-menu-item" onclick="bulk.moveSelected('later')">📥 Move to Later</button>
          <button class="bulk-menu-item" onclick="bulk.moveSelected('backlog')">📋 Move to Backlog</button>
        </div>
        
        <div class="bulk-menu-section">
          <div class="bulk-menu-title">Assignee</div>
          <button class="bulk-menu-item" onclick="bulk.setAssignee('Oleg')">👤 Assign to Oleg</button>
          <button class="bulk-menu-item" onclick="bulk.setAssignee('KimiClaw')">🤖 Assign to KimiClaw</button>
          <button class="bulk-menu-item" onclick="bulk.setAssignee('')">❌ Unassign</button>
        </div>
        
        <div class="bulk-menu-section">
          <div class="bulk-menu-title">Tags</div>
          <button class="bulk-menu-item" onclick="bulk.addTag('urgent')">🔥 Add "urgent" tag</button>
          <button class="bulk-menu-item" onclick="bulk.addTag('etsy')">🛒 Add "etsy" tag</button>
          <button class="bulk-menu-item" onclick="bulk.removeAllTags()">🏷️ Clear all tags</button>
        </div>
        
        <div class="bulk-menu-section">
          <div class="bulk-menu-title">Due Date</div>
          <button class="bulk-menu-item" onclick="bulk.setDueDate('today')">📅 Set to Today</button>
          <button class="bulk-menu-item" onclick="bulk.setDueDate('tomorrow')">📅 Set to Tomorrow</button>
          <button class="bulk-menu-item" onclick="bulk.setDueDate('nextWeek')">📅 Set to Next Week</button>
          <button class="bulk-menu-item" onclick="bulk.clearDueDate()">❌ Clear Due Date</button>
        </div>
        
        <div class="bulk-menu-section">
          <div class="bulk-menu-title">Board</div>
          <button class="bulk-menu-item" onclick="bulk.setBoard('etsy')">🛒 Move to Etsy</button>
          <button class="bulk-menu-item" onclick="bulk.setBoard('photography')">📸 Move to Photo</button>
          <button class="bulk-menu-item" onclick="bulk.setBoard('wholesale')">🏪 Move to B2B</button>
          <button class="bulk-menu-item" onclick="bulk.setBoard('3dprint')">🖨️ Move to 3D Print</button>
        </div>
      </div>
    `
  }
  
  showMoreMenu() {
    this.menuOpen = !this.menuOpen
    this.updateBarContent()
  }
  
  toggleAll() {
    const priorities = store.get('priorities') || []
    const visible = priorities.filter(p => !p.completed) // Only select active
    
    if (this.selected.size === visible.length) {
      this.clearSelection()
    } else {
      visible.forEach(p => this.selected.add(p.id))
      this.updateBarContent()
      this.updateCheckboxVisuals()
    }
  }
  
  toggleSelection(id) {
    if (this.selected.has(id)) {
      this.selected.delete(id)
    } else {
      this.selected.add(id)
    }
    
    this.updateBarContent()
    this.updateCheckboxVisuals()
  }
  
  clearSelection() {
    this.selected.clear()
    this.menuOpen = false
    this.updateBarContent()
    this.updateCheckboxVisuals()
  }
  
  updateCheckboxVisuals() {
    document.querySelectorAll('.bulk-checkbox').forEach(cb => {
      const id = parseInt(cb.dataset.id)
      cb.classList.toggle('checked', this.selected.has(id))
    })
  }
  
  refreshUI() {
    const state = store.getState()
    store.replace({ ...state })
  }
  
  // Bulk actions
  moveSelected(status) {
    this.updateItems((p) => {
      p.status = status
      p.completed = status === 'done'
      if (p.completed) p.completedAt = new Date().toISOString()
    }, `Moved to ${status}`)
  }
  
  completeSelected() {
    this.updateItems((p) => {
      p.completed = true
      p.status = 'done'
      p.completedAt = new Date().toISOString()
    }, 'Marked as complete')
  }
  
  setAssignee(assignee) {
    this.updateItems((p) => {
      p.assignee = assignee
    }, assignee ? `Assigned to ${assignee}` : 'Unassigned')
  }
  
  addTag(tag) {
    this.updateItems((p) => {
      if (!p.tags) p.tags = []
      if (!p.tags.includes(tag)) p.tags.push(tag)
    }, `Added "${tag}" tag`)
  }
  
  removeAllTags() {
    this.updateItems((p) => {
      p.tags = []
    }, 'Cleared all tags')
  }
  
  setDueDate(preset) {
    const date = new Date()
    
    switch(preset) {
      case 'tomorrow':
        date.setDate(date.getDate() + 1)
        break
      case 'nextWeek':
        date.setDate(date.getDate() + 7)
        break
    }
    
    const dateStr = date.toISOString().split('T')[0]
    
    this.updateItems((p) => {
      p.dueDate = dateStr
    }, `Due date set to ${dateStr}`)
  }
  
  clearDueDate() {
    this.updateItems((p) => {
      delete p.dueDate
    }, 'Due date cleared')
  }
  
  setBoard(board) {
    this.updateItems((p) => {
      p.board = board
    }, `Moved to ${board}`)
  }
  
  async deleteSelected() {
    if (this.selected.size === 0) return
    
    const confirmed = await confirmDelete(`${this.selected.size} priorities`)
    if (!confirmed) return
    
    const priorities = store.get('priorities') || []
    const remaining = priorities.filter(p => !this.selected.has(p.id))
    
    store.set('priorities', remaining)
    Toast.success(`Deleted ${this.selected.size} priorities`)
    this.clearSelection()
  }
  
  // Helper to update multiple items
  updateItems(updateFn, successMessage) {
    if (this.selected.size === 0) return
    
    const priorities = store.get('priorities') || []
    let count = 0
    
    this.selected.forEach(id => {
      const p = priorities.find(p => p.id === id)
      if (p) {
        updateFn(p)
        p.updatedAt = new Date().toISOString()
        count++
      }
    })
    
    store.set('priorities', priorities)
    this.menuOpen = false
    this.clearSelection()
    Toast.success(successMessage, `${count} items updated`)
  }
  
  // Render checkbox for priority item
  renderCheckbox(id) {
    if (!this.isActive) return ''
    
    const isChecked = this.selected.has(id)
    return `
      <div class="bulk-checkbox-wrapper" onclick="event.stopPropagation();">
        <div class="bulk-checkbox ${isChecked ? 'checked' : ''}" 
             data-id="${id}" 
             onclick="bulk.toggleSelection(${id})">
          ${isChecked ? '✓' : ''}
        </div>
      </div>
    `
  }
}

export const bulk = new BulkManager()

// Expose globally
window.bulk = bulk
