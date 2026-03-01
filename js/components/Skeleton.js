// Skeleton Loading Component
// Shows placeholder content while data loads

export function createSkeleton(type = 'text', options = {}) {
  const { lines = 1, width = '100%', height = null, animated = true } = options
  
  const baseClass = 'skeleton'
  const animationClass = animated ? '' : ' skeleton-static'
  
  switch (type) {
    case 'text':
      return `
        <div class="${baseClass}-text${animationClass}" style="width: ${width};">
          ${Array.from({ length: lines }, (_, i) => `
            <div class="${baseClass}-line" style="width: ${i === lines - 1 && lines > 1 ? '60%' : '100%'};"></div>
          `).join('')}
        </div>
      `
    
    case 'card':
      return `
        <div class="${baseClass}-card${animationClass}">
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
        <div class="${baseClass}-chart${animationClass}">
          <div class="${baseClass}-chart-bars">
            ${Array.from({ length: 12 }, () => `
              <div class="${baseClass}-bar" style="height: ${Math.random() * 60 + 20}%;"></div>
            `).join('')}
          </div>
        </div>
      `
    
    case 'table':
      return `
        <div class="${baseClass}-table${animationClass}">
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
      return `<div class="${baseClass}-avatar${animationClass}" style="width: ${width}; height: ${height || width};"></div>`
    
    case 'list':
      const listItems = options.items || 5
      return `
        <div class="${baseClass}-list${animationClass}">
          ${Array.from({ length: listItems }, () => `
            <div class="${baseClass}-list-item">
              <div class="${baseClass}-avatar ${baseClass}-avatar-sm"></div>
              <div class="${baseClass}-text" style="flex: 1;">
                <div class="${baseClass}-line" style="width: 70%;"></div>
                <div class="${baseClass}-line" style="width: 40%; margin-top: 4px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `
    
    case 'form':
      const formFields = options.fields || 4
      return `
        <div class="${baseClass}-form${animationClass}">
          ${Array.from({ length: formFields }, () => `
            <div class="${baseClass}-form-field">
              <div class="${baseClass}-form-label"></div>
              <div class="${baseClass}-form-input"></div>
            </div>
          `).join('')}
        </div>
      `
    
    case 'image':
      return `<div class="${baseClass}-image${animationClass}" style="width: ${width}; height: ${height || '200px'};"></div>`
    
    case 'dots':
      return `
        <div class="${baseClass}-pulse-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `
    
    default:
      return `<div class="${baseClass}${animationClass}" style="width: ${width}; height: ${height || '20px'};"></div>`
  }
}

// Create skeleton screen for entire section
export function createSkeletonScreen(type, options = {}) {
  const { animated = true } = options
  const animationClass = animated ? '' : ' skeleton-static'
  
  const screens = {
    dashboard: () => `
      <div class="skeleton-screen${animationClass}">
        <div class="skeleton-welcome">
          <div class="skeleton-title"></div>
          <div class="skeleton-badge"></div>
        </div>
        <div class="skeleton-metrics">
          ${Array.from({ length: 4 }, () => createSkeleton('card', { animated })).join('')}
        </div>
        <div class="skeleton-chart">
          ${createSkeleton('chart', { animated })}
        </div>
      </div>
    `,
    
    revenue: () => `
      <div class="skeleton-screen${animationClass}">
        <div class="skeleton-welcome"></div>
        <div class="skeleton-metrics">
          ${Array.from({ length: 4 }, () => createSkeleton('card', { animated })).join('')}
        </div>
        <div class="skeleton-chart-large">
          ${createSkeleton('chart', { animated })}
        </div>
      </div>
    `,
    
    inventory: () => `
      <div class="skeleton-screen${animationClass}">
        <div class="skeleton-welcome"></div>
        <div class="skeleton-grid">
          ${Array.from({ length: 3 }, () => createSkeleton('card', { animated })).join('')}
        </div>
      </div>
    `,
    
    table: () => `
      <div class="skeleton-screen${animationClass}">
        <div class="skeleton-welcome"></div>
        ${createSkeleton('table', { animated })}
      </div>
    `,
    
    list: () => `
      <div class="skeleton-screen${animationClass}">
        <div class="skeleton-welcome"></div>
        ${createSkeleton('list', { items: 8, animated })}
      </div>
    `,
    
    form: () => `
      <div class="skeleton-screen${animationClass}">
        <div class="skeleton-welcome"></div>
        ${createSkeleton('form', { fields: 6, animated })}
      </div>
    `
  }
  
  return screens[type] ? screens[type]() : screens.dashboard()
}

// Show loading state for async operation with progress
export function withLoading(asyncFn, options = {}) {
  const { 
    containerId, 
    skeletonType = 'dashboard',
    minDuration = 300,
    showProgress = false,
    onProgress = null
  } = options
  
  const container = document.getElementById(containerId)
  const originalContent = container?.innerHTML
  
  // Show skeleton
  if (container) {
    container.innerHTML = createSkeletonScreen(skeletonType)
    container.classList.add('skeleton-loading')
  }
  
  const startTime = Date.now()
  let progressInterval
  
  // Simulate progress if requested
  if (showProgress && onProgress) {
    let progress = 0
    progressInterval = setInterval(() => {
      progress += Math.random() * 15
      if (progress > 90) progress = 90
      onProgress(Math.min(progress, 100))
    }, 200)
  }
  
  return asyncFn()
    .then(result => {
      if (progressInterval) clearInterval(progressInterval)
      if (showProgress && onProgress) onProgress(100)
      return result
    })
    .finally(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, minDuration - elapsed)
      
      // Ensure minimum display time
      setTimeout(() => {
        if (container) {
          container.classList.remove('skeleton-loading')
          container.classList.add('skeleton-fade-out')
          
          setTimeout(() => {
            if (originalContent) {
              container.innerHTML = originalContent
            }
            container.classList.remove('skeleton-fade-out')
          }, 300)
        }
      }, remaining)
    })
}

// Create a loading overlay
export function createLoadingOverlay(message = 'Loading...') {
  const overlay = document.createElement('div')
  overlay.className = 'loading-overlay'
  overlay.innerHTML = `
    <div class="loading-content">
      <div class="skeleton-pulse-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <p class="loading-message">${message}</p>
    </div>
  `
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 15, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
  `
  
  document.body.appendChild(overlay)
  
  // Trigger animation
  requestAnimationFrame(() => {
    overlay.style.opacity = '1'
  })
  
  return {
    element: overlay,
    updateMessage: (newMessage) => {
      const msgEl = overlay.querySelector('.loading-message')
      if (msgEl) msgEl.textContent = newMessage
    },
    remove: () => {
      overlay.style.opacity = '0'
      setTimeout(() => overlay.remove(), 300)
    }
  }
}
