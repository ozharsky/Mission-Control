/**
 * UI Polish & Interactions Utility
 * Enhanced micro-interactions and animations for Mission Control V5
 */

// ========================================
// RIPPLE EFFECT FOR BUTTONS
// ========================================

export function initRippleEffect() {
  document.addEventListener('click', (e) => {
    const button = e.target.closest('.btn-ripple-enhanced, .btn-ripple, .touch-ripple')
    if (!button) return
    
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2
    
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.35);
      transform: scale(0);
      animation: rippleEffect 0.6s ease-out;
      pointer-events: none;
    `
    
    button.appendChild(ripple)
    
    setTimeout(() => ripple.remove(), 600)
  })
}

// ========================================
// MAGNETIC BUTTON EFFECT
// ========================================

export function initMagneticButtons() {
  const magneticButtons = document.querySelectorAll('.btn-magnetic')
  
  magneticButtons.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`
    })
    
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = ''
    })
  })
}

// ========================================
// SCROLL-TRIGGERED ANIMATIONS
// ========================================

export function initScrollAnimations() {
  const animatedElements = document.querySelectorAll(
    '.fade-in-scroll, .scale-in-scroll, .slide-left-scroll, .slide-right-scroll, .reveal'
  )
  
  if (!animatedElements.length) return
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible')
        observer.unobserve(entry.target)
      }
    })
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  })
  
  animatedElements.forEach(el => observer.observe(el))
}

// ========================================
// STAGGER ANIMATIONS FOR LISTS
// ========================================

export function initStaggerAnimations() {
  const staggerContainers = document.querySelectorAll('.stagger-list, .stagger-children, .stagger-animate, .stagger-reveal')
  
  staggerContainers.forEach(container => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })
    
    observer.observe(container)
  })
}

// ========================================
// TOUCH FEEDBACK FOR MOBILE
// ========================================

export function initTouchFeedback() {
  // Skip on non-touch devices
  if (window.matchMedia('(hover: hover)').matches) return
  
  document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0]
    const element = e.target.closest('.touch-feedback, .card-touch, .btn-touch')
    
    if (element) {
      const rect = element.getBoundingClientRect()
      const x = ((touch.clientX - rect.left) / rect.width) * 100
      const y = ((touch.clientY - rect.top) / rect.height) * 100
      
      element.style.setProperty('--touch-x', `${x}%`)
      element.style.setProperty('--touch-y', `${y}%`)
    }
  }, { passive: true })
}

// ========================================
// PULL TO REFRESH
// ========================================

export function initPullToRefresh(callback) {
  let startY = 0
  let currentY = 0
  let isPulling = false
  const threshold = 80
  
  const container = document.querySelector('.content') || document.body
  
  container.addEventListener('touchstart', (e) => {
    if (container.scrollTop === 0) {
      startY = e.touches[0].clientY
      isPulling = true
    }
  }, { passive: true })
  
  container.addEventListener('touchmove', (e) => {
    if (!isPulling) return
    
    currentY = e.touches[0].clientY
    const diff = currentY - startY
    
    if (diff > 0 && diff < threshold * 2) {
      container.style.transform = `translateY(${diff * 0.4}px)`
      
      // Update pull indicator if exists
      const indicator = document.querySelector('.pull-indicator')
      if (indicator) {
        indicator.classList.toggle('pulling', diff < threshold)
        indicator.classList.toggle('ready', diff >= threshold)
      }
    }
  }, { passive: true })
  
  container.addEventListener('touchend', () => {
    if (!isPulling) return
    
    const diff = currentY - startY
    
    container.style.transition = 'transform 0.3s ease'
    
    if (diff >= threshold && callback) {
      container.style.transform = `translateY(${threshold * 0.5}px)`
      
      const indicator = document.querySelector('.pull-indicator')
      if (indicator) indicator.classList.add('refreshing')
      
      callback().then(() => {
        container.style.transform = ''
        if (indicator) indicator.classList.remove('refreshing', 'ready', 'pulling')
      })
    } else {
      container.style.transform = ''
    }
    
    setTimeout(() => {
      container.style.transition = ''
      isPulling = false
    }, 300)
  })
}

// ========================================
// SWIPEABLE CARDS
// ========================================

export function initSwipeableCards(options = {}) {
  const { onSwipeLeft, onSwipeRight, threshold = 100 } = options
  
  const cards = document.querySelectorAll('.card-swipeable')
  
  cards.forEach(card => {
    let startX = 0
    let currentX = 0
    let isSwiping = false
    
    card.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX
      isSwiping = true
      card.classList.add('swiping')
    }, { passive: true })
    
    card.addEventListener('touchmove', (e) => {
      if (!isSwiping) return
      
      currentX = e.touches[0].clientX
      const diff = currentX - startX
      
      // Limit swipe distance
      const limitedDiff = Math.max(-threshold * 1.5, Math.min(threshold * 1.5, diff))
      card.style.transform = `translateX(${limitedDiff}px)`
      
      // Visual feedback
      const opacity = 1 - Math.abs(diff) / (threshold * 2)
      card.style.opacity = Math.max(0.5, opacity)
    }, { passive: true })
    
    card.addEventListener('touchend', () => {
      if (!isSwiping) return
      
      const diff = currentX - startX
      
      card.style.transition = 'transform 0.3s ease, opacity 0.3s ease'
      
      if (diff > threshold && onSwipeRight) {
        card.style.transform = `translateX(${threshold * 2}px)`
        card.style.opacity = '0'
        setTimeout(() => onSwipeRight(card), 300)
      } else if (diff < -threshold && onSwipeLeft) {
        card.style.transform = `translateX(-${threshold * 2}px)`
        card.style.opacity = '0'
        setTimeout(() => onSwipeLeft(card), 300)
      } else {
        card.style.transform = ''
        card.style.opacity = ''
      }
      
      setTimeout(() => {
        card.style.transition = ''
        card.classList.remove('swiping')
        isSwiping = false
      }, 300)
    })
  })
}

