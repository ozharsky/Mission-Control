/**
 * Scroll Animation Utilities
 * Handles intersection observer-based animations and scroll effects
 */

export class ScrollAnimator {
  constructor(options = {}) {
    this.options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      once: true,
      ...options
    }
    
    this.observer = null
    this.elements = new Set()
    this.isPaused = false
    this.init()
  }
  
  init() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show all elements immediately
      this.showAll()
      return
    }
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin
      }
    )
  }
  
  handleIntersection(entries) {
    if (this.isPaused) return
    
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.reveal(entry.target)
        
        if (this.options.once) {
          this.observer.unobserve(entry.target)
          this.elements.delete(entry.target)
        }
      } else if (!this.options.once) {
        this.hide(entry.target)
      }
    })
  }
  
  reveal(element) {
    // Add small delay for natural feel
    const delay = parseInt(element.dataset.revealDelay) || 0
    
    // Use requestAnimationFrame for smoother animations
    const revealFn = () => {
      element.classList.add('revealed', 'in-view', 'visible', 'fade-in-visible')
      element.dispatchEvent(new CustomEvent('revealed'))
    }
    
    if (delay > 0) {
      setTimeout(revealFn, delay)
    } else {
      requestAnimationFrame(revealFn)
    }
  }
  
  hide(element) {
    element.classList.remove('revealed', 'in-view', 'visible', 'fade-in-visible')
    element.dispatchEvent(new CustomEvent('hidden'))
  }
  
  observe(element) {
    if (!element || this.elements.has(element)) return
    
    this.elements.add(element)
    this.observer?.observe(element)
  }
  
  unobserve(element) {
    this.elements.delete(element)
    this.observer?.unobserve(element)
  }
  
  observeAll(selector = '.reveal-on-scroll, .io-animate, .stagger-children') {
    document.querySelectorAll(selector).forEach(el => this.observe(el))
  }
  
  showAll() {
    this.elements.forEach(el => this.reveal(el))
  }
  
  /**
   * Pause observer callbacks (useful during heavy operations)
   */
  pause() {
    this.isPaused = true
  }
  
  /**
   * Resume observer callbacks
   */
  resume() {
    this.isPaused = false
  }
  
  /**
   * Batch observe multiple elements efficiently
   * @param {Array<HTMLElement>} elements - Elements to observe
   */
  observeBatch(elements) {
    if (!elements || elements.length === 0) return
    
    // Use requestIdleCallback for non-critical batch operations
    const batchFn = () => {
      elements.forEach(el => {
        if (el && !this.elements.has(el)) {
          this.elements.add(el)
          this.observer?.observe(el)
        }
      })
    }
    
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(batchFn, { timeout: 100 })
    } else {
      setTimeout(batchFn, 0)
    }
  }
  
  destroy() {
    this.observer?.disconnect()
    this.elements.clear()
  }
}

// Global scroll progress indicator
export class ScrollProgress {
  constructor(options = {}) {
    this.options = {
      color: 'var(--accent-primary)',
      height: '3px',
      position: 'top',
      ...options
    }
    
    this.element = null
    this.rafId = null
    this.init()
  }
  
  init() {
    // Create progress element
    this.element = document.createElement('div')
    this.element.className = 'scroll-progress-indicator'
    this.element.style.cssText = `
      position: fixed;
      ${this.options.position}: 0;
      left: 0;
      height: ${this.options.height};
      background: ${this.options.color};
      z-index: 9999;
      transform-origin: left;
      transform: scaleX(0);
      transition: transform 0.1s linear;
    `
    
    document.body.appendChild(this.element)
    
    // Bind scroll handler
    this.handleScroll = this.handleScroll.bind(this)
    window.addEventListener('scroll', this.handleScroll, { passive: true })
    
    // Initial update
    this.updateProgress()
  }
  
  handleScroll() {
    if (this.rafId) return
    
    this.rafId = requestAnimationFrame(() => {
      this.updateProgress()
      this.rafId = null
    })
  }
  
  updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = docHeight > 0 ? scrollTop / docHeight : 0
    
    this.element.style.transform = `scaleX(${Math.min(progress, 1)})`
  }
  
  destroy() {
    window.removeEventListener('scroll', this.handleScroll)
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.element?.remove()
  }
}

// Parallax effect utility
export class ParallaxEffect {
  constructor(elements, options = {}) {
    this.elements = new Map()
    this.options = {
      speed: 0.5,
      direction: 'vertical',
      ...options
    }
    
    this.rafId = null
    this.lastScrollY = 0
    
    if (typeof elements === 'string') {
      document.querySelectorAll(elements).forEach(el => this.addElement(el))
    } else if (elements) {
      this.addElement(elements)
    }
    
    this.init()
  }
  
  init() {
    this.handleScroll = this.handleScroll.bind(this)
    window.addEventListener('scroll', this.handleScroll, { passive: true })
  }
  
  addElement(element, speed = this.options.speed) {
    if (!element) return
    
    this.elements.set(element, {
      speed,
      initialTransform: getComputedStyle(element).transform
    })
  }
  
  removeElement(element) {
    this.elements.delete(element)
  }
  
  handleScroll() {
    if (this.rafId) return
    
    this.rafId = requestAnimationFrame(() => {
      const scrollY = window.scrollY
      
      this.elements.forEach((config, element) => {
        const offset = scrollY * config.speed
        const transform = config.initialTransform !== 'none' 
          ? `${config.initialTransform} translateY(${offset}px)`
          : `translateY(${offset}px)`
        
        element.style.transform = transform
      })
      
      this.rafId = null
    })
  }
  
  destroy() {
    window.removeEventListener('scroll', this.handleScroll)
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.elements.clear()
  }
}

// Smooth scroll to element
export function smoothScrollTo(target, options = {}) {
  const config = {
    offset: 0,
    duration: 500,
    easing: 'easeInOutCubic',
    ...options
  }
  
  const element = typeof target === 'string' 
    ? document.querySelector(target) 
    : target
    
  if (!element) return
  
  const targetPosition = element.getBoundingClientRect().top + window.scrollY - config.offset
  const startPosition = window.scrollY
  const distance = targetPosition - startPosition
  
  const easings = {
    linear: t => t,
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    easeOutQuart: t => 1 - Math.pow(1 - t, 4)
  }
  
  const easing = easings[config.easing] || easings.easeInOutCubic
  const startTime = performance.now()
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / config.duration, 1)
    const easedProgress = easing(progress)
    
    window.scrollTo(0, startPosition + distance * easedProgress)
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }
  
  requestAnimationFrame(animate)
}

// Initialize on DOM ready
export function initScrollAnimations() {
  // Create global animator instance
  window.scrollAnimator = new ScrollAnimator()
  window.scrollAnimator.observeAll()
  
  // Auto-initialize elements with data attributes
  document.querySelectorAll('[data-reveal]').forEach(el => {
    const type = el.dataset.reveal || 'fade-up'
    el.classList.add(`reveal-${type}`, 'fade-in-scroll')
    window.scrollAnimator.observe(el)
  })
  
  // Auto-initialize new enhanced scroll animations
  document.querySelectorAll('.fade-in-scroll, .scale-in-scroll, .slide-left-scroll, .slide-right-scroll').forEach(el => {
    window.scrollAnimator.observe(el)
  })
  
  // Auto-initialize stagger containers
  document.querySelectorAll('.stagger-scroll').forEach(container => {
    window.scrollAnimator.observe(container)
  })
}

// Export singleton for easy access
export const scrollAnimator = new ScrollAnimator()
