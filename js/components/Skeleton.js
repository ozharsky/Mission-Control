// Skeleton Loading Component
// Shows placeholder content while data loads

export function createSkeleton(type = 'text', options = {}) {
  const { lines = 1, width = '100%', height = null } = options
  
  const baseClass = 'skeleton'
  
  switch (type) {
    case 'text':
      return `
        <div class="${baseClass}-text" style="width: ${width};">
          ${Array.from({ length: lines }, (_, i) => `
            <div class="${baseClass}-line" style="width: ${i === lines - 1 && lines > 1 ? '60%' : '100%'};"></div>
          `).join('')}
        </div>
      `
    
    case 'card':
      return `
        <div class="${baseClass}-card">
          <div class="${baseClass}-header">
            <div class="${baseClass}-avatar"></div>
            <div class="${baseClass}-title"></div>
          </div>
          <div class="${baseClass}-content">
            <div class="${baseClass}-line"></div>
            <div class="${baseClass}-line" style="width: 80%;"></div>
            <div class="${baseClass}-line" style="width: 60%;"></div>
          </div>
        </div>
      `
    
    case 'chart':
      return `
        <div class="${baseClass}-chart">
          <div class="${baseClass}-chart-bars">
            ${Array.from({ length: 12 }, () => `
              <div class="${baseClass}-bar" style="height: ${Math.random() * 60 + 20}%;"></div>
            `).join('')}
          </div>
        </div>
      `
    
    case 'table':
      return `
        <div class="${baseClass}-table">
          <div class="${baseClass}-row ${baseClass}-header">
            ${Array.from({ length: 4 }, () => `
              <div class="${baseClass}-cell"></div>
            `).join('')}
          </div>
          ${Array.from({ length: 5 }, () => `
            <div class="${baseClass}-row">
              ${Array.from({ length: 4 }, () => `
                <div class="${baseClass}-cell"></div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `
    
    case 'avatar':
      return `<div class="${baseClass}-avatar" style="width: ${width}; height: ${height || width};"></div>
      `
    
    default:
      return `<div class="${baseClass}" style="width: ${width}; height: ${height || '20px'};"></div>`
  }
}

// Create skeleton screen for entire section
export function createSkeletonScreen(type) {
  const screens = {
    dashboard: () => `
      <div class="skeleton-screen">
        <div class="skeleton-welcome">
          <div class="skeleton-title"></div>
          <div class="skeleton-badge"></div>
        </div>
        <div class="skeleton-metrics">
          ${Array.from({ length: 4 }, () => createSkeleton('card')).join('')}
        </div>
        <div class="skeleton-chart">
          ${createSkeleton('chart')}
        </div>
      </div>
    `,
    
    revenue: () => `
      <div class="skeleton-screen">
        <div class="skeleton-welcome"></div>
        <div class="skeleton-metrics">
          ${Array.from({ length: 4 }, () => createSkeleton('card')).join('')}
        </div>
        <div class="skeleton-chart-large">
          ${createSkeleton('chart')}
        </div>
      </div>
    `,
    
    inventory: () => `
      <div class="skeleton-screen">
        <div class="skeleton-welcome"></div>
        <div class="skeleton-grid">
          ${Array.from({ length: 3 }, () => createSkeleton('card')).join('')}
        </div>
      </div>
    `,
    
    table: () => `
      <div class="skeleton-screen">
        <div class="skeleton-welcome"></div>
        ${createSkeleton('table')}
      </div>
    `
  }
  
  return screens[type] ? screens[type]() : screens.dashboard()
}

// Show loading state for async operation
export function withLoading(asyncFn, options = {}) {
  const { 
    containerId, 
    skeletonType = 'dashboard',
    minDuration = 300 
  } = options
  
  const container = document.getElementById(containerId)
  const originalContent = container?.innerHTML
  
  // Show skeleton
  if (container) {
    container.innerHTML = createSkeletonScreen(skeletonType)
  }
  
  const startTime = Date.now()
  
  return asyncFn()
    .finally(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, minDuration - elapsed)
      
      // Ensure minimum display time
      setTimeout(() => {
        if (container && originalContent) {
          container.innerHTML = originalContent
        }
      }, remaining)
    })
}
