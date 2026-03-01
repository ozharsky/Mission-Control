/**
 * Modal Scroll Lock Utility
 * Prevents body scroll when modal is open on mobile
 */

let scrollY = 0
let scrollLockCount = 0

/**
 * Lock body scroll when modal opens
 */
export function lockBodyScroll() {
  scrollLockCount++
  
  if (scrollLockCount === 1) {
    // Save current scroll position
    scrollY = window.scrollY || window.pageYOffset
    
    // Apply scroll lock styles to body
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    
    // Add class for additional CSS targeting
    document.body.classList.add('modal-open')
    
    // Prevent touchmove on body (for iOS)
    document.addEventListener('touchmove', preventTouchMove, { passive: false })
  }
}

/**
 * Unlock body scroll when modal closes
 */
export function unlockBodyScroll() {
  scrollLockCount--
  
  if (scrollLockCount <= 0) {
    scrollLockCount = 0
    
    // Remove scroll lock styles
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
    
    // Remove class
    document.body.classList.remove('modal-open')
    
    // Restore scroll position
    window.scrollTo(0, scrollY)
    
    // Remove touchmove listener
    document.removeEventListener('touchmove', preventTouchMove, { passive: false })
  }
}

/**
 * Force unlock (for emergency cleanup)
 */
export function forceUnlockBodyScroll() {
  scrollLockCount = 0
  
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.left = ''
  document.body.style.right = ''
  document.body.style.width = ''
  document.body.style.overflow = ''
  document.body.style.touchAction = ''
  document.body.classList.remove('modal-open')
  
  window.scrollTo(0, scrollY)
  
  document.removeEventListener('touchmove', preventTouchMove, { passive: false })
}

/**
 * Prevent touchmove on body (for iOS scroll lock)
 */
function preventTouchMove(e) {
  // Only prevent if not inside a scrollable modal body
  const modalBody = e.target.closest('.modal-body')
  if (!modalBody) {
    e.preventDefault()
  }
}

/**
 * Check if scroll is currently locked
 */
export function isScrollLocked() {
  return scrollLockCount > 0
}

/**
 * Get current scroll position (saved when locked)
 */
export function getSavedScrollPosition() {
  return scrollY
}

// Expose globally for legacy usage
window.lockBodyScroll = lockBodyScroll
window.unlockBodyScroll = unlockBodyScroll
window.forceUnlockBodyScroll = forceUnlockBodyScroll
