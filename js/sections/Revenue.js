// Revenue Section - Improved with relevant metrics and better chart

import { store } from '../state/store.js'
import { parseEtsyCSV, readFile } from '../utils/csv.js'
import { toast } from '../components/Toast.js'
import { addTouchFeedback } from '../utils/mobileInteractions.js'

let revenueChart = null
let isLoading = false
let chartRenderTimeout = null

// Calculate realistic goals based on historical data
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

// Create gradient for chart
function createGradient(ctx, color1, color2) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)
  return gradient
}

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

function createChart(canvas, history) {
  const ctx = canvas.getContext('2d')
  
  // Create gradients
  const revenueGradient = createGradient(ctx, 'rgba(99, 102, 241, 0.8)', 'rgba(99, 102, 241, 0.2)')
  const revenueBorderGradient = createGradient(ctx, '#6366f1', '#8b5cf6')
  
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
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#10b981',
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
          backgroundColor: 'rgba(26, 26, 37, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(148, 163, 184, 0.2)',
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
            color: '#64748b',
            font: { size: 11 }
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#64748b',
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
            color: '#10b981',
            font: { size: 11 }
          }
        }
      }
    }
  })
}

function formatMonthLabel(monthStr) {
  if (!monthStr) return ''
  const [year, month] = monthStr.split('-')
  if (!year || !month) return monthStr
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

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
    const itemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0
    const avgMonthlyRevenue = history.length > 0 ? totalRevenue / history.length : 0
    
    container.innerHTML = `
      <div class="welcome-bar m-card">
        <div class="welcome-content">
          <div class="welcome-greeting m-title">💰 Revenue</div>
          <div class="welcome-status">
            ${trend.direction !== 'flat' ? `
              <span class="status-badge" style="background: ${trend.direction === 'up' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${trend.direction === 'up' ? 'var(--accent-success)' : 'var(--accent-danger)'};">
                ${trend.direction === 'up' ? '📈' : '📉'} ${trend.percent.toFixed(0)}% vs last quarter
              </span>
            ` : ''}
            ${onTrack && current.value > 0 ? `
              <span class="status-badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-success);">✅ On track</span>
            ` : current.value > 0 ? `
              <span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-warning);">⚠️ Behind pace</span>
            ` : ''}
          </div>
        </div>
        <button class="btn btn-sm btn-secondary m-touch" onclick="document.getElementById('revenueFileInput').click()">📁 Import</button>
      </div>
      
      <input type="file" id="revenueFileInput" accept=".csv" style="display: none;" onchange="handleRevenueFileSelect(this)">
      
      <!-- Key Metrics -->
      <div class="metrics-grid revenue-metrics m-grid-2">
        <div class="metric-card m-card">
          <div class="metric-value">$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div class="metric-label">Total Revenue</div>
          <div class="metric-sub">Lifetime earnings</div>
        </div>
        
        <div class="metric-card m-card">
          <div class="metric-value">${totalOrders.toLocaleString()}</div>
          <div class="metric-label">Total Orders</div>
          <div class="metric-sub">${avgOrderValue > 0 ? `$${avgOrderValue.toFixed(2)} avg order` : 'Import data'}</div>
        </div>
        
        <div class="metric-card m-card">
          <div class="metric-value">$${avgMonthlyRevenue.toFixed(0)}</div>
          <div class="metric-label">Avg/Month</div>
          <div class="metric-sub">Based on ${history.length} months</div>
        </div>
        
        <div class="metric-card m-card">
          <div class="metric-value">${bestMonth ? formatMonthLabel(bestMonth.month) : '-'}</div>
          <div class="metric-label">Best Month</div>
          <div class="metric-sub">${bestMonth ? `$${bestMonth.value.toFixed(0)} revenue` : 'No data'}</div>
        </div>
      </div>
      
      <!-- Monthly Goals (SMART goals based on history) -->
      <div class="card m-card">
        <div class="card-header">
          <div class="card-title m-title">🎯 This Month's Goals</div>
          <span class="goal-subtitle m-caption">Based on your ${history.length > 3 ? '3-month average + 20%' : 'starter goals'}</span>
        </div>
        
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">Revenue Goal: $${monthlyRevenueGoal.toLocaleString()}</span>
            <span class="progress-value ${revenueProgress >= 100 ? 'success' : ''}">${revenueProgress.toFixed(0)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill revenue ${revenueProgress >= 100 ? 'success' : ''}" style="width: ${Math.min(revenueProgress, 100)}%"></div>
          </div>
          <div class="progress-footer">
            ${revenueProgress >= 100 ? '🎉 Goal achieved!' : 
              `$${revenueRemaining.toLocaleString()} more needed • ${daysRemaining} days left • Projected: $${projectedRevenue.toFixed(0)}`}
          </div>
        </div>
        
        <div class="progress-section" style="margin-top: 1rem;">
          <div class="progress-header">
            <span class="progress-label">Orders Goal: ${monthlyOrdersGoal}</span>
            <span class="progress-value ${ordersProgress >= 100 ? 'success' : ''}">${ordersProgress.toFixed(0)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill orders ${ordersProgress >= 100 ? 'success' : ''}" style="width: ${Math.min(ordersProgress, 100)}%"></div>
          </div>
          <div class="progress-footer">
            ${ordersProgress >= 100 ? '🎉 Target achieved!' : `${ordersRemaining} more orders needed`}
          </div>
        </div>
      </div>
      
      ${history.length > 0 ? `
        <!-- Revenue Chart -->
        <div class="card m-card">
          <div class="card-header">
            <div class="card-title m-title">📈 Revenue & Orders Trend</div>
          </div>
          <div class="chart-container" style="max-width: 100%; overflow-x: auto;">
            <canvas id="revenueChart" style="max-width: 100%;"></canvas>
          </div>
        </div>
        
        <!-- Monthly History Table -->
        <div class="card m-card">
          <div class="card-header">
            <div class="card-title m-title">📋 Monthly History</div>
            <span class="history-count m-caption">${history.length} months tracked</span>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th class="numeric">Orders</th>
                  <th class="numeric">Items</th>
                  <th class="numeric">Revenue</th>
                  <th class="numeric">Avg/Order</th>
                </tr>
              </thead>
              <tbody>
                ${history.slice().reverse().map(h => {
                  const avg = h.orders > 0 ? h.value / h.orders : 0
                  const isBest = bestMonth && h.month === bestMonth.month
                  const isCurrent = h.month === currentMonthKey
                  return `<tr class="${isBest ? 'best-month' : ''} ${isCurrent ? 'current-month' : ''}">
                    <td>
                      ${formatMonthLabel(h.month)}
                      ${isBest ? '<span class="best-badge">★ Best</span>' : ''}
                      ${isCurrent ? '<span class="current-badge">Current</span>' : ''}
                    </td>
                    <td class="numeric">${h.orders || 0}</td>
                    <td class="numeric">${h.items || 0}</td>
                    <td class="numeric revenue">$${(h.value || 0).toFixed(2)}</td>
                    <td class="numeric">$${avg.toFixed(2)}</td>
                  </tr>`
                }).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>Total/Avg</strong></td>
                  <td class="numeric"><strong>${totalOrders}</strong></td>
                  <td class="numeric"><strong>${totalItems}</strong></td>
                  <td class="numeric revenue"><strong>$${totalRevenue.toFixed(2)}</strong></td>
                  <td class="numeric"><strong>$${avgOrderValue.toFixed(2)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ` : `
        <div class="empty-state m-card">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-title m-title">No revenue data yet</div>
          <div class="empty-state-text m-body">
            Import your Etsy Orders CSV to see revenue trends and insights.<br>
            <strong>Go to:</strong> Etsy Shop Manager → Orders & Shipping → Download CSV
          </div>
          <button class="btn btn-primary m-touch-lg" onclick="document.getElementById('revenueFileInput').click()">📁 Import Orders CSV</button>
        </div>
      `}
    `
    
    // Apply touch feedback to all interactive elements
    container.querySelectorAll('.m-touch, .m-touch-lg').forEach(addTouchFeedback)
    
    if (history.length > 0) {
      setTimeout(() => renderRevenueChart(history), 100)
    }
  }
  
  window.handleRevenueFileSelect = async (input) => {
    const file = input.files[0]
    if (!file) return
    await processRevenueFile(file)
    input.value = ''
  }
  
  async function processRevenueFile(file) {
    if (isLoading) return
    isLoading = true
    try {
      toast.info('Reading file...', file.name)
      const text = await readFile(file)
      toast.info('Parsing CSV...')
      const rows = parseEtsyCSV(text)
      if (rows.length === 0) { 
        toast.error('No valid data found')
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
      
      toast.success('Import complete!', `${totalOrders} orders, $${totalRevenue.toFixed(2)}`)
    } catch (err) {
      toast.error('Import failed', err.message)
    } finally {
      isLoading = false
    }
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('revenue') || path.includes('orders') || path.includes('revenueHistory')) {
      render()
    }
  })
  
  render()
  return { render }
}