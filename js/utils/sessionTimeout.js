// Session Timeout Manager
// Auto-lock app after period of inactivity

import { Toast } from '../components/Toast.js'

class SessionManager {
  constructor(options = {}) {
    this.timeoutMinutes = options.timeoutMinutes || 30
    this.warningMinutes = options.warningMinutes || 5
    this.onTimeout = options.onTimeout || this.defaultTimeoutHandler
    this.onWarning = options.onWarning || this.defaultWarningHandler
    
    this.timeoutId = null
    this.warningId = null
    this.isLocked = false
    this.lastActivity = Date.now()
    
    this.activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll']
  }
  
  init() {
    this.resetTimer()
    this.attachEventListeners()
    console.log(`🔒 Session timeout initialized (${this.timeoutMinutes} min)`)
  }
  
  attachEventListeners() {
    this.activityEvents.forEach(event => {
      document.addEventListener(event, () => this.recordActivity(), { passive: true })
    })
    
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkTimeout()
      }
    })
  }
  
  recordActivity() {
    if (this.isLocked) return
    
    this.lastActivity = Date.now()
    this.resetTimer()
  }
  
  resetTimer() {
    if (this.isLocked) return
    
    clearTimeout(this.timeoutId)
    clearTimeout(this.warningId)
    
    const timeoutMs = this.timeoutMinutes * 60 * 1000
    const warningMs = (this.timeoutMinutes - this.warningMinutes) * 60 * 1000
    
    // Set warning timer
    this.warningId = setTimeout(() => {
      this.onWarning(this.warningMinutes)
    }, warningMs)
    
    // Set timeout timer
    this.timeoutId = setTimeout(() => {
      this.lock()
    }, timeoutMs)
  }
  
  checkTimeout() {
    const inactiveMs = Date.now() - this.lastActivity
    const timeoutMs = this.timeoutMinutes * 60 * 1000
    
    if (inactiveMs >= timeoutMs) {
      this.lock()
    } else if (inactiveMs >= (this.timeoutMinutes - this.warningMinutes) * 60 * 1000) {
      const remaining = Math.ceil((timeoutMs - inactiveMs) / 60000)
      this.onWarning(remaining)
    }
  }
  
  lock() {
    if (this.isLocked) return
    
    this.isLocked = true
    clearTimeout(this.timeoutId)
    clearTimeout(this.warningId)
    
    this.onTimeout()
    console.log('🔒 Session locked due to inactivity')
  }
  
  unlock() {
    this.isLocked = false
    this.lastActivity = Date.now()
    this.resetTimer()
    
    // Remove lock screen
    const lockScreen = document.getElementById('session-lock-screen')
    if (lockScreen) {
      lockScreen.remove()
    }
    
    console.log('🔓 Session unlocked')
  }
  
  defaultWarningHandler(minutesRemaining) {
    Toast.warning(
      'Session Timeout',
      `App will lock in ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} due to inactivity`,
      5000
    )
  }
  
  defaultTimeoutHandler() {
    this.createLockScreen()
  }
  
  createLockScreen() {
    const lockScreen = document.createElement('div')
    lockScreen.id = 'session-lock-screen'
    lockScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(10, 10, 15, 0.95);
      backdrop-filter: blur(10px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 1.5rem;
    `
    
    lockScreen.innerHTML = `
      <div style="font-size: 4rem;">🔒</div>
      <h2 style="color: white; margin: 0;">Session Locked</h2>
      <p style="color: var(--text-muted); margin: 0;">App locked due to inactivity</p>
      <button id="unlock-btn" class="btn btn-primary btn-lg">
        🔓 Unlock App
      </button>
    `
    
    document.body.appendChild(lockScreen)
    
    // Focus the unlock button
    setTimeout(() => {
      const btn = document.getElementById('unlock-btn')
      if (btn) {
        btn.focus()
        btn.addEventListener('click', () => this.unlock())
      }
    }, 100)
  }
  
  destroy() {
    clearTimeout(this.timeoutId)
    clearTimeout(this.warningId)
    
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, () => this.recordActivity())
    })
  }
  
  getStatus() {
    return {
      isLocked: this.isLocked,
      lastActivity: this.lastActivity,
      timeoutMinutes: this.timeoutMinutes
    }
  }
}

export const sessionManager = new SessionManager()

// Export for manual control
export function initSessionTimeout(options = {}) {
  const manager = new SessionManager(options)
  manager.init()
  return manager
}
