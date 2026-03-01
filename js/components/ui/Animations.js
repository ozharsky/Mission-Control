/**
 * Animation Polish - Unified Animation System
 * Page transitions, loading states, and micro-interactions
 */

export class AnimationController {
  constructor(options = {}) {
    this.options = {
      duration: 250,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      staggerDelay: 50,
      reducedMotion: document.documentElement.classList.contains('reduce-motion'),
      ...options
    }
    
    this.activeTransitions = new Map()
    this.init()
  }
  
  init() {
    this.addGlobalStyles()
  }
  
  /**
   * Page transition - slide and fade
   */
  async transition(fromEl, toEl, type = 'slide') {
    if (this.options.reducedMotion) {
      if (fromEl) fromEl.style.display = 'none'
      if (toEl) toEl.style.display = 'block'
      return Promise.resolve()
    }
    
    const transitionId = `transition-${Date.now()}`
    this.activeTransitions.set(transitionId, true)
    
    // Hide from element with animation
    if (fromEl && fromEl.style.display !== 'none') {
      await this.animateOut(fromEl, type)
      fromEl.style.display = 'none'
    }
    
    // Show to element with animation
    if (toEl) {
      toEl.style.display = 'block'
      await this.animateIn(toEl, type)
    }
    
    this.activeTransitions.delete(transitionId)
  }
  
  /**
   * Animate element in
   */
  animateIn(element, type = 'fade') {
    return new Promise(resolve => {
      if (!element || this.options.reducedMotion) {
        resolve()
        return
      }
      
      const animations = {
        fade: [
          { opacity: 0 },
          { opacity: 1 }
        ],
        slide: [
          { opacity: 0, transform: 'translateX(20px)' },
          { opacity: 1, transform: 'translateX(0)' }
        ],
        slideUp: [
          { opacity: 0, transform: 'translateY(20px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ],
        scale: [
          { opacity: 0, transform: 'scale(0.95)' },
          { opacity: 1, transform: 'scale(1)' }
        ]
      }
      
      const keyframes = animations[type] || animations.fade
      
      const animation = element.animate(keyframes, {
        duration: this.options.duration,
        easing: this.options.easing,
        fill: 'forwards'
      })
      
      animation.onfinish = resolve
    })
  }
  
  /**
   * Animate element out
   */
  animateOut(element, type = 'fade') {
    return new Promise(resolve => {
      if (!element || this.options.reducedMotion) {
        resolve()
        return
      }
      
      const animations = {
        fade: [
          { opacity: 1 },
          { opacity: 0 }
        ],
        slide: [
          { opacity: 1, transform: 'translateX(0)' },
          { opacity: 0, transform: 'translateX(-20px)' }
        ],
        slideUp: [
          { opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-20px)' }
        ],
        scale: [
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(0.95)' }
        ]
      }
      
      const keyframes = animations[type] || animations.fade
      
      const animation = element.animate(keyframes, {
        duration: this.options.duration,
        easing: this.options.easing,
        fill: 'forwards'
      })
      
      animation.onfinish = resolve
    })
  }
  
  /**
   * Staggered animation for lists
   */
  stagger(elements, type = 'slideUp', options = {}) {
    if (this.options.reducedMotion) {
      elements.forEach(el => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
      return Promise.resolve()
    }
    
    const delay = options.delay || this.options.staggerDelay
    const initialDelay = options.initialDelay || 0
    
    return Promise.all(elements.map((el, i) => {
      return new Promise(resolve => {
        setTimeout(() => {
          this.animateIn(el, type).then(resolve)
        }, initialDelay + (i * delay))
      })
    }))
  }
  
  /**
   * Show loading state on element
   */
  showLoading(element, options = {}) {
    if (!element) return { hide: () => {} }
    
    const config = {
      type: 'spinner',
      text: 'Loading...',
      overlay: false,
      ...options
    }
    
    const loaderId = `loader-${Date.now()}`
    
    // Create loader element
    const loader = document.createElement('div')
    loader.className = `m-loading m-loading-${config.type}`
    loader.id = loaderId
    loader.innerHTML = this.getLoaderHTML(config)
    
    if (config.overlay) {
      loader.classList.add('m-loading-overlay')
      element.style.position = 'relative'
    }
    
    element.appendChild(loader)
    
    // Trigger animation
    requestAnimationFrame(() => {
      loader.classList.add('m-loading-active')
    })
    
    return {
      id: loaderId,
      updateText: (text) => {
        const textEl = loader.querySelector('.m-loading-text')
        if (textEl) textEl.textContent = text
      },
      updateProgress: (percent) => {
        const progressEl = loader.querySelector('.m-loading-progress-bar')
        if (progressEl) progressEl.style.width = `${percent}%`
      },
      hide: () => this.hideLoading(loaderId)
    }
  }
  
  /**
   * Hide loading state
   */
  hideLoading(loaderId) {
    const loader = document.getElementById(loaderId)
    if (!loader) return
    
    loader.classList.remove('m-loading-active')
    loader.classList.add('m-loading-hiding')
    
    setTimeout(() => {
      loader.remove()
    }, 300)
  }
  
  /**
   * Get loader HTML based on type
   */
  getLoaderHTML(config) {
    const loaders = {
      spinner: `
        <div class="m-loading-content">
          <div class="m-loading-spinner">
            <svg viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                <animate attributeName="stroke-dasharray" values="1,150;90,150;90,150" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" values="0;-35;-124" dur="1.5s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          ${config.text ? `<span class="m-loading-text">${config.text}</span>` : ''}
        </div>
      `,
      dots: `
        <div class="m-loading-content">
          <div class="m-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          ${config.text ? `<span class="m-loading-text">${config.text}</span>` : ''}
        </div>
      `,
      pulse: `
        <div class="m-loading-content">
          <div class="m-loading-pulse"></div>
          ${config.text ? `<span class="m-loading-text">${config.text}</span>` : ''}
        </div>
      `,
      progress: `
        <div class="m-loading-content">
          <div class="m-loading-spinner">
            <svg viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/>
                <animate attributeName="stroke-dasharray" values="1,150;90,150;90,150" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" values="0;-35;-124" dur="1.5s" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          ${config.text ? `<span class="m-loading-text">${config.text}</span>` : ''}
          <div class="m-loading-progress">
            <div class="m-loading-progress-bar" style="width: 0%"></div>
          </div>
        </div>
      `
    }
    
    return loaders[config.type] || loaders.spinner
  }
  
  /**
   * Micro-interaction: success pulse
   */
  pulseSuccess(element) {
    if (!element || this.options.reducedMotion) return
    
    element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ], {
      duration: 300,
      easing: 'ease-out'
    })
    
    element.classList.add('m-pulse-success')
    setTimeout(() => element.classList.remove('m-pulse-success'), 300)
  }
  
  /**
   * Micro-interaction: error shake
   */
  shakeError(element) {
    if (!element || this.options.reducedMotion) return
    
    element.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' }
    ], {
      duration: 400,
      easing: 'ease-in-out'
    })
    
