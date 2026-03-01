// Focus Trap for Modals
// Ensures keyboard navigation stays within modal

export function createFocusTrap(container, options = {}) {
  const { onEscape, onClose } = options
  
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ')
  
  let focusableElements = []
  let firstFocusable = null
  let lastFocusable = null
  let previouslyFocused = null
  
  function init() {
    // Store previously focused element
    previouslyFocused = document.activeElement
    
    // Get all focusable elements
    updateFocusableElements()
    
    // Focus first element
    if (firstFocusable) {
      firstFocusable.focus()
    }
    
    // Add event listeners
    container.addEventListener('keydown', handleKeydown)
    document.addEventListener('focusin', handleFocusIn, true)
  }
  
  function updateFocusableElements() {
    focusableElements = Array.from(container.querySelectorAll(focusableSelectors))
    firstFocusable = focusableElements[0]
    lastFocusable = focusableElements[focusableElements.length - 1]
  }
  
  function handleKeydown(e) {
    // Handle Tab key
    if (e.key === 'Tab') {
      updateFocusableElements()
      
      if (focusableElements.length === 0) {
        e.preventDefault()
        return
      }
      
      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }
    
    // Handle Escape key
    if (e.key === 'Escape') {
      if (onEscape) {
        onEscape()
      } else if (onClose) {
        onClose()
      }
    }
  }
  
  function handleFocusIn(e) {
    // If focus moved outside container, bring it back
    if (!container.contains(e.target)) {
      e.preventDefault()
      if (firstFocusable) {
        firstFocusable.focus()
      }
    }
  }
  
  function destroy() {
    container.removeEventListener('keydown', handleKeydown)
    document.removeEventListener('focusin', handleFocusIn, true)
    
    // Restore previous focus
    if (previouslyFocused && previouslyFocused.focus) {
      previouslyFocused.focus()
    }
  }
  
  function focusFirst() {
    updateFocusableElements()
    if (firstFocusable) {
      firstFocusable.focus()
    }
  }
  
  function focusLast() {
    updateFocusableElements()
    if (lastFocusable) {
      lastFocusable.focus()
    }
  }
  
  init()
  
  return {
    destroy,
    focusFirst,
    focusLast,
    updateFocusableElements
  }
}

// Apply focus trap to modal
export function trapModalFocus(modalId, options = {}) {
  const modal = document.getElementById(modalId)
  if (!modal) return null
  
  return createFocusTrap(modal, options)
}

// Auto-apply to all modals
export function initModalFocusTraps() {
  // Watch for modal creation
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.classList?.contains('modal-overlay')) {
          createFocusTrap(node, {
            onEscape: () => node.remove()
          })
        }
      })
    })
  })
  
  observer.observe(document.body, { childList: true, subtree: true })
}
