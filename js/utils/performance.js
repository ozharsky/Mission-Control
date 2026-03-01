// Performance Utilities
// Throttling, debouncing, and RAF helpers

// Cache for low-power device detection
let _lowPowerCache = null
let _lowPowerCacheTime = 0
const LOW_POWER_CACHE_TTL = 30000 // 30 seconds

/**
 * Detect if the device is low-power (mobile, battery saving, etc.)
 * @returns {boolean} True if low-power device detected
 */
export function isLowPowerDevice() {
  // Return cached result if valid
  const now = Date.now()
  if (_lowPowerCache !== null && (now - _lowPowerCacheTime) < LOW_POWER_CACHE_TTL) {
    return _lowPowerCache
  }
  
  // Check for reduced motion preference first (immediate return)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    _lowPowerCache = true
    _lowPowerCacheTime = now
    return true
  }
  
  // Check for low memory
  if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
    _lowPowerCache = true
    _lowPowerCacheTime = now
    return true
  }
  
  // Check for low-end hardware concurrency
  if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency < 4) {
    _lowPowerCache = true
    _lowPowerCacheTime = now
    return true
  }
  
  // Check for touch-only device (likely mobile)
  if (window.matchMedia('(pointer: coarse)').matches && 
      !window.matchMedia('(pointer: fine)').matches) {
    _lowPowerCache = true
    _lowPowerCacheTime = now
    return true
  }
  
  _lowPowerCache = false
  _lowPowerCacheTime = now
  return false
}

/**
 * Check if battery saving mode is active (async)
 * @returns {Promise<boolean>} True if battery saving mode is active
 */
export async function isBatterySaving() {
  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery()
      // Check for saveBattery property or low battery level
      const isSaving = battery.saveBattery === true || (battery.level < 0.2 && !battery.charging)
      return isSaving
    } catch (e) {
      return false
    }
  }
  return false
}

/**
 * Throttle a function to only execute once per wait period
 * @param {Function} func - Function to throttle
 * @param {number} wait - Wait period in milliseconds
 * @param {Object} options - Options { leading, trailing }
 */
export function throttle(func, wait = 100, options = {}) {
  let timeout = null
  let previous = 0
  const { leading = true, trailing = true } = options

  return function throttled(...args) {
    const now = Date.now()
    
    if (!previous && !leading) {
      previous = now
    }
    
    const remaining = wait - (now - previous)
    
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      try {
        func.apply(this, args)
      } catch (error) {
        console.error('Throttled function error:', error)
      }
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0
        timeout = null
        try {
          func.apply(this, args)
        } catch (error) {
          console.error('Throttled function error:', error)
        }
      }, remaining)
    }
  }
}

/**
 * Debounce a function to delay execution until after wait period of inactivity
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait period in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 */
export function debounce(func, wait = 100, immediate = false) {
  let timeout

  return function debounced(...args) {
    const callNow = immediate && !timeout
    
    clearTimeout(timeout)
    
    timeout = setTimeout(() => {
      timeout = null
      if (!immediate) {
        try {
          func.apply(this, args)
        } catch (error) {
          console.error('Debounced function error:', error)
        }
      }
    }, wait)
    
    if (callNow) {
      try {
        func.apply(this, args)
      } catch (error) {
        console.error('Debounced function error:', error)
      }
    }
  }
}

/**
 * RequestAnimationFrame wrapper with throttling
 * @param {Function} callback - Function to execute
 */
export function rafThrottle(callback) {
  let ticking = false
  
  return function rafThrottled(...args) {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        callback.apply(this, args)
        ticking = false
      })
      ticking = true
    }
  }
}

/**
 * Measure function execution time (for debugging)
 * @param {Function} fn - Function to measure
 * @param {string} label - Label for console output
 */
export function measurePerformance(fn, label = 'Performance') {
  return function measured(...args) {
    const start = performance.now()
    const result = fn.apply(this, args)
    const end = performance.now()
    console.log(`${label}: ${(end - start).toFixed(2)}ms`)
    return result
  }
}

/**
 * Lazy load images when they enter viewport
 * @param {string} selector - CSS selector for images
 */
