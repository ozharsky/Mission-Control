// Swipe Actions
// Mobile swipe gestures for cards

class SwipeActions {
  constructor(element, options = {}) {
    this.element = element
    this.options = {
      threshold: 80,
      maxSwipe: 150,
      leftActions: options.leftActions || [],
      rightActions: options.rightActions || [],
      onSwipeStart: options.onSwipeStart || null,
      onSwipeEnd: options.onSwipeEnd || null,
      ...options
    }
    
    this.startX = 0
    this.currentX = 0
    this.isSwiping = false
    this.revealedSide = null
    
    this.init()
  }
  
  init() {
    // Create action containers
    this.leftContainer = this.createActionContainer('left')
    this.rightContainer = this.createActionContainer('right')
    
    // Wrap element
    this.wrapper = document.createElement('div')
    this.wrapper.className = 'swipe-wrapper'
    this.element.parentNode.insertBefore(this.wrapper, this.element)
    this.wrapper.appendChild(this.leftContainer)
    this.wrapper.appendChild(this.element)
    this.wrapper.appendChild(this.rightContainer)
    
    // Bind events
    this.element.addEventListener('touchstart', this.handleStart.bind(this), { passive: true })
    this.element.addEventListener('touchmove', this.handleMove.bind(this), { passive: false })
    this.element.addEventListener('touchend', this.handleEnd.bind(this))
    
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.wrapper.contains(e.target)) {
        this.close()
      }
    })
  }
  
  createActionContainer(side) {
    const container = document.createElement('div')
    container.className = `swipe-actions swipe-actions-${side}`
    
    const actions = side === 'left' ? this.options.leftActions : this.options.rightActions
    
    actions.forEach(action => {
      const btn = document.createElement('button')
      btn.className = `swipe-action-btn ${action.variant || 'secondary'}`
      btn.innerHTML = `${action.icon || ''} ${action.label || ''}`
      btn.onclick = (e) => {
        e.stopPropagation()
        action.onClick()
        this.close()
      }
      container.appendChild(btn)
    })
    
    return container
  }
  
  handleStart(e) {
    if (this.revealedSide) {
      this.close()
      return
    }
    
    this.startX = e.touches[0].clientX
    this.isSwiping = true
    this.element.style.transition = 'none'
    
    if (this.options.onSwipeStart) {
      this.options.onSwipeStart()
    }
  }
  
  handleMove(e) {
    if (!this.isSwiping) return
    
    this.currentX = e.touches[0].clientX
    const diff = this.currentX - this.startX
    
    // Determine direction
    const isRightSwipe = diff > 0
    const hasLeftActions = this.options.leftActions.length > 0
    const hasRightActions = this.options.rightActions.length > 0
    
    // Only allow swipe if actions exist in that direction
    if ((isRightSwipe && !hasLeftActions) || (!isRightSwipe && !hasRightActions)) {
      return
    }
    
    // Prevent scrolling while swiping
    if (Math.abs(diff) > 10) {
      e.preventDefault()
    }
    
    // Apply transform
    const translateX = Math.max(-this.options.maxSwipe, Math.min(this.options.maxSwipe, diff))
    this.element.style.transform = `translateX(${translateX}px)`
    
    // Show actions
    if (translateX > this.options.threshold) {
      this.leftContainer.style.opacity = Math.min((translateX - this.options.threshold) / 50, 1)
    } else if (translateX < -this.options.threshold) {
      this.rightContainer.style.opacity = Math.min((-translateX - this.options.threshold) / 50, 1)
    }
  }
  
  handleEnd() {
    if (!this.isSwiping) return
    
    this.isSwiping = false
    this.element.style.transition = 'transform 0.3s ease'
    
    const diff = this.currentX - this.startX
    
    if (diff > this.options.threshold && this.options.leftActions.length > 0) {
      // Reveal left actions
      this.element.style.transform = `translateX(${this.options.threshold}px)`
      this.revealedSide = 'left'
      this.leftContainer.style.opacity = '1'
    } else if (diff < -this.options.threshold && this.options.rightActions.length > 0) {
      // Reveal right actions
      this.element.style.transform = `translateX(-${this.options.threshold}px)`
      this.revealedSide = 'right'
      this.rightContainer.style.opacity = '1'
    } else {
      this.close()
    }
    
    if (this.options.onSwipeEnd) {
      this.options.onSwipeEnd(this.revealedSide)
    }
  }
  
  close() {
    this.element.style.transform = 'translateX(0)'
    this.leftContainer.style.opacity = '0'
    this.rightContainer.style.opacity = '0'
    this.revealedSide = null
  }
  
  destroy() {
    this.wrapper.replaceWith(this.element)
  }
}

// Initialize swipe on elements
export function initSwipeActions(selector, options) {
  const elements = document.querySelectorAll(selector)
  elements.forEach(el => new SwipeActions(el, options))
}

// Common action presets
export const swipePresets = {
  priority: {
    rightActions: [
      { icon: '✓', label: 'Done', variant: 'success', onClick: () => {} },
      { icon: '📌', label: 'Pin', variant: 'primary', onClick: () => {} }
    ],
    leftActions: [
      { icon: '🗑️', label: 'Delete', variant: 'danger', onClick: () => {} }
    ]
  },
  
  project: {
    rightActions: [
      { icon: '▶️', label: 'Start', variant: 'primary', onClick: () => {} },
      { icon: '✓', label: 'Done', variant: 'success', onClick: () => {} }
    ],
    leftActions: [
      { icon: '🗑️', label: 'Delete', variant: 'danger', onClick: () => {} }
    ]
  },
  
  lead: {
    rightActions: [
      { icon: '✉️', label: 'Email', variant: 'primary', onClick: () => {} },
      { icon: '✓', label: 'Qualify', variant: 'success', onClick: () => {} }
    ],
    leftActions: [
      { icon: '🗑️', label: 'Delete', variant: 'danger', onClick: () => {} }
    ]
  }
}

export default SwipeActions
