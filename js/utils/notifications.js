// Browser notifications and reminders

import { toast } from '../components/Toast.js'

// Check if mobile device
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768

class NotificationManager {
  constructor() {
    this.permission = 'default'
    this.disabled = isMobile // Disable on mobile
    
    if (!this.disabled) {
      this.checkPermission()
    }
  }
  
  /**
   * Check notification permission
   */
  async checkPermission() {
    if (this.disabled) {
      this.permission = 'denied'
      return
    }
    
    if (!('Notification' in window)) {
      this.permission = 'unsupported'
      return
    }
    
    this.permission = Notification.permission
  }
  
  /**
   * Request permission
   */
  async requestPermission() {
    if (this.disabled) {
      console.log('📱 Notifications disabled on mobile')
      return false
    }
    
    if (!('Notification' in window)) {
      toast.error('Notifications not supported', 'Your browser does not support notifications')
      return false
    }
    
    const result = await Notification.requestPermission()
    this.permission = result
    
    if (result === 'granted') {
      toast.success('Notifications enabled')
      this.send('Mission Control', 'Notifications are now enabled!')
    } else {
      toast.warning('Notifications blocked', 'Please enable in browser settings')
    }
    
    return result === 'granted'
  }
  
  /**
   * Send a notification
   */
  send(title, options = {}) {
    if (this.disabled || this.permission !== 'granted') return false
    
    const defaultOptions = {
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'mission-control',
      requireInteraction: false,
      silent: false,
      ...options
    }
    
    try {
      const notification = new Notification(title, defaultOptions)
      
      notification.onclick = () => {
        window.focus()
        notification.close()
        options.onClick?.()
      }
      
      return notification
    } catch (e) {
      console.error('Notification failed:', e)
      return false
    }
  }
  
  /**
   * Schedule a reminder
   */
  schedule(title, body, when, options = {}) {
    if (this.disabled) return
    
    const now = new Date().getTime()
    const delay = when.getTime() - now
    
    if (delay <= 0) {
      this.send(title, { body, ...options })
      return
    }
    
    setTimeout(() => {
      this.send(title, { body, ...options })
    }, delay)
  }
  
  /**
   * Schedule priority reminders
   */
  schedulePriorityReminders(priorities) {
    if (this.disabled) return
    
    priorities.forEach(p => {
      if (!p.dueDate || p.completed) return
      
      const due = new Date(p.dueDate)
      const now = new Date()
      
      // Remind 1 hour before
      const oneHourBefore = new Date(due.getTime() - 60 * 60 * 1000)
      if (oneHourBefore > now) {
        this.schedule(
          'Due Soon!',
          `"${p.text}" is due in 1 hour`,
          oneHourBefore,
          { tag: `priority-${p.id}` }
        )
      }
      
      // Remind at due time
      if (due > now) {
        this.schedule(
          'Due Now!',
          `"${p.text}" is due now`,
          due,
          { tag: `priority-${p.id}-due` }
        )
      }
    })
  }
  
  /**
   * Send daily digest
   */
  sendDailyDigest(priorities) {
    if (this.disabled) return
    
    const overdue = priorities.filter(p => {
      if (!p.dueDate || p.completed) return false
      return new Date(p.dueDate) < new Date()
    })
    
    const dueToday = priorities.filter(p => {
      if (!p.dueDate || p.completed) return false
      return p.dueDate === new Date().toISOString().split('T')[0]
    })
    
    if (overdue.length === 0 && dueToday.length === 0) return
    
    let body = ''
    if (overdue.length > 0) {
      body += `${overdue.length} overdue, `
    }
    if (dueToday.length > 0) {
      body += `${dueToday.length} due today`
    }
    
    this.send('Daily Digest', {
      body,
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Priorities' }
      ]
    })
  }
  
  /**
   * Create notification settings UI
   */
  createSettings() {
    if (this.disabled) {
      return `
        <div class="card">
          <div class="card-title">🔔 Notifications</div>
          <div style="color: var(--text-muted); padding: 1rem 0;">
            📱 Notifications are disabled on mobile devices
          </div>
        </div>
      `
    }
    
    return `
      <div class="card">
        <div class="card-title">🔔 Notifications</div>
        
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
          <div>
            <div style="font-weight: 500;">Browser Notifications</div>
            <div style="font-size: 0.875rem; color: var(--text-muted);">Get notified about due dates</div>
          </div>
          <button class="btn ${this.permission === 'granted' ? 'btn-success' : 'btn-primary'}" 
                  onclick="notifications.requestPermission()"
                  ${this.permission === 'unsupported' ? 'disabled' : ''}>
            ${this.permission === 'granted' ? '✅ Enabled' : 'Enable'}
          </button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" checked disabled>
            <span>Due date reminders</span>
          </label>
          
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" checked disabled>
            <span>Pomodoro timer alerts</span>
          </label>
          
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" disabled>
            <span>Daily digest (coming soon)</span>
          </label>
        </div>
      </div>
    `
  }
}

export const notifications = new NotificationManager()

// Expose globally
window.notifications = notifications
