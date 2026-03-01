/**
 * UI Enhancements Integration Module
 * Integrates new UI polish features into Mission Control V5
 * 
 * Created: March 1, 2025
 */

import { initRippleEffect, initScrollAnimations, initMagneticButtons } from './uiPolish.js'

// ========================================
// MODAL ENHANCEMENTS
// ========================================

/**
 * Initialize enhanced modal behaviors
 */
export function initModalEnhancements() {
  // Add closing animation class when modal is being closed
  document.addEventListener('click', (e) => {
    const closeBtn = e.target.closest('.modal-close, [data-modal-close]')
    if (closeBtn) {
      const overlay = closeBtn.closest('.modal-overlay')
      if (overlay) {
        overlay.classList.add('closing')
        // Remove after animation
        setTimeout(() => {
          overlay.classList.remove('closing', 'active')
        }, 250)
      }
    }
  })
  
  // Close on backdrop click with animation
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
      e.target.classList.add('closing')
      setTimeout(() => {
        e.target.classList.remove('closing', 'active')
      }, 250)
    }
  })
  
  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal-overlay.active')
      if (activeModal) {
        activeModal.classList.add('closing')
        setTimeout(() => {
          activeModal.classList.remove('closing', 'active')
        }, 250)
      }
    }
  })
}

/**
 * Show modal with enhanced animation
 * @param {string} modalId - ID of modal to show
 * @param {string} animation - Animation type: 'fade', 'slide', 'zoom'
 */
export function showModal(modalId, animation = 'fade') {
  const modal = document.getElementById(modalId)
  if (!modal) return
  
  modal.classList.remove('closing')
  modal.classList.add('active')
  modal.setAttribute('data-animation', animation)
  
  // Focus first focusable element
  const focusable = modal.querySelector('input, textarea, select, button:not(.modal-close)')
  if (focusable) focusable.focus()
}

/**
 * Hide modal with closing animation
 * @param {string} modalId - ID of modal to hide
 */
export function hideModal(modalId) {
  const modal = document.getElementById(modalId)
  if (!modal) return
  
  modal.classList.add('closing')
  setTimeout(() => {
    modal.classList.remove('closing', 'active')
  }, 250)
}

// ========================================
// FORM ENHANCEMENTS
// ========================================

/**
 * Initialize form validation enhancements
 */
export function initFormEnhancements() {
  // Auto-resize textareas
  document.querySelectorAll('textarea[data-auto-resize]').forEach(textarea => {
    const resize = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
    textarea.addEventListener('input', resize)
    resize()
  })
  
  // Character counter
  document.querySelectorAll('[data-max-length]').forEach(input => {
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
  
  // Input focus effects
  document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
    input.addEventListener('focus', () => {
      input.closest('.form-group')?.classList.add('focused')
    })
    input.addEventListener('blur', () => {
      input.closest('.form-group')?.classList.remove('focused')
    })
  })
}

/**
 * Validate a form group
 * @param {HTMLElement} formGroup - The form group element
 * @param {boolean} isValid - Whether the field is valid
 * @param {string} message - Error message (if invalid)
 */
export function setFormValidation(formGroup, isValid, message = '') {
  formGroup.classList.remove('has-error', 'has-success')
  
  // Remove existing messages
  const existingMsg = formGroup.querySelector('.form-error, .form-success')
  if (existingMsg) existingMsg.remove()
  
  if (isValid) {
    formGroup.classList.add('has-success')
  } else {
    formGroup.classList.add('has-error')
    if (message) {
      const errorEl = document.createElement('div')
      errorEl.className = 'form-error'
      errorEl.innerHTML = `⚠️ ${message}`
      formGroup.appendChild(errorEl)
    }
  }
}

// ========================================
// BUTTON ENHANCEMENTS
// ========================================

/**
 * Set button loading state
 * @param {HTMLElement} button - The button element
 * @param {boolean} loading - Whether to show loading state
 * @param {string} text - Loading text (optional)
 */
export function setButtonLoading(button, loading = true, text = null) {
  if (loading) {
    button.dataset.originalText = button.innerHTML
    button.classList.add('btn-loading')
    if (text) {
      button.dataset.loadingText = text
    }
    button.disabled = true
  } else {
    button.innerHTML = button.dataset.originalText || 'Submit'
    button.classList.remove('btn-loading')
    button.disabled = false
  }
}

/**
 * Create ripple effect on button click
 * @param {HTMLElement} button - The button element
 * @param {Event} event - The click event
 */
export function createButtonRipple(button, event) {
  const rect = button.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2
  
  const ripple = document.createElement('span')
  ripple.className = 'ripple'
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: scale(0);
    animation: rippleEffect 0.6s ease-out;
    pointer-events: none;
  `
  
  button.appendChild(ripple)
  setTimeout(() => ripple.remove(), 600)
}

/**
 * Initialize ripple effects on all buttons
 */
export function initButtonRipples() {
  document.addEventListener('click', (e) => {
    const button = e.target.closest('.btn-ripple, .btn-ripple-enhanced')
    if (button) {
      createButtonRipple(button, e)
    }
  })
}

// ========================================
// CARD ENHANCEMENTS
// ========================================

/**
 * Animate cards entrance with stagger
 * @param {string} selector - CSS selector for cards
 * @param {number} delay - Base delay in ms
 */
export function animateCardsEntrance(selector = '.card, .metric-card, .priority-card, .project-card', delay = 80) {
  const cards = document.querySelectorAll(selector)
  
  cards.forEach((card, index) => {
    card.style.opacity = '0'
    card.style.transform = 'translateY(20px)'
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      card.style.opacity = '1'
      card.style.transform = 'translateY(0)'
      
      // Clean up after animation
      setTimeout(() => {
        card.style.transition = ''
      }, 400)
    }, index * delay)
  })
}

// ========================================
// TOAST ENHANCEMENTS
// ========================================

/**
 * Enhanced toast notification with animation
 * @param {Object} options - Toast options
 */
export function showEnhancedToast(options = {}) {
  const {
    title,
    message,
    type = 'info',
    duration = 5000,
    position = 'top-right'
  } = options
  
  // Import toast from existing component
  import('./components/Toast.js').then(({ toast }) => {
    toast.show({
      title,
      message,
      type,
      duration
    })
  })
}

// ========================================
// INITIALIZE ALL ENHANCEMENTS
// ========================================

/**
 * Initialize all UI enhancements
 */
export function initAllEnhancements() {
  // Initialize existing UI polish
  initRippleEffect()
  initScrollAnimations()
  initMagneticButtons()
  
  // Initialize new enhancements
  initModalEnhancements()
  initFormEnhancements()
  initButtonRipples()
  
  console.log('✨ UI Enhancements initialized (v83)')
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAllEnhancements)
} else {
  initAllEnhancements()
}

// Export for manual initialization
export default {
  initAll: initAllEnhancements,
  initModalEnhancements,
  initFormEnhancements,
  initButtonRipples,
  showModal,
  hideModal,
  setFormValidation,
  setButtonLoading,
  createButtonRipple,
  animateCardsEntrance,
  showEnhancedToast
}
