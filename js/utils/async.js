// Async utilities for better promise handling and concurrency

/**
 * Run promises with concurrency limit
 * @param {Array} items - Items to process
 * @param {Function} fn - Async function to apply to each item
 * @param {number} concurrency - Max concurrent operations
 * @returns {Promise<Array>} Results in original order
 */
export async function asyncPool(items, fn, concurrency = 5) {
  const results = new Array(items.length)
  const executing = new Set()

  for (let i = 0; i < items.length; i++) {
    const promise = fn(items[i], i).then(result => {
      results[i] = { status: 'fulfilled', value: result }
      executing.delete(promise)
      return result
    }).catch(error => {
      results[i] = { status: 'rejected', reason: error }
      executing.delete(promise)
      throw error
    })

    executing.add(promise)

    if (executing.size >= concurrency) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
  return results
}

/**
 * Timeout wrapper for promises with AbortController support
 * @param {Promise} promise - Promise to wrap
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Error message
 * @returns {Promise}
 */
export function withTimeout(promise, ms = 5000, message = 'Operation timed out') {
  const abortController = new AbortController()
  
  const timeout = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      abortController.abort()
      reject(new Error(message))
    }, ms)
    
    // Clean up timer if promise resolves first
    promise.finally(() => clearTimeout(timer)).catch(() => {})
  })
  
  return Promise.race([promise, timeout])
}

/**
 * Retry a function with exponential backoff and jitter
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise}
 */
export async function retry(fn, options = {}) {
  const {
    attempts = 3,
    delay = 1000,
    backoff = 2,
    maxDelay = 30000,
    jitter = true,
    onRetry = null,
    shouldRetry = null // Custom predicate to determine if error is retryable
  } = options

  let lastError

  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Check if we should retry this error
      if (shouldRetry && !shouldRetry(error)) {
        throw error
      }
      
      if (i < attempts - 1) {
        // Calculate wait time with exponential backoff
        let waitTime = delay * Math.pow(backoff, i)
        
        // Cap at maxDelay
        waitTime = Math.min(waitTime, maxDelay)
        
        // Add jitter to prevent thundering herd
        if (jitter) {
          waitTime = waitTime * (0.5 + Math.random() * 0.5)
        }
        
        if (onRetry) {
          onRetry(error, i + 1, attempts, waitTime)
        }
        
        await sleep(waitTime)
      }
    }
  }

  throw lastError
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Create a cancellable promise
 * @param {Function} executor - Promise executor
 * @returns {Object} { promise, cancel }
 */
export function makeCancellable(executor) {
  let isCancelled = false
  let cancelFn = () => {}

  const promise = new Promise((resolve, reject) => {
    cancelFn = () => {
      isCancelled = true
      reject(new Error('Cancelled'))
    }

    executor(
      value => {
        if (!isCancelled) resolve(value)
      },
      error => {
        if (!isCancelled) reject(error)
      }
    )
  })

  return { promise, cancel: cancelFn }
}

/**
 * Debounce async functions
 * @param {Function} fn - Async function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
export function debounceAsync(fn, wait = 300) {
  let timeoutId = null
  let pendingPromise = null
  let resolvePending = null

  return function debounced(...args) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (!pendingPromise) {
      pendingPromise = new Promise(resolve => {
        resolvePending = resolve
      })
    }

    timeoutId = setTimeout(async () => {
      try {
        const result = await fn.apply(this, args)
        resolvePending({ success: true, result })
      } catch (error) {
        resolvePending({ success: false, error })
      } finally {
        pendingPromise = null
        resolvePending = null
        timeoutId = null
      }
    }, wait)

    return pendingPromise
  }
}

/**
 * Queue for sequential async operations
 */
export class AsyncQueue {
  constructor() {
    this.queue = []
    this.running = false
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject })
      this.process()
    })
  }

  async process() {
    if (this.running) return
    this.running = true

    while (this.queue.length > 0) {
      const { fn, resolve, reject } = this.queue.shift()
      try {
        const result = await fn()
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }

    this.running = false
  }

  clear() {
    this.queue = []
  }

  get size() {
    return this.queue.length
  }
}

/**
 * Rate limiter for function calls
 */
export class RateLimiter {
  constructor(maxCalls, windowMs) {
    this.maxCalls = maxCalls
    this.windowMs = windowMs
    this.calls = []
  }

  async acquire() {
    const now = Date.now()
    
    // Remove old calls outside the window
    this.calls = this.calls.filter(time => now - time < this.windowMs)
    
    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0]
      const waitTime = this.windowMs - (now - oldestCall)
      await sleep(waitTime)
      return this.acquire()
    }
    
    this.calls.push(now)
  }

  async execute(fn) {
    await this.acquire()
    return fn()
  }
}
