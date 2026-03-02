import { syncStorage } from '../storage/sync.js'
import { icons } from '../utils/icons.js'

export function createStatusIndicator(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function render() {
    const status = syncStorage.getStatus()
    
    let statusText = 'Offline (Local)'
    let statusClass = 'offline'
    let statusIcon = icons.globe()
    let pulseAnimation = 'none'
    let glowColor = '#6b7280'
    
    if (status.firebase) {
      statusText = 'Firebase Live'
      statusClass = 'online'
      statusIcon = icons.flame()
      pulseAnimation = 'pulse 2s infinite'
      glowColor = '#10b981'
    } else if (status.github) {
      statusText = 'GitHub Sync'
      statusClass = 'github'
      statusIcon = icons.github()
      pulseAnimation = 'pulse 2s infinite'
      glowColor = '#6366f1'
    }
    
    container.innerHTML = `
      <div class="status-indicator ${statusClass} m-touch" style="
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-muted);
        padding: 0.375rem 0.625rem;
        border-radius: var(--radius-md);
        background: var(--bg-tertiary);
        border: 1px solid var(--border-color);
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        cursor: pointer;
        min-height: 44px;
      " title="Click to refresh connection">
        <span class="status-dot ${statusClass}" style="
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${glowColor};
          animation: ${pulseAnimation};
          box-shadow: ${statusClass !== 'offline' ? `0 0 8px ${glowColor}, 0 0 16px ${glowColor}40` : 'none'};
          transition: all 0.3s ease;
        "></span>
        <span class="status-icon" style="display: flex; align-items: center; width: 16px; height: 16px;">${statusIcon}</span>
        <span class="status-text" style="font-weight: 500;">${statusText}</span>
      </div>
    `
    
    // Add click handler for refresh
    const indicator = container.querySelector('.status-indicator')
    if (indicator) {
      indicator.addEventListener('click', () => {
        indicator.style.transform = 'scale(0.95)'
        setTimeout(() => {
          indicator.style.transform = 'scale(1)'
          syncStorage.checkConnection?.()
        }, 150)
      })
      
      // Hover effects
      indicator.addEventListener('mouseenter', () => {
        indicator.style.background = 'var(--bg-hover)'
        indicator.style.borderColor = 'var(--border-color-hover)'
      })
      
      indicator.addEventListener('mouseleave', () => {
        indicator.style.background = 'var(--bg-tertiary)'
        indicator.style.borderColor = 'var(--border-color)'
      })
    }
  }
  
  // Update every 10 seconds
  setInterval(render, 10000)
  
  render()
  return { render }
}

// Add enhanced styles
const style = document.createElement('style')
style.textContent = `
  @keyframes pulse {
    0%, 100% { 
      opacity: 1;
      transform: scale(1);
    }
    50% { 
      opacity: 0.7;
      transform: scale(1.15);
    }
  }
  
  @keyframes status-glow {
    0%, 100% { 
      box-shadow: 0 0 4px currentColor;
    }
    50% { 
      box-shadow: 0 0 12px currentColor, 0 0 20px currentColor;
    }
  }
  
  .status-indicator {
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  
  .status-indicator:active {
    transform: scale(0.95) !important;
  }
  
  .status-dot.online {
    animation: pulse 2s ease-in-out infinite, status-glow 2s ease-in-out infinite !important;
  }
  
  .status-dot.github {
    animation: pulse 2s ease-in-out infinite, status-glow 2s ease-in-out infinite !important;
  }
  
  /* Connection status transition */
  .status-indicator {
    position: relative;
    overflow: hidden;
  }
  
  .status-indicator::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.05),
      transparent
    );
    transition: left 0.5s ease;
  }
  
  .status-indicator:hover::after {
    left: 100%;
  }
`
document.head.appendChild(style)
