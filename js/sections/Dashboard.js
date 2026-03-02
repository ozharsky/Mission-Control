import { Button } from '../components/Button.js'
import { Card } from '../components/Card.js'
import { Badge, StatusBadge, PriorityBadge } from '../components/Badge.js'
import { Toast } from '../components/Toast.js'
import { store } from '../state/store.js'
import { getDueAlert, sortPriorities } from '../utils/priority.js'
import { isPriorityBlocked } from '../utils/taskUtils.js'

/**
 * Create Dashboard section with new design system
 * @param {string} containerId - Container element ID
 * @returns {Object} Dashboard controller with render method
 */
export function createDashboardSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`[Dashboard] Container #${containerId} not found`)
    return
  }

  let clockStarted = false

  /**
   * Get greeting based on time of day
   * @returns {string} Greeting message
   */
  function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  /**
   * Format currency value
   * @param {number} value - Value to format
   * @returns {string} Formatted currency string
   */
  function formatCurrency(value) {
    return `$${(value || 0).toLocaleString()}`
  }

  /**
   * Create welcome header with stats
   * @returns {HTMLElement} Welcome header element
   */
  function createWelcomeHeader() {
    const state = store.getState()
    const pendingPriorities = (state.priorities || []).filter(p => !p.completed).length
    const activePrinters = (state.printers || []).filter(p => 
      p.status === 'operational' || p.status === 'printing' || p.status === 'idle'
    ).length
    const totalPrinters = (state.printers || []).length
    const revenue = state.revenueHistory?.length > 0 
      ? state.revenueHistory[state.revenueHistory.length - 1].value 
      : 0

    const header = document.createElement('div')
    header.className = 'dashboard-header'

    const greeting = document.createElement('h1')
    greeting.className = 'dashboard-greeting'
    greeting.textContent = `${getGreeting()}, Oleg`
    header.appendChild(greeting)

    const statsRow = document.createElement('div')
    statsRow.className = 'dashboard-stats-row'

    // Active printers stat
    const printersStat = document.createElement('div')
    printersStat.className = 'dashboard-stat'
    printersStat.innerHTML = `
      <span class="dashboard-stat-value">${activePrinters}/${totalPrinters || 0}</span>
      <span class="dashboard-stat-label">Printers</span>
    `
    printersStat.addEventListener('click', () => {
      if (window.showSection) window.showSection('inventory')
    })
    statsRow.appendChild(printersStat)

    // Revenue stat
    const revenueStat = document.createElement('div')
    revenueStat.className = 'dashboard-stat'
    revenueStat.innerHTML = `
      <span class="dashboard-stat-value">${formatCurrency(revenue)}</span>
      <span class="dashboard-stat-label">Revenue</span>
    `
    revenueStat.addEventListener('click', () => {
      if (window.showSection) window.showSection('revenue')
    })
    statsRow.appendChild(revenueStat)

    // Pending priorities stat
    const prioritiesStat = document.createElement('div')
    prioritiesStat.className = 'dashboard-stat'
    prioritiesStat.innerHTML = `
      <span class="dashboard-stat-value">${pendingPriorities}</span>
      <span class="dashboard-stat-label">Priorities</span>
    `
    prioritiesStat.addEventListener('click', () => {
      if (window.showSection) window.showSection('priorities')
    })
    statsRow.appendChild(prioritiesStat)

    header.appendChild(statsRow)

    // Status badges row
    const badgesRow = document.createElement('div')
    badgesRow.className = 'dashboard-badges-row'

    if (pendingPriorities > 0) {
      badgesRow.appendChild(Badge({
        text: `${pendingPriorities} pending`,
        variant: 'warning',
        icon: 'clock'
      }))
    } else {
      badgesRow.appendChild(Badge({
        text: 'All caught up',
        variant: 'success',
        icon: 'check-circle'
      }))
    }

    header.appendChild(badgesRow)

    return header
  }

  /**
   * Create quick actions section
   * @returns {HTMLElement} Quick actions card
   */
  function createQuickActions() {
    const actions = [
      { 
        icon: 'plus', 
        label: 'New Priority', 
        variant: 'primary',
        onClick: () => {
          if (window.openPriorityModal) {
            window.openPriorityModal()
          } else {
            Toast.info('Priority modal not available')
          }
        }
      },
      { 
        icon: 'folder-plus', 
        label: 'New Project', 
        variant: 'secondary',
        onClick: () => {
          if (window.openProjectModal) {
            window.openProjectModal()
          } else {
            Toast.info('Project modal not available')
          }
        }
      },
      { 
        icon: 'dollar-sign', 
        label: 'Revenue', 
        variant: 'secondary',
        onClick: () => {
          if (window.showSection) window.showSection('revenue')
        }
      },
      { 
        icon: 'printer', 
        label: 'Printers', 
        variant: 'secondary',
        onClick: () => {
          if (window.showSection) window.showSection('inventory')
        }
      }
    ]

    const buttonsContainer = document.createElement('div')
    buttonsContainer.className = 'quick-actions-grid'

    actions.forEach(action => {
      buttonsContainer.appendChild(Button({
        text: action.label,
        variant: action.variant,
        icon: action.icon,
        onClick: action.onClick
      }))
    })

    return Card({
      header: { title: 'Quick Actions' },
      body: buttonsContainer
    })
  }

  /**
   * Create active printers grid
   * @returns {HTMLElement} Printers grid card
   */
  function createActivePrintersGrid() {
    const state = store.getState()
    const printers = (state.printers || []).slice(0, 6) // Show up to 6 printers

    if (printers.length === 0) {
      return Card({
        header: { title: 'Active Printers' },
        body: createEmptyState('No printers configured', 'Add printers to monitor their status')
      })
    }

    const grid = document.createElement('div')
    grid.className = 'printers-mini-grid'

    printers.forEach(printer => {
      const isPrinting = printer.status === 'printing'
      const isError = printer.status === 'error' || printer.status === 'offline'
      
      const printerCard = document.createElement('div')
      printerCard.className = `printer-mini-card ${printer.status}`
      
      printerCard.innerHTML = `
        <div class="printer-mini-header">
          <span class="printer-mini-name">${printer.name}</span>
        </div>
        <div class="printer-mini-status">
          ${StatusBadge(printer.status || 'idle').outerHTML}
        </div>
        ${isPrinting && printer.progress > 0 ? `
          <div class="printer-mini-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${printer.progress}%"></div>
            </div>
            <span class="progress-text">${printer.progress}%</span>
          </div>
        ` : ''}
        <div class="printer-mini-temps">
          <span><i data-lucide="flame"></i> ${printer.temp || 0}°C</span>
          <span><i data-lucide="layers"></i> ${printer.bedTemp || 0}°C</span>
        </div>
      `
      
      printerCard.addEventListener('click', () => {
        if (window.showSection) window.showSection('inventory')
      })
      
      grid.appendChild(printerCard)
    })

    return Card({
      header: { 
        title: 'Active Printers',
        actions: [
          Button({
            text: 'View All',
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              if (window.showSection) window.showSection('inventory')
            }
          })
        ]
      },
      body: grid
    })
  }

  /**
   * Create recent priorities list
   * @returns {HTMLElement} Priorities card
   */
  function createRecentPriorities() {
    const state = store.getState()
    let priorities = sortPriorities(state.priorities || [])
      .filter(p => !p.completed)
      .slice(0, 5)

    if (priorities.length === 0) {
      const emptyActions = document.createElement('div')
      emptyActions.appendChild(Button({
        text: 'Create Priority',
        variant: 'primary',
        icon: 'plus',
        onClick: () => {
          if (window.openPriorityModal) window.openPriorityModal()
        }
      }))

      return Card({
        header: { title: 'Top Priorities' },
        body: createEmptyState('No active priorities', 'Create your first priority to get started'),
        footer: { content: emptyActions, align: 'center' }
      })
    }

    const list = document.createElement('div')
    list.className = 'priorities-list'

    priorities.forEach(priority => {
      const alert = getDueAlert(priority)
      const isBlocked = isPriorityBlocked(priority, state.priorities || [])

      const item = document.createElement('div')
      item.className = `priority-list-item ${alert?.type || ''} ${isBlocked ? 'blocked' : ''}`
      
      item.innerHTML = `
        <div class="priority-checkbox ${priority.completed ? 'checked' : ''}">
          ${priority.completed ? '<i data-lucide="check"></i>' : ''}
        </div>
        <div class="priority-content">
          <div class="priority-text">${isBlocked ? '<i data-lucide="lock"></i> ' : ''}${priority.text}</div>
          <div class="priority-meta">
            ${alert ? `<span class="alert-badge ${alert.type}">${alert.text}</span>` : ''}
            ${priority.dueDate ? `<span><i data-lucide="calendar"></i> ${priority.dueDate}</span>` : ''}
          </div>
        </div>
        <i data-lucide="chevron-right" class="priority-arrow"></i>
      `

      item.addEventListener('click', (e) => {
        // Don't open edit if clicking checkbox
        if (e.target.closest('.priority-checkbox')) {
          e.stopPropagation()
          togglePriority(priority.id)
          return
        }
        if (window.openEditPriorityModal) {
          window.openEditPriorityModal(priority.id)
        }
      })

      list.appendChild(item)
    })

    return Card({
      header: { 
        title: 'Top Priorities',
        actions: [
          Button({
            text: 'View All',
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              if (window.showSection) window.showSection('priorities')
            }
          })
        ]
      },
      body: list
    })
  }

  /**
   * Create revenue mini chart
   * @returns {HTMLElement} Revenue card
   */
  function createRevenueChart() {
    const state = store.getState()
    const revenueHistory = state.revenueHistory || []
    const currentRevenue = revenueHistory.length > 0 
      ? revenueHistory[revenueHistory.length - 1].value 
      : 0
    const monthlyGoal = 450
    const progress = Math.min((currentRevenue / monthlyGoal) * 100, 100)

    // Simple sparkline using CSS
    const sparklineData = revenueHistory.slice(-7).map(h => h.value)
    const maxValue = Math.max(...sparklineData, 1)
    const minValue = Math.min(...sparklineData, 0)
    const range = maxValue - minValue || 1

    const chartContainer = document.createElement('div')
    chartContainer.className = 'revenue-chart-container'

    const sparkline = document.createElement('div')
    sparkline.className = 'revenue-sparkline'
    
    if (sparklineData.length > 1) {
      const points = sparklineData.map((value, index) => {
        const x = (index / (sparklineData.length - 1)) * 100
        const y = 100 - ((value - minValue) / range) * 80 - 10
        return `${x},${y}`
      }).join(' ')

      sparkline.innerHTML = `
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points="${points}" fill="none" stroke="var(--color-success)" stroke-width="2"/>
          ${sparklineData.map((value, index) => {
            const x = (index / (sparklineData.length - 1)) * 100
            const y = 100 - ((value - minValue) / range) * 80 - 10
            return `<circle cx="${x}" cy="${y}" r="2" fill="var(--color-success)"/>`
          }).join('')}
        </svg>
      `
    } else {
      sparkline.innerHTML = '<div class="text-muted">Not enough data</div>'
    }

    const stats = document.createElement('div')
    stats.className = 'revenue-stats'
    stats.innerHTML = `
      <div class="revenue-stat">
        <span class="revenue-value">${formatCurrency(currentRevenue)}</span>
        <span class="revenue-label">This month</span>
      </div>
      <div class="revenue-progress-ring">
        <svg viewBox="0 0 36 36">
          <path class="progress-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
          <path class="progress-ring-fill" stroke-dasharray="${progress}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
        </svg>
        <span class="progress-ring-text">${Math.round(progress)}%</span>
      </div>
    `

    chartContainer.appendChild(sparkline)
    chartContainer.appendChild(stats)

    return Card({
      header: { 
        title: 'Revenue Trend',
        actions: [
          Button({
            text: 'Details',
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              if (window.showSection) window.showSection('revenue')
            }
          })
        ]
      },
      body: chartContainer
    })
  }

  /**
   * Create empty state element
   * @param {string} title - Empty state title
   * @param {string} message - Empty state message
   * @returns {HTMLElement} Empty state element
   */
  function createEmptyState(title, message) {
    const empty = document.createElement('div')
    empty.className = 'empty-state'
    empty.innerHTML = `
      <i data-lucide="inbox" class="empty-state-icon"></i>
      <h3 class="empty-state-title">${title}</h3>
      <p class="empty-state-message">${message}</p>
    `
    return empty
  }

  /**
   * Toggle priority completion status
   * @param {number} id - Priority ID
   */
  function togglePriority(id) {
    const priorities = store.get('priorities')
    const priority = priorities.find(p => p.id === id)
    if (priority && !isPriorityBlocked(priority, priorities)) {
      priority.completed = !priority.completed
      priority.status = priority.completed ? 'done' : 'later'
      if (priority.completed) {
        priority.completedAt = new Date().toISOString()
        Toast.success('Priority completed!')
      }
      store.set('priorities', priorities)
    }
  }

  /**
   * Render the dashboard
   */
  function render() {
    try {
      // Clear container
      container.innerHTML = ''

      // Create dashboard layout
      const dashboard = document.createElement('div')
      dashboard.className = 'dashboard-container'

      // Welcome header
      dashboard.appendChild(createWelcomeHeader())

      // Quick actions
      dashboard.appendChild(createQuickActions())

      // Two column layout for desktop
      const gridSection = document.createElement('div')
      gridSection.className = 'dashboard-grid'

      // Active printers
      gridSection.appendChild(createActivePrintersGrid())

      // Recent priorities
      gridSection.appendChild(createRecentPriorities())

      dashboard.appendChild(gridSection)

      // Revenue chart
      dashboard.appendChild(createRevenueChart())

      container.appendChild(dashboard)

      // Initialize Lucide icons
      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons()
      }

      Toast.success('Dashboard loaded')

    } catch (err) {
      console.error('[Dashboard] Render error:', err)
      container.innerHTML = `
        <div class="error-state">
          <i data-lucide="alert-circle"></i>
          <h3>Error loading dashboard</h3>
          <p>Please refresh the page</p>
        </div>
      `
    }
  }

  // Subscribe to store updates
  const unsubscribe = store.subscribe((state, path) => {
    if (!path || 
        path.includes('priorities') || 
        path.includes('projects') || 
        path.includes('printers') ||
        path.includes('revenueHistory')) {
      render()
    }
  })

  // Initial render
  render()

  // Expose togglePriority globally
  window.togglePriority = togglePriority

  return { 
    render,
    destroy: () => {
      unsubscribe()
    }
  }
}

export default createDashboardSection
