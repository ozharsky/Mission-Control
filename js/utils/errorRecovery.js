/**
 * Error Recovery Utilities
 * Provides graceful error handling and recovery mechanisms
 */

// Error recovery strategies
const recoveryStrategies = {
  // Retry a function with exponential backoff
  async retry(fn, options = {}) {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      shouldRetry = () => true
    } = options
    
    let lastError
    let delay = initialDelay
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        
        if (attempt === maxAttempts || !shouldRetry(error)) {
          throw error
        }
        
        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * backoffMultiplier, maxDelay)
      }
    }
    
    throw lastError
  },
  
  // Circuit breaker pattern
  createCircuitBreaker(fn, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 30000,
      halfOpenMaxCalls = 3
    } = options
    
    let state = 'closed' // closed, open, half-open
    let failures = 0
    let nextAttempt = 0
    let halfOpenCalls = 0
    
    return async function circuitBreaker(...args) {
      if (state === 'open') {
        if (Date.now() < nextAttempt) {
          throw new Error('Circuit breaker is open')
        }
        state = 'half-open'
        halfOpenCalls = 0
      }
      
      try {
        const result = await fn.apply(this, args)
        
        if (state === 'half-open') {
          halfOpenCalls++
          if (halfOpenCalls >= halfOpenMaxCalls) {
            state = 'closed'
            failures = 0
          }
        } else {
          failures = 0
        }
        
        return result
      } catch (error) {
        failures++
        
        if (failures >= failureThreshold) {
          state = 'open'
          nextAttempt = Date.now() + resetTimeout
        }
        
        throw error
      }
    }
  },
  
  // Fallback value for failed operations
  async withFallback(fn, fallbackValue, options = {}) {
    const { logError = true } = options
    
    try {
      return await fn()
    } catch (error) {
      if (logError) {
        console.warn('Operation failed, using fallback:', error.message)
      }
      return typeof fallbackValue === 'function' ? fallbackValue(error) : fallbackValue
    }
  },
  
  // Timeout wrapper
  withTimeout(fn, timeoutMs, timeoutMessage = 'Operation timed out') {
    return Promise.race([
      fn,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
      )
    ])
  },
  
  // Safe JSON parse with fallback
  safeJsonParse(str, fallback = null) {
    try {
      return JSON.parse(str)
    } catch {
      return fallback
    }
  },
  
  // Safe localStorage access
  safeStorage: {
    get(key, fallback = null) {
      try {
        const item = localStorage.getItem(key)
        return item !== null ? recoveryStrategies.safeJsonParse(item, item) : fallback
      } catch {
        return fallback
      }
    },
    
    set(key, value) {
      try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
        return true
      } catch {
        return false
      }
    },
    
    remove(key) {
      try {
        localStorage.removeItem(key)
        return true
      } catch {
        return false
      }
    }
  },
  
  // Batch operations with partial success handling
  async batch(items, fn, options = {}) {
    const { continueOnError = true, onError = null } = options
    
    const results = []
    const errors = []
    
    for (let i = 0; i < items.length; i++) {
      try {
        const result = await fn(items[i], i)
        results.push({ success: true, result, index: i })
      } catch (error) {
        errors.push({ error, index: i, item: items[i] })
        results.push({ success: false, error, index: i })
        
        if (onError) {
          onError(error, items[i], i)
        }
        
        if (!continueOnError) {
          break
        }
      }
    }
    
    return {
      results,
      errors,
      successCount: results.filter(r => r.success).length,
      failureCount: errors.length,
      allSucceeded: errors.length === 0
    }
  }
}

// Export individual functions
export const {
  retry,
  createCircuitBreaker,
  withFallback,
  withTimeout,
  safeJsonParse,
  safeStorage,
  batch
} = recoveryStrategies

// Default export
export default recoveryStrategies

// Expose globally for debugging
window.errorRecovery = recoveryStrategies
