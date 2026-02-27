// Standardized error handling utilities

export class AppError extends Error {
  constructor(message, code, details = {}) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

export const ErrorCodes = {
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  UNKNOWN: 'UNKNOWN_ERROR'
}

// Standardized result type
export function createResult(data = null, error = null) {
  return {
    success: !error,
    data,
    error,
    timestamp: new Date().toISOString()
  }
}

// Safe async wrapper
export async function safeAsync(fn, errorCode = ErrorCodes.UNKNOWN) {
  try {
    const data = await fn()
    return createResult(data)
  } catch (e) {
    const error = new AppError(
      e.message,
      e.code || errorCode,
      { stack: e.stack }
    )
    console.error(`[${errorCode}]`, e)
    return createResult(null, error)
  }
}

// Safe sync wrapper
export function safeSync(fn, errorCode = ErrorCodes.UNKNOWN) {
  try {
    const data = fn()
    return createResult(data)
  } catch (e) {
    const error = new AppError(
      e.message,
      e.code || errorCode,
      { stack: e.stack }
    )
    console.error(`[${errorCode}]`, e)
    return createResult(null, error)
  }
}

// Type validation helpers
export const TypeCheck = {
  isArray(value) {
    return Array.isArray(value)
  },
  
  isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
  },
  
  isString(value) {
    return typeof value === 'string'
  },
  
  isNumber(value) {
    return typeof value === 'number' && !isNaN(value)
  },
  
  isFunction(value) {
    return typeof value === 'function'
  },
  
  // Safe getters with defaults
  getArray(value, defaultValue = []) {
    return Array.isArray(value) ? value : defaultValue
  },
  
  getObject(value, defaultValue = {}) {
    return (value !== null && typeof value === 'object' && !Array.isArray(value)) 
      ? value 
      : defaultValue
  },
  
  getString(value, defaultValue = '') {
    return typeof value === 'string' ? value : defaultValue
  },
  
  getNumber(value, defaultValue = 0) {
    return (typeof value === 'number' && !isNaN(value)) ? value : defaultValue
  }
}

// Global error handler
export function setupGlobalErrorHandler() {
  window.onerror = function(msg, url, line, col, error) {
    const appError = new AppError(
      msg,
      ErrorCodes.UNKNOWN,
      { url, line, col, stack: error?.stack }
    )
    console.error('Global error:', appError)
    // Could send to error tracking service here
    return false
  }
  
  window.addEventListener('unhandledrejection', function(event) {
    const appError = new AppError(
      event.reason?.message || 'Unhandled promise rejection',
      ErrorCodes.UNKNOWN,
      { stack: event.reason?.stack }
    )
    console.error('Unhandled rejection:', appError)
    // Could send to error tracking service here
  })
}