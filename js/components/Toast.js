class ToastManager {
  constructor() {
    this.container = null
    this.toasts = new Map()
    this.undoCallbacks = new Map()
    this.maxToasts = 3 // Limit concurrent toasts
    this.init()
  }
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.className = 'toast-container'
      this.container.setAttribute('role', 'region')
      this.container.setAttribute('aria-live', 'polite')
      this.container.setAttribute('aria-label', 'Notifications')
      document.body.appendChild(this.container)
      
      // Add container styles
      this.addContainerStyles()
    }
  }
  
  addContainerStyles() {
    if (document.getElementById('toast-container-styles')) return
    
    const styles = document.createElement('style')
    styles.id = 'toast-container-styles'
    styles.textContent = `
      .toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-width: 400px;
        width: calc(100% - 2rem);
        pointer-events: none;
      }
      
      .toast {
        background: var(--glass-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        padding: 1rem 1.25rem;
        display: flex;
        align-items: flex-start;
        gap: 0.875rem;
        box-shadow: 
          0 10px 40px -10px rgba(0, 0, 0, 0.5),
          0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        pointer-events: auto;
        animation: toastSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        position: relative;
        overflow: hidden;
        min-width: 320px;
      }
      
      @keyframes toastSlideIn {
        from {
          opacity: 0;
          transform: translateX(100%) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }
      
      @keyframes toastSlideOut {
        to {
          opacity: 0;
          transform: translateX(100%) scale(0.9);
        }
      }
      
      .toast.hiding {
        animation: toastSlideOut 0.3s ease forwards;
      }
      
      .toast-icon-wrapper {
        position: relative;
        flex-shrink: 0;
      }
      
      .toast-icon {
        font-size: 1.5rem;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-md);
        background: var(--bg-tertiary);
        position: relative;
        z-index: 1;
        animation: toastIconPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      @keyframes toastIconPop {
        0% { transform: scale(0) rotate(-45deg); }
        70% { transform: scale(1.2) rotate(5deg); }
        100% { transform: scale(1) rotate(0); }
      }
      
      .toast-success .toast-icon { background: rgba(16, 185, 129, 0.15); }
      .toast-error .toast-icon { background: rgba(239, 68, 68, 0.15); }
      .toast-warning .toast-icon { background: rgba(245, 158, 11, 0.15); }
      .toast-info .toast-icon { background: rgba(99, 102, 241, 0.15); }
      
      /* Animated ring around icon */
      .toast-icon-wrapper::before {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: var(--radius-lg);
        border: 2px solid transparent;
        animation: toastIconRing 2s ease-out infinite;
      }
      
      .toast-success .toast-icon-wrapper::before { border-color: rgba(16, 185, 129, 0.3); }
      .toast-error .toast-icon-wrapper::before { border-color: rgba(239, 68, 68, 0.3); }
      .toast-warning .toast-icon-wrapper::before { border-color: rgba(245, 158, 11, 0.3); }
      .toast-info .toast-icon-wrapper::before { border-color: rgba(99, 102, 241, 0.3); }
      
      @keyframes toastIconRing {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(1.3); opacity: 0; }
      }
      
      .toast-content {
        flex: 1;
        min-width: 0;
        padding-top: 0.25rem;
      }
      
      .toast-title {
        font-weight: 600;
        font-size: 0.9375rem;
        color: var(--text-primary);
        line-height: 1.3;
      }
      
      .toast-message {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-top: 0.375rem;
        line-height: 1.5;
      }
      
      .toast-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.875rem;
        flex-wrap: wrap;
      }
      
      .toast-btn {
        padding: 0.5rem 1rem;
        border-radius: var(--radius-md);
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: all 0.2s;
        min-height: 36px;
        position: relative;
        overflow: hidden;
      }
      
      .toast-btn::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      .toast-btn:hover::before { opacity: 1; }
      .toast-btn:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
      .toast-btn:active { transform: translateY(0); }
      
      .toast-btn-primary {
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        color: white;
      }
      
      .toast-btn-secondary {
        background: var(--bg-tertiary);
        color: var(--text-secondary);
        border: 1px solid var(--border-color);
      }
      
      .toast-btn-secondary:hover {
        background: var(--bg-secondary);
        border-color: var(--text-muted);
      }
      
      .toast-close {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        border-radius: var(--radius-md);
        flex-shrink: 0;
        transition: all 0.2s;
        position: relative;
        overflow: hidden;
      }
      
      .toast-close::before {
        content: '';
        position: absolute;
        inset: 0;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        transform: scale(0);
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      .toast-close:hover { color: var(--text-primary); }
      .toast-close:hover::before { transform: scale(1); }
      .toast-close:active { transform: scale(0.95); }
      
      .toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: rgba(0, 0, 0, 0.2);
        overflow: hidden;
      }
      
      .toast-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-primary));
        background-size: 200% 100%;
        animation: toastProgress linear forwards, toastProgressShimmer 2s linear infinite;
      }
      
      .toast-success .toast-progress-bar {
        background: linear-gradient(90deg, var(--accent-success), #34d399, var(--accent-success));
        background-size: 200% 100%;
      }
      
      .toast-error .toast-progress-bar {
        background: linear-gradient(90deg, var(--accent-danger), #f87171, var(--accent-danger));
        background-size: 200% 100%;
      }
      
      .toast-warning .toast-progress-bar {
        background: linear-gradient(90deg, var(--accent-warning), #fbbf24, var(--accent-warning));
        background-size: 200% 100%;
      }
      
      @keyframes toastProgress {
        from { width: 100%; }
        to { width: 0%; }
      }
      
      @keyframes toastProgressShimmer {
        from { background-position: 200% 0; }
        to { background-position: -200% 0; }
      }
      
      /* Toast type variants with gradient backgrounds */
      .toast-success {
        border-left: 4px solid var(--accent-success);
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), var(--glass-bg));
      }
      
      .toast-error {
        border-left: 4px solid var(--accent-danger);
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), var(--glass-bg));
      }
      
      .toast-warning {
        border-left: 4px solid var(--accent-warning);
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), var(--glass-bg));
      }
      
      .toast-info {
        border-left: 4px solid var(--accent-primary);
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), var(--glass-bg));
      }
      
      /* Mobile adjustments */
      @media (max-width: 640px) {
        .toast-container {
          top: auto;
          bottom: calc(80px + env(safe-area-inset-bottom, 0));
          left: 0.75rem;
          right: 0.75rem;
          max-width: none;
          width: auto;
          gap: 0.5rem;
        }
        
        .toast {
          min-width: auto;
          max-width: none;
          animation: toastSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          padding: 0.875rem 1rem;
          border-radius: var(--radius-md);
        }
        
        @keyframes toastSlideUp {
          from {
            opacity: 0;
            transform: translateY(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes toastSlideOut {
          to {
            opacity: 0;
            transform: translateY(100%) scale(0.95);
          }
        }
        
        .toast-icon {
          width: 36px;
          height: 36px;
          font-size: 1.25rem;
        }
        
        .toast-close {
          min-width: 40px;
          min-height: 40px;
        }
        
        .toast-btn {
          min-height: 44px;
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
        }
        
        .toast-title {
          font-size: 0.9375rem;
        }
        
        .toast-message {
          font-size: 0.8125rem;
        }
      }
      
      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .toast {
          animation: none;
        }
        .toast.hiding {
          animation: none;
          opacity: 0;
        }
        .toast-progress-bar {
          animation: toastProgress linear forwards;
        }
        .toast-icon-wrapper::before {
          animation: none;
        }
        .toast-icon {
          animation: none;
        }
      }
    `
    document.head.appendChild(styles)
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
    
    // Limit max toasts
    if (this.toasts.size >= this.maxToasts) {
      const oldestToast = this.toasts.keys().next().value
      this.dismiss(oldestToast)
    }
    
    const id = Date.now().toString()
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.dataset.id = id
    toast.setAttribute('role', 'alert')
    
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
                onclick="toast.executeAction('${actionId}')"${a.ariaLabel ? ` aria-label="${a.ariaLabel}"` : ''}>${a.label}</button>
      `
    }).join('')
    
    toast.innerHTML = `
      <div class="toast-icon-wrapper">
        <div class="toast-icon toast-icon-animated" aria-hidden="true">${icons[type]}</div>
      </div>
      <div class="toast-content">
        <div class="toast-title">${this.escapeHtml(title)}</div>
        ${message ? `<div class="toast-message">${this.escapeHtml(message)}</div>` : ''}
        ${actions.length > 0 ? `<div class="toast-actions">${actionButtons}</div>` : ''}
      </div>
      <button class="toast-close" onclick="event.stopPropagation(); toast.dismiss('${id}')" aria-label="Close notification">✕</button>
      ${duration > 0 ? `<div class="toast-progress"><div class="toast-progress-bar" style="animation-duration: ${duration}ms;"></div></div>` : ''}
    `
    
    // Add tap-to-dismiss functionality (but not when clicking buttons)
    toast.addEventListener('click', (e) => {
      // Only dismiss if clicking on the toast itself, not buttons or actions
      if (e.target === toast || e.target.closest('.toast-content')) {
        this.dismiss(id)
      }
    })
    
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
    
    // Clear any associated callbacks
    this.toasts.forEach((_, key) => {
      if (key.startsWith(id)) {
        this.undoCallbacks.delete(key)
      }
    })
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove()
      }
      this.toasts.delete(id)
    }, 300)
  }

  /**
   * Clear all toasts
   */
  clearAll() {
    this.toasts.forEach((toast, id) => {
      this.dismiss(id)
    })
  }

  /**
   * Destroy the toast manager and clean up
   */
  destroy() {
    this.clearAll()
    if (this.container?.parentNode) {
      this.container.remove()
    }
    this.container = null
    this.undoCallbacks.clear()
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
  
  // Escape HTML to prevent XSS
  escapeHtml(text) {
    if (text == null) return ''
    if (typeof text !== 'string') text = String(text)
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Update an existing toast
   * @param {string} id - Toast ID
   * @param {Object} options - Update options
   */
  update(id, options = {}) {
    const toast = this.toasts.get(id)
    if (!toast) return false

    const { title, message, type } = options

    if (title) {
      const titleEl = toast.querySelector('.toast-title')
      if (titleEl) titleEl.textContent = this.escapeHtml(title)
    }

    if (message) {
      const messageEl = toast.querySelector('.toast-message')
      if (messageEl) messageEl.textContent = this.escapeHtml(message)
    }

    if (type) {
      // Remove old type classes
      toast.classList.remove('toast-success', 'toast-error', 'toast-warning', 'toast-info')
      toast.classList.add(`toast-${type}`)
      
      // Update icon
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      }
      const iconEl = toast.querySelector('.toast-icon')
      if (iconEl) iconEl.textContent = icons[type]
    }

    return true
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
  
  // Loading toast with spinner
  loading(message = 'Loading...', duration = 0) {
    const id = Date.now().toString()
    const toast = document.createElement('div')
    toast.className = 'toast toast-info'
    toast.dataset.id = id
    toast.setAttribute('role', 'status')
    toast.setAttribute('aria-live', 'polite')
    
    toast.innerHTML = `
      <div class="toast-icon-wrapper">
        <div class="toast-icon" aria-hidden="true">⏳</div>
      </div>
      <div class="toast-content">
        <div class="toast-title">${this.escapeHtml(message)}</div>
      </div>
    `
    
    this.container.appendChild(toast)
    this.toasts.set(id, toast)
    
    return {
      id,
      update: (newMessage) => {
        const title = toast.querySelector('.toast-title')
        if (title) title.textContent = newMessage
      },
      success: (newTitle, newMessage) => {
        this.dismiss(id)
        return this.success(newTitle, newMessage)
      },
      error: (newTitle, newMessage) => {
        this.dismiss(id)
        return this.error(newTitle, newMessage)
      },
      dismiss: () => this.dismiss(id)
    }
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
        { label: 'Undo', primary: true, ariaLabel: 'Undo action' }
      ],
      undoId: id
    })
  }
}

export const toast = new ToastManager()

// Expose for onclick handlers
window.toast = toast
