// Bulk Operations Component
// Adds bulk select/checkbox functionality to lists

import { toast } from './Toast.js'
import { confirmDelete } from './ConfirmDialog.js'

export function createBulkOperations(options) {
  const {
    container,
    items,
    onSelectionChange,
    actions = []
  } = options
  
  let selectedIds = new Set()
  let isActive = false
  
  function renderBulkBar() {
    if (!isActive || selectedIds.size === 0) {
      return ''
    }
    
    return `
      <div class="bulk-bar">
        <div class="bulk-info">
          <input type="checkbox" checked onchange="bulkToggleAll()">
          <span>${selectedIds.size} selected</span>
        </div>
        <div class="bulk-actions">
          ${actions.map(action => `
            <button class="btn btn-sm ${action.variant || 'secondary'}" 
                    onclick="bulkAction('${action.id}')"
                    ${action.disabled ? 'disabled' : ''}>
              ${action.icon} ${action.label}
            </button>
          `).join('')}
          
          <button class="btn btn-sm btn-text" onclick="bulkCancel()">
            Cancel
          </button>
        </div>
      </div>
    `
  }
  
  function renderItemCheckbox(item) {
    if (!isActive) return ''
    
    const isSelected = selectedIds.has(item.id)
    return `
      <div class="bulk-checkbox-wrapper"
           onclick="event.stopPropagation(); bulkToggleItem(${item.id})"
      >
        <div class="bulk-checkbox ${isSelected ? 'checked' : ''}">
          ${isSelected ? '✓' : ''}
        </div>
      </div>
    `
  }
  
  function toggleItem(id) {
    if (selectedIds.has(id)) {
      selectedIds.delete(id)
    } else {
      selectedIds.add(id)
    }
    
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds))
    }
    
    renderBulkBar()
  }
  
  function toggleAll() {
    if (selectedIds.size === items.length) {
      selectedIds.clear()
    } else {
      selectedIds = new Set(items.map(i => i.id))
    }
    
    if (onSelectionChange) {
      onSelectionChange(Array.from(selectedIds))
    }
    
    renderBulkBar()
  }
  
  function activate() {
    isActive = true
    selectedIds.clear()
    renderBulkBar()
  }
  
  function deactivate() {
    isActive = false
    selectedIds.clear()
    renderBulkBar()
  }
  
  function getSelectedItems() {
    return items.filter(i => selectedIds.has(i.id))
  }
  
  // Expose functions globally for onclick handlers
  window.bulkToggleItem = (id) => {
    toggleItem(id)
    // Re-render the specific item or full list
    if (options.onToggle) options.onToggle(id, selectedIds.has(id))
  }
  
  window.bulkToggleAll = () => {
    toggleAll()
    if (options.onToggleAll) options.onToggleAll(Array.from(selectedIds))
  }
  
  window.bulkAction = (actionId) => {
    const action = actions.find(a => a.id === actionId)
    if (action && action.handler) {
      action.handler(Array.from(selectedIds), getSelectedItems())
    }
  }
  
  window.bulkCancel = () => {
    deactivate()
    if (options.onCancel) options.onCancel()
  }
  
  return {
    renderBulkBar,
    renderItemCheckbox,
    activate,
    deactivate,
    getSelectedIds: () => Array.from(selectedIds),
    getSelectedItems,
    isActive: () => isActive,
    isSelected: (id) => selectedIds.has(id)
  }
}

// Common bulk actions with undo support
export const bulkActions = {
  delete: (storeKey, onComplete, undoManager) => ({
    id: 'delete',
    label: 'Delete',
    icon: '🗑️',
    variant: 'danger',
    handler: async (ids, items) => {
      const confirmed = await confirmDelete(`${ids.length} items`)
      if (!confirmed) return
      
      const allItems = store.getState()[storeKey] || []
      const deletedItems = allItems.filter(i => ids.includes(i.id))
      const remaining = allItems.filter(i => !ids.includes(i.id))
      
      store.set(storeKey, remaining)
      
      // Add undo
      if (undoManager) {
        const undoId = undoManager.add({
          type: `bulk_delete_${storeKey}`,
          description: `Deleted ${ids.length} ${storeKey}`,
          undo: () => {
            const current = store.getState()[storeKey] || []
            store.set(storeKey, [...current, ...deletedItems])
          }
        })
        undoManager.showUndo(undoId, `Deleted ${ids.length} items`)
      } else {
        toast.success('Deleted', `${ids.length} items removed`)
      }
      
      if (onComplete) onComplete()
    }
  }),
  
  changeStatus: (storeKey, status, onComplete, undoManager) => ({
    id: 'changeStatus',
    label: `Mark ${status}`,
    icon: '✓',
    variant: 'primary',
    handler: (ids, items) => {
      const allItems = store.getState()[storeKey] || []
      const previousStates = new Map()
      
      allItems.forEach(item => {
        if (ids.includes(item.id)) {
          previousStates.set(item.id, item.status)
          item.status = status
        }
      })
      
      store.set(storeKey, allItems)
      
      // Add undo
      if (undoManager) {
        const undoId = undoManager.add({
          type: `bulk_status_${storeKey}`,
          description: `Changed status of ${ids.length} items to ${status}`,
          undo: () => {
            const current = store.getState()[storeKey] || []
            current.forEach(item => {
              if (previousStates.has(item.id)) {
                item.status = previousStates.get(item.id)
              }
            })
            store.set(storeKey, current)
          }
        })
        undoManager.showUndo(undoId, `Updated ${ids.length} items`)
      } else {
        toast.success('Updated', `${ids.length} items marked ${status}`)
      }
      
      if (onComplete) onComplete()
    }
  }),
  
  export: (items, filename) => ({
    id: 'export',
    label: 'Export',
    icon: '📤',
    handler: (ids, selectedItems) => {
      const data = JSON.stringify(selectedItems, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      toast.success('Exported', `${selectedItems.length} items exported`)
    }
  })
}
