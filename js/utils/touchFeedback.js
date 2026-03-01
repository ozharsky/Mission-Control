/**
 * Touch Feedback & Enhanced Interactions
 * Provides haptic-like feedback and touch ripple effects for mobile
 */

export class TouchFeedback {
  constructor(options = {}) {
    this.options = {
      rippleSelector: '.touch-ripple, .btn, .card, .priority-card, .project-card',
      hapticSelector: '.haptic, .btn, .card-action-btn',
      rippleColor: 'rgba(255, 255, 255, 0.15)',
      ...options
    }
    
    this.init()
  }
  
  init() {
    // Only enable on touch devices
    if (!this.isTouchDevice()) return
    
    this.addRippleListeners()
    this.addHapticListeners()
  }
  
  isTouchDevice() {
    return window.matchMedia('(hover: none) and (pointer: coarse)').matches
  }
  
  addRippleListeners() {
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest(this.options.rippleSelector)
      if (!target) return
      
      this.createRipple(target, e.touches[0])
    }, { passive: true })
  }
  
  createRipple(element, touch) {
    const rect = element.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    // Set CSS custom properties for ripple position
    element.style.setProperty('--touch-x', `${x}px`)
    element.style.setProperty('--touch-y', `${y}px`)
  }
  
  addHapticListeners() {
    document.addEventListener('touchstart', (e) => {
      const target = e.target.closest(this.options.hapticSelector)
      if (!target) return
      
      // Add haptic class for CSS animation
      target.classList.add('haptic-active')
      
      // Try native vibration API if available
      if (navigator.vibrate) {
        navigator.vibrate(10)
      }
      
      // Remove class after animation
      setTimeout(() => {
        target.classList.remove('haptic-active')
      }, 150)
    }, { passive: true })
  }
  
  // Trigger success feedback
  success(element) {
    if (!element) return
    
    element.classList.add('success-checkmark')
    
    if (navigator.vibrate) {
      navigator.vibrate([20, 30, 20])
    }
    
    setTimeout(() => {
      element.classList.remove('success-checkmark')
    }, 400)
  }
  
  // Trigger error feedback
  error(element) {
    if (!element) return
    
    element.classList.add('shake')
    
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30])
    }
    
    setTimeout(() => {
      element.classList.remove('shake')
    }, 500)
  }
  
  // Trigger attention feedback
  attention(element) {
    if (!element) return
    
    element.classList.add('pulse-attention')
    
    setTimeout(() => {
      element.classList.remove('pulse-attention')
    }, 2000)
  }
}

// Enhanced loading states
export class LoadingState {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      type: 'spinner', // spinner, dots, pulse, shimmer
      text: 'Loading...',
      ...options
    }
    
    this.originalContent = null
    this.loadingElement = null
  }
  
  show() {
    if (!this.element) return
    
    this.originalContent = this.element.innerHTML
    this.element.classList.add('loading-active')
    
    const loaderHTML = this.getLoaderHTML()
    this.element.innerHTML = loaderHTML
    
    this.loadingElement = this.element.querySelector('.loading-indicator')
  }
  
  hide() {
    if (!this.element || !this.originalContent) return
    
    this.element.classList.remove('loading-active')
    this.element.innerHTML = this.originalContent
    
    this.originalContent = null
    this.loadingElement = null
  }
  
  getLoaderHTML() {
    const loaders = {
      spinner: `
        <div class="loading-indicator loading-center">
          <div class="loading-spinner-double"></div>
          ${this.options.text ? `<span class="loading-text">${this.options.text}</span>` : ''}
        </div>
      `,
      dots: `
        <div class="loading-indicator loading-center">
          <div class="loading-dots-spinner">
            <span></span>
            <span></span>
            <span></span>
          </div>
          ${this.options.text ? `<span class="loading-text">${this.options.text}</span>` : ''}
        </div>
      `,
      pulse: `
        <div class="loading-indicator loading-center">
          <div class="loading-pulse-ring"></div>
          ${this.options.text ? `<span class="loading-text">${this.options.text}</span>` : ''}
        </div>
      `,
      shimmer: `
        <div class="loading-indicator loading-shimmer-container">
          <div class="loading-shimmer"></div>
        </div>
      `
    }
    
    return loaders[this.options.type] || loaders.spinner
  }
}

// Button loading state helper
export function setButtonLoading(button, loading = true, text = 'Loading...') {
  if (!button) return
  
  if (loading) {
    button.dataset.originalText = button.innerHTML
    button.disabled = true
    button.innerHTML = `
      <span class="loading-dots-spinner" style="display: inline-flex; margin-right: 0.5rem;">
        <span></span>
        <span></span>
        <span></span>
      </span>
      ${text}
    `
    button.classList.add('btn-loading')
  } else {
    button.innerHTML = button.dataset.originalText || 'Submit'
    button.disabled = false
    button.classList.remove('btn-loading')
  }
}

// Card entrance animation helper
export function animateCards(selector = '.card, .metric-card, .priority-card, .project-card') {
  const cards = document.querySelectorAll(selector)
  
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 80}ms`
    card.classList.add('card-enter')
    
    // Remove animation class after it completes
    setTimeout(() => {
      card.classList.remove('card-enter')
      card.style.animationDelay = ''
    }, 500 + (index * 80))
  })
}

// Initialize global touch feedback
export function initTouchFeedback() {
  window.touchFeedback = new TouchFeedback()
}

// Export singleton
export const touchFeedback = new TouchFeedback()
