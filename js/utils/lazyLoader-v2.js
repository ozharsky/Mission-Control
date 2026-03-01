// Lazy Loader - Performance-optimized lazy loading for images and components
// Uses Intersection Observer with fallback for older browsers

class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: '50px 0px',
      threshold: 0.01,
      ...options
    }
    this.observer = null
    this.elements = new Map()
    this.isSupported = 'IntersectionObserver' in window
    this._fallbackTimer = null
    this._mutationObserver = null
    this._isDestroyed = false
    
    this.init()
  }

  init() {
    if (this._isDestroyed) return
    
    if (this.isSupported) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        this.options
      )
    } else {
      this.initFallback()
    }
    
    this.observeMutations()
  }

  /**
   * Handle intersection changes
   * @private
   */
  handleIntersection(entries) {
    if (this._isDestroyed) return
    
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target
        const callback = this.elements.get(element)
        
        if (callback) {
          try {
            callback(element)
          } catch (error) {
            console.error('Lazy load callback error:', error)
          }
        }
        
        this.unobserve(element)
      }
    })
  }

  /**
   * Initialize fallback for browsers without IntersectionObserver
   * @private
   */
  initFallback() {
    if (this._isDestroyed) return
    
    // Throttled scroll handler for fallback
    let ticking = false
    
    const checkElements = () => {
      if (!ticking && !this._isDestroyed) {
        requestAnimationFrame(() => {
          this.checkElementsInViewport()
          ticking = false
        })
        ticking = true
      }
    }
    
    window.addEventListener('scroll', checkElements, { passive: true })
    window.addEventListener('resize', checkElements, { passive: true })
    
    // Store cleanup function
    this._fallbackCleanup = () => {
      window.removeEventListener('scroll', checkElements)
      window.removeEventListener('resize', checkElements)
    }
    
    // Initial check
    setTimeout(() => this.checkElementsInViewport(), 100)
  }

  /**
   * Check which elements are in viewport (fallback method)
   * @private
   */
  checkElementsInViewport() {
    if (this._isDestroyed) return
    
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    
    this.elements.forEach((callback, element) => {
      // Skip if element is no longer in DOM
      if (!element.isConnected) {
        this.unobserve(element)
        return
      }
      
      const rect = element.getBoundingClientRect()
      const isInViewport = (
        rect.top < viewportHeight + 100 &&
        rect.bottom > -100 &&
        rect.left < viewportWidth + 100 &&
        rect.right > -100
      )
      
      if (isInViewport) {
        try {
          callback(element)
        } catch (error) {
          console.error('Lazy load callback error:', error)
        }
        this.unobserve(element)
      }
    })
  }

  /**
   * Observe DOM mutations to auto-detect lazy-loadable elements
   * @private
   */
  observeMutations() {
    if (!('MutationObserver' in window) || this._isDestroyed) return
    
    this._mutationObserver = new MutationObserver((mutations) => {
      if (this._isDestroyed) return
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.autoDetectElements(node)
          }
        })
      })
    })
    
    this._mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  /**
   * Auto-detect and setup lazy loading for elements
   * @private
   */
  autoDetectElements(container = document) {
    if (this._isDestroyed) return
    
    // Images with data-src
    container.querySelectorAll('img[data-src]:not([data-lazy-initialized])').forEach(img => {
      this.observe(img, (el) => this.loadImage(el))
    })
    
    // Iframes with data-src
    container.querySelectorAll('iframe[data-src]:not([data-lazy-initialized])').forEach(iframe => {
      this.observe(iframe, (el) => this.loadIframe(el))
    })
    
    // Background images
    container.querySelectorAll('[data-bg-src]:not([data-lazy-initialized])').forEach(el => {
      this.observe(el, (el) => this.loadBackground(el))
    })
  }

  /**
   * Observe an element for lazy loading
   * @param {Element} element - Element to observe
   * @param {Function} callback - Callback when element enters viewport
   */
  observe(element, callback) {
    if (!element || typeof callback !== 'function' || this._isDestroyed) return
    
    // Skip if already initialized
    if (element.hasAttribute('data-lazy-initialized')) return
    
    // Mark as initialized
    element.setAttribute('data-lazy-initialized', 'true')
    
    this.elements.set(element, callback)
    
    if (this.observer) {
      this.observer.observe(element)
    }
  }

  /**
   * Stop observing an element
   * @param {Element} element - Element to stop observing
   */
  unobserve(element) {
    if (!element) return
    
    this.elements.delete(element)
    
    if (this.observer) {
      this.observer.unobserve(element)
    }
  }

  /**
   * Load an image lazily
   * @param {HTMLImageElement} img - Image element
   */
  loadImage(img) {
    if (!img || !img.dataset) return
    
    const src = img.dataset.src
    const srcset = img.dataset.srcset
    const sizes = img.dataset.sizes
    
    if (!src) return
    
    // Add loading class
    img.classList.add('lazy-loading')
    
    // Create new image to preload
    const preloadImg = new Image()
    
    preloadImg.onload = () => {
      img.src = src
      if (srcset) img.srcset = srcset
      if (sizes) img.sizes = sizes
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-loaded')
      img.removeAttribute('data-src')
      img.removeAttribute('data-srcset')
      img.removeAttribute('data-sizes')
      
      // Trigger custom event
      img.dispatchEvent(new CustomEvent('lazyLoaded', { detail: { src } }))
    }
    
    preloadImg.onerror = () => {
      img.classList.remove('lazy-loading')
      img.classList.add('lazy-error')
      img.dispatchEvent(new CustomEvent('lazyError', { detail: { src } }))
    }
    
    // Set srcset first if available (for proper image selection)
    if (srcset) {
      preloadImg.srcset = srcset
    }
    preloadImg.src = src
  }

  /**
   * Load an iframe lazily
   * @param {HTMLIFrameElement} iframe - Iframe element
   */
  loadIframe(iframe) {
    if (!iframe || !iframe.dataset) return
    
    const src = iframe.dataset.src
    if (!src) return
    
    iframe.src = src
    iframe.classList.add('lazy-loaded')
  }

  /**
   * Load a background image lazily
   * @param {Element} element - Element with background image
   */
  loadBackground(element) {
    if (!element || !element.dataset) return
    
    const src = element.dataset.bgSrc
    if (!src) return
    
    const img = new Image()
    
    img.onload = () => {
      element.style.backgroundImage = `url(${src})`
      element.classList.add('lazy-loaded')
    }
    
    img.src = src
  }

  /**
   * Load all elements immediately (e.g., for print)
   */
  loadAll() {
    if (this._isDestroyed) return
    
    this.elements.forEach((callback, element) => {
      try {
        callback(element)
      } catch (error) {
        console.error('Lazy load callback error:', error)
      }
    })
    this.elements.clear()
  }

  /**
   * Destroy the lazy loader and clean up
   */
  destroy() {
    this._isDestroyed = true
    
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    
    if (this._mutationObserver) {
      this._mutationObserver.disconnect()
      this._mutationObserver = null
    }
    
    if (this._fallbackTimer) {
      clearTimeout(this._fallbackTimer)
      this._fallbackTimer = null
    }
    
    if (this._fallbackCleanup) {
      this._fallbackCleanup()
      this._fallbackCleanup = null
    }
    
    this.elements.clear()
  }
}

// Create global instance
export const lazyLoader = new LazyLoader()

// Export class for custom instances
export { LazyLoader }

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => lazyLoader.autoDetectElements())
} else {
  lazyLoader.autoDetectElements()
}