export function lazyLoadImages(selector = 'img[data-src]') {
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all images immediately
    document.querySelectorAll(selector).forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src
        img.removeAttribute('data-src')
      }
    })
    return
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        if (img.dataset.src) {
          img.src = img.dataset.src
          img.removeAttribute('data-src')
          img.classList.add('loaded')
        }
        imageObserver.unobserve(img)
      }
    })
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  })

  document.querySelectorAll(selector).forEach(img => {
    imageObserver.observe(img)
  })
}

/**
 * Preload critical resources
 * @param {Array} resources - Array of resource URLs
 */
export function preloadResources(resources) {
  resources.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = src
    
    if (src.match(/\.(js)$/)) {
      link.as = 'script'
    } else if (src.match(/\.(css)$/)) {
      link.as = 'style'
    } else if (src.match(/\.(woff2?|ttf|otf)$/)) {
      link.as = 'font'
      link.crossOrigin = 'anonymous'
    } else if (src.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
      link.as = 'image'
    }
    
    document.head.appendChild(link)
  })
}

/**
 * Batch DOM updates for better performance
 * @param {Function} updateFn - Function containing DOM updates
 */
export function batchDOMUpdate(updateFn) {
  // Use requestAnimationFrame for visual updates
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      updateFn()
      resolve()
    })
  })
}

/**
 * Memoize function results
 * @param {Function} fn - Function to memoize
 * @param {Function} keyFn - Function to generate cache key
 */
export function memoize(fn, keyFn = (...args) => JSON.stringify(args)) {
  const cache = new Map()
  
  return function memoized(...args) {
    const key = keyFn(...args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = fn.apply(this, args)
    cache.set(key, result)
    return result
  }
}

/**
 * Check if element is in viewport
 * @param {Element} element - DOM element to check
 * @param {number} offset - Offset in pixels
 */
export function isInViewport(element, offset = 0) {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= -offset &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Schedule idle callback with fallback
 * Uses requestIdleCallback when available, falls back to setTimeout with MessageChannel for better performance
 * @param {Function} callback - Function to execute
 * @param {Object} options - Options { timeout }
 * @returns {number|object} Handle that can be used with cancelIdle
 */
export function scheduleIdle(callback, options = {}) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }
  
  // Use MessageChannel for faster fallback than setTimeout(fn, 0)
  // This yields to the browser's event loop more efficiently
  const channel = new MessageChannel()
  const startTime = performance.now()
  let timeoutId = null
  
  const wrappedCallback = () => {
    const elapsed = performance.now() - startTime
    const didTimeout = options.timeout && elapsed > options.timeout
    
    // Clear timeout if it exists
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    
    // Mimic IdleDeadline interface
    callback({
      didTimeout,
      timeRemaining: () => Math.max(0, 50 - (performance.now() - startTime))
    })
  }
  
  // Set up timeout if specified
  if (options.timeout) {
    timeoutId = setTimeout(wrappedCallback, options.timeout)
  }
  
  channel.port1.onmessage = wrappedCallback
  channel.port2.postMessage(null)
  
  // Return a handle that can be used with cancelIdle
  return { channel, timeoutId }
}

/**
 * Cancel scheduled idle callback
 * @param {number|object} handle - Callback handle from scheduleIdle
 */
export function cancelIdle(handle) {
  if (!handle) return
  
  if ('cancelIdleCallback' in window && typeof handle === 'number') {
    window.cancelIdleCallback(handle)
  } else if (handle && typeof handle === 'object') {
    // MessageChannel fallback - disconnect the port
    if (handle.channel && handle.channel.port1) {
      handle.channel.port1.onmessage = null
    }
    if (handle.timeoutId) {
      clearTimeout(handle.timeoutId)
    }
  } else {
    clearTimeout(handle)
  }
}

/**
 * Optimize scroll performance by batching reads/writes
 */
export class ScrollOptimizer {
  constructor() {
    this.reads = []
    this.writes = []
    this.scheduled = false
  }

  measure(fn) {
    this.reads.push(fn)
    this.schedule()
  }

  mutate(fn) {
    this.writes.push(fn)
    this.schedule()
  }

  schedule() {
    if (this.scheduled) return
    
    this.scheduled = true
    
    window.requestAnimationFrame(() => {
      // Execute all reads first
      this.reads.forEach(fn => fn())
      this.reads = []
      
      // Then execute all writes
      this.writes.forEach(fn => fn())
      this.writes = []
      
      this.scheduled = false
    })
  }
}

// Global scroll optimizer instance
export const scrollOptimizer = new ScrollOptimizer()
