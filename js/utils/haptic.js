// Haptic Feedback
// Vibration feedback for mobile interactions

class HapticFeedback {
  constructor() {
    this.enabled = this.isSupported() && localStorage.getItem('mc-haptic') !== 'false'
  }
  
  // Check if vibration is supported
  isSupported() {
    return 'vibrate' in navigator
  }
  
  // Enable/disable haptic feedback
  setEnabled(enabled) {
    this.enabled = enabled && this.isSupported()
    localStorage.setItem('mc-haptic', enabled ? 'true' : 'false')
  }
  
  // Light tap (button press)
  light() {
    if (!this.enabled) return
    navigator.vibrate(10)
  }
  
  // Medium feedback (action completed)
  medium() {
    if (!this.enabled) return
    navigator.vibrate(20)
  }
  
  // Heavy feedback (important action)
  heavy() {
    if (!this.enabled) return
    navigator.vibrate([30, 50, 30])
  }
  
  // Success pattern
  success() {
    if (!this.enabled) return
    navigator.vibrate([10, 30, 10])
  }
  
  // Error pattern
  error() {
    if (!this.enabled) return
    navigator.vibrate([50, 100, 50])
  }
  
  // Warning pattern
  warning() {
    if (!this.enabled) return
    navigator.vibrate([20, 50, 20])
  }
  
  // Selection change
  selection() {
    if (!this.enabled) return
    navigator.vibrate(5)
  }
  
  // Long press
  longPress() {
    if (!this.enabled) return
    navigator.vibrate(40)
  }
  
  // Drag start
  dragStart() {
    if (!this.enabled) return
    navigator.vibrate(15)
  }
  
  // Drop success
  drop() {
    if (!this.enabled) return
    navigator.vibrate([10, 20, 10])
  }
  
  // Toggle switch
  toggle() {
    if (!this.enabled) return
    navigator.vibrate(8)
  }
}

// Create singleton
export const haptic = new HapticFeedback()

// Auto-attach to common elements
export function initHapticFeedback() {
  if (!haptic.isSupported()) return
  
  // Buttons
  document.querySelectorAll('.btn, button').forEach(btn => {
    btn.addEventListener('click', () => haptic.light())
  })
  
  // Toggles
  document.querySelectorAll('input[type="checkbox"]').forEach(toggle => {
    toggle.addEventListener('change', () => haptic.toggle())
  })
  
  // Cards (long press)
  document.querySelectorAll('.priority-card, .project-card, .event-card').forEach(card => {
    let pressTimer
    card.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => haptic.longPress(), 500)
    })
    card.addEventListener('touchend', () => clearTimeout(pressTimer))
    card.addEventListener('touchmove', () => clearTimeout(pressTimer))
  })
}

// Export shortcuts
export const { light, medium, heavy, success, error, warning, selection, toggle: hapticToggle } = haptic
