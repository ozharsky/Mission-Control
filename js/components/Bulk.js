// Enhanced Bulk Operations Manager
import { store } from '../state/store.js'
import { Toast } from './Toast.js'
import { confirmDelete } from './ConfirmDialog.js'
import { icon } from '../utils/icons.js'

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
          <button class="bulk-btn m-touch" onclick="bulk.showMoreMenu()" title="More actions">
            ${icon('more-vertical', 'icon-sm')} More
          </button>
          
          <button class="bulk-btn primary m-touch" onclick="bulk.completeSelected()" 
                  ${count === 0 ? 'disabled' : ''}>
            ${icon('check', 'icon-sm')} Complete
          </button>
          
          <button class="bulk-btn danger m-touch" onclick="bulk.deleteSelected()" 
                  ${count === 0 ? 'disabled' : ''}>
            ${icon('trash-2', 'icon-sm')} Delete
          </button>
          
          <button class="bulk-btn m-touch" onclick="bulk.clearSelection()" 
                  ${count === 0 ? 'disabled' : ''}>
            Clear
          </button>
          
          <button class="bulk-btn m-touch" onclick="bulk.toggle()">
            ${icon('x', 'icon-sm')} Close
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
          <div class="bulk-menu-title">${icon('zap', 'icon-sm')} Status</div>
          <button class="bulk-menu-item m-touch" onclick="bulk.moveSelected('now')">${icon('zap', 'icon-sm')} Move to Now</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.moveSelected('later')">${icon('inbox', 'icon-sm')} Move to Later</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.moveSelected('backlog')">${icon('clipboard-list', 'icon-sm')} Move to Backlog</button>
        </div>
        
        <div class="bulk-menu-section">
          <div class="bulk-menu-title">${icon('user', 'icon-sm')} Assignee</div>
          <button class="bulk-menu-item m-touch" onclick="bulk.setAssignee('Oleg')">${icon('user', 'icon-sm')} Assign to Oleg</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.setAssignee('KimiClaw')">${icon('bot', 'icon-sm')} Assign to KimiClaw</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.setAssignee('')">${icon('user-x', 'icon-sm')} Unassign</button>
        </div>
        
        <div class="bulk-menu-section">
          <div class="bulk-menu-title">${icon('tag', 'icon-sm')} Tags</div>
          <button class="bulk-menu-item m-touch" onclick="bulk.addTag('urgent')">${icon('flame', 'icon-sm')} Add "urgent" tag</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.addTag('etsy')">${icon('shopping-cart', 'icon-sm')} Add "etsy" tag</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.removeAllTags()">${icon('tags', 'icon-sm')} Clear all tags</button>
        </div>
        
        <div class="bulk-menu-section">
          <div class="bulk-menu-title">${icon('calendar', 'icon-sm')} Due Date</div>
          <button class="bulk-menu-item m-touch" onclick="bulk.setDueDate('today')">${icon('calendar-check', 'icon-sm')} Set to Today</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.setDueDate('tomorrow')">${icon('calendar', 'icon-sm')} Set to Tomorrow</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.setDueDate('nextWeek')">${icon('calendar-days', 'icon-sm')} Set to Next Week</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.clearDueDate()">${icon('calendar-x', 'icon-sm')} Clear Due Date</button>
        </div>
        
        <div class="bulk-menu-section">
          <div class="bulk-menu-title">${icon('layout-grid', 'icon-sm')} Board</div>
          <button class="bulk-menu-item m-touch" onclick="bulk.setBoard('etsy')">${icon('shopping-cart', 'icon-sm')} Move to Etsy</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.setBoard('photography')">${icon('camera', 'icon-sm')} Move to Photo</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.setBoard('wholesale')">${icon('building-2', 'icon-sm')} Move to B2B</button>
          <button class="bulk-menu-item m-touch" onclick="bulk.setBoard('3dprint')">${icon('printer', 'icon-sm')} Move to 3D Print</button>
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
