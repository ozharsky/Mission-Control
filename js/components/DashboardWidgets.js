// Dashboard Widgets - Reusable data visualization components
import { store } from '../state/store.js'

// Memoization cache for expensive computations
const memoCache = new Map()
const MEMO_TTL = 5000 // 5 seconds

function getMemoized(key, computeFn) {
  const cached = memoCache.get(key)
  if (cached && (Date.now() - cached.time) < MEMO_TTL) {
    return cached.value
  }
  const value = computeFn()
  memoCache.set(key, { value, time: Date.now() })
  return value
}

export const dashboardWidgets = {
  // Mini chart widget for trends
  renderSparkline(data, options = {}) {
    const { width = 120, height = 40, color = '#6366f1' } = options
    
    if (!data || data.length < 2) {
      return `<div style="width: ${width}px; height: ${height}px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.75rem;">No data</div>`
    }
    
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((val - min) / range) * height
      return `${x},${y}`
    }).join(' ')
    
    const trend = data[data.length - 1] > data[0] ? 'up' : 'down'
    const trendColor = trend === 'up' ? '#10b981' : '#ef4444'
    
    return `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true">
        <polyline fill="none" stroke="${color}" stroke-width="2" points="${points}"></polyline>
        <circle cx="${width}" cy="${height - ((data[data.length - 1] - min) / range) * height}" r="3" fill="${trendColor}"></circle>
      </svg>
    `
  },
  
  // Progress ring widget
  renderProgressRing(percentage, options = {}) {
    const { size = 60, strokeWidth = 6, color = '#6366f1' } = options
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" 
                fill="none" stroke="var(--bg-tertiary)" stroke-width="${strokeWidth}"></circle>
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" 
                fill="none" stroke="${color}" stroke-width="${strokeWidth}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                stroke-linecap="round"
                transform="rotate(-90 ${size/2} ${size/2})"
                style="transition: stroke-dashoffset 0.5s ease;"></circle>
        <text x="${size/2}" y="${size/2}" text-anchor="middle" dy="0.3em" 
              fill="var(--text-primary)" font-size="${size * 0.25}px" font-weight="600">${Math.round(percentage)}%</text>
      </svg>
    `
  },
  
  // Stat card widget
  renderStatCard(title, value, change, options = {}) {
    const { icon = '📊', trend = null, subtitle = '' } = options
    
    const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️'
    const trendColor = trend > 0 ? 'var(--accent-success)' : trend < 0 ? 'var(--accent-danger)' : 'var(--text-muted)'
    
    return `
      <div class="stat-card" ${options.onClick ? `onclick="${options.onClick}" tabindex="0" role="button"` : ''}>
        <div class="stat-header">
          <span class="stat-icon" aria-hidden="true">${icon}</span>
          ${trend !== null ? `<span class="stat-trend" style="color: ${trendColor}" aria-label="Trend ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable'}">${trendIcon} ${Math.abs(trend)}%</span>` : ''}
        </div>
        <div class="stat-value" aria-label="${title}: ${value}">${value}</div>
        <div class="stat-title">${title}</div>
        ${subtitle ? `<div class="stat-subtitle">${subtitle}</div>` : ''}
      </div>
    `
  },
  
  // Activity feed widget
  renderActivityFeed(activities, options = {}) {
    const { limit = 5, emptyMessage = 'No recent activity' } = options
    
    if (!activities || activities.length === 0) {
      return `<div class="activity-feed-empty">${emptyMessage}</div>`
    }
    
    const icons = {
      created: '➕',
      completed: '✅',
      updated: '✏️',
      deleted: '🗑️',
      assigned: '👤',
      commented: '💬'
    }
    
    return `
      <div class="activity-feed">
        ${activities.slice(0, limit).map(activity => `
          <div class="activity-item">
            <span class="activity-icon" aria-hidden="true">${icons[activity.action] || '📝'}</span>
            <div class="activity-content">
              <div class="activity-text">${activity.text}</div>
              <div class="activity-meta">
                <span>${activity.user || 'System'}</span>
                <span aria-hidden="true">•</span>
                <span>${this.timeAgo(activity.timestamp)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `
  },
  
  // Quick actions widget
  renderQuickActions(actions) {
    return `
      <div class="quick-actions" role="group" aria-label="Quick actions">
        ${actions.map((action, index) => `
          <button class="quick-action-btn ${action.primary ? 'primary' : ''}" 
                  onclick="${action.onClick}"
                  ${action.disabled ? 'disabled' : ''}
                  aria-label="${action.label}"
                  ${action.primary ? 'aria-pressed="true"' : ''}>
            <span class="quick-action-icon" aria-hidden="true">${action.icon}</span>
            <span class="quick-action-label">${action.label}</span>
          </button>
        `).join('')}
      </div>
    `
  },
  
  // Helper: Time ago with memoization
  timeAgo(timestamp) {
    if (!timestamp) return ''
    
    return getMemoized(`timeAgo-${timestamp}`, () => {
      const date = new Date(timestamp)
      const now = new Date()
      const seconds = Math.floor((now - date) / 1000)
      
      if (seconds < 60) return 'just now'
      const minutes = Math.floor(seconds / 60)
      if (minutes < 60) return `${minutes}m ago`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}h ago`
      const days = Math.floor(hours / 24)
      if (days < 7) return `${days}d ago`
      return date.toLocaleDateString()
    })
  },
  
  // Add widget styles
  addStyles() {
    if (document.getElementById('dashboardWidgetStyles')) return
    
    const styles = document.createElement('style')
    styles.id = 'dashboardWidgetStyles'
    styles.textContent = `
      .stat-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 1rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        position: relative;
        overflow: hidden;
      }
      
      .stat-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
        transition: left 0.5s;
      }
      
      .stat-card:hover::before {
        left: 100%;
      }
      
      .stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(99, 102, 241, 0.15);
        border-color: rgba(99, 102, 241, 0.3);
      }
      
      .stat-card:active {
        transform: translateY(-2px);
      }
      
      .stat-card:focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
      }
      
      @media (max-width: 768px) {
        .stat-card {
          padding: 0.875rem;
        }
        
        .stat-value {
          font-size: 1.5rem;
        }
        
        .stat-title {
          font-size: 0.8125rem;
        }
      }
      
      .stat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      
      .stat-icon {
        font-size: 1.5rem;
      }
      
      .stat-trend {
        font-size: 0.75rem;
        font-weight: 600;
      }
      
      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
      }
      
      .stat-title {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
      
      .stat-subtitle {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 0.25rem;
      }
      
      .activity-feed {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      
      .activity-feed-empty {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
      }
      
      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }
      
      .activity-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
      }
      
      .activity-content {
        flex: 1;
        min-width: 0;
      }
      
      .activity-text {
        color: var(--text-primary);
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }
      
      .activity-meta {
        font-size: 0.75rem;
        color: var(--text-secondary);
        display: flex;
        gap: 0.5rem;
      }
      
      .quick-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      .quick-action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .quick-action-btn:hover {
        background: var(--bg-tertiary);
      }
      
      .quick-action-btn:focus-visible {
        outline: 2px solid var(--accent-primary);
        outline-offset: 2px;
      }
      
      .quick-action-btn.primary {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
      }
      
      .quick-action-btn.primary:hover {
        background: var(--primary-hover);
      }
      
      .quick-action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .quick-action-icon {
        font-size: 1.125rem;
      }
      
      .quick-action-label {
        font-size: 0.875rem;
        font-weight: 500;
      }
    `
    document.head.appendChild(styles)
  }
}

// Expose globally
window.dashboardWidgets = dashboardWidgets
