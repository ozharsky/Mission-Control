import { syncStorage } from '../storage/sync.js'

export function createStatusIndicator(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function render() {
    const status = syncStorage.getStatus()
    
    let statusText = 'Offline (Local)'
    let statusClass = 'offline'
    let icon = '⚪'
    
    if (status.firebase) {
      statusText = '🔥 Firebase Live'
      statusClass = 'online'
      icon = '🔥'
    } else if (status.github) {
      statusText = '🔗 GitHub Sync'
      statusClass = 'github'
      icon = '🔗'
    }
    
    container.innerHTML = `
      <div class="status-indicator ${statusClass}" style="
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-muted);
        padding: 0.25rem 0.5rem;
        border-radius: var(--radius-sm);
        background: var(--bg-tertiary);
      ">
        <span class="status-dot ${statusClass}" style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${statusClass === 'online' ? '#10b981' : statusClass === 'github' ? '#6366f1' : '#6b7280'};
          animation: ${statusClass !== 'offline' ? 'pulse 2s infinite' : 'none'};
        "></span>
        <span class="status-text">${statusText}</span>
      </div>
    `
  }
  
  // Update every 10 seconds
  setInterval(render, 10000)
  
  render()
  return { render }
}

// Add pulse animation
const style = document.createElement('style')
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`
document.head.appendChild(style)
