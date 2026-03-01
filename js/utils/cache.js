// Cache Manager - Intelligent caching for data and computed values
// Provides TTL-based caching with automatic cleanup

class CacheManager {
  constructor(options = {}) {
    this.cache = new Map()
    this.timers = new Map()
    this.defaultTTL = options.defaultTTL || 60000 // 1 minute default
    this.maxSize = options.maxSize || 100 // Max cached items
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {*} Cached value or undefined
   */
  get(key) {
    const entry = this.cache.get(key)
    if (!entry) {
      this.stats.misses++
      return undefined
    }

    // Check if expired
    if (entry.expires && Date.now() > entry.expires) {
      this.delete(key)
      this.stats.misses++
      return undefined
    }

    this.stats.hits++
    entry.lastAccessed = Date.now()
    return entry.value
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = this.defaultTTL) {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evictLRU()
    }

    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    const entry = {
      value,
      created: Date.now(),
      lastAccessed: Date.now(),
      expires: ttl > 0 ? Date.now() + ttl : null
    }

    this.cache.set(key, entry)

    // Set expiration timer
    if (ttl > 0) {
      const timer = setTimeout(() => this.delete(key), ttl)
      this.timers.set(key, timer)
    }

    return this
  }

  /**
   * Get or compute a cached value
   * @param {string} key - Cache key
   * @param {Function} computeFn - Function to compute value if not cached
   * @param {number} ttl - Time to live in milliseconds
   * @returns {*} Cached or computed value
   */
  getOrCompute(key, computeFn, ttl = this.defaultTTL) {
    const cached = this.get(key)
    if (cached !== undefined) {
      return cached
    }

    try {
      const value = computeFn()
      this.set(key, value, ttl)
      return value
    } catch (error) {
      console.error(`Cache computation failed for key "${key}":`, error)
      throw error
    }
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    return this.cache.delete(key)
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (entry.expires && Date.now() > entry.expires) {
      this.delete(key)
      return false
    }
    return true
  }

  /**
   * Clear all cached values
   */
  clear() {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize
    }
  }

  /**
   * Prefetch values into cache before they're needed
   * Uses requestIdleCallback for non-critical prefetching
   * @param {Array<string>} keys - Keys to prefetch
   * @param {Function} computeFn - Function to compute values
   * @param {number} ttl - Time to live in milliseconds
   */
  prefetch(keys, computeFn, ttl = this.defaultTTL) {
    const prefetchFn = () => {
      keys.forEach(key => {
        if (!this.has(key)) {
          try {
            const value = computeFn(key)
            this.set(key, value, ttl)
          } catch (error) {
            console.warn(`Prefetch failed for key "${key}":`, error)
          }
        }
      })
    }

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(prefetchFn, { timeout: 2000 })
    } else {
      setTimeout(prefetchFn, 100)
    }
  }

  /**
   * Warm up cache with frequently accessed data
   * @param {Object} dataMap - Object with key-value pairs to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  warmUp(dataMap, ttl = this.defaultTTL) {
    Object.entries(dataMap).forEach(([key, value]) => {
      if (!this.has(key)) {
        this.set(key, value, ttl)
      }
    })
  }

  /**
   * Evict least recently used item
   * @private
   */
  _evictLRU() {
    let oldest = null
    let oldestKey = null

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.lastAccessed < oldest.lastAccessed) {
        oldest = entry
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.delete(oldestKey)
      this.stats.evictions++
    }
  }

  /**
   * Create a memoized version of a function
   * @param {Function} fn - Function to memoize
   * @param {Function} keyFn - Function to generate cache key from arguments
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Function} Memoized function
   */
  memoize(fn, keyFn = (...args) => JSON.stringify(args), ttl = this.defaultTTL) {
    return (...args) => {
      const key = keyFn(...args)
      return this.getOrCompute(key, () => fn(...args), ttl)
    }
  }

  /**
   * Get all keys in cache
   * @returns {Array<string>} Array of cache keys
   */
  keys() {
    return Array.from(this.cache.keys())
  }

  /**
   * Get cache size
   * @returns {number} Number of cached items
   */
  size() {
    return this.cache.size
  }
}

// Create default cache instance
export const cache = new CacheManager({
  defaultTTL: 30000, // 30 seconds
  maxSize: 50
})

// Create specialized caches
export const dashboardCache = new CacheManager({
  defaultTTL: 5000, // 5 seconds for dashboard
  maxSize: 20
})

export const dataCache = new CacheManager({
  defaultTTL: 60000, // 1 minute for data
  maxSize: 100
})

// Export class for custom instances
export { CacheManager }
