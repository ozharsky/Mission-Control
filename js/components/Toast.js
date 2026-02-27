class ToastManager {
  constructor() {
    this.container = null
    this.toasts = new Map()
    this.undoCallbacks = new Map()
    this.init()
  }
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.className = 'toast-container'
      document.body.appendChild(this.container)
    }
  }
  
  show(options) {
    const {
      title,
      message,
      type = 'info',
      duration = 5000,
      actions = [],
      undoId = null
    } = options
    
    const id = Date.now().toString()
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.dataset.id = id
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }
    
    const actionButtons = actions.map((a, idx) => {
      const actionId = `${id}-${idx}`
      if (a.onClick) {
        // Store callback
        this.undoCallbacks.set(actionId, a.onClick)
      }
      return `
        <button class="toast-btn ${a.primary ? 'toast-btn-primary' : 'toast-btn-secondary'}" 
                onclick="toast.executeAction('${actionId}')">${a.label}</button>
      `
    }).join('')
    
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
        ${actions.length > 0 ? `<div class="toast-actions">${actionButtons}</div>` : ''}
      </div>
      <button class="toast-close" onclick="toast.dismiss('${id}')">✕</button>
      ${duration > 0 ? `<div class="toast-progress"><div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div></div>` : ''}
    `
    
    this.container.appendChild(toast)
    this.toasts.set(id, toast)
    
    // Play sound for errors (optional)
    if (type === 'error') {
      this.playSound('error')
    }
    
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration)
    }
    
    return id
  }
  
  dismiss(id) {
    const toast = this.toasts.get(id)
    if (!toast) return
    
    toast.classList.add('hiding')
    setTimeout(() => {
      toast.remove()
      this.toasts.delete(id)
    }, 300)
  }
  
  executeAction(actionId) {
    const callback = this.undoCallbacks.get(actionId)
    if (callback && typeof callback === 'function') {
      callback()
    }
    // Dismiss the toast
    const toastId = actionId.split('-')[0]
    this.dismiss(toastId)
  }
  
  playSound(type) {
    // Optional: Add sound effects
    // const audio = new Audio(`/sounds/${type}.mp3`)
    // audio.play().catch(() => {})
  }
  
  success(title, message, duration = 3000) {
    return this.show({ title, message, type: 'success', duration })
  }
  
  error(title, message, duration = 5000) {
    return this.show({ title, message, type: 'error', duration })
  }
  
  warning(title, message, duration = 4000) {
    return this.show({ title, message, type: 'warning', duration })
  }
  
  info(title, message, duration = 3000) {
    return this.show({ title, message, type: 'info', duration })
  }
  
  // Undo toast with action
  undo(message, onUndo, duration = 30000) {
    const id = Date.now().toString()
    this.undoCallbacks.set(`${id}-0`, onUndo)
    
    return this.show({
      title: message,
      type: 'info',
      duration,
      actions: [
        { label: 'Undo', primary: true }
      ],
      undoId: id
    })
  }
}

export const toast = new ToastManager()

// Expose for onclick handlers
window.toast = toast
