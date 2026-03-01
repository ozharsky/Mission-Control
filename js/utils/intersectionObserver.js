// Intersection Observer utilities for lazy loading and viewport detection

/**
 * Create an intersection observer for lazy loading elements
 * @param {Object} options - Observer options
 * @param {string} options.selector - CSS selector for elements to observe
 * @param {Function} options.onEnter - Callback when element enters viewport
 * @param {Function} options.onLeave - Callback when element leaves viewport
 * @param {number} options.threshold - Intersection threshold (0-1)
 * @param {string} options.rootMargin - Margin around root
 * @returns {IntersectionObserver} The created observer
 */
export function createViewportObserver(options = {}) {
  const {
    selector = '[data-lazy]',
    onEnter = () => {},
    onLeave = () => {},
    threshold = 0.1,
    rootMargin = '50px 0px'
  } = options

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        onEnter(entry.target)
        entry.target.dataset.inViewport = 'true'
      } else {
        onLeave(entry.target)
        entry.target.dataset.inViewport = 'false'
      }
    })
  }, {
    threshold,
    rootMargin
  })

  // Observe existing elements
  document.querySelectorAll(selector).forEach(el => observer.observe(el))

  // Observe dynamically added elements
  const mutationObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.matches?.(selector)) {
            observer.observe(node)
          }
          node.querySelectorAll?.(selector).forEach(el => observer.observe(el))
        }
      })
    })
  })

  mutationObserver.observe(document.body, { childList: true, subtree: true })

  return {
    observer,
    disconnect: () => {
      observer.disconnect()
      mutationObserver.disconnect()
    }
  }
}

/**
 * Lazy load images when they enter viewport
 * @param {string} selector - CSS selector for images to lazy load
 * @param {Object} options - Loading options
 */
export function lazyLoadImages(selector = 'img[data-src]', options = {}) {
  const { rootMargin = '100px 0px', threshold = 0 } = options

  if (!('IntersectionObserver' in window)) {
    // Fallback: load all images immediately
    document.querySelectorAll(selector).forEach(img => {
      loadImage(img)
    })
    return
  }

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadImage(entry.target)
        imageObserver.unobserve(entry.target)
      }
    })
  }, {
    rootMargin,
    threshold
  })

  document.querySelectorAll(selector).forEach(img => {
    // Add fade-in effect
    img.style.opacity = '0'
    img.style.transition = 'opacity 0.3s ease'
    imageObserver.observe(img)
  })
}

/**
 * Load an image from data-src
 * @param {HTMLImageElement} img - Image element to load
 */
function loadImage(img) {
  if (!img.dataset.src) return

  const newImg = new Image()
  newImg.onload = () => {
    img.src = img.dataset.src
    img.style.opacity = '1'
    img.removeAttribute('data-src')
    img.classList.add('loaded')
  }
  newImg.onerror = () => {
    img.classList.add('error')
    img.dispatchEvent(new CustomEvent('imageError', { detail: { src: img.dataset.src } }))
  }
  newImg.src = img.dataset.src
}

/**
 * Create a section visibility tracker
 * Tracks which sections are currently visible for analytics/performance
 * @param {Array<string>} sectionIds - Array of section IDs to track
 * @param {Function} onVisibilityChange - Callback when visibility changes
 */
export function trackSectionVisibility(sectionIds, onVisibilityChange) {
  const visibilityMap = new Map()

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const sectionId = entry.target.id
      const isVisible = entry.isIntersecting
      const wasVisible = visibilityMap.get(sectionId)

      if (isVisible !== wasVisible) {
        visibilityMap.set(sectionId, isVisible)
        onVisibilityChange?.(sectionId, isVisible, entry.intersectionRatio)
      }
    })
  }, {
    threshold: [0, 0.25, 0.5, 0.75, 1],
    rootMargin: '0px'
  })

  sectionIds.forEach(id => {
    const element = document.getElementById(id)
    if (element) {
      visibilityMap.set(id, false)
      observer.observe(element)
    }
  })

  return {
    observer,
    getVisibleSections: () => {
      return Array.from(visibilityMap.entries())
        .filter(([, isVisible]) => isVisible)
        .map(([id]) => id)
    },
    disconnect: () => observer.disconnect()
  }
}

/**
 * Sticky element observer - triggers when element becomes sticky
 * @param {HTMLElement} element - Element to observe
 * @param {Object} options - Observer options
 */
export function observeSticky(element, options = {}) {
  const { onSticky, onUnsticky, threshold = 1 } = options

  const observer = new IntersectionObserver(
    ([entry]) => {
      const isSticky = entry.intersectionRatio < threshold
      if (isSticky) {
        onSticky?.(element)
        element.classList.add('is-sticky')
      } else {
        onUnsticky?.(element)
        element.classList.remove('is-sticky')
      }
    },
    { threshold: [threshold] }
  )

  // Create a sentinel element
  const sentinel = document.createElement('div')
  sentinel.style.position = 'absolute'
  sentinel.style.top = '0'
  sentinel.style.height = '1px'
  sentinel.style.width = '100%'
  sentinel.style.pointerEvents = 'none'
  sentinel.style.visibility = 'hidden'

  element.parentNode.insertBefore(sentinel, element)
  observer.observe(sentinel)

  return {
    observer,
    disconnect: () => {
      observer.disconnect()
      sentinel.remove()
    }
  }
}

/**
 * Animation trigger - triggers animations when elements enter viewport
 * @param {string} selector - Elements to animate
 * @param {string} animationClass - CSS class to add for animation
 * @param {Object} options - Animation options
 */
export function animateOnScroll(selector, animationClass = 'animate-in', options = {}) {
  const { once = true, threshold = 0.1, rootMargin = '0px' } = options

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add(animationClass)
        if (once) {
          observer.unobserve(entry.target)
        }
      } else if (!once) {
        entry.target.classList.remove(animationClass)
      }
    })
  }, {
    threshold,
    rootMargin
  })

  document.querySelectorAll(selector).forEach(el => observer.observe(el))

  return observer
}

// Global viewport observer instance for common use cases
export const viewportObserver = {
  _observers: new Map(),

  /**
   * Register a callback for when elements matching selector enter viewport
   * @param {string} name - Unique name for this observation
   * @param {string} selector - CSS selector
   * @param {Function} callback - Callback function
   */
  on(name, selector, callback) {
    if (this._observers.has(name)) {
      this._observers.get(name).disconnect()
    }

    const observer = createViewportObserver({
      selector,
      onEnter: callback
    })

    this._observers.set(name, observer)
    return observer
  },

  /**
   * Disconnect a specific observer
   * @param {string} name - Observer name
   */
  off(name) {
    const observer = this._observers.get(name)
    if (observer) {
      observer.disconnect()
      this._observers.delete(name)
    }
  },

  /**
   * Disconnect all observers
   */
  disconnectAll() {
    this._observers.forEach(observer => observer.disconnect())
    this._observers.clear()
  }
}
