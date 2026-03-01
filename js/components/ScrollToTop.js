// Scroll to Top Button - Shows when scrolling down on mobile

class ScrollToTop {
  constructor(options = {}) {
    this.threshold = options.threshold || 300
    this.showProgress = options.showProgress !== false // Default true
    this.button = null
    this.progressRing = null
    this.visible = false
    this.content = null
    this.init()
  }

  init() {
    // Only show on mobile
    if (!this.isMobile()) return
    
    this.content = document.querySelector('.content')
    if (!this.content) return
    
    this.createButton()
    if (this.showProgress) {
      this.createProgressRing()
    }
    this.bindEvents()
  }

  isMobile() {
    return window.innerWidth <= 768
  }

  createButton() {
    this.button = document.createElement('button')
    this.button.className = 'scroll-to-top'
    this.button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    `
    this.button.setAttribute('aria-label', 'Scroll to top')
    this.button.setAttribute('title', 'Scroll to top')
    this.button.style.cssText = `
      position: fixed;
      bottom: calc(80px + env(safe-area-inset-bottom, 0));
      right: 1rem;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      color: white;
      border: none;
      box-shadow: var(--shadow-lg), 0 4px 16px rgba(99, 102, 241, 0.35);
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.8);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 100;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    `
    
    // Add hover effect
    this.button.addEventListener('mouseenter', () => {
      if (this.visible) {
        this.button.style.transform = 'translateY(0) scale(1.08)'
        this.button.style.boxShadow = 'var(--shadow-lg), 0 0 24px rgba(99, 102, 241, 0.5)'
      }
    })
    
    this.button.addEventListener('mouseleave', () => {
      if (this.visible) {
        this.button.style.transform = 'translateY(0) scale(1)'
        this.button.style.boxShadow = 'var(--shadow-lg), 0 4px 16px rgba(99, 102, 241, 0.35)'
      }
    })
    
    this.button.addEventListener('click', () => this.scrollToTop())
    document.body.appendChild(this.button)
  }

  createProgressRing() {
    // Create SVG progress ring
    const svgNS = 'http://www.w3.org/2000/svg'
    this.progressRing = document.createElementNS(svgNS, 'svg')
    this.progressRing.setAttribute('width', '60')
    this.progressRing.setAttribute('height', '60')
    this.progressRing.setAttribute('viewBox', '0 0 60 60')
    this.progressRing.style.cssText = `
      position: fixed;
      bottom: calc(76px + env(safe-area-inset-bottom, 0));
      right: calc(1rem - 4px);
      width: 60px;
      height: 60px;
      transform: rotate(-90deg);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      z-index: 99;
      pointer-events: none;
      filter: drop-shadow(0 2px 4px rgba(99, 102, 241, 0.2));
    `
    
    // Background circle
    const bgCircle = document.createElementNS(svgNS, 'circle')
    bgCircle.setAttribute('cx', '30')
    bgCircle.setAttribute('cy', '30')
    bgCircle.setAttribute('r', '27')
    bgCircle.setAttribute('fill', 'none')
    bgCircle.setAttribute('stroke', 'rgba(99, 102, 241, 0.15)')
    bgCircle.setAttribute('stroke-width', '3')
    
    // Progress circle
    this.progressCircle = document.createElementNS(svgNS, 'circle')
    this.progressCircle.setAttribute('cx', '30')
    this.progressCircle.setAttribute('cy', '30')
    this.progressCircle.setAttribute('r', '27')
    this.progressCircle.setAttribute('fill', 'none')
    this.progressCircle.setAttribute('stroke', 'url(#progressGradient)')
    this.progressCircle.setAttribute('stroke-width', '3')
    this.progressCircle.setAttribute('stroke-linecap', 'round')
    this.progressCircle.setAttribute('stroke-dasharray', '169.65')
    this.progressCircle.setAttribute('stroke-dashoffset', '169.65')
    this.progressCircle.style.transition = 'stroke-dashoffset 0.15s ease-out'
    
    // Gradient definition
    const defs = document.createElementNS(svgNS, 'defs')
    const gradient = document.createElementNS(svgNS, 'linearGradient')
    gradient.setAttribute('id', 'progressGradient')
    gradient.setAttribute('x1', '0%')
    gradient.setAttribute('y1', '0%')
    gradient.setAttribute('x2', '100%')
    gradient.setAttribute('y2', '0%')
    
    const stop1 = document.createElementNS(svgNS, 'stop')
    stop1.setAttribute('offset', '0%')
    stop1.setAttribute('stop-color', 'var(--accent-primary)')
    
    const stop2 = document.createElementNS(svgNS, 'stop')
    stop2.setAttribute('offset', '100%')
    stop2.setAttribute('stop-color', 'var(--accent-secondary)')
    
    gradient.appendChild(stop1)
    gradient.appendChild(stop2)
    defs.appendChild(gradient)
    
    this.progressRing.appendChild(defs)
    this.progressRing.appendChild(bgCircle)
    this.progressRing.appendChild(this.progressCircle)
    document.body.appendChild(this.progressRing)
  }

  updateProgress() {
    if (!this.progressCircle || !this.content) return
    
    const scrollTop = this.content.scrollTop
    const scrollHeight = this.content.scrollHeight - this.content.clientHeight
    const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0
    const circumference = 2 * Math.PI * 27
    const offset = circumference - (progress * circumference)
    
    this.progressCircle.style.strokeDashoffset = offset
  }

  bindEvents() {
    if (!this.content) return
    
    // Store handler references for cleanup
    this._scrollHandler = (e) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = this.content.scrollTop
          
          if (scrollTop > this.threshold && !this.visible) {
            this.show()
          } else if (scrollTop <= this.threshold && this.visible) {
            this.hide()
          }
          
          // Update progress ring
          if (this.showProgress) {
            this.updateProgress()
          }
          
          ticking = false
        })
        ticking = true
      }
    }
    
    this._resizeHandler = () => {
      if (!this.isMobile() && this.button) {
        this.button.style.display = 'none'
        if (this.progressRing) this.progressRing.style.display = 'none'
      } else if (this.button) {
        this.button.style.display = 'flex'
        if (this.progressRing) this.progressRing.style.display = 'block'
      }
    }
    
    let ticking = false
    
    // Use passive listener for better scroll performance
    this.content.addEventListener('scroll', this._scrollHandler, { passive: true })
    
    // Handle resize
    window.addEventListener('resize', this._resizeHandler, { passive: true })
  }

  show() {
    this.visible = true
    this.button.style.opacity = '1'
    this.button.style.visibility = 'visible'
    this.button.style.transform = 'translateY(0) scale(1)'
    
    if (this.progressRing) {
      this.progressRing.style.opacity = '1'
      this.progressRing.style.visibility = 'visible'
    }
  }

  hide() {
    this.visible = false
    this.button.style.opacity = '0'
    this.button.style.visibility = 'hidden'
    this.button.style.transform = 'translateY(20px) scale(0.8)'
    
    if (this.progressRing) {
      this.progressRing.style.opacity = '0'
      this.progressRing.style.visibility = 'hidden'
    }
  }

  scrollToTop() {
    if (this.content) {
      this.content.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
    
    // Visual feedback animation
    this.button.style.transform = 'translateY(0) scale(0.9)'
    setTimeout(() => {
      if (this.visible) {
        this.button.style.transform = 'translateY(0) scale(1)'
      }
    }, 150)
  }

  destroy() {
    this.button?.remove()
    this.progressRing?.remove()
    
    // Clean up event listeners
    if (this._scrollHandler && this.content) {
      this.content.removeEventListener('scroll', this._scrollHandler)
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler)
    }
    
    this.button = null
    this.progressRing = null
    this.content = null
  }
}

export function initScrollToTop(options = {}) {
  return new ScrollToTop(options)
}

export { ScrollToTop }