/**
 * Revenue Section - Financial tracking with charts and goals
 * Uses new design system with Card, Button, Badge components
 */

import { store } from '../state/store.js'
import { parseEtsyCSV, readFile } from '../utils/csv.js'
import { Toast } from '../components/Toast.js'
import { Card, StatCard } from '../components/Card.js'
import { Button } from '../components/Button.js'
import { Badge } from '../components/Badge.js'

let revenueChart = null
let isLoading = false
let chartRenderTimeout = null

/**
 * Calculate smart goals based on historical data
 * @param {Array} history - Revenue history array
 * @returns {Object} Monthly revenue and orders goals
 */
function calculateSmartGoals(history) {
  if (history.length === 0) {
    return { monthlyRevenueGoal: 500, monthlyOrdersGoal: 20 }
  }
  
  // Get last 3 months average
  const recent = history.slice(-3)
  const avgRevenue = recent.reduce((s, h) => s + h.value, 0) / recent.length
  const avgOrders = recent.reduce((s, h) => s + h.orders, 0) / recent.length
  
  // Set goals at 20% above average (ambitious but achievable)
  return {
    monthlyRevenueGoal: Math.max(Math.round(avgRevenue * 1.2), 300),
    monthlyOrdersGoal: Math.max(Math.round(avgOrders * 1.2), 10)
  }
}

/**
 * Create gradient for chart
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} color1 - Start color
 * @param {string} color2 - End color
 * @returns {CanvasGradient} Linear gradient
 */
function createGradient(ctx, color1, color2) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)
  return gradient
}

/**
 * Render the revenue chart using Chart.js
 * @param {Array} history - Revenue history data
 */
function renderRevenueChart(history) {
  const canvas = document.getElementById('revenueChart')
  if (!canvas || !history?.length) return
  
  // Debounce chart rendering to prevent flickering
  if (chartRenderTimeout) {
    clearTimeout(chartRenderTimeout)
  }
  
  chartRenderTimeout = setTimeout(() => {
    if (revenueChart) {
      revenueChart.destroy()
      revenueChart = null
    }
    
    if (typeof window.Chart === 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js'
      script.onload = () => createChart(canvas, history)
      document.head.appendChild(script)
    } else {
      createChart(canvas, history)
    }
  }, 50)
}

/**
 * Create Chart.js chart instance
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array} history - Revenue history data
 */
function createChart(canvas, history) {
  const ctx = canvas.getContext('2d')
  
  // Create gradients
  const revenueGradient = createGradient(ctx, 'rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.2)')
  
  revenueChart = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels: history.map(h => formatMonthLabel(h.month)),
      datasets: [
        {
          label: 'Revenue ($)',
          data: history.map(h => h.value),
          backgroundColor: revenueGradient,
          borderColor: '#6366f1',
          borderWidth: 2,
          borderRadius: 6,
          yAxisID: 'y',
          order: 2
        },
        {
          label: 'Orders',
          data: history.map(h => h.orders),
          type: 'line',
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          yAxisID: 'y1',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(26, 26, 46, 0.95)',
          titleColor: '#ffffff',
          bodyColor: 'rgba(255, 255, 255, 0.7)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              if (ctx.dataset.label === 'Revenue ($)') {
                return `Revenue: $${Number(ctx.parsed?.y || 0).toFixed(2)}`
              }
              return `Orders: ${ctx.parsed?.y || 0}`
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            font: { size: 11 }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: {
            color: 'rgba(255, 255, 255, 0.05)',
            drawBorder: false
          },
          ticks: {
            color: 'rgba(255, 255, 255, 0.5)',
            callback: v => '$' + v,
            font: { size: 11 }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { display: false },
          ticks: {
            color: '#22c55e',
            font: { size: 11 }
          }
        }
      }
    }
  })
}

/**
 * Format month label for display
 * @param {string} monthStr - Month string (YYYY-MM)
 * @returns {string} Formatted month label
 */
