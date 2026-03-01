/**
 * Focus Management Utilities
 * Enhanced focus trapping, restoration, and accessibility
 */

// Store for focus history
const focusHistory = []
const MAX_FOCUS_HISTORY = 10

/**
 * Save current focus to history
 */
export function saveFocus() {
  const activeElement = document.activeElement
  if (activeElement && activeElement !== document.body) {
    focusHistory.push(activeElement)
    if (focusHistory.length > MAX_FOCUS_HISTORY) {
      focusHistory.shift()
    }
  }
  return activeElement
}

/**
 * Restore focus from history
 */
export function restoreFocus() {
  const element = focusHistory.pop()
  if (element && document.contains(element)) {
    element.focus()
    return element
  }
  return null
}

/**
 * Create a focus trap for modals/dialogs
 * @param {HTMLElement} container - Container element to trap focus within
 * @param {Object} options - Options
 * @returns {Object} Focus trap controller
 */
export function createFocusTrap(container, options = {}) {
  if (!container) {
    console.warn('createFocusTrap: No container provided')
    return { activate: () => {}, deactivate: () => {} }
  }

  const { escapeDeactivates = true, returnFocus = true } = options
  let previouslyFocused = null
  let isActive = false

  // Find all focusable elements
  function getFocusableElements() {
    const selector = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable]'
    ].join(', ')

    return Array.from(container.querySelectorAll(selector))
      .filter(el => {
        // Check visibility
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden'
      })
  }

  function handleKeyDown(e) {
    if (e.key !== 'Tab') return

    const focusableElements = getFocusableElements()
    if (focusableElements.length === 0) {
      e.preventDefault()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }

  function handleEscape(e) {
    if (escapeDeactivates && e.key === 'Escape') {
      deactivate()
    }
  }

  function activate() {
    if (isActive) return
    
    previouslyFocused = document.activeElement
    isActive = true

    // Focus first element
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      // Focus the first non-submit button or input
      const firstInteractive = focusableElements.find(el => 
        el.tagName !== 'BUTTON' || el.type !== 'submit'
      ) || focusableElements[0]
      firstInteractive.focus()
    }

    container.addEventListener('keydown', handleKeyDown)
    if (escapeDeactivates) {
      document.addEventListener('keydown', handleEscape)
    }
  }

  function deactivate() {
    if (!isActive) return
    
    isActive = false
    container.removeEventListener('keydown', handleKeyDown)
    document.removeEventListener('keydown', handleEscape)

    if (returnFocus && previouslyFocused && document.contains(previouslyFocused)) {
      previouslyFocused.focus()
    }
  }

  return {
    activate,
    deactivate,
    get isActive() { return isActive }
  }
}

/**
 * Initialize focus management for the app
 */
export function initFocusManagement() {
  // Handle focus-visible for keyboard navigation
  document.body.addEventListener('mousedown', () => {
    document.body.classList.add('using-mouse')
    document.body.classList.remove('using-keyboard')
  })

  document.body.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('using-keyboard')
      document.body.classList.remove('using-mouse')
    }
  })

  // Add CSS for focus-visible
  if (!document.getElementById('focus-management-styles')) {
    const styles = document.createElement('style')
    styles.id = 'focus-management-styles'
    styles.textContent = `
      /* Hide focus outline when using mouse */
      body.using-mouse *:focus {
        outline: none !important;
      }
      
      /* Show focus outline when using keyboard */
      body.using-keyboard *:focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
      }
      
      /* Skip link for accessibility */
      .skip-link {
        position: absolute;
        top: -100%;
        left: 50%;
        transform: translateX(-50%);
        padding: 0.75rem 1.5rem;
        background: var(--accent-primary);
        color: white;
        border-radius: var(--radius-md);
        z-index: 99999;
        transition: top 0.2s ease;
      }
      
      .skip-link:focus {
        top: 1rem;
      }
    `
    document.head.appendChild(styles)
  }

  // Add skip link
  if (!document.querySelector('.skip-link')) {
    const skipLink = document.createElement('a')
    skipLink.href = '#mainContent'
    skipLink.className = 'skip-link'
    skipLink.textContent = 'Skip to main content'
    document.body.insertBefore(skipLink, document.body.firstChild)
  }
}

/**
 * Set focus to an element safely
 * @param {HTMLElement} element - Element to focus
 * @param {boolean} scrollIntoView - Whether to scroll element into view
 */
export function setFocus(element, scrollIntoView = false) {
  if (!element || !document.contains(element)) return false

  try {
    element.focus()
    if (scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return true
  } catch (e) {
    console.warn('Failed to focus element:', e)
    return false
  }
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level ('polite' or 'assertive')
 */
export function announceToScreenReader(message, priority = 'polite') {
  let announcer = document.getElementById(`aria-announcer-${priority}`)
  
  if (!announcer) {
    announcer = document.createElement('div')
    announcer.id = `aria-announcer-${priority}`
    announcer.setAttribute('role', 'status')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.className = 'sr-only'
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `
    document.body.appendChild(announcer)
  }

  // Clear and set new message
  announcer.textContent = ''
  requestAnimationFrame(() => {
    announcer.textContent = message
  })
}

// Export for backwards compatibility
export default {
  saveFocus,
  restoreFocus,
  createFocusTrap,
  initFocusManagement,
  setFocus,
  announceToScreenReader
}
