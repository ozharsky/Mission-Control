/**
 * Mobile Interactions
 * Touch feedback, haptic feedback, pull-to-refresh, and swipe detection
 */

// Touch feedback - adds scale effect on touch
export function addTouchFeedback(element) {
  if (!element) return
  
  element.addEventListener('touchstart', () => {
    element.style.transform = 'scale(0.98)'
    element.style.transition = 'transform 0.1s'
  }, { passive: true })
  
  element.addEventListener('touchend', () => {
    element.style.transform = 'scale(1)'
  }, { passive: true })
  
  element.addEventListener('touchcancel', () => {
    element.style.transform = 'scale(1)'
  }, { passive: true })
}

// Apply touch feedback to multiple elements
export function applyTouchFeedbackToAll(selector = 'button, .m-touch, .card, .priority-card, .project-card, .mobile-priority-item') {
  const elements = document.querySelectorAll(selector)
  elements.forEach(addTouchFeedback)
  return elements.length
}

// Haptic feedback (if supported)
export function haptic(type = 'light') {
  if (navigator.vibrate) {
    navigator.vibrate(type === 'light' ? 10 : 20)
  }
}

// Haptic patterns
export function hapticPattern(pattern) {
  if (!navigator.vibrate) return
  
  const patterns = {
    success: [20, 30, 20],
    error: [30, 50, 30],
    warning: [20, 40, 20],
    complete: [10, 20, 10, 20, 10]
  }
  
  navigator.vibrate(patterns[pattern] || [10])
}

