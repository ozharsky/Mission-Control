// Chart.js Fallback
// Provides placeholder when Chart.js fails to load

import { icon } from './icons.js';

export function createChartFallback(canvas, data, options = {}) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height)
  
  // Draw placeholder message
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Chart unavailable - offline mode', width / 2, height / 2)
  
  // Draw simple bar representation
  if (data && data.labels && data.datasets) {
    const labels = data.labels
    const values = data.datasets[0]?.data || []
    const max = Math.max(...values, 1)
    
    const barWidth = (width - 60) / labels.length
    const barGap = 10
    const chartHeight = height - 80
    
    labels.forEach((label, i) => {
      const value = values[i] || 0
      const barHeight = (value / max) * chartHeight
      const x = 30 + i * (barWidth + barGap)
      const y = height - 40 - barHeight
      
      // Draw bar
      ctx.fillStyle = 'rgba(99, 102, 241, 0.6)'
      ctx.fillRect(x, y, barWidth - barGap, barHeight)
      
      // Draw label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.font = '10px sans-serif'
      ctx.fillText(label, x + (barWidth - barGap) / 2, height - 20)
    })
  }
}

// Check if Chart.js is available
export function isChartAvailable() {
  return typeof window.Chart !== 'undefined'
}

// Safe chart creator with fallback
export function createSafeChart(canvas, config) {
  if (isChartAvailable()) {
    return new window.Chart(canvas, config)
  } else {
    createChartFallback(canvas, config.data, config.options)
    return null
  }
}

// Show offline chart message
export function showOfflineChartMessage(container) {
  container.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 300px;
      color: var(--text-muted);
      text-align: center;
      padding: 2rem;
    ">
      <div style="font-size: 3rem; margin-bottom: 1rem; color: var(--accent-primary);">${icon('bar-chart-2', 'offline-chart-icon')}</div>
      <h3>Charts Unavailable Offline</h3>
      <p>Connect to the internet to view charts.</p>
      <button class="btn btn-secondary m-touch" onclick="window.location.reload()">
        ${icon('refresh-cw', 'btn-icon')} Retry
      </button>
    </div>
  `
}
