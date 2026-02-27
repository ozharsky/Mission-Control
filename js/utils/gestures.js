// Mobile gesture support

export class GestureManager {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      threshold: 50,
      timeout: 300,
      ...options
    }
    
    this.startX = 0
    this.startY = 0
    this.startTime = 0
    this.isTracking = false
    
    this.bindEvents()
  }
  
  bindEvents() {
    // Touch events
    this.element.addEventListener('touchstart', this.handleStart.bind(this), { passive: true })
    this.element.addEventListener('touchmove', this.handleMove.bind(this), { passive: true })
    this.element.addEventListener('touchend', this.handleEnd.bind(this))
    this.element.addEventListener('touchcancel', this.handleCancel.bind(this))
    
    // Mouse events (for desktop testing)
    this.element.addEventListener('mousedown', this.handleMouseStart.bind(this))
  }
  
  handleStart(e) {
    const touch = e.touches[0]
    this.startX = touch.clientX
    this.startY = touch.clientY
    this.startTime = Date.now()
    this.isTracking = true
    
    this.options.onStart?.(e)
  }
  
  handleMouseStart(e) {
    this.startX = e.clientX
    this.startY = e.clientY
    this.startTime = Date.now()
    this.isTracking = true
    
    const handleMouseMove = (e) => this.handleMove({ 
      touches: [{ clientX: e.clientX, clientY: e.clientY }],
      preventDefault: () => {}
    })
    
    const handleMouseUp = (e) => {
      this.handleEnd({
        changedTouches: [{ clientX: e.clientX, clientY: e.clientY }]
      })
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }
  
  handleMove(e) {
    if (!this.isTracking) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - this.startX
    const deltaY = touch.clientY - this.startY
    
    this.options.onMove?.(deltaX, deltaY, e)
  }
  
  handleEnd(e) {
    if (!this.isTracking) return
    
    this.isTracking = false
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - this.startX
    const deltaY = touch.clientY - this.startY
    const deltaTime = Date.now() - this.startTime
    
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    
    // Determine swipe direction
    if (absX > absY && absX > this.options.threshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.options.onSwipeRight?.()
      } else {
        this.options.onSwipeLeft?.()
      }
    } else if (absY > absX && absY > this.options.threshold) {
      // Vertical swipe
      if (deltaY > 0) {
        this.options.onSwipeDown?.()
      } else {
        this.options.onSwipeUp?.()
      }
    } else if (deltaTime < this.options.timeout && absX < 10 && absY < 10) {
      // Tap
      this.options.onTap?.()
    }
    
    this.options.onEnd?.(deltaX, deltaY, e)
  }
  
  handleCancel(e) {
    this.isTracking = false
    this.options.onCancel?.(e)
  }
  
  destroy() {
    // Cleanup if needed
  }
}

/**
 * Add pull-to-refresh functionality
 */
export function addPullToRefresh(element, onRefresh) {
  let startY = 0
  let isPulling = false
  
  element.addEventListener('touchstart', (e) => {
    if (element.scrollTop === 0) {
      startY = e.touches[0].clientY
      isPulling = true
    }
  }, { passive: true })
  
  element.addEventListener('touchmove', (e) => {
    if (!isPulling) return
    
    const deltaY = e.touches[0].clientY - startY
    
    if (deltaY > 0 && element.scrollTop === 0) {
      // Show pull indicator
      if (deltaY > 100) {
        element.style.transform = `translateY(${Math.min(deltaY * 0.3, 80)}px)`
      }
    }
  }, { passive: true })
  
  element.addEventListener('touchend', () => {
    if (!isPulling) return
    
    const transform = element.style.transform
    const pulled = parseInt(transform?.match(/translateY\((\d+)px\)/)?.[1] || 0)
    
    if (pulled > 60) {
      onRefresh?.()
    }
    
    element.style.transition = 'transform 0.3s'
    element.style.transform = ''
    
    setTimeout(() => {
      element.style.transition = ''
    }, 300)
    
    isPulling = false
  })
}

/**
 * Add swipe to dismiss
 */
export function addSwipeToDismiss(element, onDismiss, direction = 'left') {
  let startX = 0
  let currentX = 0
  
  element.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX
    element.style.transition = ''
  }, { passive: true })
  
  element.addEventListener('touchmove', (e) => {
    currentX = e.touches[0].clientX - startX
    
    if (direction === 'left' && currentX < 0) {
      element.style.transform = `translateX(${currentX}px)`
    } else if (direction === 'right' && currentX > 0) {
      element.style.transform = `translateX(${currentX}px)`
    }
  }, { passive: true })
  
  element.addEventListener('touchend', () => {
    const threshold = element.offsetWidth * 0.4
    
    if (Math.abs(currentX) > threshold) {
      // Dismiss
      element.style.transition = 'transform 0.3s, opacity 0.3s'
      element.style.transform = `translateX(${direction === 'left' ? '-100%' : '100%'})`
      element.style.opacity = '0'
      
      setTimeout(() => {
        onDismiss?.()
        element.remove()
      }, 300)
    } else {
      // Snap back
      element.style.transition = 'transform 0.3s'
      element.style.transform = ''
    }
    
    currentX = 0
  })
}

// Expose globally
window.GestureManager = GestureManager
window.addPullToRefresh = addPullToRefresh
window.addSwipeToDismiss = addSwipeToDismiss
