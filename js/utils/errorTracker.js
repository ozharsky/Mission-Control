// Error Tracker - Comprehensive error tracking and reporting
// Captures and reports errors with context for debugging

class ErrorTracker {
  constructor(options = {}) {
    this.options = {
      maxErrors: 50,
      reportUrl: null,
      environment: 'production',
      ...options
    }
    
    this.errors = []
    this.isInitialized = false
    this.userContext = {}
    this.breadcrumbs = []
    this.maxBreadcrumbs = 20
  }

  init() {
    if (this.isInitialized) return
    
    this.setupErrorHandlers()
    this.setupUnhandledRejectionHandler()
    this.setupConsoleInterceptor()
    
    this.isInitialized = true
    console.log('🔍 Error Tracker initialized')
  }

  /**
   * Setup global error handler
   * @private
   */
  setupErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.captureError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'error'
      })
      
      // Don't prevent default for debugging
      return false
    })
  }

  /**
   * Setup unhandled promise rejection handler
   * @private
   */
  setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandledrejection'
      })
    })
  }

  /**
   * Intercept console methods to capture breadcrumbs
   * @private
   */
  setupConsoleInterceptor() {
    const methods = ['log', 'warn', 'error', 'info']
    
    methods.forEach(method => {
      const original = console[method]
      console[method] = (...args) => {
        this.addBreadcrumb('console', method, args.join(' '))
        original.apply(console, args)
      }
    })
  }

  /**
   * Capture an error with context
   * @param {Error|string} error - Error object or message
   * @param {Object} context - Additional context
   */
  captureError(error, context = {}) {
    const errorInfo = this.parseError(error, context)
    
    // Add to errors array
    this.errors.push(errorInfo)
    
    // Limit stored errors
    if (this.errors.length > this.options.maxErrors) {
      this.errors.shift()
    }
    
    // Log to console in development
    if (this.options.environment === 'development') {
      console.error('[ErrorTracker]', errorInfo)
    }
    
    // Report if configured
    if (this.options.reportUrl) {
      this.reportError(errorInfo)
    }
    
    return errorInfo
  }

  /**
   * Parse error into structured format
   * @private
   */
  parseError(error, context) {
    const now = new Date()
    
    let errorMessage = 'Unknown error'
    let errorStack = null
    let errorType = 'Error'
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorStack = error.stack
      errorType = error.name
    } else if (typeof error === 'string') {
      errorMessage = error
    } else {
      try {
        errorMessage = JSON.stringify(error)
      } catch (e) {
        errorMessage = String(error)
      }
    }
    
    return {
      id: this.generateId(),
      timestamp: now.toISOString(),
      type: errorType,
      message: errorMessage,
      stack: errorStack,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...this.userContext,
        ...context
      },
      breadcrumbs: [...this.breadcrumbs],
      performance: this.getPerformanceInfo()
    }
  }

  /**
   * Generate unique error ID
   * @private
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get performance information
   * @private
   */
  getPerformanceInfo() {
    if (!('performance' in window)) return null
    
    const timing = performance.timing
    const memory = performance.memory
    
    return {
      loadTime: timing ? timing.loadEventEnd - timing.navigationStart : null,
      domReady: timing ? timing.domContentLoadedEventEnd - timing.navigationStart : null,
      memoryUsed: memory ? memory.usedJSHeapSize : null,
      memoryTotal: memory ? memory.totalJSHeapSize : null
    }
  }

  /**
   * Add a breadcrumb for context
   * @param {string} category - Breadcrumb category
   * @param {string} action - Action performed
   * @param {string} message - Additional message
   */
  addBreadcrumb(category, action, message = '') {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      category,
      action,
      message
    })
    
    // Limit breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }
  }

  /**
   * Set user context for error reports
   * @param {Object} context - User context
   */
  setUserContext(context) {
    this.userContext = { ...this.userContext, ...context }
  }

  /**
   * Report error to external endpoint
   * @private
   */
  async reportError(errorInfo) {
    if (!this.options.reportUrl) return
    
    try {
      await fetch(this.options.reportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorInfo),
        keepalive: true
      })
    } catch (e) {
      console.error('Failed to report error:', e)
    }
  }

  /**
   * Get all captured errors
   * @returns {Array} Array of error objects
   */
  getErrors() {
    return [...this.errors]
  }

  /**
   * Get recent errors
   * @param {number} count - Number of errors to return
   * @returns {Array} Recent errors
   */
  getRecentErrors(count = 10) {
    return this.errors.slice(-count)
  }

  /**
   * Clear all stored errors
   */
  clearErrors() {
    this.errors = []
  }

  /**
   * Create error summary for display
   * @returns {Object} Error summary
   */
  getSummary() {
    const errorCount = this.errors.length
    const recentErrors = this.getRecentErrors(5)
    
    // Group by type
    const byType = this.errors.reduce((acc, err) => {
      acc[err.type] = (acc[err.type] || 0) + 1
      return acc
    }, {})
    
    return {
      total: errorCount,
      recent: recentErrors,
      byType,
      lastError: this.errors[this.errors.length - 1] || null
    }
  }

  /**
   * Export errors as JSON
   * @returns {string} JSON string of errors
   */
  exportErrors() {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      errors: this.errors,
      summary: this.getSummary()
    }, null, 2)
  }

  /**
   * Wrap a function with error tracking
   * @param {Function} fn - Function to wrap
   * @param {string} context - Context for error tracking
   * @returns {Function} Wrapped function
   */
  wrap(fn, context = '') {
    return (...args) => {
      try {
        return fn.apply(this, args)
      } catch (error) {
        this.captureError(error, { context, args })
        throw error
      }
    }
  }

  /**
   * Create a promise wrapper with error tracking
   * @param {Promise} promise - Promise to track
   * @param {string} context - Context for error tracking
   * @returns {Promise} Wrapped promise
   */
  trackPromise(promise, context = '') {
    return promise.catch(error => {
      this.captureError(error, { context, type: 'promise' })
      throw error
    })
  }
}

// Create singleton instance
export const errorTracker = new ErrorTracker()

// Initialize on import
errorTracker.init()

// Expose globally for debugging
window.errorTracker = errorTracker
