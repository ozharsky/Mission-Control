// Error Logger - Structured error logging with context

class ErrorLogger {
  constructor() {
    this.errors = []
    this.maxErrors = 50
    this.breadcrumbs = []
    this.maxBreadcrumbs = 20
    this._initialized = false
  }

  init() {
    if (this._initialized) return
    this._initialized = true

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log('unhandledrejection', event.reason, { 
        stack: event.reason?.stack,
        type: 'promise'
      })
    })

    // Capture global errors
    window.addEventListener('error', (event) => {
      this.log('error', event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'global'
      })
    })
  }

  /**
   * Add a breadcrumb for context
   * @param {string} message - Breadcrumb message
   * @param {Object} data - Additional context
   */
  addBreadcrumb(message, data = {}) {
    this.breadcrumbs.push({
      timestamp: new Date().toISOString(),
      message,
      data
    })

    // Trim old breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift()
    }
  }

  /**
   * Log an error with context
   * @param {string} category - Error category
   * @param {Error|string} error - The error
   * @param {Object} context - Additional context
   */
  log(category, error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      category,
      message: error?.message || error?.toString() || String(error),
      stack: error?.stack,
      context,
      breadcrumbs: [...this.breadcrumbs],
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    this.errors.push(errorInfo)

    // Trim old errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // Log to console in development
    if (location.hostname === 'localhost' || location.search.includes('debug')) {
      console.error(`[ErrorLogger:${category}]`, error, context)
    }

    return errorInfo
  }

  /**
   * Wrap a function with error logging
   * @param {Function} fn - Function to wrap
   * @param {string} context - Context name
   */
  wrap(fn, context) {
    return (...args) => {
      try {
        return fn.apply(this, args)
      } catch (error) {
        this.log(context, error, { args: args.map(a => String(a)) })
        throw error
      }
    }
  }

  /**
   * Wrap an async function with error logging
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Context name
   */
  wrapAsync(fn, context) {
    return async (...args) => {
      try {
        return await fn.apply(this, args)
      } catch (error) {
        this.log(context, error, { args: args.map(a => String(a)) })
        throw error
      }
    }
  }

  /**
   * Get recent errors
   * @param {number} count - Number of errors to return
   */
  getRecent(count = 10) {
    return this.errors.slice(-count)
  }

  /**
   * Get all errors
   */
  getAll() {
    return [...this.errors]
  }

  /**
   * Clear all errors
   */
  clear() {
    this.errors = []
    this.breadcrumbs = []
  }

  /**
   * Export errors as JSON
   */
  export() {
    return JSON.stringify({
      errors: this.errors,
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  /**
   * Create a report for debugging
   */
  createReport() {
    return {
      summary: {
        totalErrors: this.errors.length,
        recentErrors: this.getRecent(5).map(e => ({
          category: e.category,
          message: e.message,
          timestamp: e.timestamp
        }))
      },
      breadcrumbs: this.breadcrumbs,
      fullLog: this.errors
    }
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger()

// Initialize on import
errorLogger.init()

// Expose globally
window.ErrorLogger = ErrorLogger
window.errorLogger = errorLogger
