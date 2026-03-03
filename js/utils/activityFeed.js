// Activity feed and collaboration

import { store } from '../state/store.js'

class ActivityFeed {
  constructor() {
    this.activities = this.loadActivities()
    this.maxItems = 100
  }
  
  loadActivities() {
    const saved = localStorage.getItem('activity_feed')
    return saved ? JSON.parse(saved) : []
  }
  
  saveActivities() {
    localStorage.setItem('activity_feed', JSON.stringify(
      this.activities.slice(0, this.maxItems)
    ))
  }
  
  /**
   * Add activity to feed
   */
  add(type, data = {}) {
    const activity = {
      id: Date.now(),
      type,
      timestamp: new Date().toISOString(),
      ...data
    }
    
    this.activities.unshift(activity)
    this.saveActivities()
    
    // Notify subscribers
    this.notifySubscribers(activity)
    
    return activity
  }
  
  /**
   * Log priority activity
   */
  logPriority(action, priority, details = {}) {
    return this.add('priority', {
      action, // created, updated, completed, deleted
      priorityId: priority.id,
      priorityText: priority.text,
      user: 'Oleg', // Could be dynamic
      ...details
    })
  }
  
  /**
   * Log project activity
   */
  logProject(action, project, details = {}) {
    return this.add('project', {
      action,
      projectId: project.id,
      projectTitle: project.title,
      user: 'Oleg',
      ...details
    })
  }
  
  /**
   * Log system activity
   */
  logSystem(action, message, details = {}) {
    return this.add('system', {
      action,
      message,
      ...details
    })
  }
  
  /**
   * Get activities with filters
   */
  get(options = {}) {
    const { 
      type = null, 
      limit = 50, 
      since = null,
      user = null
    } = options
    
    let filtered = this.activities
    
    if (type) {
      filtered = filtered.filter(a => a.type === type)
    }
    
    if (user) {
      filtered = filtered.filter(a => a.user === user)
    }
    
    if (since) {
      filtered = filtered.filter(a => new Date(a.timestamp) >= new Date(since))
    }
    
    return filtered.slice(0, limit)
  }
  
  /**
   * Get activity summary for a date range
   */
  getSummary(days = 7) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    
    const recent = this.get({ since, limit: 1000 })
    
    const summary = {
      total: recent.length,
      byType: {},
      byAction: {},
      prioritiesCompleted: 0,
      projectsCreated: 0
    }
    
    recent.forEach(a => {
      // By type
      summary.byType[a.type] = (summary.byType[a.type] || 0) + 1
      
      // By action
      summary.byAction[a.action] = (summary.byAction[a.action] || 0) + 1
      
      // Specific metrics
      if (a.type === 'priority' && a.action === 'completed') {
        summary.prioritiesCompleted++
      }
      if (a.type === 'project' && a.action === 'created') {
        summary.projectsCreated++
      }
    })
    
    return summary
  }
  
  /**
   * Render activity feed
   */
  render(containerId, options = {}) {
    const container = document.getElementById(containerId)
    if (!container) return

    const activities = this.get(options)

    if (activities.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon"><i data-lucide="clipboard-list" class="lucide-icon"></i></div>
          <div class="empty-state-title">No activity yet</div>
          <div class="empty-state-desc">Your recent actions will appear here</div>
        </div>
      `
      return
    }

    container.innerHTML = `
      <div class="activity-feed">
        ${activities.map(a => this.renderActivity(a)).join('')}
      </div>
    `

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons({ attrs: { 'stroke-width': 2 }, nameAttr: 'data-lucide' });
    }
  }
  
  /**
   * Render single activity
   */
  renderActivity(activity) {
    const time = this.formatTime(activity.timestamp)
    const icon = this.getActivityIcon(activity)
    const text = this.getActivityText(activity)
    
    return `
      <div class="activity-item" data-id="${activity.id}">
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-text">${text}</div>
          <div class="activity-time">${time}</div>
        </div>
      </div>
    `
  }
  
  /**
   * Get icon for activity type
   */
  getActivityIcon(activity) {
    const iconMap = {
      priority: {
        created: 'plus-circle',
        updated: 'pencil',
        completed: 'check-circle',
        deleted: 'trash-2'
      },
      project: {
        created: 'folder-plus',
        updated: 'file-edit',
        moved: 'arrow-right',
        deleted: 'trash-2'
      },
      system: {
        backup: 'save',
        import: 'download',
        export: 'upload',
        sync: 'refresh-cw'
      }
    }

    const iconName = iconMap[activity.type]?.[activity.action] || 'pin'
    return `<i data-lucide="${iconName}" class="lucide-icon activity-type-icon"></i>`
  }
  
  /**
   * Get text description for activity
   */
  getActivityText(activity) {
    switch (activity.type) {
      case 'priority':
        switch (activity.action) {
          case 'created':
            return `Created priority "${activity.priorityText}"`
          case 'updated':
            return `Updated priority "${activity.priorityText}"`
          case 'completed':
            return `Completed priority "${activity.priorityText}"`
          case 'deleted':
            return `Deleted priority "${activity.priorityText}"`
        }
        break
        
      case 'project':
        switch (activity.action) {
          case 'created':
            return `Created project "${activity.projectTitle}"`
          case 'updated':
            return `Updated project "${activity.projectTitle}"`
          case 'moved':
            return `Moved project "${activity.projectTitle}" to ${activity.toStatus}`
          case 'deleted':
            return `Deleted project "${activity.projectTitle}"`
        }
        break
        
      case 'system':
        return activity.message
    }
    
    return 'Unknown activity'
  }
  
  /**
   * Format timestamp to relative time
   */
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (seconds < 60) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    
    return date.toLocaleDateString()
  }
  
  /**
   * Subscribe to new activities
   */
  subscribe(callback) {
    if (!this.subscribers) this.subscribers = []
    this.subscribers.push(callback)
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback)
    }
  }
  
  notifySubscribers(activity) {
    this.subscribers?.forEach(cb => cb(activity))
  }
  
  /**
   * Clear old activities
   */
  clear(keep = 50) {
    this.activities = this.activities.slice(0, keep)
    this.saveActivities()
  }
}

export const activityFeed = new ActivityFeed()

// Auto-log store changes
store.subscribe((state, path) => {
  if (path?.includes('priorities')) {
    // Could detect specific changes here
  }
})

// Expose globally
window.activityFeed = activityFeed
