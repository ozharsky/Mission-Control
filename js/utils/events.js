/**
 * Event Delegation Utilities
 * Provides efficient event handling through delegation
 */

/**
 * Create an event delegator for a container element
 * @param {HTMLElement} container - Container element to delegate from
 * @param {string} eventType - Event type to listen for
 * @param {Object} handlers - Map of selectors to handler functions
 * @param {Object} options - Event listener options
 * @returns {Function} Cleanup function
 */
export function delegate(container, eventType, handlers, options = {}) {
  if (!container) {
    console.warn('Event delegation: container is null')
    return () => {}
  }

  const handler = (event) => {
    for (const [selector, callback] of Object.entries(handlers)) {
      const target = event.target.closest(selector)
      if (target && container.contains(target)) {
        try {
          callback(event, target)
        } catch (error) {
          console.error(`Event delegation error for ${selector}:`, error)
        }
        if (options.stopPropagation) {
          break
        }
      }
    }
  }

  container.addEventListener(eventType, handler, options)

  // Return cleanup function
  return () => {
    container.removeEventListener(eventType, handler, options)
  }
}

/**
 * Single event delegation helper
 * @param {HTMLElement} container - Container element
 * @param {string} selector - CSS selector for target elements
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 * @returns {Function} Cleanup function
 */
export function delegateEvent(container, selector, eventType, handler, options = {}) {
  if (!container) {
    console.warn('Event delegation: container is null')
    return () => {}
  }

  const wrappedHandler = (event) => {
    const target = event.target.closest(selector)
    if (target && container.contains(target)) {
      handler(event, target)
    }
  }

  container.addEventListener(eventType, wrappedHandler, options)

  return () => {
    container.removeEventListener(eventType, wrappedHandler, options)
  }
}

/**
 * Auto-cleanup event registry
 * Manages event listeners with automatic cleanup
 */
export class EventRegistry {
  constructor() {
    this.listeners = new Map()
    this.cleanupFns = new Set()
  }

  /**
   * Add an event listener
   * @param {HTMLElement} element - Target element
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event listener options
   */
  add(element, eventType, handler, options = {}) {
    if (!element || typeof handler !== 'function') return

    const key = `${eventType}-${handler.toString().slice(0, 50)}`
    
    element.addEventListener(eventType, handler, options)
    
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map())
    }
    this.listeners.get(element).set(key, { handler, options, eventType })

    // Return remove function
    return () => this.remove(element, eventType, handler, options)
  }

  /**
   * Remove an event listener
   * @param {HTMLElement} element - Target element
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event listener options
   */
  remove(element, eventType, handler, options = {}) {
    if (!element) return

    element.removeEventListener(eventType, handler, options)

    const key = `${eventType}-${handler.toString().slice(0, 50)}`
    const elementListeners = this.listeners.get(element)
    if (elementListeners) {
      elementListeners.delete(key)
      if (elementListeners.size === 0) {
        this.listeners.delete(element)
      }
    }
  }

  /**
   * Add delegated event listener
   * @param {HTMLElement} container - Container element
   * @param {string} selector - CSS selector
   * @param {string} eventType - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event listener options
   */
  delegate(container, selector, eventType, handler, options = {}) {
    const cleanup = delegateEvent(container, selector, eventType, handler, options)
    this.cleanupFns.add(cleanup)
    return cleanup
  }

  /**
   * Add cleanup function
   * @param {Function} fn - Cleanup function
   */
  onCleanup(fn) {
    this.cleanupFns.add(fn)
    return fn
  }

  /**
   * Remove all listeners for an element
   * @param {HTMLElement} element - Target element
   */
  removeAll(element) {
    if (!element) return
    const elementListeners = this.listeners.get(element)
    if (elementListeners) {
      elementListeners.forEach(({ handler, options, eventType }) => {
        element.removeEventListener(eventType, handler, options)
      })
      this.listeners.delete(element)
    }
  }

  /**
   * Clean up all registered listeners
   */
  destroy() {
    this.listeners.forEach((elementListeners, element) => {
      elementListeners.forEach(({ handler, options, eventType }) => {
        element.removeEventListener(eventType, handler, options)
      })
    })
    this.listeners.clear()

    // Run cleanup functions
    this.cleanupFns.forEach(fn => {
      try {
        fn()
      } catch (e) {
        console.error('Cleanup function error:', e)
      }
    })
    this.cleanupFns.clear()
  }

  /**
   * Get count of registered listeners
   */
  get count() {
    let total = 0
    this.listeners.forEach(listeners => {
      total += listeners.size
    })
    return total
  }
}

// Global event registry instance
export const globalEvents = new EventRegistry()

/**
 * Passive event listener helper
 * Automatically uses passive listeners where beneficial
 * @param {HTMLElement} element - Target element
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - Additional options
 */
export function addPassiveListener(element, eventType, handler, options = {}) {
  // Events that benefit from passive listeners
  const passiveEvents = ['scroll', 'wheel', 'touchstart', 'touchmove', 'touchend', 'resize']
  
  const shouldBePassive = passiveEvents.includes(eventType) && !options.active
  
  element.addEventListener(eventType, handler, {
    passive: shouldBePassive,
    ...options
  })

  return () => {
    element.removeEventListener(eventType, handler, {
      passive: shouldBePassive,
      ...options
    })
  }
}

/**
 * Throttled event listener
 * @param {HTMLElement} element - Target element
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler
 * @param {number} wait - Throttle wait time
 * @param {Object} options - Event listener options
 */
export function addThrottledListener(element, eventType, handler, wait = 16, options = {}) {
  let ticking = false

  const throttledHandler = (event) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        handler(event)
        ticking = false
      })
      ticking = true
    }
  }

  element.addEventListener(eventType, throttledHandler, options)

  return () => {
    element.removeEventListener(eventType, throttledHandler, options)
  }
}

/**
 * One-time event listener
 * @param {HTMLElement} element - Target element
 * @param {string} eventType - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - Event listener options
 * @returns {Promise} Promise that resolves when event fires
 */
export function once(element, eventType, handler, options = {}) {
  return new Promise((resolve) => {
    const wrappedHandler = (event) => {
      if (handler) handler(event)
      resolve(event)
    }
    
    element.addEventListener(eventType, wrappedHandler, { once: true, ...options })
  })
}
