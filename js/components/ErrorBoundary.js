// Error Boundary - Catches and displays errors gracefully

import { toast } from './Toast.js'

class ErrorBoundary {
  constructor() {
    this.errors = []
    this._lastErrorToast = 0
    this._maxErrors = 50
    this._setupGlobalHandler()
  }

  _setupGlobalHandler() {
    // Store bound handlers for potential cleanup
    this._errorHandler = (event) => {
      this.handleError(event.error, 'window.onerror')
      return false
    }
    
    this._rejectionHandler = (event) => {
      this.handleError(event.reason, 'unhandledrejection')
      return false
    }

    window.addEventListener('error', this._errorHandler)
    window.addEventListener('unhandledrejection', this._rejectionHandler)
  }

  /**
   * Clean up global error handlers
   */
  destroy() {
    if (this._errorHandler) {
      window.removeEventListener('error', this._errorHandler)
    }
    if (this._rejectionHandler) {
      window.removeEventListener('unhandledrejection', this._rejectionHandler)
    }
  }

  handleError(error, source = 'unknown') {
    // Normalize error object
    const normalizedError = error instanceof Error ? error : new Error(String(error))
    
    // Deduplicate identical errors within 5 seconds
    const errorKey = `${normalizedError.message}:${source}`
    const now = Date.now()
    if (this._lastErrorKey === errorKey && (now - this._lastErrorTime) < 5000) {
      return // Skip duplicate
    }
    this._lastErrorKey = errorKey
    this._lastErrorTime = now
    
    console.error(`[ErrorBoundary] ${source}:`, normalizedError)
    
    const errorInfo = {
      message: normalizedError.message || 'Unknown error',
      stack: normalizedError.stack || '',
      source,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }
    
    this.errors.push(errorInfo)
    
    // Keep only last N errors to prevent memory bloat
    if (this.errors.length > this._maxErrors) {
      this.errors = this.errors.slice(-this._maxErrors)
    }
    
    // Show user-friendly toast (throttle to prevent spam)
    this.throttledShowError(errorInfo)
    
    // Save to localStorage for debugging (throttled)
    this._debouncedSaveErrors()
  }

  _debouncedSaveErrors() {
    if (this._saveTimeout) clearTimeout(this._saveTimeout)
    this._saveTimeout = setTimeout(() => this.saveErrors(), 1000)
  }

  throttledShowError(errorInfo) {
    const now = Date.now()
    if (this._lastErrorToast && now - this._lastErrorToast < 1000) {
      return // Throttle to 1 error toast per second
    }
    this._lastErrorToast = now
    this.showErrorToast(errorInfo)
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