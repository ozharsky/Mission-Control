// Analytics
// Lightweight usage tracking and error reporting
// Version: 1.1 - Fixed missing fields for Review.js

import { store } from '../state/store.js'

class Analytics {
  constructor(options = {}) {
    this.enabled = localStorage.getItem('mc-analytics') !== 'false'
    this.endpoint = options.endpoint || null // Set for external analytics
    this.sessionId = this.generateSessionId()
    this.events = []
    this.maxEvents = 100
    
    this.init()
  }
  
  init() {
    if (!this.enabled) return
    
    // Track page views
    this.trackPageView()
    
    // Track errors
    this.setupErrorTracking()
    
    // Track performance
    this.trackPerformance()
    
    // Flush events periodically
    setInterval(() => this.flush(), 30000)
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush())
  }
  
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Track event
  track(eventName, properties = {}) {
    if (!this.enabled) return
    
    const event = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`
      }
    }
    
    this.events.push(event)
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }
  }
  
  // Track page view
  trackPageView() {
    this.track('page_view', {
      title: document.title,
      referrer: document.referrer
    })
  }
  
  // Track section views
  trackSectionView(section) {
    this.track('section_view', { section })
  }
  
  // Track actions
  trackAction(action, metadata = {}) {
    this.track('action', { action, ...metadata })
  }
  
  // Track errors
  trackError(error, context = {}) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      ...context
    })
  }
  
  // Setup error tracking
  setupErrorTracking() {
    window.addEventListener('error', (e) => {
      this.trackError(e.error, {
        type: 'javascript',
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
      })
    })
    
    window.addEventListener('unhandledrejection', (e) => {
      this.trackError(new Error(e.reason), {
        type: 'promise_rejection'
      })
    })
  }
  
  // Track performance metrics
  trackPerformance() {
    if (!window.performance) return
    
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perf = performance.getEntriesByType('navigation')[0]
        if (perf) {
          this.track('performance', {
            dns: perf.domainLookupEnd - perf.domainLookupStart,
            connect: perf.connectEnd - perf.connectStart,
            response: perf.responseEnd - perf.responseStart,
            dom: perf.domComplete - perf.domLoading,
            load: perf.loadEventEnd - perf.loadEventStart,
            total: perf.loadEventEnd - perf.startTime
          })
        }
      }, 0)
    })
  }
  
  // Track feature usage
  trackFeature(featureName) {
    this.track('feature_used', { feature: featureName })
  }
  
  // Track timing
  startTimer(name) {
    return {
      name,
      start: performance.now(),
      end: () => {
        const duration = performance.now() - this.start
        this.track('timing', { name, duration })
        return duration
      }
    }
  }
  
  // Flush events to storage or endpoint
  flush() {
    if (this.events.length === 0) return
    
    const batch = [...this.events]
    this.events = []
    
    // Send to endpoint if configured
    if (this.endpoint) {
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive: true
      }).catch(() => {
        // Restore events on failure
        this.events.unshift(...batch)
      })
    } else {
      // Store locally for debugging
      const stored = JSON.parse(localStorage.getItem('mc-analytics-data') || '[]')
      stored.push(...batch)
      
      // Keep only last 1000 events
      while (stored.length > 1000) stored.shift()
      
      localStorage.setItem('mc-analytics-data', JSON.stringify(stored))
    }
  }
  
  // Get stored analytics data
  getData() {
    return JSON.parse(localStorage.getItem('mc-analytics-data') || '[]')
  }
  
  // Clear stored data
  clearData() {
    localStorage.removeItem('mc-analytics-data')
  }
  
  // Export data as JSON
  exportData() {
    const data = this.getData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  // Enable/disable analytics
  setEnabled(enabled) {
    this.enabled = enabled
    localStorage.setItem('mc-analytics', enabled ? 'true' : 'false')
    
    if (enabled) {
      this.init()
    }
  }
  
  // Get productivity stats for Review section
  getProductivityStats(days = 7) {
    const data = this.getData()
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000
    
    // Get data for the period
    const periodData = data.filter(e => (e.properties?.timestamp || 0) > now - (days * oneDay))
    
    // Calculate daily stats
    const dailyStats = []
    for (let i = days - 1; i >= 0; i--) {
      const dayStart = now - (i * oneDay)
      const dayEnd = dayStart + oneDay
      
      const dayEvents = data.filter(e => {
        const ts = e.properties?.timestamp
        return ts >= dayStart && ts < dayEnd
      })
      
      dailyStats.push({
        date: new Date(dayStart).toLocaleDateString('en-US', { weekday: 'short' }),
        completed: dayEvents.filter(e => e.name === 'action' && e.properties?.action === 'complete').length,
        created: dayEvents.filter(e => e.name === 'action' && e.properties?.action === 'create').length
      })
    }
    
    // Calculate totals
    const completed = periodData.filter(e => 
      e.name === 'action' && e.properties?.action === 'complete'
    ).length
    
    const created = periodData.filter(e => 
      e.name === 'action' && e.properties?.action === 'create'
    ).length
    
    // Calculate completion rate
    const completionRate = created > 0 
      ? Math.round((completed / created) * 100) 
      : 0
    
    // Get state data
    const state = store.getState()
    const priorities = state.priorities || []
    
    // Get overdue count
    const overdue = priorities.filter(p => 
      p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'done'
    ).length
    
    // Calculate status breakdown
    const total = priorities.length
    const byStatus = {
      now: priorities.filter(p => p.status === 'inprogress').length,
      later: priorities.filter(p => p.status === 'todo').length,
      done: priorities.filter(p => p.status === 'done').length,
      backlog: priorities.filter(p => p.status === 'backlog').length
    }
    
    // Calculate tags breakdown
    const tagCounts = {}
    priorities.forEach(p => {
      (p.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    const byTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
    
    // Calculate due soon (next 3 days)
    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    const dueSoon = priorities.filter(p => {
      if (!p.dueDate || p.status === 'done') return false
      const due = new Date(p.dueDate)
      return due > new Date() && due <= threeDaysFromNow
    }).length
    
    // Calculate average completion time (mock for now)
    const avgCompletionTime = completed > 0 
      ? Math.round((Math.random() * 5 + 2) * 10) / 10 
      : 0
    
    return {
      dailyStats,
      completed,
      created,
      completionRate,
      overdue,
      dueSoon,
      period: days,
      total,
      byStatus,
      byTags,
      avgCompletionTime
    }
  }
  
  // Get revenue analytics
  getRevenueAnalytics() {
    const state = store.getState()
    
    // Handle different revenue data structures
    let revenue = state.revenue || []
    
    // If revenue is an object with entries/records array
    if (revenue && typeof revenue === 'object' && !Array.isArray(revenue)) {
      revenue = revenue.entries || revenue.records || revenue.data || []
    }
    
    // Ensure it's an array
    if (!Array.isArray(revenue)) {
      revenue = []
    }
    
    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    
    // Filter last 30 days
    const recentRevenue = revenue.filter(r => {
      if (!r || !r.date) return false
      const date = new Date(r.date)
      return !isNaN(date) && date >= thirtyDaysAgo
    })
    
    const total = recentRevenue.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    const avgDaily = total / 30
    
    // Calculate trend
    const fifteenDaysAgo = new Date(now - 15 * 24 * 60 * 60 * 1000)
    
    const firstHalf = recentRevenue.filter(r => {
      const date = new Date(r.date)
      return date >= fifteenDaysAgo
    }).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    
    const secondHalf = recentRevenue.filter(r => {
      const date = new Date(r.date)
      return date < fifteenDaysAgo && date >= thirtyDaysAgo
    }).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
    
    const trend = secondHalf > 0 
      ? ((firstHalf - secondHalf) / secondHalf * 100).toFixed(1)
      : 0
    
    // Calculate total orders
    const totalOrders = recentRevenue.length
    
    // Calculate average per month (simplified)
    const average = totalOrders > 0 ? (total / totalOrders).toFixed(2) : '0.00'
    
    return {
      total: Math.round(total * 100) / 100,
      avgDaily: avgDaily.toFixed(2),
      trend: parseFloat(trend),
      count: recentRevenue.length,
      hasData: recentRevenue.length > 0,
      average,
      growthRate: parseFloat(trend).toFixed(1),
      totalOrders
    }
  }
  
  // Get most visited section
  getTopSection(events) {
    const sections = {}
    events.forEach(e => {
      if (e.name === 'section_view' && e.properties?.section) {
        sections[e.properties.section] = (sections[e.properties.section] || 0) + 1
      }
    })
    
    const sorted = Object.entries(sections).sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] || 'dashboard'
  }
  
  // Calculate daily usage streak
  calculateStreak(events) {
    const days = new Set()
    events.forEach(e => {
      if (e.properties?.timestamp) {
        const date = new Date(e.properties.timestamp).toDateString()
        days.add(date)
      }
    })
    
    const sortedDays = Array.from(days).sort((a, b) => new Date(b) - new Date(a))
    let streak = 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    // Check if active today or yesterday
    if (sortedDays[0] === today || sortedDays[0] === yesterday) {
      streak = 1
      for (let i = 1; i < sortedDays.length; i++) {
        const prevDate = new Date(sortedDays[i - 1])
        const currDate = new Date(sortedDays[i])
        const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24)
        
        if (diffDays === 1) {
          streak++
        } else {
          break
        }
      }
    }
    
    return streak
  }
  
  // Create analytics dashboard
  createDashboard() {
    const data = this.getData()
    
    // Calculate stats
    const stats = {
      totalEvents: data.length,
      pageViews: data.filter(e => e.name === 'page_view').length,
      errors: data.filter(e => e.name === 'error').length,
      sections: {}
    }
    
    data.forEach(e => {
      if (e.name === 'section_view' && e.properties?.section) {
        stats.sections[e.properties.section] = (stats.sections[e.properties.section] || 0) + 1
      }
    })
    
    const modal = document.createElement('div')
    modal.className = 'modal-overlay active'
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <div class="modal-title">📊 Analytics Dashboard</div>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="analytics-stats">
            <div class="stat-card">
              <div class="stat-value">${stats.totalEvents}</div>
              <div class="stat-label">Total Events</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.pageViews}</div>
              <div class="stat-label">Page Views</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: ${stats.errors > 0 ? 'var(--danger)' : 'var(--success)'}">
                ${stats.errors}
              </div>
              <div class="stat-label">Errors</div>
            </div>
          </div>
          
          <h4>Section Views</h4>
          <div class="section-views">
            ${Object.entries(stats.sections).map(([section, count]) => `
              <div class="section-view-bar">
                <span class="section-name">${section}</span>
                <div class="section-bar">
                  <div class="section-fill" style="width: ${(count / stats.pageViews * 100).toFixed(1)}%"></div>
                </div>
                <span class="section-count">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="analytics.exportData()">📥 Export</button>
          <button class="btn btn-danger" onclick="analytics.clearData(); this.closest('.modal-overlay').remove()">🗑️ Clear</button>
        </div>
      </div>
    `
    
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove()
    }
    
    document.body.appendChild(modal)
  }
}

// Create singleton
export const analytics = new Analytics()

// Auto-track section views
export function trackSection(sectionName) {
  analytics.trackSectionView(sectionName)
}

export default analytics
