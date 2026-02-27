import { toast } from './Toast.js'

export function confirmDialog(options = {}) {
  const {
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    icon = '⚠️',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    onConfirm,
    onCancel
  } = options
  
  return new Promise((resolve) => {
    const modal = document.createElement('div')
    modal.className = 'modal-overlay active'
    modal.innerHTML = `
      <div class="modal confirm-dialog" onclick="event.stopPropagation()">
        <div class="confirm-dialog-icon">${icon}</div>
        <div class="confirm-dialog-title">${title}</div>
        <div class="confirm-dialog-message">${message}</div>
        <div class="confirm-dialog-actions">
          <button class="btn btn-secondary" id="confirmCancel">${cancelText}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirmOk">${confirmText}</button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Close on backdrop click
    modal.onclick = (e) => {
      if (e.target === modal) {
        close()
        resolve(false)
      }
    }
    
    // Close on Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close()
        resolve(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    
    function close() {
      document.removeEventListener('keydown', handleEscape)
      modal.remove()
    }
    
    // Cancel button
    document.getElementById('confirmCancel').onclick = () => {
      close()
      if (onCancel) onCancel()
      resolve(false)
    }
    
    // Confirm button
    document.getElementById('confirmOk').onclick = () => {
      close()
      if (onConfirm) onConfirm()
      resolve(true)
    }
  })
}

// Convenience methods
export function confirmDelete(itemName = 'this item') {
  return confirmDialog({
    title: 'Delete?',
    message: `Are you sure you want to delete "${itemName}"? This cannot be undone.`,
    icon: '🗑️',
    confirmText: 'Delete',
    danger: true
  })
}

export function confirmAction(title, message, icon = '⚠️') {
  return confirmDialog({
    title,
    message,
    icon,
    confirmText: 'Continue'
  })
}

// Expose globally
window.confirmDialog = confirmDialog
window.confirmDelete = confirmDelete
window.confirmAction = confirmAction
