import { store } from '../state/store.js'
import { weather, clock } from '../utils/widgets.js'
import { getAlertCount, sortPriorities, getDueAlert } from '../utils/priority.js'
import { isPriorityBlocked } from '../utils/taskUtils.js'
import { filterByBoard, getCurrentBoardLabel } from '../components/BoardSelector.js'
import { dashboardWidgets } from '../components/DashboardWidgets.js'
import { dashboardCache } from '../utils/cache.js'
import { addTouchFeedback } from '../utils/mobileInteractions.js'
import { createMetricCard, initMetricCardIcons } from '../components/ui/MetricCard.js'
import { icons } from '../utils/icons.js'

// Use centralized cache from cache.js
function getCachedInsights(key, computeFn) {
  return dashboardCache.getOrCompute(key, computeFn, 5000) // 5 seconds TTL
}

function getCachedStats(key, computeFn) {
  return dashboardCache.getOrCompute(key, computeFn, 2000) // 2 seconds TTL
}

export function createDashboardSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  let clockStarted = false
  
  function renderSkeleton() {
    return `
      <div class="welcome-bar m-card">
        <div class="skeleton skeleton-text skeleton-lg"></div>
        <div class="skeleton skeleton-text skeleton-sm"></div>
      </div>
      
      <div class="dashboard-metrics-grid">
        ${[1,2,3,4].map(() => `
          <div class="metric-card">
            <div class="metric-card-header">
              <div class="skeleton skeleton-circle" style="width:40px;height:40px;"></div>
              <div class="skeleton skeleton-text skeleton-xs" style="width:50px;"></div>
            </div>
            <div class="skeleton skeleton-text skeleton-lg" style="width:60px;"></div>
            <div class="skeleton skeleton-text skeleton-sm" style="width:80px;"></div>
          </div>
        `).join('')}
      </div>
      
      <div class="m-card">
        <div class="skeleton skeleton-text skeleton-md m-title"></div>
        ${[1,2,3].map(() => `
          <div class="skeleton skeleton-list-item"></div>
        `).join('')}
      </div>
    `
  }
  
  function renderMetricsGrid() {
    const state = store.getState()
    const stats = {
      activeAgents: state.agents?.filter(a => a.status === 'active').length || 0,
      totalAgents: state.agents?.length || 0,
      runningTasks: state.tasks?.filter(t => t.status === 'running').length || 0,
      totalTasks: state.tasks?.length || 0,
      completedTasksToday: state.priorities?.filter(p => {
        if (!p.completed || !p.completedAt) return false
        const today = new Date().toDateString()
        const completedDate = new Date(p.completedAt).toDateString()
        return today === completedDate
      }).length || 0,
      systemHealth: 98
    }
    
    // Calculate trends (mock data - would come from historical comparison)
    const agentTrend = 12
    const taskTrend = -5
    const completedTrend = 28
    const healthTrend = 0
    
    return createMetricCardGrid(`
      ${createMetricCard({
        title: 'Active Agents',
        value: stats.activeAgents,
        suffix: `/ ${stats.totalAgents}`,
        icon: 'bot',
        trend: agentTrend,
        color: 'purple'
      })}
      ${createMetricCard({
        title: 'Running Tasks',
        value: stats.runningTasks,
        suffix: `/ ${stats.totalTasks}`,
        icon: 'zap',
        trend: taskTrend,
        color: 'blue'
      })}
      ${createMetricCard({
        title: 'Completed Today',
        value: stats.completedTasksToday,
        icon: 'check-circle',
        trend: completedTrend,
        color: 'green'
      })}
      ${createMetricCard({
        title: 'System Health',
        value: `${stats.systemHealth}%`,
        icon: 'heart',
        trend: healthTrend,
        color: 'amber'
      })}
    `)
  }
  
  function renderActivityFeed() {
    const state = store.getState()
    const priorities = state.priorities || []
    const recentActivities = []
    
    // Get recent completed priorities
    const completedToday = priorities
      .filter(p => p.completed && p.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5)
    
    completedToday.forEach(p => {
      recentActivities.push({
        icon: 'check-circle',
        color: 'green',
        message: `Completed priority: ${p.text}`,
        time: new Date(p.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })
    })
    
    // Add some mock activities if not enough
    if (recentActivities.length === 0) {
      recentActivities.push({
        icon: 'info',
        color: 'blue',
        message: 'Welcome back! Ready to tackle your priorities?',
        time: 'Just now'
      })
    }
    
    return `
      <div class="m-card activity-feed">
        <div class="activity-feed-header">
          <div class="activity-feed-title">
            ${icons.clipboard()} Activity Feed
          </div>
        </div>
        <div class="activity-feed-list">
          ${recentActivities.map(activity => `
            <div class="activity-item">
              <div class="activity-icon activity-icon-${activity.color}">
                <i data-lucide="${activity.icon}" class="lucide-icon"></i>
              </div>
              <div class="activity-content">
                <div class="activity-message">${activity.message}</div>
                <div class="activity-time">${activity.time}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }
  
  function renderQuickActions() {
    const actions = [
      { icon: 'plus', label: 'New Priority', primary: true, onClick: 'openPriorityModal()' },
      { icon: 'folder-plus', label: 'New Project', onClick: 'openProjectModal()' },
      { icon: 'dollar-sign', label: 'Revenue', onClick: 'showSection("revenue")' },
      { icon: 'printer', label: 'Printers', onClick: 'showSection("inventory")' }
    ]
    
    return `
      <div class="section-card">
        <div class="section-card-header">
          <div class="section-card-title">${icons.zap()} Quick Actions</div>
        </div>
        <div class="section-card-content">
          <div class="quick-actions-grid">
            ${actions.map(action => `
              <button class="quick-action-btn ${action.primary ? 'primary' : ''} m-touch" 
                      onclick="${action.onClick}">
                <i data-lucide="${action.icon}" class="lucide-icon quick-action-icon"></i>
                <span>${action.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `
  }
  
  function renderAIInsights() {
    const state = store.getState()
    const cacheKey = JSON.stringify({
      priorities: state.priorities?.length,
      projects: Object.values(state.projects || {}).flat().length,
      revenueHistoryLength: state.revenueHistory?.length,
      skus: state.skus?.length,
      printers: state.printers?.length
    })
    
    return getCachedInsights(cacheKey, () => {
      const priorities = state.priorities || []
      const projects = state.projects || {}
      const revenueHistory = state.revenueHistory || []
      const skus = state.skus || []
      const printers = state.printers || []
      
      // Calculate SMART monthly goal
      let monthlyRevenueGoal = 450
      if (revenueHistory.length >= 3) {
        const recent3 = revenueHistory.slice(-3)
        const avgRevenue = recent3.reduce((s, h) => s + h.value, 0) / 3
        monthlyRevenueGoal = Math.max(Math.round(avgRevenue * 1.2), 300)
      }
      
      const activePriorities = priorities.filter(p => !p.completed)
      const overdueCount = activePriorities.filter(p => {
        const alert = getDueAlert(p)
        return alert?.type === 'overdue'
      }).length
      const dueSoonCount = activePriorities.filter(p => {
        const alert = getDueAlert(p)
        return alert?.type === 'soon'
      }).length
      
      const activeProjects = Object.values(projects).flat().filter(p => p.status !== 'done').length
      const doneProjects = (projects.done || []).length
      
      // Use monthly goal for progress
      const currentMonthRevenue = revenueHistory.length > 0 ? revenueHistory[revenueHistory.length - 1].value : 0
      const revenueProgress = monthlyRevenueGoal > 0 ? Math.min((currentMonthRevenue / monthlyRevenueGoal) * 100, 100) : 0
      
      let trend = 'stable'
      let trendIcon = 'minus'
      let trendColor = 'neutral'
      if (revenueHistory.length >= 2) {
        const lastMonth = revenueHistory[revenueHistory.length - 1]?.value || 0
        const prevMonth = revenueHistory[revenueHistory.length - 2]?.value || 0
        if (lastMonth > prevMonth * 1.05) {
          trend = 'up'
          trendIcon = 'trending-up'
          trendColor = 'success'
        } else if (lastMonth < prevMonth * 0.95) {
          trend = 'down'
          trendIcon = 'trending-down'
          trendColor = 'danger'
        }
      }
      
      const lowStock = skus.filter(s => s.stock <= 5).length
      const onlinePrinters = printers.filter(p => p.status === 'operational' || p.status === 'printing' || p.status === 'idle').length
      const totalPrinters = printers.length || 3
      
      const recommendations = []
      
      if (overdueCount > 0) {
        recommendations.push({
          icon: 'flame',
          text: `${overdueCount} overdue`,
          subtext: 'priorities need attention',
          action: 'View',
          section: 'priorities',
          urgent: true
        })
      }
      
      if (dueSoonCount > 0) {
        recommendations.push({
          icon: 'clock',
          text: `${dueSoonCount} due soon`,
          subtext: 'within 3 days',
          action: 'Review',
          section: 'priorities',
          urgent: false
        })
      }
      
      if (lowStock > 0) {
        recommendations.push({
          icon: 'package',
          text: `${lowStock} low stock`,
          subtext: 'SKUs need restocking',
          action: 'Check',
          section: 'skus',
          urgent: false
        })
      }
      
      if (recommendations.length === 0) {
        recommendations.push({
          icon: 'sparkles',
          text: 'All caught up!',
          subtext: 'Great job staying on top of things',
          action: null,
          section: null,
          urgent: false
        })
      }
      
      return `
        <div class="m-card insights-card">
          <div class="m-title">
            <i data-lucide="sparkles" class="lucide-icon"></i>
            AI Insights
          </div>
          
          <div class="m-grid-2">
            <div class="m-stat m-touch insight-stat" onclick="showSection('revenue')" role="button" tabindex="0">
              <div class="m-title text-${trendColor}">
                <i data-lucide="${trendIcon}" class="lucide-icon"></i>
              </div>
              <div class="m-caption">Revenue ${trend}</div>
            </div>
            
            <div class="m-stat m-touch insight-stat" onclick="showSection('revenue')" role="button" tabindex="0">
              <div class="m-title">${(revenueProgress || 0).toFixed(0)}%</div>
              <div class="m-caption">of $${monthlyRevenueGoal.toLocaleString()} monthly goal</div>
            </div>
            
            <div class="m-stat m-touch insight-stat" onclick="showSection('inventory')" role="button" tabindex="0">
              <div class="m-title text-${onlinePrinters === totalPrinters ? 'success' : onlinePrinters === 0 ? 'danger' : 'warning'}">${onlinePrinters}/${totalPrinters}</div>
              <div class="m-caption">Printers online</div>
            </div>
            
            <div class="m-stat m-touch insight-stat" onclick="showSection('projects')" role="button" tabindex="0">
              <div class="m-title">${doneProjects}/${doneProjects + activeProjects}</div>
              <div class="m-caption">Projects done</div>
            </div>
          </div>
          
          <div class="m-list recommendations-list">
            ${recommendations.map(rec => `
              <div class="m-list-item m-touch recommendation-item ${rec.urgent ? 'urgent' : ''}"
                   ${rec.section ? `onclick="showSection('${rec.section}')"` : ''}>
                <span class="recommendation-icon">
                  <i data-lucide="${rec.icon}" class="lucide-icon"></i>
                </span>
                <div class="recommendation-content">
                  <div class="m-body recommendation-text">${rec.text}</div>
                  <div class="m-caption recommendation-subtext">${rec.subtext}</div>
                </div>
                ${rec.action ? `
                  <button class="m-btn m-touch recommendation-action">${rec.action}</button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `
    })
  }
  
  function render() {
    try {
      const state = store.getState()
      const totalOrders = state.orders || 0
      const activeProjects = Object.values(state.projects || {}).flat().filter(p => p.status !== 'done').length
      const pendingPriorities = (state.priorities || []).filter(p => !p.completed).length
      const alerts = getAlertCount()
      
      // Stats for metric cards
      const stats = {
        activeAgents: state.agents?.filter(a => a.status === 'active').length || 0,
        runningTasks: state.tasks?.filter(t => t.status === 'running').length || 0,
        completedTasksToday: state.priorities?.filter(p => {
          if (!p.completed || !p.completedAt) return false
          const today = new Date().toDateString()
          const completedDate = new Date(p.completedAt).toDateString()
          return today === completedDate
        }).length || 0
      }
      
      const hour = new Date().getHours()
      let greeting = 'Good morning'
      if (hour >= 12 && hour < 17) greeting = 'Good afternoon'
      else if (hour >= 17) greeting = 'Good evening'
    
    let topPriorities = sortPriorities(state.priorities || [])
      .filter(p => !p.completed)
    topPriorities = filterByBoard(topPriorities, 'board')
    topPriorities = topPriorities.slice(0, 5)
    
    // Get revenue data for widgets
    const revenueHistory = state.revenueHistory || []
    const revenueSparkline = revenueHistory.slice(-7).map(h => h.value)
    const revenueProgress = revenueHistory.length > 0 ? Math.min((revenueHistory[revenueHistory.length - 1].value / 450) * 100, 100) : 0
    
    // Add dashboard widgets styles
    dashboardWidgets.addStyles()
    
    // Simple metric cards HTML
    const metricsHtml = `
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-card-value">${stats.activeAgents || 0}</div>
          <div class="metric-card-title">Active Agents</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-value">${stats.runningTasks || 0}</div>
          <div class="metric-card-title">Running Tasks</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-value">${stats.completedTasksToday || 0}</div>
          <div class="metric-card-title">Completed Today</div>
        </div>
        <div class="metric-card">
          <div class="metric-card-value">98%</div>
          <div class="metric-card-title">System Health</div>
        </div>
      </div>
    `
    
    container.innerHTML = `
      <!-- Simple Metric Cards -->
      ${metricsHtml}
      
      <!-- Welcome Header -->
      <div class="welcome-bar m-card">
        <div class="welcome-content">
          <div class="m-title welcome-greeting">${greeting}, Oleg</div>
          <div class="welcome-status">
            ${pendingPriorities > 0 
              ? `<span class="m-badge status-badge">${pendingPriorities} pending</span>` 
              : '<span class="m-badge status-badge status-success"><i data-lucide="check" class="lucide-icon"></i> All caught up</span>'
            }
            <span class="m-badge board-label">${getCurrentBoardLabel()}</span>
          </div>
        </div>
        <div class="welcome-time">
          <div id="clockDisplay" class="m-title clock-display">--:--</div>
          <div id="weatherDisplay" class="m-body weather-display">
            <span class="weather-loading">Loading...</span>
          </div>
        </div>
      </div>
      
      <!-- Board Selector -->
      <div id="boardSelector"></div>
      
      <!-- New Metrics Grid with Metric Cards -->
      ${renderMetricsGrid()}
      
      <!-- Quick Actions -->
      ${renderQuickActions()}
      
      <!-- Activity Feed -->
      ${renderActivityFeed()}
      
      ${renderAIInsights()}
      
      <!-- Revenue Trend Widget -->
      <div class="m-card dashboard-card dashboard-card-revenue">
        <div class="dashboard-card-header">
          <div class="m-title dashboard-card-title">
            <i data-lucide="trending-up" class="lucide-icon"></i>
            Revenue Trend
          </div>
          <button class="m-touch dashboard-card-action" onclick="showSection('revenue')">View <i data-lucide="chevron-right" class="lucide-icon"></i></button>
        </div>
        <div class="dashboard-card-body">
          <div class="m-stack revenue-main">
            <div class="revenue-chart">
              ${revenueSparkline.length > 1 
                ? dashboardWidgets.renderSparkline(revenueSparkline, { width: 200, height: 70, color: '#10b981' })
                : '<span class="m-body text-muted">Not enough data</span>'
              }
            </div>
            <div class="revenue-center">
              <div class="m-title revenue-amount">$${revenueHistory.length > 0 ? revenueHistory[revenueHistory.length - 1].value.toLocaleString() : '0'}</div>
              <div class="m-body revenue-label">This month</div>
            </div>
            <div class="revenue-progress">
              ${dashboardWidgets.renderProgressRing(revenueProgress, { size: 80, color: revenueProgress >= 100 ? '#10b981' : '#6366f1' })}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Top Priorities -->
      <div class="m-card dashboard-card priorities-card">
        <div class="dashboard-card-header">
          <div class="m-title dashboard-card-title">
            <i data-lucide="star" class="lucide-icon"></i>
            Top Priorities
          </div>
          <button class="m-touch dashboard-card-action" onclick="showSection('priorities')">View All <i data-lucide="chevron-right" class="lucide-icon"></i></button>
        </div>
        
        ${topPriorities.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon"><i data-lucide="clipboard-list" class="lucide-icon"></i></div>
            <div class="m-title empty-state-title">No active priorities</div>
            <div class="m-body empty-state-text">Create your first priority to get started</div>
            <button class="m-btn m-btn-primary m-touch" onclick="openPriorityModal()">
              <i data-lucide="plus" class="lucide-icon"></i> Create Priority
            </button>
          </div>
        ` : `
          <div class="dashboard-card-body">
            <div class="m-list dashboard-priority-list">
              ${topPriorities.map(p => {
                const alert = getDueAlert(p)
                const isBlocked = isPriorityBlocked(p, state.priorities || [])
                return `
                  <div class="m-list-item m-touch dashboard-priority-item ${alert?.type || ''} ${p.completed ? 'completed' : ''} ${isBlocked ? 'blocked' : ''}"
                       onclick="openEditPriorityModal(${p.id})">
                    
                    <div class="priority-checkbox ${p.completed ? 'checked' : ''} m-touch"
                         onclick="event.stopPropagation(); togglePriority(${p.id})">
                      ${p.completed ? '<i data-lucide="check" class="lucide-icon"></i>' : ''}
                    </div>
                    
                    <div class="priority-content">
                      <div class="m-body priority-text">${isBlocked ? '<i data-lucide="lock" class="lucide-icon"></i> ' : ''}${p.text}</div>
                      <div class="m-caption priority-meta">
                        ${alert ? `<span class="m-badge alert-badge ${alert.type}">
                          <i data-lucide="${alert.type === 'overdue' ? 'alert-circle' : 'clock'}" class="lucide-icon"></i> 
                          ${alert.text}
                        </span>` : ''}
                        ${p.dueDate ? `<span><i data-lucide="calendar" class="lucide-icon"></i> ${p.dueDate}</span>` : ''}
                      </div>
                    </div>
                    
                    <div class="priority-arrow"><i data-lucide="chevron-right" class="lucide-icon"></i></div>
                  </div>
                `
              }).join('')}
            </div>
          </div>
          
          ${topPriorities.length >= 5 ? `
            <div class="card-footer">
              <button class="m-touch m-btn btn-text" onclick="showSection('priorities')">View all priorities <i data-lucide="arrow-right" class="lucide-icon"></i></button>
            </div>
          ` : ''}
        `}
      </div>
      
      <!-- Quick Stats -->
      <div class="m-card activity-card">
        <div class="m-title">
          <i data-lucide="bar-chart-2" class="lucide-icon"></i>
          Quick Stats
        </div>
        <div class="m-grid-3 quick-stats">
          <div class="m-stat quick-stat">
            <div class="m-title quick-stat-value">${state.priorities?.filter(p => p.completed).length || 0}</div>
            <div class="m-caption quick-stat-label">Completed today</div>
          </div>
          
          <div class="m-stat quick-stat">
            <div class="m-title quick-stat-value">${state.projects?.done?.length || 0}</div>
            <div class="m-caption quick-stat-label">Projects done</div>
          </div>
          
          <div class="m-stat quick-stat">
            <div class="m-title quick-stat-value">$${(state.revenue || 0).toLocaleString()}</div>
            <div class="m-caption quick-stat-label">Total revenue</div>
          </div>
        </div>
      </div>
    `
    
    // Start clock
    if (!clockStarted) {
      clock.start('clockDisplay')
      clockStarted = true
    }
    
    // Load weather with better loading state
    weather.render('weatherDisplay')
    
    // Initialize board selector
    import('../components/BoardSelector.js').then(({ createBoardSelector }) => {
      createBoardSelector('boardSelector')
    })
    
    // Initialize Lucide icons
    setTimeout(() => {
      initMetricCardIcons(container)
    }, 0)
    
    } catch (err) {
      console.error('[Dashboard] Render error:', err)
      container.innerHTML = `<div class="error-state m-body">Error loading dashboard. Please refresh.</div>`
    }
  }

  store.subscribe((state, path) => {
    if (!path || path.includes('priorities') || path.includes('projects') || path.includes('currentBoard')) {
      render()
    }
  })
  
  render()
  
  // Initialize mobile interactions after render
  setTimeout(() => {
    // Add touch feedback to dashboard cards and interactive elements
    document.querySelectorAll('.metric-card, .dashboard-card, .dashboard-priority-item, .quick-stat, .insight-stat').forEach(el => {
      addTouchFeedback(el)
    })
  }, 100)
  
  // Expose togglePriority globally
  window.togglePriority = (id) => {
    const priorities = store.get('priorities')
    const priority = priorities.find(p => p.id === id)
    if (priority && !isPriorityBlocked(priority, priorities)) {
      priority.completed = !priority.completed
      priority.status = priority.completed ? 'done' : 'later'
      if (priority.completed) {
        priority.completedAt = new Date().toISOString()
      }
      store.set('priorities', priorities)
    }
  }
  
  return { render }
}

function getBoardEmoji(board) {
  const emojis = {
    'etsy': '🛒',
    'photography': '📸',
    'wholesale': '🏪',
    '3dprint': '🖨️',
    'all': '🏢'
  }
  return emojis[board] || '📋'
}

// Helper function to create metric card grid
function createMetricCardGrid(cardsHtml) {
  return `
    <div class="dashboard-metrics-grid">
      ${cardsHtml}
    </div>
  `
}
