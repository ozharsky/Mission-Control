// Viewport Observer Utility
// Triggers animations when elements enter the viewport

export class ViewportObserver {
  constructor(options = {}) {
    this.options = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1,
      ...options
    }
    
    this.observer = null
    this.elements = new Map()
    this.init()
  }

  init() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements immediately
      this.fallback()
      return
    }

    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      this.options
    )
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      const { onEnter, onLeave, once } = this.elements.get(entry.target) || {}

      if (entry.isIntersecting) {
        entry.target.classList.add('in-view')
        entry.target.classList.add('revealed')
        
        if (typeof onEnter === 'function') {
          onEnter(entry.target)
        }

        if (once) {
          this.unobserve(entry.target)
        }
      } else {
        entry.target.classList.remove('in-view')
        
        if (typeof onLeave === 'function') {
          onLeave(entry.target)
        }
      }
    })
  }

  observe(element, callbacks = {}) {
    if (!element || !this.observer) return

    this.elements.set(element, callbacks)
    this.observer.observe(element)
  }

  unobserve(element) {
    if (!element || !this.observer) return

    this.observer.unobserve(element)
    this.elements.delete(element)
  }

  disconnect() {
    if (this.observer) {
      try {
        this.observer.disconnect()
      } catch (e) {
        // Ignore disconnect errors
      }
      this.observer = null
    }
    this.elements.clear()
  }

  /**
   * Check if observer is active
   */
  isActive() {
    return !!this.observer
  }

  fallback() {
    // For browsers without IntersectionObserver support
    document.querySelectorAll('.io-animate, .reveal-on-scroll').forEach(el => {
      el.classList.add('in-view', 'revealed')
    })
  }
}

// Global instance
let globalObserver = null

export function initViewportObserver(options = {}) {
  if (!globalObserver) {
    globalObserver = new ViewportObserver(options)
  }
  return globalObserver
}

export function observeElement(element, callbacks = {}) {
  const observer = initViewportObserver()
  observer.observe(element, callbacks)
  return () => observer.unobserve(element)
}

// Auto-initialize elements with data attributes
export function initScrollAnimations() {
  const observer = initViewportObserver()
  
  // Observe elements with animation classes
  document.querySelectorAll('.io-animate, .reveal-on-scroll, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    observer.observe(el, { once: true })
  })
  
  // Observe elements with data-animate attribute
  document.querySelectorAll('[data-animate]').forEach(el => {
    const animation = el.dataset.animate
    el.classList.add(animation)
    observer.observe(el, { once: true })
  })
}

// Stagger animation for lists
export function staggerAnimate(container, selector = '> *', delay = 100) {
  const items = container.querySelectorAll(selector)
  
  items.forEach((item, index) => {
    item.style.opacity = '0'
    item.style.transform = 'translateY(20px)'
    item.style.transition = `opacity 0.5s ease ${index * delay}ms, transform 0.5s ease ${index * delay}ms`
    
    setTimeout(() => {
      item.style.opacity = '1'
      item.style.transform = 'translateY(0)'
    }, 50)
  })
}

// Parallax effect
export function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]')
  
  if (parallaxElements.length === 0) return
  
  let ticking = false
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        parallaxElements.forEach(el => {
          const speed = parseFloat(el.dataset.parallax) || 0.5
          const rect = el.getBoundingClientRect()
          const scrolled = window.pageYOffset
          const rate = scrolled * speed
          
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            el.style.transform = `translateY(${rate}px)`
          }
        })
        ticking = false
      })
      ticking = true
    }
  }, { passive: true })
}

// Scroll progress indicator
export function initScrollProgress() {
  const progressBar = document.createElement('div')
  progressBar.className = 'scroll-progress'
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
    z-index: 9999;
    transform-origin: left;
    transform: scaleX(0);
    transition: transform 0.1s ease-out;
  `
  document.body.appendChild(progressBar)
  
  let ticking = false
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrollTop = window.pageYOffset
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const progress = scrollTop / docHeight
        progressBar.style.transform = `scaleX(${progress})`
        ticking = false
      })
      ticking = true
    }
  }, { passive: true })
}

// Reveal on scroll helper
export function revealOnScroll(selector, options = {}) {
  const { threshold = 0.1, rootMargin = '0px' } = options
  
  const elements = document.querySelectorAll(selector)
  
  if (!('IntersectionObserver' in window)) {
    elements.forEach(el => el.classList.add('revealed'))
    return
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed')
        observer.unobserve(entry.target)
      }
    })
  }, { threshold, rootMargin })
  
  elements.forEach(el => observer.observe(el))
}

// Default export for compatibility
export const viewportObserver = {
  init: initViewportObserver,
  observe: observeElement,
  initAnimations: initScrollAnimations,
  initParallax,
  initScrollProgress,
  revealOnScroll
}
