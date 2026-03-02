import { Toast } from './Toast.js'
import { icon } from '../utils/icons.js'

export function confirmDialog(options = {}) {
  const {
    title = 'Are you sure?',
    message = 'This action cannot be undone.',
    icon: iconName = 'alert-triangle',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    onConfirm,
    onCancel
  } = options
  
  return new Promise((resolve) => {
    const modal = document.createElement('div')
    modal.className = 'modal-overlay active'
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    modal.setAttribute('aria-labelledby', 'confirm-dialog-title')
    modal.setAttribute('aria-describedby', 'confirm-dialog-message')
    modal.innerHTML = `
      <div class="modal confirm-dialog scale-in" onclick="event.stopPropagation()">
        <div class="confirm-dialog-icon ${danger ? 'danger' : ''}">${icon(iconName, 'confirm-dialog-lucide-icon')}</div>
        <div class="confirm-dialog-title" id="confirm-dialog-title">${title}</div>
        <div class="confirm-dialog-message" id="confirm-dialog-message">${message}</div>
        <div class="confirm-dialog-actions">
          <button class="btn btn-secondary m-touch" id="confirmCancel" aria-label="${cancelText}">${cancelText}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} m-touch" id="confirmOk" aria-label="${confirmText}">${confirmText}</button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Focus trap for accessibility
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]
    
    // Focus the cancel button by default
    setTimeout(() => firstFocusable?.focus(), 50)
    
    // Close on backdrop click
    modal.onclick = (e) => {
      if (e.target === modal) {
        close()
        resolve(false)
      }
    }
    
    // Handle keyboard navigation
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        close()
        resolve(false)
      }
      
      // Focus trap
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault()
            lastFocusable?.focus()
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault()
            firstFocusable?.focus()
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeydown)
    
    function close() {
      // Add closing animation
      modal.classList.add('closing')
      modal.querySelector('.modal').style.animation = 'scaleOut 0.2s ease forwards'
      
      document.removeEventListener('keydown', handleKeydown)
      
      setTimeout(() => {
        modal.remove()
      }, 200)
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
    icon: 'trash-2',
    confirmText: 'Delete',
    danger: true
  })
}

export function confirmAction(title, message, iconName = 'alert-triangle') {
  return confirmDialog({
    title,
    message,
    icon: iconName,
    confirmText: 'Continue'
  })
}

// Expose globally
window.confirmDialog = confirmDialog
window.confirmDelete = confirmDelete
window.confirmAction = confirmAction
