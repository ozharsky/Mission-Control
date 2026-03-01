/**
 * CSS Animation Utilities
 * Performance-optimized animations with reduced motion support
 */

// Animation configuration
const ANIMATION_CONFIG = {
  defaultDuration: 300,
  defaultEasing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  reducedMotionQuery: window.matchMedia('(prefers-reduced-motion: reduce)')
}

// Check if reduced motion is preferred
function prefersReducedMotion() {
  return ANIMATION_CONFIG.reducedMotionQuery.matches
}

// Animation utilities
export const animations = {
  // Fade in element
  fadeIn(element, options = {}) {
    if (!element || prefersReducedMotion()) {
      if (element) element.style.opacity = '1'
      return Promise.resolve()
    }
    
    const { duration = ANIMATION_CONFIG.defaultDuration } = options
    
    return new Promise(resolve => {
      element.style.opacity = '0'
      element.style.transition = `opacity ${duration}ms ease`
      
      requestAnimationFrame(() => {
        element.style.opacity = '1'
        setTimeout(resolve, duration)
      })
    })
  },
  
  // Fade out element
  fadeOut(element, options = {}) {
    if (!element || prefersReducedMotion()) {
      if (element) element.style.opacity = '0'
      return Promise.resolve()
    }
    
    const { duration = ANIMATION_CONFIG.defaultDuration } = options
    
    return new Promise(resolve => {
      element.style.transition = `opacity ${duration}ms ease`
      element.style.opacity = '0'
      setTimeout(resolve, duration)
    })
  },
  
  // Slide in from direction
  slideIn(element, direction = 'up', options = {}) {
    if (!element || prefersReducedMotion()) {
      if (element) {
        element.style.transform = ''
        element.style.opacity = '1'
      }
      return Promise.resolve()
    }
    
    const { duration = ANIMATION_CONFIG.defaultDuration } = options
    const distance = options.distance || '20px'
    
    const transforms = {
      up: `translateY(${distance})`,
      down: `translateY(-${distance})`,
      left: `translateX(${distance})`,
      right: `translateX(-${distance})`
    }
    
    return new Promise(resolve => {
      element.style.opacity = '0'
      element.style.transform = transforms[direction] || transforms.up
      element.style.transition = `all ${duration}ms ${ANIMATION_CONFIG.defaultEasing}`
      
      requestAnimationFrame(() => {
        element.style.opacity = '1'
        element.style.transform = 'translate(0, 0)'
        setTimeout(() => {
          element.style.transition = ''
          resolve()
        }, duration)
      })
    })
  },
  
  // Scale animation
  scale(element, from = 0.9, to = 1, options = {}) {
    if (!element || prefersReducedMotion()) {
      if (element) element.style.transform = `scale(${to})`
      return Promise.resolve()
    }
    
    const { duration = ANIMATION_CONFIG.defaultDuration } = options
    
    return new Promise(resolve => {
      element.style.transform = `scale(${from})`
      element.style.transition = `transform ${duration}ms ${ANIMATION_CONFIG.defaultEasing}`
      
      requestAnimationFrame(() => {
        element.style.transform = `scale(${to})`
        setTimeout(() => {
          element.style.transition = ''
          resolve()
        }, duration)
      })
    })
  },
  
  // Stagger animation for multiple elements
  stagger(elements, animationFn, options = {}) {
    if (!elements || elements.length === 0) return Promise.resolve()
    
    const { delay = 50 } = options
    
    return Promise.all(
      Array.from(elements).map((el, i) => 
        new Promise(resolve => {
          setTimeout(() => {
            animationFn(el, options).then(resolve)
          }, i * delay)
        })
      )
    )
  },
  
  // Animate height auto (for collapsible sections)
  animateHeight(element, targetHeight, options = {}) {
    if (!element || prefersReducedMotion()) {
      if (element) element.style.height = typeof targetHeight === 'number' ? `${targetHeight}px` : targetHeight
      return Promise.resolve()
    }
    
    const { duration = ANIMATION_CONFIG.defaultDuration } = options
    const startHeight = element.offsetHeight
    const endHeight = targetHeight === 'auto' ? element.scrollHeight : targetHeight
    
    return new Promise(resolve => {
      element.style.height = `${startHeight}px`
      element.style.overflow = 'hidden'
      element.style.transition = `height ${duration}ms ease`
      
      requestAnimationFrame(() => {
        element.style.height = typeof endHeight === 'number' ? `${endHeight}px` : endHeight
        
        setTimeout(() => {
          if (targetHeight === 'auto') {
            element.style.height = 'auto'
          }
          element.style.overflow = ''
          element.style.transition = ''
          resolve()
        }, duration)
      })
    })
  },
  
  // Pulse animation
  pulse(element, options = {}) {
    if (!element || prefersReducedMotion()) return Promise.resolve()
    
    const { duration = 500, scale = 1.05 } = options
    
    return new Promise(resolve => {
      element.style.transition = `transform ${duration / 2}ms ease`
      element.style.transform = `scale(${scale})`
      
      setTimeout(() => {
        element.style.transform = 'scale(1)'
        setTimeout(() => {
          element.style.transition = ''
          resolve()
        }, duration / 2)
      }, duration / 2)
    })
  },
  
  // Shake animation for errors
  shake(element, options = {}) {
    if (!element || prefersReducedMotion()) return Promise.resolve()
    
    const { duration = 400, intensity = 5 } = options
    
    return new Promise(resolve => {
      const keyframes = [
        { transform: 'translateX(0)' },
        { transform: `translateX(-${intensity}px)` },
        { transform: `translateX(${intensity}px)` },
        { transform: `translateX(-${intensity}px)` },
        { transform: `translateX(${intensity}px)` },
        { transform: 'translateX(0)' }
      ]
      
      const animation = element.animate(keyframes, {
        duration,
        easing: 'ease-in-out'
      })
      
      animation.onfinish = resolve
    })
  },
  
  // Counter animation for numbers
  countUp(element, targetValue, options = {}) {
    if (!element || prefersReducedMotion()) {
      if (element) element.textContent = targetValue
      return Promise.resolve()
    }
    
    const { duration = 1000, prefix = '', suffix = '' } = options
    const startValue = parseFloat(element.textContent.replace(/[^0-9.-]/g, '')) || 0
    const startTime = performance.now()
    
    return new Promise(resolve => {
      function update(currentTime) {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Ease out cubic
        const easeProgress = 1 - Math.pow(1 - progress, 3)
        const currentValue = startValue + (targetValue - startValue) * easeProgress
        
        element.textContent = `${prefix}${Math.round(currentValue).toLocaleString()}${suffix}`
        
        if (progress < 1) {
          requestAnimationFrame(update)
        } else {
          resolve()
        }
      }
      
      requestAnimationFrame(update)
    })
  },
  
  // Add CSS class with animation
  addClass(element, className, options = {}) {
    if (!element) return Promise.resolve()
    
    const { waitForTransition = true } = options
    
    return new Promise(resolve => {
      element.classList.add(className)
      
      if (waitForTransition && !prefersReducedMotion()) {
        const duration = parseFloat(getComputedStyle(element).transitionDuration) * 1000 || 0
        setTimeout(resolve, duration)
      } else {
        resolve()
      }
    })
  },
  
  // Remove CSS class with animation
  removeClass(element, className, options = {}) {
    if (!element) return Promise.resolve()
    
    const { waitForTransition = true } = options
    
    return new Promise(resolve => {
      element.classList.remove(className)
      
      if (waitForTransition && !prefersReducedMotion()) {
        const duration = parseFloat(getComputedStyle(element).transitionDuration) * 1000 || 0
        setTimeout(resolve, duration)
      } else {
        resolve()
      }
    })
  }
}

// Export individual functions
export const {
  fadeIn,
  fadeOut,
  slideIn,
  scale,
  stagger,
  animateHeight,
  pulse,
  shake,
  countUp,
  addClass,
  removeClass
} = animations

// Default export
export default animations

// Expose globally
window.animations = animations
