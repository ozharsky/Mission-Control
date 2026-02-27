// Scroll to Top Button - Shows when scrolling down on mobile

class ScrollToTop {
  constructor(options = {}) {
    this.threshold = options.threshold || 300
    this.button = null
    this.visible = false
    this.init()
  }

  init() {
    // Only show on mobile
    if (!this.isMobile()) return
    
    this.createButton()
    this.bindEvents()
  }

  isMobile() {
    return window.innerWidth <= 768
  }

  createButton() {
    this.button = document.createElement('button')
    this.button.className = 'scroll-to-top'
    this.button.innerHTML = '↑'
    this.button.setAttribute('aria-label', 'Scroll to top')
    this.button.style.cssText = `
      position: fixed;
      bottom: calc(80px + env(safe-area-inset-bottom, 0));
      right: 1rem;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: white;
      border: none;
      box-shadow: var(--shadow-lg);
      font-size: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px) scale(0.8);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 100;
      cursor: pointer;
    `
    
    this.button.addEventListener('click', () => this.scrollToTop())
    document.body.appendChild(this.button)
  }

  bindEvents() {
    const content = document.querySelector('.content')
    if (!content) return
    
    content.addEventListener('scroll', () => {
      const scrollTop = content.scrollTop
      
      if (scrollTop > this.threshold && !this.visible) {
        this.show()
      } else if (scrollTop <= this.threshold && this.visible) {
        this.hide()
      }
    }, { passive: true })
  }

  show() {
    this.visible = true
    this.button.style.opacity = '1'
    this.button.style.visibility = 'visible'
    this.button.style.transform = 'translateY(0) scale(1)'
  }

  hide() {
    this.visible = false
    this.button.style.opacity = '0'
    this.button.style.visibility = 'hidden'
    this.button.style.transform = 'translateY(20px) scale(0.8)'
  }

  scrollToTop() {
    const content = document.querySelector('.content')
    if (content) {
      content.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }

  destroy() {
    this.button?.remove()
  }
}

export function initScrollToTop() {
  return new ScrollToTop()
}

export { ScrollToTop }