// ========================================
// SCROLL TO TOP BUTTON
// ========================================

export function initScrollToTop() {
  const content = document.querySelector('.content') || document.body
  
  // Create scroll to top button if it doesn't exist
  let scrollBtn = document.querySelector('.scroll-to-top')
  
  if (!scrollBtn) {
    scrollBtn = document.createElement('button')
    scrollBtn.className = 'scroll-to-top m-touch'
    scrollBtn.innerHTML = '<i data-lucide="chevron-up" style="width: 20px; height: 20px;"></i>'
    scrollBtn.setAttribute('aria-label', 'Scroll to top')
    scrollBtn.style.cssText = `
      position: fixed;
      bottom: calc(90px + env(safe-area-inset-bottom, 0));
      right: 1rem;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--accent-primary);
      color: white;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: var(--shadow-lg);
      z-index: 100;
    `
    document.body.appendChild(scrollBtn)
  }
  
  let ticking = false
  
  content.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const show = content.scrollTop > 300
        scrollBtn.style.opacity = show ? '1' : '0'
        scrollBtn.style.visibility = show ? 'visible' : 'hidden'
        scrollBtn.style.transform = show ? 'translateY(0)' : 'translateY(20px)'
        ticking = false
      })
      ticking = true
    }
  }, { passive: true })
  
  scrollBtn.addEventListener('click', () => {
    content.scrollTo({ top: 0, behavior: 'smooth' })
  })
}

// ========================================
// INPUT ENHANCEMENTS
// ========================================

export function initInputEnhancements() {
  // Auto-resize textareas
  const textareas = document.querySelectorAll('textarea[data-auto-resize]')
  
  textareas.forEach(textarea => {
    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    })
  })
  
  // Character counter
  const inputsWithCounter = document.querySelectorAll('[data-max-length]')
  
  inputsWithCounter.forEach(input => {
    const maxLength = parseInt(input.dataset.maxLength)
    const counter = document.createElement('div')
    counter.className = 'form-counter'
    input.parentNode.appendChild(counter)
    
    const updateCounter = () => {
      const remaining = maxLength - input.value.length
      counter.textContent = `${remaining}`
      counter.classList.toggle('warning', remaining < maxLength * 0.1)
      counter.classList.toggle('error', remaining < 0)
    }
    
    input.addEventListener('input', updateCounter)
    updateCounter()
  })
}

// ========================================
// FOCUS MANAGEMENT
// ========================================

export function initFocusManagement() {
  // Skip link for keyboard navigation
  const skipLink = document.createElement('a')
  skipLink.href = '#mainContent'
  skipLink.className = 'skip-link'
  skipLink.textContent = 'Skip to main content'
  document.body.insertBefore(skipLink, document.body.firstChild)
  
  // Add ID to main content if not present
  const mainContent = document.getElementById('mainContent')
  if (mainContent && !mainContent.hasAttribute('tabindex')) {
    mainContent.setAttribute('tabindex', '-1')
  }
}

// ========================================
// ANIMATION UTILITIES
// ========================================

export function animateElement(element, animationClass, duration = 500) {
  return new Promise(resolve => {
    element.classList.add(animationClass)
    
    setTimeout(() => {
      element.classList.remove(animationClass)
      resolve()
    }, duration)
  })
}

export function shakeElement(element) {
  return animateElement(element, 'shake', 500)
}

export function fadeInElement(element) {
  element.style.opacity = '0'
  element.style.display = ''
  
  requestAnimationFrame(() => {
    element.style.transition = 'opacity 0.3s ease'
    element.style.opacity = '1'
  })
}

export function fadeOutElement(element) {
  element.style.transition = 'opacity 0.3s ease'
  element.style.opacity = '0'
  
  setTimeout(() => {
    element.style.display = 'none'
  }, 300)
}

// ========================================
// INITIALIZE ALL
// ========================================

export function initAllUIPolish() {
  initRippleEffect()
  initMagneticButtons()
  initScrollAnimations()
  initStaggerAnimations()
  initTouchFeedback()
  initScrollToTop()
  initInputEnhancements()
  initFocusManagement()
  
  console.log('✨ UI Polish initialized')
}

export default {
  initAll: initAllUIPolish,
  initRippleEffect,
  initMagneticButtons,
  initScrollAnimations,
  initStaggerAnimations,
  initTouchFeedback,
  initPullToRefresh,
  initSwipeableCards,
  initScrollToTop,
  initInputEnhancements,
  initFocusManagement,
  animateElement,
  shakeElement,
  fadeInElement,
  fadeOutElement
}