// Pull to refresh
export function initPullToRefresh(callback, options = {}) {
  const config = {
    threshold: 100,
    container: document.body,
    ...options
  }
  
  let startY = 0
  let refreshing = false
  let indicator = null
  
  // Create indicator element if it doesn't exist
  function createIndicator() {
    if (indicator) return
    indicator = document.createElement('div')
    indicator.className = 'pull-refresh-indicator'
    indicator.innerHTML = `
      <div class="pull-refresh-spinner"></div>
      <span class="pull-refresh-text">Pull to refresh</span>
    `
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: var(--bg-secondary, #f8fafc);
      transform: translateY(-100%);
      transition: transform 0.2s ease;
      z-index: 9999;
    `
    document.body.appendChild(indicator)
  }
  
  createIndicator()
  
  document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0 && !refreshing) {
      startY = e.touches[0].clientY
    }
  }, { passive: true })
  
  document.addEventListener('touchmove', (e) => {
    if (window.scrollY === 0 && !refreshing && startY > 0) {
      const y = e.touches[0].clientY
      const diff = y - startY
      
      if (diff > 0 && diff < config.threshold * 2) {
        indicator.style.transform = `translateY(${Math.min(diff - 60, 0)}px)`
        
        if (diff > config.threshold) {
          indicator.querySelector('.pull-refresh-text').textContent = 'Release to refresh'
          indicator.classList.add('ready')
        } else {
          indicator.querySelector('.pull-refresh-text').textContent = 'Pull to refresh'
          indicator.classList.remove('ready')
        }
      }
    }
  }, { passive: true })
  
  document.addEventListener('touchend', () => {
    if (refreshing) return
    
    const diff = parseFloat(indicator?.style?.transform?.replace('translateY(', '') || 0) * -1 + 60
    
    if (diff > config.threshold) {
      refreshing = true
      indicator.querySelector('.pull-refresh-text').textContent = 'Refreshing...'
      indicator.classList.add('refreshing')
      
      Promise.resolve(callback()).then(() => {
        refreshing = false
        indicator.style.transform = 'translateY(-100%)'
        indicator.classList.remove('ready', 'refreshing')
        startY = 0
      })
    } else {
      indicator.style.transform = 'translateY(-100%)'
      startY = 0
    }
  }, { passive: true })
  
  return {
    destroy() {
      indicator?.remove()
    }
  }
}

// Swipe detection
export function initSwipe(element, onSwipeLeft, onSwipeRight, options = {}) {
  if (!element) return
  
  const config = {
    threshold: 50,
    ...options
  }
  
  let startX = 0
  let startY = 0
  let isHorizontal = null
  
  element.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    isHorizontal = null
  }, { passive: true })
  
  element.addEventListener('touchmove', (e) => {
    if (startX === 0) return
    
    const diffX = e.touches[0].clientX - startX
    const diffY = e.touches[0].clientY - startY
    
    // Determine scroll direction
    if (isHorizontal === null) {
      isHorizontal = Math.abs(diffX) > Math.abs(diffY)
    }
    
    // Prevent scrolling when swiping horizontally
    if (isHorizontal && Math.abs(diffX) > 10) {
      e.preventDefault()
    }
  }, { passive: false })
  
  element.addEventListener('touchend', (e) => {
    if (startX === 0 || !isHorizontal) return
    
    const endX = e.changedTouches[0].clientX
    const diff = startX - endX
    
    if (Math.abs(diff) > config.threshold) {
      if (diff > 0) {
        onSwipeLeft?.(e)
        haptic('light')
      } else {
        onSwipeRight?.(e)
        haptic('light')
      }
    }
    
    startX = 0
    startY = 0
    isHorizontal = null
  }, { passive: true })
}

// Swipe to complete (for priorities)
export function initSwipeToComplete(element, onComplete) {
  initSwipe(
    element,
    () => onComplete?.(), // Swipe left to complete
    null,
    { threshold: 80 }
  )
  
  // Visual feedback for swipe
  element.addEventListener('touchmove', (e) => {
    const diffX = e.touches[0].clientX - (element.dataset.startX || 0)
    if (diffX < -30) {
      element.style.transform = `translateX(${diffX}px)`
      element.style.opacity = 1 - Math.abs(diffX) / 300
    }
  }, { passive: true })
  
  element.addEventListener('touchend', () => {
    element.style.transform = ''
    element.style.opacity = ''
  }, { passive: true })
}

// Swipe actions with reveal
export function initSwipeActions(element, actions) {
  if (!element) return
  
  let startX = 0
  let currentX = 0
  let isSwiping = false
  const threshold = 80
  
  // Create action buttons container
  const actionsContainer = document.createElement('div')
  actionsContainer.className = 'swipe-actions-container'
  actionsContainer.style.cssText = `
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1rem;
    background: var(--accent-success, #10b981);
    transform: translateX(100%);
    transition: transform 0.2s ease;
  `
  
  actions.forEach(action => {
    const btn = document.createElement('button')
    btn.className = `swipe-action-btn ${action.variant || 'primary'}`
    btn.innerHTML = action.icon || action.label
    btn.onclick = (e) => {
      e.stopPropagation()
      action.onClick()
      element.style.transform = ''
      actionsContainer.style.transform = 'translateX(100%)'
    }
    actionsContainer.appendChild(btn)
  })
  
  // Wrap element
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position: relative; overflow: hidden;'
  element.parentNode.insertBefore(wrapper, element)
  wrapper.appendChild(actionsContainer)
  wrapper.appendChild(element)
  
  element.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX
    isSwiping = true
    element.style.transition = 'none'
  }, { passive: true })
  
  element.addEventListener('touchmove', (e) => {
    if (!isSwiping) return
    currentX = e.touches[0].clientX
    const diff = currentX - startX
    
    if (diff < -20) {
      element.style.transform = `translateX(${diff}px)`
      actionsContainer.style.transform = `translateX(${Math.max(0, 100 + diff)}%)`
    }
  }, { passive: true })
  
  element.addEventListener('touchend', () => {
    isSwiping = false
    element.style.transition = 'transform 0.2s ease'
    const diff = currentX - startX
    
    if (diff < -threshold) {
      element.style.transform = `translateX(-${threshold}px)`
      actionsContainer.style.transform = 'translateX(0)'
      haptic('light')
    } else {
      element.style.transform = ''
      actionsContainer.style.transform = 'translateX(100%)'
    }
  }, { passive: true })
}

// Long press detection
export function initLongPress(element, callback, duration = 500) {
  if (!element) return
  
  let timer = null
  let isPressed = false
  
  const start = (e) => {
    isPressed = true
    timer = setTimeout(() => {
      if (isPressed) {
        callback(e)
        haptic('medium')
      }
    }, duration)
  }
  
  const end = () => {
    isPressed = false
    clearTimeout(timer)
  }
  
  element.addEventListener('touchstart', start, { passive: true })
  element.addEventListener('touchend', end, { passive: true })
  element.addEventListener('touchcancel', end, { passive: true })
  element.addEventListener('touchmove', end, { passive: true })
}

// Double tap detection
export function initDoubleTap(element, callback, maxDelay = 300) {
  if (!element) return
  
  let lastTap = 0
  
  element.addEventListener('touchend', (e) => {
    const now = Date.now()
    if (now - lastTap < maxDelay) {
      callback(e)
      haptic('light')
    }
    lastTap = now
  }, { passive: true })
}

// Initialize all mobile interactions
export function initMobileInteractions() {
  // Apply touch feedback to all interactive elements
  applyTouchFeedbackToAll()
  
  // Add haptic feedback to buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, .btn, [role="button"]')
    if (btn) {
      haptic('light')
    }
  })
  
  console.log('Mobile interactions initialized')
}
