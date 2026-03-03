import { store } from '../state/store.js'
import { weather, clock } from '../utils/widgets.js'
import { getAlertCount, sortPriorities, getDueAlert } from '../utils/priority.js'
import { isPriorityBlocked } from '../utils/taskUtils.js'
import { filterByBoard, getCurrentBoardLabel } from '../components/BoardSelector.js'

export function createDashboardSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  let clockStarted = false
  
  function renderSkeleton() {
    return `
      <div class="welcome-bar">
        <div class="skeleton" style="width: 200px; height: 28px;"></div>
        <div class="skeleton" style="width: 80px; height: 36px;"></div>
      </div>
      
      <div class="metrics-grid">
        ${[1,2,3,4].map(() => `
          <div class="metric-card">
            <div class="skeleton" style="width: 40px; height: 32px; margin: 0 auto 0.5rem;"></div>
            <div class="skeleton" style="width: 60px; height: 16px; margin: 0 auto;"></div>
          </div>
        `).join('')}
      </div>
      
      <div class="card">
        <div class="skeleton" style="width: 150px; height: 24px; margin-bottom: 1rem;"></div>
        ${[1,2,3].map(() => `
          <div class="skeleton" style="width: 100%; height: 60px; margin-bottom: 0.5rem;"></div>
        `).join('')}
      </div>
    `
  }
  
  function renderAIInsights() {
    const state = store.getState()
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
    let trendColor = 'var(--text-muted)'
    if (revenueHistory.length >= 2) {
      const lastMonth = revenueHistory[revenueHistory.length - 1]?.value || 0
      const prevMonth = revenueHistory[revenueHistory.length - 2]?.value || 0
      if (lastMonth > prevMonth * 1.05) {
        trend = 'up'
        trendIcon = '📈'
        trendColor = 'var(--accent-success)'
      } else if (lastMonth < prevMonth * 0.95) {
        trend = 'down'
        trendIcon = '📉'
        trendColor = 'var(--accent-danger)'
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
      <div class="card insights-card">
        <div class="card-title">🤖 AI Insights</div>
        
        <!-- Mobile: 2 columns, Desktop: 4 columns -->
        <div class="insights-grid">
          <div class="insight-stat">
            <div class="insight-stat-value" style="color: ${trendColor};">${trendIcon}</div>
            <div class="insight-stat-label">Revenue ${trend}</div>
          </div>
          
          <div class="insight-stat">
            <div class="insight-stat-value">${(revenueProgress || 0).toFixed(0)}%</div>
            <div class="insight-stat-label">of $${monthlyRevenueGoal.toLocaleString()} monthly goal</div>
          </div>
          
          <div class="insight-stat">
            <div class="insight-stat-value ${onlinePrinters === totalPrinters ? 'text-success' : onlinePrinters === 0 ? 'text-danger' : 'text-warning'}">${onlinePrinters}/${totalPrinters}</div>
            <div class="insight-stat-label">Printers online</div>
          </div>
          
          <div class="insight-stat">
            <div class="insight-stat-value">${doneProjects}/${doneProjects + activeProjects}</div>
            <div class="insight-stat-label">Projects done</div>
          </div>
        </div>
        
        <div class="recommendations-list">
          ${recommendations.map(rec => `
            <div class="recommendation-item ${rec.urgent ? 'urgent' : ''}"
                 ${rec.section ? `onclick="showSection('${rec.section}')" style="cursor: pointer;"` : ''}>
              <span class="recommendation-icon">${rec.icon}</span>
              <div class="recommendation-content">
                <div class="recommendation-text">${rec.text}</div>
                <div class="recommendation-subtext">${rec.subtext}</div>
              </div>
              ${rec.action ? `
                <button class="btn btn-sm btn-primary recommendation-action">${rec.action}</button>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `
  }
  
  function render() {
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
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting">${greeting}, Oleg</div>
          <div class="welcome-status">
            ${pendingPriorities > 0 
              ? `<span class="status-badge">${pendingPriorities} pending</span>` 
              : '<span class="status-badge success">✓ All caught up</span>'
            }
            <span class="board-label">${getCurrentBoardLabel()}</span>
          </div>
        </div>
        <div class="welcome-time">
          <div id="clockDisplay" class="clock-display">--:--</div>
          <div id="weatherDisplay" class="weather-display">
            <span class="weather-loading">Loading...</span>
          </div>
        </div>
      </div>
      
      <!-- Board Selector -->
      <div id="boardSelector"></div>
      
      ${renderAIInsights()}
      
      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="quick-action-btn primary" onclick="openPriorityModal()">
          <span class="quick-action-icon">➕</span>
          <span class="quick-action-text">New Priority</span>
        </button>
        
        <button class="quick-action-btn" onclick="openProjectModal()">
          <span class="quick-action-icon">📁</span>
          <span class="quick-action-text">New Project</span>
        </button>
        
        <button class="quick-action-btn" onclick="showSection('revenue')">
          <span class="quick-action-icon">💰</span>
          <span class="quick-action-text">Revenue</span>
        </button>
        
        <button class="quick-action-btn" onclick="showSection('inventory')">
          <span class="quick-action-icon">🖨️</span>
          <span class="quick-action-text">Printers</span>
        </button>
      </div>
      
      <!-- Metrics -->
      <div class="metrics-grid">
        <div class="metric-card ${alerts > 0 ? 'has-alerts' : ''}" onclick="showSection('priorities')">
          <div class="metric-icon">${alerts > 0 ? '⚠️' : '⭐'}</div>
          <div class="metric-content">
            <div class="metric-value ${alerts > 0 ? 'text-danger' : ''}">${alerts > 0 ? alerts : pendingPriorities}</div>
            <div class="metric-label">${alerts > 0 ? `${alerts} Alert${alerts !== 1 ? 's' : ''}` : 'Priorities'}</div>
          </div>
        </div>
        
        <div class="metric-card" onclick="showSection('projects')">
          <div class="metric-icon">📁</div>
          <div class="metric-content">
            <div class="metric-value">${activeProjects}</div>
            <div class="metric-label">Active Projects</div>
          </div>
        </div>
        
        <div class="metric-card" onclick="showSection('revenue')">
          <div class="metric-icon">💰</div>
          <div class="metric-content">
            <div class="metric-value">${totalOrders}</div>
            <div class="metric-label">Orders</div>
          </div>
        </div>
        
        <div class="metric-card" onclick="showSection('skus')">
          <div class="metric-icon">📦</div>
          <div class="metric-content">
            <div class="metric-value">${state.skus?.length || 0}</div>
            <div class="metric-label">SKUs</div>
          </div>
        </div>
      </div>
      
      <!-- Activity Feed -->
      <div class="activity-feed">
        <div class="activity-feed-title">Recent Activity</div>
        <div class="activity-item">
          <div class="activity-icon">✓</div>
          <div class="activity-content">
            <div class="activity-text">Task completed: Website Redesign</div>
            <div class="activity-time">2 minutes ago</div>
          </div>
        </div>
        <div class="activity-item">
          <div class="activity-icon">🖨️</div>
          <div class="activity-content">
            <div class="activity-text">Print job started: Vase_Mode_Flower_Pot.gcode</div>
            <div class="activity-time">15 minutes ago</div>
          </div>
        </div>
        <div class="activity-item">
          <div class="activity-icon">📦</div>
          <div class="activity-content">
            <div class="activity-text">New order received: #1234</div>
            <div class="activity-time">1 hour ago</div>
          </div>
        </div>
      </div>
      
      <!-- Top Priorities -->
      <div class="card priorities-card">
        <div class="card-header">
          <div class="card-title">⭐ Top Priorities</div>
          <button class="btn btn-sm btn-text" onclick="showSection('priorities')">View All →</button>
        </div>
        
        ${topPriorities.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-title">No active priorities</div>
            <div class="empty-state-text">Create your first priority to get started</div>
            <button class="btn btn-primary" onclick="openPriorityModal()">➕ Create Priority</button>
          </div>
        ` : `
          <div class="priority-list">
            ${topPriorities.map(p => {
              const alert = getDueAlert(p)
              const isBlocked = isPriorityBlocked(p, state.priorities || [])
              return `
                <div class="priority-item ${alert?.type || ''} ${p.completed ? 'completed' : ''}"
                     style="${isBlocked ? 'opacity: 0.6;' : ''}">
                  
                  <label class="priority-checkbox ${p.completed ? 'checked' : ''}"
                         onclick="event.preventDefault(); togglePriority(${p.id})">
                    <input type="checkbox" ${p.completed ? 'checked' : ''}
                           ${isBlocked ? 'disabled' : ''}
                           style="position: absolute; opacity: 0;">
                    <span class="checkbox-visual">${p.completed ? '✓' : ''}</span>
                  </label>
                  
                  <div class="priority-content" onclick="openEditPriorityModal(${p.id})">
                    <div class="priority-title">
                      ${isBlocked ? '<span class="blocked-indicator" title="Blocked">🔒</span>' : ''}
                      ${p.text}
                    </div>
                    
                    <div class="priority-meta">
                      ${alert ? `
                        <span class="alert-badge ${alert.type}">
                          ${alert.type === 'overdue' ? '🔥' : '⏰'} ${alert.text}
                        </span>
                      ` : ''}
                      
                      ${p.dueDate ? `
                        <span class="meta-item">📅 ${p.dueDate}</span>
                      ` : ''}
                      
                      ${p.assignee ? `
                        <span class="meta-item assignee ${p.assignee}">
                          ${p.assignee === 'KimiClaw' ? '🤖' : '👤'} ${p.assignee}
                        </span>
                      ` : ''}
                      
                      ${p.board && p.board !== 'all' ? `
                        <span class="meta-item board">${getBoardEmoji(p.board)} ${p.board}</span>
                      ` : ''}
                      
                      ${p.tags?.length ? `
                        <span class="meta-item tags">${p.tags.slice(0, 2).map(t => `#${t}`).join(' ')}</span>
                      ` : ''}
                    </div>
                  </div>
                  
                  <button class="priority-menu-btn" onclick="event.stopPropagation();">⋮</button>
                </div>
              `
            }).join('')}
          </div>
          
          ${topPriorities.length >= 5 ? `
            <div class="card-footer">
              <button class="btn btn-text" onclick="showSection('priorities')">View all priorities →</button>
            </div>
          ` : ''}
        `}
      </div>
      
      <!-- Recent Activity (placeholder for future) -->
      <div class="card activity-card">
        <div class="card-header">
          <div class="card-title">📊 Quick Stats</div>
        </div>
        <div class="quick-stats">
          <div class="quick-stat">
            <div class="quick-stat-value">${state.priorities?.filter(p => p.completed).length || 0}</div>
            <div class="quick-stat-label">Completed today</div>
          </div>
          
          <div class="quick-stat">
            <div class="quick-stat-value">${state.projects?.done?.length || 0}</div>
            <div class="quick-stat-label">Projects done</div>
          </div>
          
          <div class="quick-stat">
            <div class="quick-stat-value">$${(state.revenue || 0).toLocaleString()}</div>
            <div class="quick-stat-label">Total revenue</div>
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
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('priorities') || path.includes('projects') || path.includes('currentBoard')) {
      render()
    }
  })
  
  render()
  
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
