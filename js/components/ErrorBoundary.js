// Error Boundary - Catches and displays errors gracefully

import { toast } from './Toast.js'

class ErrorBoundary {
  constructor() {
    this.errors = []
    this.setupGlobalHandler()
  }

  setupGlobalHandler() {
    window.addEventListener('error', (event) => {
      this.handleError(event.error, 'window.onerror')
      return false
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, 'unhandledrejection')
      return false
    })
  }

  handleError(error, source = 'unknown') {
    console.error(`[ErrorBoundary] ${source}:`, error)
    
    const errorInfo = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || '',
      source,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    }
    
    this.errors.push(errorInfo)
    
    // Keep only last 10 errors
    if (this.errors.length > 10) {
      this.errors.shift()
    }
    
    // Show user-friendly toast
    this.showErrorToast(errorInfo)
    
    // Save to localStorage for debugging
    this.saveErrors()
  }

  showErrorToast(errorInfo) {
    const isDev = location.hostname === 'localhost' || location.search.includes('debug=true')
    
    if (isDev) {
      toast.error('Error', `${errorInfo.message} (${errorInfo.source})`, 5000)
    } else {
      // Production - generic message
      toast.error('Something went wrong', 'Please refresh the page if issues persist', 3000)
    }
  }

  saveErrors() {
    try {
      localStorage.setItem('mc-errors', JSON.stringify(this.errors))
    } catch (e) {
      // Ignore storage errors
    }
  }

  getErrors() {
    return [...this.errors]
  }

  clearErrors() {
    this.errors = []
    localStorage.removeItem('mc-errors')
  }

  // Wrap a function with error handling
  wrap(fn, context = '') {
    return (...args) => {
      try {
        return fn(...args)
      } catch (error) {
        this.handleError(error, context)
        throw error
      }
    }
  }

  // Wrap an async function
  wrapAsync(fn, context = '') {
    return async (...args) => {
      try {
        return await fn(...args)
      } catch (error) {
        this.handleError(error, context)
        throw error
      }
    }
  }

  // Create error UI for a section
  createErrorUI(error, onRetry) {
    return `
      <div class="error-boundary">
        <div class="error-icon">⚠️</div>
        <div class="error-title">Something went wrong</div>
        <div class="error-message">${this.escapeHtml(error.message)}</div>
        ${onRetry ? `<button class="btn btn-primary" onclick="${onRetry}()">Try Again</button>` : ''}
        <button class="btn btn-secondary" onclick="location.reload()">Reload Page</button>
      </div>
    `
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}

export const errorBoundary = new ErrorBoundary()
window.errorBoundary = errorBoundary