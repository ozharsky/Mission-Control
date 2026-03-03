// Progress Indicator Component
import { Toast } from './Toast.js'
import { icon } from '../utils/icons.js'

class ProgressManager {
  constructor() {
    this.operations = new Map()
    this.container = null
    this.ensureContainer()
  }
  
  ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div')
      this.container.id = 'progressContainer'
      this.container.className = 'progress-container'
      document.body.appendChild(this.container)
    }
  }
  
  // Start a new progress operation
  start(id, options = {}) {
    const { title = 'Loading...', showPercent = true, cancellable = false, onCancel } = options
    
    this.ensureContainer()
    
    const operation = {
      id,
      title,
      progress: 0,
      status: 'running',
      showPercent,
      cancellable,
      onCancel,
      startTime: Date.now()
    }
    
    this.operations.set(id, operation)
    this.render(operation)
    
    return {
      update: (progress, statusText) => this.update(id, progress, statusText),
      complete: (message) => this.complete(id, message),
      error: (message) => this.error(id, message),
      cancel: () => this.cancel(id)
    }
  }
  
  // Update progress
  update(id, progress, statusText) {
    const operation = this.operations.get(id)
    if (!operation) return
    
    operation.progress = Math.min(Math.max(progress, 0), 100)
    if (statusText) operation.statusText = statusText
    
    this.render(operation)
  }
  
  // Mark as complete
  complete(id, message) {
    const operation = this.operations.get(id)
    if (!operation) return
    
    operation.progress = 100
    operation.status = 'complete'
    operation.statusText = message || 'Complete'
    
    this.render(operation)
    
    // Auto-remove after delay
    setTimeout(() => this.remove(id), 2000)
  }
  
  // Mark as error
  error(id, message) {
    const operation = this.operations.get(id)
    if (!operation) return
    
    operation.status = 'error'
    operation.statusText = message || 'Error'
    
    this.render(operation)
    
    // Auto-remove after delay
    setTimeout(() => this.remove(id), 5000)
  }
  
  // Cancel operation
  cancel(id) {
    const operation = this.operations.get(id)
    if (!operation) return
    
    if (operation.onCancel) {
      operation.onCancel()
    }
    
    operation.status = 'cancelled'
    operation.statusText = 'Cancelled'
    
    this.render(operation)
    setTimeout(() => this.remove(id), 2000)
  }
  
  // Remove operation
  remove(id) {
    const el = document.getElementById(`progress-${id}`)
    if (el) {
      el.classList.add('removing')
      setTimeout(() => el.remove(), 300)
    }
    this.operations.delete(id)
  }
  
  // Render progress item
  render(operation) {
    let el = document.getElementById(`progress-${operation.id}`)
    
    if (!el) {
      el = document.createElement('div')
      el.id = `progress-${operation.id}`
      el.className = 'progress-item'
      this.container.appendChild(el)
    }
    
    const isComplete = operation.status === 'complete'
    const isError = operation.status === 'error'
    const isCancelled = operation.status === 'cancelled'
    
    // Lucide icons for status
    const statusIcon = isComplete 
      ? icon('check-circle', 'status-icon status-complete') 
      : isError 
        ? icon('x-circle', 'status-icon status-error') 
        : isCancelled 
          ? icon('ban', 'status-icon status-cancelled') 
          : icon('loader', 'status-icon status-running')

    el.className = `progress-item ${operation.status}`
    
    el.innerHTML = `
      <div class="progress-header">
        <div class="progress-title m-touch">
          ${statusIcon} ${escapeHtml(operation.title)}
        </div>
        <div class="progress-meta">
          ${operation.showPercent && !isComplete && !isError ? `
            <span class="progress-percent">${Math.round(operation.progress)}%</span>
          ` : ''}
          ${operation.cancellable && operation.status === 'running' ? `
            <button class="progress-cancel m-touch" onclick="progressManager.cancel('${operation.id}')" aria-label="Cancel">${icon('x', 'cancel-icon')}</button>
          ` : ''}
        </div>
      </div>
      
      ${operation.statusText ? `
        <div class="progress-status">${escapeHtml(operation.statusText)}</div>
      ` : ''}
      
      <div class="progress-bar">
        <div class="progress-fill ${isError ? 'error' : isComplete ? 'complete' : ''}" 
             style="width: ${operation.progress}%"></div>
      </div>
    `
  }
  
  // Helper for async operations
  async run(id, asyncFn, options = {}) {
    const progress = this.start(id, options)
    
    try {
      const result = await asyncFn(progress)
      progress.complete(options.successMessage || 'Complete')
      return result
    } catch (err) {
      progress.error(err.message || 'Failed')
      throw err
    }
  }
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export const progressManager = new ProgressManager()

// Expose globally for onclick handlers
window.progressManager = progressManager
