import { store } from '../state/store.js'
import { weather, clock } from '../utils/widgets.js'
import { getAlertCount, sortPriorities, getDueAlert } from '../utils/priority.js'
import { isPriorityBlocked } from '../utils/taskUtils.js'
import { filterByBoard, getCurrentBoardLabel } from '../components/BoardSelector.js'
import { dashboardWidgets } from '../components/DashboardWidgets.js'
import { dashboardCache } from '../utils/cache.js'
import { addTouchFeedback } from '../utils/mobileInteractions.js'

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
      
      <div class="metrics-grid m-grid-2">
        ${[1,2,3,4].map(() => `
          <div class="metric-card m-card m-stat">
            <div class="skeleton skeleton-circle"></div>
            <div class="skeleton skeleton-text skeleton-xs"></div>
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
      const revenue = state.revenue || 0
      const revenueGoal = state.revenueGoal || 5400
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
      let trendIcon = '➡️'
      let trendColor = 'muted'
      if (revenueHistory.length >= 2) {
        const lastMonth = revenueHistory[revenueHistory.length - 1]?.value || 0
        const prevMonth = revenueHistory[revenueHistory.length - 2]?.value || 0
        if (lastMonth > prevMonth * 1.05) {
          trend = 'up'
          trendIcon = '📈'
          trendColor = 'success'
        } else if (lastMonth < prevMonth * 0.95) {
          trend = 'down'
          trendIcon = '📉'
          trendColor = 'danger'
        }
      }
      
      const lowStock = skus.filter(s => s.stock <= 5).length
      const onlinePrinters = printers.filter(p => p.status === 'operational' || p.status === 'printing' || p.status === 'idle').length
      const totalPrinters = printers.length || 3
      
      const recommendations = []
      
      if (overdueCount > 0) {
        recommendations.push({
          icon: '🔥',
          text: `${overdueCount} overdue`,
          subtext: 'priorities need attention',
          action: 'View',
          section: 'priorities',
          urgent: true
        })
      }
      
      if (dueSoonCount > 0) {
        recommendations.push({
          icon: '⏰',
          text: `${dueSoonCount} due soon`,
          subtext: 'within 3 days',
          action: 'Review',
          section: 'priorities',
          urgent: false
        })
      }
      
      if (lowStock > 0) {
        recommendations.push({
          icon: '📦',
          text: `${lowStock} low stock`,
          subtext: 'SKUs need restocking',
          action: 'Check',
          section: 'skus',
          urgent: false
        })
      }
      
      if (recommendations.length === 0) {
        recommendations.push({
          icon: '✨',
          text: 'All caught up!',
          subtext: 'Great job staying on top of things',
          action: null,
          section: null,
          urgent: false
        })
      }
      
      return `
        <div class="m-card insights-card">
          <div class="m-title">🤖 AI Insights</div>
          
          <div class="m-grid-2">
            <div class="m-stat m-touch insight-stat" onclick="showSection('revenue')" role="button" tabindex="0">
              <div class="m-title text-${trendColor}">${trendIcon}</div>
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
                <span class="recommendation-icon">${rec.icon}</span>
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
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar m-card">
        <div class="welcome-content">
          <div class="m-title welcome-greeting">${greeting}, Oleg</div>
          <div class="welcome-status">
            ${pendingPriorities > 0 
              ? `<span class="m-badge status-badge">${pendingPriorities} pending</span>` 
              : '<span class="m-badge status-badge status-success">✓ All caught up</span>'
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
      
      <!-- Enhanced Stats with Widgets -->
      <div class="m-grid-2 dashboard-stats-grid">
        ${dashboardWidgets.renderStatCard('Priorities', pendingPriorities, alerts > 0 ? 10 : -5, { 
          icon: '⭐', 
          subtitle: `${alerts} alerts`,
          onClick: 'showSection("priorities")'
        })}
        ${dashboardWidgets.renderStatCard('Projects', activeProjects, 0, { 
          icon: '📁',
          onClick: 'showSection("projects")'
        })}
        ${dashboardWidgets.renderStatCard('Orders', totalOrders, 0, { 
          icon: '💰',
          onClick: 'showSection("revenue")'
        })}
        ${dashboardWidgets.renderStatCard('SKUs', state.skus?.length || 0, 0, { 
          icon: '📦',
          onClick: 'showSection("skus")'
        })}
      </div>
      
      ${renderAIInsights()}
      
      <!-- Revenue Trend Widget -->
      <div class="m-card dashboard-card dashboard-card-revenue">
        <div class="dashboard-card-header">
          <div class="m-title dashboard-card-title">📈 Revenue Trend</div>
          <button class="m-touch dashboard-card-action" onclick="showSection('revenue')">View →</button>
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
      
      <!-- Quick Actions using Widget -->
      <div class="m-scroll-x quick-actions-container">
        ${dashboardWidgets.renderQuickActions([
          { icon: '➕', label: 'New Priority', primary: true, onClick: 'openPriorityModal()' },
          { icon: '📁', label: 'New Project', onClick: 'openProjectModal()' },
          { icon: '💰', label: 'Revenue', onClick: 'showSection("revenue")' },
          { icon: '🖨️', label: 'Printers', onClick: 'showSection("inventory")' },
          { icon: '📤', label: 'Export', onClick: 'dataManager.exportAll()' }
        ])}
      </div>
      
      <!-- Top Priorities -->
      <div class="m-card dashboard-card priorities-card">
        <div class="dashboard-card-header">
          <div class="m-title dashboard-card-title">⭐ Top Priorities</div>
          <button class="m-touch dashboard-card-action" onclick="showSection('priorities')">View All →</button>
        </div>
        
        ${topPriorities.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <div class="m-title empty-state-title">No active priorities</div>
            <div class="m-body empty-state-text">Create your first priority to get started</div>
            <button class="m-btn m-btn-primary m-touch" onclick="openPriorityModal()">➕ Create Priority</button>
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
                      ${p.completed ? '✓' : ''}
                    </div>
                    
                    <div class="priority-content">
                      <div class="m-body priority-text">${isBlocked ? '🔒 ' : ''}${p.text}</div>
                      <div class="m-caption priority-meta">
                        ${alert ? `<span class="m-badge alert-badge ${alert.type}">${alert.icon} ${alert.text}</span>` : ''}
                        ${p.dueDate ? `<span>📅 ${p.dueDate}</span>` : ''}
                      </div>
                    </div>
                    
                    <div class="priority-arrow">›</div>
                  </div>
                `
              }).join('')}
            </div>
          </div>
          
          ${topPriorities.length >= 5 ? `
            <div class="card-footer">
              <button class="m-touch m-btn btn-text" onclick="showSection('priorities')">View all priorities →</button>
            </div>
          ` : ''}
        `}
      </div>
      
      <!-- Quick Stats -->
      <div class="m-card activity-card">
        <div class="m-title">📊 Quick Stats</div>
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
