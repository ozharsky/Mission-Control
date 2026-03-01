// Review Section - Fixed to use actual store data

import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'

let currentPeriod = 7

const PERIODS = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' }
]

// Calculate stats from actual store data
function calculateStats(days) {
  const state = store.getState()
  const priorities = state.priorities || []
  const now = new Date()
  const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
  
  // Filter priorities by date
  const recentPriorities = priorities.filter(p => {
    const createdAt = p.createdAt ? new Date(p.createdAt) : null
    const completedAt = p.completedAt ? new Date(p.completedAt) : null
    const updatedAt = p.updatedAt ? new Date(p.updatedAt) : null
    
    // Include if created, completed, or updated within the period
    return (createdAt && createdAt >= cutoffDate) ||
           (completedAt && completedAt >= cutoffDate) ||
           (updatedAt && updatedAt >= cutoffDate)
  })
  
  // Calculate stats
  const total = recentPriorities.length
  const completed = recentPriorities.filter(p => p.completed).length
  const overdue = priorities.filter(p => {
    if (p.completed || !p.dueDate) return false
    return new Date(p.dueDate) < now
  }).length
  const dueSoon = priorities.filter(p => {
    if (p.completed || !p.dueDate) return false
    const due = new Date(p.dueDate)
    const diff = (due - now) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 3
  }).length
  
  // Status breakdown
  const byStatus = {
    now: priorities.filter(p => p.status === 'now' && !p.completed).length,
    later: priorities.filter(p => p.status === 'later' && !p.completed).length,
    done: priorities.filter(p => p.completed).length
  }
  
  // Tags breakdown
  const tagCounts = {}
  priorities.forEach(p => {
    (p.tags || []).forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  const byTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
  
  // Completion rate
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  
  // Average completion time (for completed items)
  const completedWithDates = priorities.filter(p => {
    if (!p.completed || !p.createdAt || !p.completedAt) return false
    const completedAt = new Date(p.completedAt)
    return completedAt >= cutoffDate
  })
  
  const avgCompletionTime = completedWithDates.length > 0
    ? Math.round(completedWithDates.reduce((sum, p) => {
        const created = new Date(p.createdAt)
        const completed = new Date(p.completedAt)
        return sum + ((completed - created) / (1000 * 60 * 60 * 24))
      }, 0) / completedWithDates.length)
    : 0
  
  return {
    total,
    completed,
    overdue,
    dueSoon,
    completionRate,
    avgCompletionTime,
    byStatus,
    byTags,
    created: recentPriorities.filter(p => {
      const created = p.createdAt ? new Date(p.createdAt) : null
      return created && created >= cutoffDate
    }).length
  }
}

// Calculate revenue stats
function calculateRevenueStats(days) {
  const state = store.getState()
  const history = state.revenueHistory || []
  
  if (history.length === 0) {
    return { hasData: false, total: 0, average: 0, growthRate: 0, totalOrders: 0 }
  }
  
  // Get recent months based on days
  const monthsToInclude = Math.ceil(days / 30)
  const recentHistory = history.slice(-monthsToInclude)
  
  const total = recentHistory.reduce((sum, h) => sum + (h.value || 0), 0)
  const totalOrders = recentHistory.reduce((sum, h) => sum + (h.orders || 0), 0)
  const average = monthsToInclude > 0 ? total / monthsToInclude : 0
  
  // Calculate growth rate
  let growthRate = 0
  if (history.length >= 2) {
    const lastMonth = history[history.length - 1]?.value || 0
    const prevMonth = history[history.length - 2]?.value || 0
    if (prevMonth > 0) {
      growthRate = Math.round(((lastMonth - prevMonth) / prevMonth) * 100)
    }
  }
  
  return {
    hasData: true,
    total,
    average: average.toFixed(0),
    growthRate,
    totalOrders
  }
}

export function createReviewSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function render() {
    const stats = calculateStats(currentPeriod)
    const revenue = calculateRevenueStats(currentPeriod)
    const prevStats = calculateStats(currentPeriod * 2)
    
    // Calculate change
    const prevCompleted = prevStats.completed - stats.completed
    const completionChange = prevCompleted > 0 
      ? Math.round(((stats.completed - prevCompleted) / prevCompleted) * 100)
      : 0
    
    // Generate insights
    const insights = []
    
    if (stats.completionRate >= 80) {
      insights.push({
        type: 'success',
        icon: '🎉',
        title: 'Excellent completion rate!',
        message: `You're completing ${stats.completionRate}% of your tasks. Keep it up!`
      })
    } else if (stats.completionRate < 50) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Completion rate is low',
        message: 'Consider breaking tasks into smaller pieces or reducing your workload.'
      })
    }
    
    if (stats.overdue > 5) {
      insights.push({
        type: 'danger',
        icon: '🔥',
        title: 'Many overdue tasks',
        message: `You have ${stats.overdue} overdue tasks. Time to clean up the backlog!`
      })
    }
    
    if (revenue.hasData && revenue.growthRate > 20) {
      insights.push({
        type: 'success',
        icon: '📈',
        title: 'Revenue growing!',
        message: `Your revenue is up ${revenue.growthRate}% compared to last period.`
      })
    }
    
    if (stats.completed > stats.created && stats.created > 0) {
      insights.push({
        type: 'success',
        icon: '⚡',
        title: 'Closing more than opening',
        message: `You completed ${stats.completed} tasks and created ${stats.created}. Great focus!`
      })
    }
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting">📊 Review</div>
          <div class="welcome-status">
            <span class="status-badge ${stats.completionRate >= 80 ? 'success' : stats.completionRate >= 50 ? 'warning' : ''}"
            >${stats.completionRate}% completion</span>
            ${stats.overdue > 0 ? `
              <span class="status-badge" style="background: rgba(239, 68, 68, 0.15); color: var(--accent-danger);"
              >🔥 ${stats.overdue} overdue</span>
            ` : ''}
          </div>
        </div>
        
        <div class="period-selector">
          ${PERIODS.map(p => `
            <button class="btn btn-sm ${currentPeriod === p.value ? 'btn-primary' : 'btn-secondary'}"
              onclick="setReviewPeriod(${p.value})"
            >${p.label}</button>
          `).join('')}
        </div>
      </div>
      
      <!-- Insights -->
      ${insights.length > 0 ? `
        <div class="insights-section">
          ${insights.map(i => `
            <div class="insight-card ${i.type}">
              <span class="insight-icon">${i.icon}</span>
              <div class="insight-content">
                <div class="insight-title">${i.title}</div>
                <div class="insight-message">${i.message}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <!-- Main Metrics Grid -->
      <div class="metrics-grid review-metrics">
        <div class="metric-card ${stats.completionRate >= 80 ? 'success' : stats.completionRate >= 50 ? 'warning' : 'danger'}">
          <div class="metric-value">${stats.completionRate}%</div>
          <div class="metric-label">Completion Rate</div>
          ${completionChange !== 0 ? `
            <div class="metric-change ${completionChange > 0 ? 'positive' : 'negative'}"
            >${completionChange > 0 ? '📈' : '📉'} ${Math.abs(completionChange)}%</div>
          ` : ''}
        </div>        
        <div class="metric-card">
          <div class="metric-value">${stats.completed}</div>
          <div class="metric-label">Completed</div>
          <div class="metric-sub">of ${stats.total} total</div>
        </div>        
        <div class="metric-card">
          <div class="metric-value">${stats.created}</div>
          <div class="metric-label">Created</div>
          <div class="metric-sub">new tasks</div>
        </div>        
        <div class="metric-card ${stats.avgCompletionTime > 7 ? 'warning' : ''}">
          <div class="metric-value">${stats.avgCompletionTime}d</div>
          <div class="metric-label">Avg Completion</div>
          <div class="metric-sub">from start to finish</div>
        </div>      
      </div>      
      
      <!-- Status Breakdown -->
      <div class="card status-breakdown-card">
        <div class="card-header">
          <div class="card-title">📋 Task Status Breakdown</div>
        </div>        
        <div class="status-breakdown">
          <div class="status-item">
            <div class="status-info">
              <div class="status-dot" style="background: var(--accent-primary);"></div>
              <span>Now (In Progress)</span>
            </div>
            <div class="status-bar-container">
              <div class="status-bar">
                <div class="status-fill" style="width: ${(stats.byStatus.now / Math.max(stats.total, 1)) * 100}%; background: var(--accent-primary);"
                ></div>
              </div>
              <span class="status-count">${stats.byStatus.now}</span>
            </div>
          </div>          
          <div class="status-item">
            <div class="status-info">
              <div class="status-dot" style="background: var(--text-muted);"></div>
              <span>Later (Backlog)</span>
            </div>
            <div class="status-bar-container">
              <div class="status-bar">
                <div class="status-fill" style="width: ${(stats.byStatus.later / Math.max(stats.total, 1)) * 100}%; background: var(--text-muted);"
                ></div>
              </div>
              <span class="status-count">${stats.byStatus.later}</span>
            </div>
          </div>          
          <div class="status-item">
            <div class="status-info">
              <div class="status-dot" style="background: var(--accent-success);"></div>
              <span>Done (Completed)</span>
            </div>
            <div class="status-bar-container">
              <div class="status-bar">
                <div class="status-fill" style="width: ${(stats.byStatus.done / Math.max(stats.total, 1)) * 100}%; background: var(--accent-success);"
                ></div>
              </div>
              <span class="status-count">${stats.byStatus.done}</span>
            </div>
          </div>        
        </div>        
        <div class="urgent-stats">
          <div class="urgent-item ${stats.overdue > 0 ? 'danger' : ''}">
            <span class="urgent-icon">🔥</span>
            <span class="urgent-label">Overdue</span>
            <span class="urgent-value">${stats.overdue}</span>
          </div>          
          <div class="urgent-item ${stats.dueSoon > 0 ? 'warning' : ''}">
            <span class="urgent-icon">⏰</span>
            <span class="urgent-label">Due Soon</span>
            <span class="urgent-value">${stats.dueSoon}</span>
          </div>        
        </div>      
      </div>      
      
      <!-- Revenue Section -->
      ${revenue.hasData ? `
        <div class="card revenue-review-card">
          <div class="card-header">
            <div class="card-title">💰 Revenue Performance</div>
            <span class="revenue-period">Last ${currentPeriod} days</span>
          </div>          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">$${revenue.total.toLocaleString()}</div>
              <div class="metric-label">Total Revenue</div>
            </div>            
            <div class="metric-card">
              <div class="metric-value">$${revenue.average}</div>
              <div class="metric-label">Avg/Month</div>
            </div>            
            <div class="metric-card ${parseFloat(revenue.growthRate) >= 0 ? 'success' : 'danger'}">
              <div class="metric-value">${revenue.growthRate}%</div>
              <div class="metric-label">Growth</div>
            </div>            
            <div class="metric-card">
              <div class="metric-value">${revenue.totalOrders}</div>
              <div class="metric-label">Orders</div>
            </div>          
          </div>        
        </div>
      ` : ''}
      
      <!-- Top Tags -->
      ${stats.byTags.length > 0 ? `
        <div class="card tags-review-card">
          <div class="card-title">🏷️ Top Tags</div>          
          <div class="tags-cloud">
            ${stats.byTags.map(([tag, count], index) => `
              <div class="tag-item ${index < 3 ? 'top' : ''}"
                   style="${index < 3 ? 'background: rgba(99, 102, 241, 0.15); color: var(--accent-primary);' : ''}"
              >
                <span class="tag-name">#${tag}</span>
                <span class="tag-count">${count}</span>
              </div>
            `).join('')}
          </div>        
        </div>
      ` : ''}
    `
  }
  
  // Global functions
  window.setReviewPeriod = (period) => {
    currentPeriod = period
    render()
    toast.success('Period updated', `Showing last ${period} days`)
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('priorities') || path.includes('projects') || path.includes('revenue')) {
      render()
    }
  })
  
  render()
  return { render }
}