    element.classList.add('m-shake-error')
    setTimeout(() => element.classList.remove('m-shake-error'), 400)
  }
  
  /**
   * Add global animation styles
   */
  addGlobalStyles() {
    if (document.getElementById('m-animation-styles')) return
    
    const styles = document.createElement('style')
    styles.id = 'm-animation-styles'
    styles.textContent = `
      /* ========================================
         ANIMATION CONTROLLER STYLES
         ======================================== */
      
      /* Loading Container */
      .m-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .m-loading-active {
        opacity: 1;
      }
      
      .m-loading-hiding {
        opacity: 0;
      }
      
      /* Loading Overlay */
      .m-loading-overlay {
        position: absolute;
        inset: 0;
        background: rgba(10, 10, 15, 0.85);
        backdrop-filter: blur(4px);
        z-index: 100;
        border-radius: inherit;
      }
      
      .m-loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 1.5rem;
      }
      
      /* Spinner */
      .m-loading-spinner {
        width: 40px;
        height: 40px;
        color: var(--accent-primary);
      }
      
      .m-loading-spinner svg {
        width: 100%;
        height: 100%;
        animation: m-loading-rotate 1s linear infinite;
      }
      
      @keyframes m-loading-rotate {
        to { transform: rotate(360deg); }
      }
      
      /* Dots */
      .m-loading-dots {
        display: flex;
        gap: 6px;
      }
      
      .m-loading-dots span {
        width: 10px;
        height: 10px;
        background: var(--accent-primary);
        border-radius: 50%;
        animation: m-loading-dots 1.4s ease-in-out infinite both;
      }
      
      .m-loading-dots span:nth-child(1) { animation-delay: -0.32s; }
      .m-loading-dots span:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes m-loading-dots {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      
      /* Pulse */
      .m-loading-pulse {
        width: 48px;
        height: 48px;
        border: 3px solid var(--accent-primary);
        border-radius: 50%;
        animation: m-loading-pulse 1.5s ease-out infinite;
      }
      
      @keyframes m-loading-pulse {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      
      /* Loading Text */
      .m-loading-text {
        font-size: 0.875rem;
        color: var(--text-secondary);
        text-align: center;
      }
      
      /* Progress Bar */
      .m-loading-progress {
        width: 160px;
        height: 4px;
        background: var(--bg-tertiary);
        border-radius: 2px;
        overflow: hidden;
      }
      
      .m-loading-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
        border-radius: 2px;
        transition: width 0.3s ease;
      }
      
      /* Success/Error States */
      .m-pulse-success {
        animation: m-pulse-success-anim 0.3s ease-out;
      }
      
      @keyframes m-pulse-success-anim {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      .m-shake-error {
        animation: m-shake-error-anim 0.4s ease-in-out;
      }
      
      @keyframes m-shake-error-anim {
        0%, 100% { transform: translateX(0); }
        20%, 60% { transform: translateX(-5px); }
        40%, 80% { transform: translateX(5px); }
      }
      
      /* Page Transition Classes */
      .m-page-transition-enter {
        animation: m-page-enter 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      
      .m-page-transition-exit {
        animation: m-page-exit 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      
      @keyframes m-page-enter {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      @keyframes m-page-exit {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(-20px);
        }
      }
      
      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .m-loading,
        .m-loading-spinner svg,
        .m-loading-dots span,
        .m-loading-pulse,
        .m-page-transition-enter,
        .m-page-transition-exit {
          animation: none !important;
          transition: none !important;
        }
      }
      
      /* Mobile Optimizations */
      @media (max-width: 768px) {
        .m-loading-spinner {
          width: 36px;
          height: 36px;
        }
        
        .m-loading-dots span {
          width: 8px;
          height: 8px;
        }
        
        .m-loading-pulse {
          width: 40px;
          height: 40px;
        }
        
        .m-loading-text {
          font-size: 0.8125rem;
        }
      }
    `
    
    document.head.appendChild(styles)
  }
}

// Create singleton
export const animationController = new AnimationController()

// Expose globally
window.AnimationController = AnimationController
window.animationController = animationController

export default animationController