function formatMonthLabel(monthStr) {
  if (!monthStr) return ''
  const [year, month] = monthStr.split('-')
  if (!year || !month) return monthStr
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

/**
 * Create the Revenue section
 * @param {string} containerId - Container element ID
 * @returns {Object} Section controller with render method
 */
export function createRevenueSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function render() {
    const state = store.getState()
    const history = state.revenueHistory || []
    
    const now = new Date()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const current = history.find(h => h.month === currentMonthKey) || { value: 0, orders: 0, items: 0 }
    
    const totalRevenue = history.reduce((s, h) => s + (h.value || 0), 0)
    const totalOrders = history.reduce((s, h) => s + (h.orders || 0), 0)
    const totalItems = history.reduce((s, h) => s + (h.items || 0), 0)
    
    // Calculate smart goals based on historical data
    const { monthlyRevenueGoal, monthlyOrdersGoal } = calculateSmartGoals(history)
    
    // Calculate progress against SMART goals
    const revenueProgress = monthlyRevenueGoal > 0 ? Math.min((current.value / monthlyRevenueGoal) * 100, 100) : 0
    const revenueRemaining = Math.max(monthlyRevenueGoal - current.value, 0)
    const ordersProgress = monthlyOrdersGoal > 0 ? Math.min((current.orders / monthlyOrdersGoal) * 100, 100) : 0
    const ordersRemaining = Math.max(monthlyOrdersGoal - current.orders, 0)
    
    // Calculate trends (3-month vs previous 3-month)
    let trend = { direction: 'flat', percent: 0 }
    if (history.length >= 6) {
      const recent3 = history.slice(-3).reduce((s, h) => s + h.value, 0)
      const previous3 = history.slice(-6, -3).reduce((s, h) => s + h.value, 0)
      if (previous3 > 0) {
        const change = ((recent3 - previous3) / previous3) * 100
        trend = { direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat', percent: Math.abs(change) }
      }
    }
    
    // Find best month
    const bestMonth = history.length > 0 ? history.reduce((b, c) => c.value > b.value ? c : b) : null
    
    // Calculate projection to goal
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysRemaining = daysInMonth - now.getDate()
    const dailyRate = now.getDate() > 0 ? current.value / now.getDate() : 0
    const projectedRevenue = current.value + (dailyRate * daysRemaining)
    const onTrack = projectedRevenue >= monthlyRevenueGoal
    
    // Key metrics
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const avgMonthlyRevenue = history.length > 0 ? totalRevenue / history.length : 0
    
    // Build header section
    const headerSection = document.createElement('div')
    headerSection.className = 'section-header'
    headerSection.innerHTML = `
      <div class="section-header__content">
        <h1 class="section-header__title">
          <i data-lucide="dollar-sign"></i> Revenue
        </h1>
        <div class="section-header__badges">
          ${trend.direction !== 'flat' ? `
            <span class="badge badge--${trend.direction === 'up' ? 'success' : 'danger'}">
              <i data-lucide="trending-${trend.direction === 'up' ? 'up' : 'down'}"></i>
              ${trend.percent.toFixed(0)}% vs last quarter
            </span>
          ` : ''}
          ${onTrack && current.value > 0 ? `
            <span class="badge badge--success">
              <i data-lucide="check-circle"></i> On track
            </span>
          ` : current.value > 0 ? `
            <span class="badge badge--warning">
              <i data-lucide="alert-triangle"></i> Behind pace
            </span>
          ` : ''}
        </div>
      </div>
    `
    
    const importBtn = Button({
      text: 'Import from Etsy',
      variant: 'secondary',
      icon: 'folder-open',
      onClick: () => document.getElementById('revenueFileInput').click()
    })
    headerSection.querySelector('.section-header__content').appendChild(importBtn)
    
    // Hidden file input
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.id = 'revenueFileInput'
    fileInput.accept = '.csv'
    fileInput.style.display = 'none'
    fileInput.onchange = (e) => handleRevenueFileSelect(e.target)
    headerSection.appendChild(fileInput)
    
    // Stats grid
    const statsGrid = document.createElement('div')
    statsGrid.className = 'grid grid--2 mb-4'
    
    const statCards = [
      StatCard({
        title: 'Total Revenue',
        value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        change: avgOrderValue > 0 ? `$${avgOrderValue.toFixed(2)} avg order` : 'Import data',
        changeType: 'neutral',
        icon: 'dollar-sign'
      }),
      StatCard({
        title: 'Total Orders',
        value: totalOrders.toLocaleString(),
        change: `${totalItems} items sold`,
        changeType: 'neutral',
        icon: 'shopping-bag'
      }),
      StatCard({
        title: 'Avg/Month',
        value: `$${avgMonthlyRevenue.toFixed(0)}`,
        change: `Based on ${history.length} months`,
        changeType: 'neutral',
        icon: 'bar-chart-3'
      }),
      StatCard({
        title: 'Best Month',
        value: bestMonth ? formatMonthLabel(bestMonth.month) : '-',
        change: bestMonth ? `$${bestMonth.value.toFixed(0)} revenue` : 'No data',
        changeType: bestMonth ? 'positive' : 'neutral',
        icon: 'trophy'
      })
    ]
    
    statCards.forEach(card => statsGrid.appendChild(card))
    
    // Goals card
    const goalsCard = Card({
      header: { 
        title: "This Month's Goals",
        actions: Badge({ 
          text: `Based on ${history.length > 3 ? '3-month avg + 20%' : 'starter goals'}`,
          variant: 'neutral'
        })
      },
      body: createGoalsBody(revenueProgress, revenueRemaining, ordersProgress, ordersRemaining, 
                           monthlyRevenueGoal, monthlyOrdersGoal, daysRemaining, projectedRevenue)
    })
    
    // Clear container and append sections
    container.innerHTML = ''
    container.appendChild(headerSection)
    container.appendChild(statsGrid)
    container.appendChild(goalsCard)
    
    // Add chart and history if data exists
    if (history.length > 0) {
      // Chart card
      const chartCard = Card({
        header: { title: 'Revenue & Orders Trend' },
        body: (() => {
          const wrapper = document.createElement('div')
          wrapper.style.height = '300px'
          wrapper.style.position = 'relative'
          const canvas = document.createElement('canvas')
          canvas.id = 'revenueChart'
          wrapper.appendChild(canvas)
          return wrapper
        })()
      })
      container.appendChild(chartCard)
      
      // History table card
      const historyCard = Card({
        header: { 
          title: 'Monthly History',
          actions: Badge({ text: `${history.length} months tracked`, variant: 'neutral' })
        },
        body: createHistoryTable(history, currentMonthKey, bestMonth, totalOrders, totalItems, totalRevenue, avgOrderValue)
      })
      container.appendChild(historyCard)
      
      // Render chart after DOM update
      setTimeout(() => renderRevenueChart(history), 100)
    } else {
      // Empty state
      const emptyCard = createEmptyStateCard()
      container.appendChild(emptyCard)
    }
    
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }
  
  /**
   * Create goals progress body
   */
  function createGoalsBody(revenueProgress, revenueRemaining, ordersProgress, ordersRemaining,
                          monthlyRevenueGoal, monthlyOrdersGoal, daysRemaining, projectedRevenue) {
    const body = document.createElement('div')
    body.innerHTML = `
      <div class="progress-section mb-4">
        <div class="progress-header flex justify-between items-center mb-2">
          <span class="form-label">Revenue Goal: $${monthlyRevenueGoal.toLocaleString()}</span>
          <span class="font-semibold ${revenueProgress >= 100 ? 'text-success' : ''}">${revenueProgress.toFixed(0)}%</span>
        </div>
        <div class="progress-bar" style="height: 8px; background: var(--color-surface-hover); border-radius: var(--radius-full); overflow: hidden;">
          <div class="progress-fill ${revenueProgress >= 100 ? 'bg-success' : 'bg-primary'}" 
               style="height: 100%; width: ${Math.min(revenueProgress, 100)}%; transition: width var(--transition-slow);"></div>
        </div>
        <div class="progress-footer text-sm text-muted mt-2">
          ${revenueProgress >= 100 ? `
            <span class="text-success"><i data-lucide="party-popper"></i> Goal achieved!</span>
          ` : `
            $${revenueRemaining.toLocaleString()} more needed • ${daysRemaining} days left • Projected: $${projectedRevenue.toFixed(0)}
          `}
        </div>
      </div>
      
      <div class="progress-section">
        <div class="progress-header flex justify-between items-center mb-2">
          <span class="form-label">Orders Goal: ${monthlyOrdersGoal}</span>
          <span class="font-semibold ${ordersProgress >= 100 ? 'text-success' : ''}">${ordersProgress.toFixed(0)}%</span>
        </div>
        <div class="progress-bar" style="height: 8px; background: var(--color-surface-hover); border-radius: var(--radius-full); overflow: hidden;">
          <div class="progress-fill ${ordersProgress >= 100 ? 'bg-success' : 'bg-success'}" 
               style="height: 100%; width: ${Math.min(ordersProgress, 100)}%; transition: width var(--transition-slow);"></div>
        </div>
        <div class="progress-footer text-sm text-muted mt-2">
          ${ordersProgress >= 100 ? `
            <span class="text-success"><i data-lucide="party-popper"></i> Target achieved!</span>
          ` : `
            ${ordersRemaining} more orders needed
          `}
        </div>
      </div>
    `
    return body
  }
  
  /**
   * Create history table
   */
  function createHistoryTable(history, currentMonthKey, bestMonth, totalOrders, totalItems, totalRevenue, avgOrderValue) {
    const wrapper = document.createElement('div')
    wrapper.style.overflowX = 'auto'
    
    const table = document.createElement('table')
    table.className = 'data-table'
    table.style.width = '100%'
    table.style.borderCollapse = 'collapse'
    
    table.innerHTML = `
      <thead>
        <tr style="border-bottom: 1px solid var(--color-border);">
          <th style="text-align: left; padding: var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: var(--font-weight-medium);">Month</th>
          <th style="text-align: right; padding: var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: var(--font-weight-medium);">Orders</th>
          <th style="text-align: right; padding: var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: var(--font-weight-medium);">Items</th>
          <th style="text-align: right; padding: var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: var(--font-weight-medium);">Revenue</th>
          <th style="text-align: right; padding: var(--space-3); font-size: var(--font-size-sm); color: var(--color-text-muted); font-weight: var(--font-weight-medium);">Avg/Order</th>
        </tr>
      </thead>
      <tbody>
        ${history.slice().reverse().map(h => {
          const avg = h.orders > 0 ? h.value / h.orders : 0
          const isBest = bestMonth && h.month === bestMonth.month
          const isCurrent = h.month === currentMonthKey
          return `
            <tr style="border-bottom: 1px solid var(--color-border); ${isBest ? 'background: var(--color-success-light);' : ''} ${isCurrent ? 'background: var(--color-primary-light);' : ''}">
              <td style="padding: var(--space-3);">
                ${formatMonthLabel(h.month)}
                ${isBest ? '<span class="badge badge--success" style="margin-left: var(--space-2);"><i data-lucide="star" style="width: 12px; height: 12px;"></i> Best</span>' : ''}
                ${isCurrent ? '<span class="badge badge--primary" style="margin-left: var(--space-2);">Current</span>' : ''}
              </td>
              <td style="text-align: right; padding: var(--space-3);">${h.orders || 0}</td>
              <td style="text-align: right; padding: var(--space-3);">${h.items || 0}</td>
              <td style="text-align: right; padding: var(--space-3); color: var(--color-success); font-weight: var(--font-weight-medium);">$${(h.value || 0).toFixed(2)}</td>
              <td style="text-align: right; padding: var(--space-3);">$${avg.toFixed(2)}</td>
            </tr>
          `
        }).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight: var(--font-weight-semibold);">
          <td style="padding: var(--space-3);">Total/Avg</td>
          <td style="text-align: right; padding: var(--space-3);">${totalOrders}</td>
          <td style="text-align: right; padding: var(--space-3);">${totalItems}</td>
          <td style="text-align: right; padding: var(--space-3); color: var(--color-success);">$${totalRevenue.toFixed(2)}</td>
          <td style="text-align: right; padding: var(--space-3);">$${avgOrderValue.toFixed(2)}</td>
        </tr>
      </tfoot>
    `
    
    wrapper.appendChild(table)
    return wrapper
  }
  
  /**
   * Create empty state card
   */
  function createEmptyStateCard() {
    const body = document.createElement('div')
    body.className = 'empty-state'
    body.innerHTML = `
      <i data-lucide="bar-chart-3" class="empty-state__icon"></i>
      <h3 class="empty-state__title">No revenue data yet</h3>
      <p class="empty-state__message">
        Import your Etsy Orders CSV to see revenue trends and insights.<br>
        <strong>Go to:</strong> Etsy Shop Manager → Orders & Shipping → Download CSV
      </p>
    `
    
    const importBtn = Button({
      text: 'Import Orders CSV',
      variant: 'primary',
      icon: 'folder-open',
      onClick: () => document.getElementById('revenueFileInput').click()
    })
    importBtn.style.marginTop = 'var(--space-4)'
    body.appendChild(importBtn)
    
    return Card({ body })
  }
  
  /**
   * Handle file selection for revenue import
   */
  async function handleRevenueFileSelect(input) {
    const file = input.files[0]
    if (!file) return
    await processRevenueFile(file)
    input.value = ''
  }
  
  /**
   * Process the uploaded revenue CSV file
   */
  async function processRevenueFile(file) {
    if (isLoading) return
    isLoading = true
    
    try {
      Toast.info('Reading file...', 3000)
      const text = await readFile(file)
      
      Toast.info('Parsing CSV...', 3000)
      const rows = parseEtsyCSV(text)
      
      if (rows.length === 0) { 
        Toast.error('No valid data found in file')
        return
      }
      
      const totalRevenue = rows.reduce((sum, r) => sum + (r.net || 0), 0)
      const totalOrders = rows.length
      const totalItems = rows.reduce((sum, r) => sum + (r.items || 0), 0)
      
      const byMonth = {}
      rows.forEach(r => {
        if (!r.date) return
        if (!byMonth[r.date]) byMonth[r.date] = { value: 0, orders: 0, items: 0 }
        byMonth[r.date].value += r.net || 0
        byMonth[r.date].orders += 1
        byMonth[r.date].items += r.items || 0
      })
      
      const history = Object.entries(byMonth)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => new Date(a.month) - new Date(b.month))
      
      store.set('revenue', totalRevenue)
      store.set('orders', totalOrders)
      store.set('totalItems', totalItems)
      store.set('revenueHistory', history)
      
      Toast.success(`Import complete! ${totalOrders} orders, $${totalRevenue.toFixed(2)}`)
    } catch (err) {
      Toast.error('Import failed: ' + err.message)
    } finally {
      isLoading = false
    }
  }
  
  // Subscribe to store changes
  store.subscribe((state, path) => {
    if (!path || path.includes('revenue') || path.includes('orders') || path.includes('revenueHistory')) {
      render()
    }
  })
  
  render()
  return { render }
}

export default createRevenueSection
