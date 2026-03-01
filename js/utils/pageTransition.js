// Page Transitions - Smooth transitions between sections

export class PageTransition {
  constructor(options = {}) {
    this.duration = options.duration || 200
    this.easing = options.easing || 'ease-out'
    this.enabled = !document.documentElement.classList.contains('reduce-motion')
  }

  /**
   * Fade out an element
   * @param {HTMLElement} element
   * @returns {Promise}
   */
  fadeOut(element) {
    if (!this.enabled || !element) {
      element?.style && (element.style.display = 'none')
      return Promise.resolve()
    }

    return new Promise(resolve => {
      element.style.transition = `opacity ${this.duration}ms ${this.easing}`
      element.style.opacity = '0'
      
      setTimeout(() => {
        element.style.display = 'none'
        element.style.opacity = ''
        element.style.transition = ''
        resolve()
      }, this.duration)
    })
  }

  /**
   * Fade in an element
   * @param {HTMLElement} element
   * @returns {Promise}
   */
  fadeIn(element) {
    if (!this.enabled || !element) {
      element?.style && (element.style.display = 'block')
      return Promise.resolve()
    }

    return new Promise(resolve => {
      element.style.opacity = '0'
      element.style.display = 'block'
      
      // Force reflow
      element.offsetHeight
      
      element.style.transition = `opacity ${this.duration}ms ${this.easing}`
      element.style.opacity = '1'
      
      setTimeout(() => {
        element.style.transition = ''
        resolve()
      }, this.duration)
    })
  }

  /**
   * Crossfade between two elements
   * @param {HTMLElement} fromElement
   * @param {HTMLElement} toElement
   */
  async crossfade(fromElement, toElement) {
    await this.fadeOut(fromElement)
    await this.fadeIn(toElement)
  }

  /**
   * Slide in from right (mobile-style transition)
   * @param {HTMLElement} element
   */
  slideIn(element) {
    if (!this.enabled || !element) {
      element?.style && (element.style.display = 'block')
      return Promise.resolve()
    }

    return new Promise(resolve => {
      element.style.transform = 'translateX(20px)'
      element.style.opacity = '0'
      element.style.display = 'block'
      
      element.offsetHeight
      
      element.style.transition = `transform ${this.duration}ms ${this.easing}, opacity ${this.duration}ms ${this.easing}`
      element.style.transform = 'translateX(0)'
      element.style.opacity = '1'
      
      setTimeout(() => {
        element.style.transition = ''
        element.style.transform = ''
        resolve()
      }, this.duration)
    })
  }

  /**
   * Staggered fade in for lists
   * @param {Array<HTMLElement>} elements
   * @param {Object} options
   */
  async stagger(elements, options = {}) {
    const delay = options.delay || 50
    const initialDelay = options.initialDelay || 0

    if (!this.enabled) {
      elements.forEach(el => {
        el.style.opacity = '1'
        el.style.transform = 'none'
      })
      return Promise.resolve()
    }

    elements.forEach((el, i) => {
      el.style.opacity = '0'
      el.style.transform = 'translateY(10px)'
      
      setTimeout(() => {
        el.style.transition = `opacity ${this.duration}ms ${this.easing}, transform ${this.duration}ms ${this.easing}`
        el.style.opacity = '1'
        el.style.transform = 'translateY(0)'
        
        setTimeout(() => {
          el.style.transition = ''
        }, this.duration)
      }, initialDelay + (i * delay))
    })

    return new Promise(resolve => {
      setTimeout(resolve, initialDelay + (elements.length * delay) + this.duration)
    })
  }
}

// Singleton instance
export const pageTransition = new PageTransition()

// Expose globally
window.PageTransition = PageTransition
window.pageTransition = pageTransition
