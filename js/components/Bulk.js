import { store } from '../state/store.js'
import { toast } from './Toast.js'
import { undoManager } from '../state/undo.js'
import { confirmDelete } from './ConfirmDialog.js'

class BulkManager {
  constructor() {
    this.isActive = false
    this.selected = new Set()
    this.bar = null
  }
  
  init() {
    // Initialize - nothing special needed currently
  }
  
  toggle() {
    this.isActive = !this.isActive
    
    if (this.isActive) {
      this.showBar()
    } else {
      this.hideBar()
      this.clearSelection()
    }
    
    // Re-render to show/hide checkboxes
    this.refreshUI()
  }
  
  showBar() {
    if (this.bar) return
    
    this.bar = document.createElement('div')
    this.bar.className = 'bulk-bar'
    this.bar.id = 'bulkActionBar'
    this.updateBarContent()
    
    document.body.appendChild(this.bar)
  }
  
  hideBar() {
    if (!this.bar) return
    this.bar.remove()
    this.bar = null
  }
  
  updateBarContent() {
    if (!this.bar) return
    
    const count = this.selected.size
    
    this.bar.innerHTML = `
      <span class="bulk-count">${count} selected</span>
      <div class="bulk-actions">
        <button class="bulk-btn" onclick="bulk.moveSelected('now')" ${count === 0 ? 'disabled' : ''}>⚡ Now</button>
        <button class="bulk-btn" onclick="bulk.moveSelected('later')" ${count === 0 ? 'disabled' : ''}>📥 Later</button>
        <button class="bulk-btn" onclick="bulk.completeSelected()" ${count === 0 ? 'disabled' : ''}>✅ Done</button>
        <button class="bulk-btn danger" onclick="bulk.deleteSelected()" ${count === 0 ? 'disabled' : ''}>🗑️ Delete</button>
        <button class="bulk-btn" onclick="bulk.clearSelection()">Clear</button>
        <button class="bulk-btn" onclick="bulk.toggle()">✕ Close</button>
      </div>
    `
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
    // Trigger re-render by notifying store subscribers
    const state = store.getState()
    store.replace({ ...state })
  }
  
  moveSelected(status) {
    const priorities = store.get('priorities') || []
    let count = 0
    
    this.selected.forEach(id => {
      const p = priorities.find(p => p.id === id)
      if (p) {
        p.status = status
        p.completed = status === 'done'
        p.updatedAt = new Date().toISOString()
        if (p.completed) {
          p.completedAt = new Date().toISOString()
        }
        count++
      }
    })
    
    store.set('priorities', priorities)
    this.clearSelection()
    toast.success(`Moved ${count} priorities to ${status}`)
  }
  
  completeSelected() {
    const priorities = store.get('priorities') || []
    let count = 0
    
    this.selected.forEach(id => {
      const p = priorities.find(p => p.id === id)
      if (p) {
        p.completed = true
        p.status = 'done'
        p.completedAt = new Date().toISOString()
        p.updatedAt = new Date().toISOString()
        count++
      }
    })
    
    store.set('priorities', priorities)
    this.clearSelection()
    toast.success(`Marked ${count} priorities as done`)
  }
  
  async deleteSelected() {
    if (this.selected.size === 0) return
    
    const confirmed = await confirmDelete(`${this.selected.size} priorities`)
    if (!confirmed) return
    
    const priorities = store.get('priorities') || []
    const deleted = []
    
    this.selected.forEach(id => {
      const p = priorities.find(p => p.id === id)
      if (p) {
        deleted.push({ ...p })
      }
    })
    
    const remaining = priorities.filter(p => !this.selected.has(p.id))
    store.set('priorities', remaining)
    
    toast.success(`Deleted ${deleted.length} priorities`)
    this.clearSelection()
  }
  
  // Render checkbox for priority item
  renderCheckbox(id) {
    if (!this.isActive) return ''
    
    const isChecked = this.selected.has(id)
    return `
      <div class="bulk-checkbox ${isChecked ? 'checked' : ''}" 
           data-id="${id}" 
           onclick="event.stopPropagation(); bulk.toggleSelection(${id})"></div>
    `
  }
}

export const bulk = new BulkManager()

// Expose globally
window.bulk = bulk
