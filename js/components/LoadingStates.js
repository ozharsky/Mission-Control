/**
 * Enhanced Loading States
 * Skeleton screens, progress indicators, and loading overlays
 */

class LoadingStates {
  constructor() {
    this.activeLoaders = new Map()
    this.skeletons = new Map()
  }

  /**
   * Show a skeleton loading screen
   * @param {string} containerId - Container element ID
   * @param {Object} options - Options
   */
  showSkeleton(containerId, options = {}) {
    const container = document.getElementById(containerId)
    if (!container) {
      console.warn(`Container #${containerId} not found`)
      return
    }

    const { 
      type = 'card', 
      count = 1,
      preserveContent = false 
    } = options

    // Store original content if preserving
    if (preserveContent && !this.skeletons.has(containerId)) {
      this.skeletons.set(containerId, container.innerHTML)
    }

    const skeletonHTML = this.getSkeletonHTML(type, count)
    container.innerHTML = skeletonHTML
    container.setAttribute('data-loading', 'true')

    return {
      hide: () => this.hideSkeleton(containerId, preserveContent)
    }
  }

  /**
   * Hide skeleton and restore content
   * @param {string} containerId - Container element ID
   * @param {boolean} restoreContent - Whether to restore original content
   */
  hideSkeleton(containerId, restoreContent = false) {
    const container = document.getElementById(containerId)
    if (!container) return

    container.removeAttribute('data-loading')

    if (restoreContent && this.skeletons.has(containerId)) {
      container.innerHTML = this.skeletons.get(containerId)
      this.skeletons.delete(containerId)
    }
  }

  /**
   * Get skeleton HTML based on type
   * @param {string} type - Skeleton type
   * @param {number} count - Number of skeletons
   * @returns {string} Skeleton HTML
   */
  getSkeletonHTML(type, count) {
    const skeletons = {
      card: `
        <div class="skeleton-card">
          <div class="skeleton skeleton-title"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        </div>
      `,
      list: `
        <div class="skeleton-list">
          <div class="skeleton skeleton-item">
            <div class="skeleton skeleton-avatar"></div>
            <div class="skeleton skeleton-content">
              <div class="skeleton skeleton-line"></div>
              <div class="skeleton skeleton-line short"></div>
            </div>
          </div>
        </div>
      `,
      table: `
        <div class="skeleton-table">
          <div class="skeleton skeleton-row header">
            <div class="skeleton skeleton-cell"></div>
            <div class="skeleton skeleton-cell"></div>
            <div class="skeleton skeleton-cell"></div>
          </div>
          <div class="skeleton skeleton-row">
            <div class="skeleton skeleton-cell"></div>
            <div class="skeleton skeleton-cell"></div>
            <div class="skeleton skeleton-cell"></div>
          </div>
        </div>
      `,
      stats: `
        <div class="skeleton-stats">
          <div class="skeleton skeleton-stat">
            <div class="skeleton skeleton-circle"></div>
            <div class="skeleton skeleton-value"></div>
          </div>
        </div>
      `,
      dashboard: `
        <div class="skeleton-dashboard">
          <div class="skeleton skeleton-header"></div>
          <div class="skeleton skeleton-metrics">
            <div class="skeleton skeleton-metric"></div>
            <div class="skeleton skeleton-metric"></div>
            <div class="skeleton skeleton-metric"></div>
            <div class="skeleton skeleton-metric"></div>
          </div>
          <div class="skeleton skeleton-content"></div>
        </div>
      `
    }

    const template = skeletons[type] || skeletons.card
    return Array(count).fill(template).join('')
  }

  /**
   * Show a loading overlay
   * @param {string} targetId - Target element ID (or 'body' for full page)
   * @param {Object} options - Options
   * @returns {Object} Loader controller
   */
  showOverlay(targetId = 'body', options = {}) {
    const { 
      message = 'Loading...', 
      spinner = true,
      blur = true,
      progress = null 
    } = options

    const target = targetId === 'body' ? document.body : document.getElementById(targetId)
    if (!target) {
      console.warn(`Target #${targetId} not found`)
      return { hide: () => {} }
    }

    const id = `loader-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const overlay = document.createElement('div')
    overlay.id = id
    overlay.className = `loading-overlay ${blur ? 'with-blur' : ''}`
    overlay.setAttribute('role', 'status')
    overlay.setAttribute('aria-live', 'polite')
    overlay.innerHTML = `
      <div class="loading-content">
        ${spinner ? `<div class="loading-spinner" aria-hidden="true">
          <svg viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="4">
              <animate attributeName="stroke-dasharray" values="1,150;90,150;90,150" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" values="0;-35;-124" dur="1.5s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>` : ''}
        <div class="loading-message">${message}</div>
        ${progress !== null ? `
          <div class="loading-progress-container" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
            <div class="loading-progress-bar" style="width: ${progress}%"></div>
          </div>
          <div class="loading-progress-text">${progress}%</div>
        ` : ''}
      </div>
    `

    // Position relative to target
    if (target !== document.body) {
      target.style.position = 'relative'
    }

    target.appendChild(overlay)
    this.activeLoaders.set(id, { overlay, target })

    return {
      id,
      updateProgress: (percent) => this.updateProgress(id, percent),
      updateMessage: (newMessage) => this.updateMessage(id, newMessage),
      hide: () => this.hideOverlay(id)
    }
  }

  /**
   * Update loader progress
   * @param {string} id - Loader ID
   * @param {number} percent - Progress percentage
   */
  updateProgress(id, percent) {
    const loader = this.activeLoaders.get(id)
    if (!loader) return

    const progressBar = loader.overlay.querySelector('.loading-progress-bar')
    const progressText = loader.overlay.querySelector('.loading-progress-text')
    const progressContainer = loader.overlay.querySelector('.loading-progress-container')

    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`
    }
    if (progressText) {
      progressText.textContent = `${Math.round(percent)}%`
    }
    if (progressContainer) {
      progressContainer.setAttribute('aria-valuenow', Math.round(percent))
    }
  }

  /**
   * Update loader message
   * @param {string} id - Loader ID
   * @param {string} message - New message
   */
  updateMessage(id, message) {
    const loader = this.activeLoaders.get(id)
    if (!loader) return

    const messageEl = loader.overlay.querySelector('.loading-message')
    if (messageEl) {
      messageEl.textContent = message
    }
  }

  /**
   * Hide loading overlay
   * @param {string} id - Loader ID
   */
  hideOverlay(id) {
    const loader = this.activeLoaders.get(id)
    if (!loader) return

    loader.overlay.classList.add('hiding')
    
    setTimeout(() => {
      if (loader.overlay.parentNode) {
        loader.overlay.remove()
      }
      this.activeLoaders.delete(id)
    }, 300)
  }

  /**
   * Show an inline loader
   * @param {HTMLElement} element - Element to show loader in
   * @param {Object} options - Options
   * @returns {Object} Loader controller
   */
  showInline(element, options = {}) {
    if (!element) return { hide: () => {} }

    const { size = 'small', replaceContent = false } = options
    
    const originalContent = replaceContent ? element.innerHTML : null
    
    const loader = document.createElement('span')
    loader.className = `inline-loader ${size}`
    loader.setAttribute('aria-hidden', 'true')
    loader.innerHTML = `
      <span class="inline-loader-dot"></span>
      <span class="inline-loader-dot"></span>
      <span class="inline-loader-dot"></span>
    `

    if (replaceContent) {
      element.innerHTML = ''
    }
    
    element.appendChild(loader)
    element.setAttribute('data-loading', 'true')

    return {
      hide: () => {
        loader.remove()
        element.removeAttribute('data-loading')
        if (originalContent) {
          element.innerHTML = originalContent
        }
      }
    }
  }

  /**
   * Add skeleton styles
   */
  addStyles() {
    if (document.getElementById('loading-states-styles')) return

    const styles = document.createElement('style')
    styles.id = 'loading-states-styles'
    styles.textContent = `
      /* Skeleton Base */
      .skeleton {
        background: linear-gradient(
          90deg,
          var(--bg-tertiary) 25%,
          var(--bg-elevated) 50%,
          var(--bg-tertiary) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.5s infinite;
        border-radius: var(--radius-sm);
      }

      @keyframes skeleton-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* Skeleton Card */
      .skeleton-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 1.25rem;
        margin-bottom: 1rem;
      }

      .skeleton-title {
        height: 1.5rem;
        width: 60%;
        margin-bottom: 1rem;
      }

      .skeleton-text {
        height: 1rem;
        margin-bottom: 0.5rem;
      }

      .skeleton-text.short {
        width: 40%;
      }

      /* Skeleton List */
      .skeleton-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .skeleton-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .skeleton-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .skeleton-line {
        height: 0.875rem;
      }

      .skeleton-line.short {
        width: 60%;
      }

      /* Skeleton Table */
      .skeleton-table {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .skeleton-row {
        display: flex;
        gap: 1rem;
        padding: 0.875rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .skeleton-row.header {
        background: var(--bg-tertiary);
      }

      .skeleton-cell {
        flex: 1;
        height: 1rem;
      }

      /* Skeleton Stats */
      .skeleton-stats {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .skeleton-stat {
        flex: 1;
        min-width: 120px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
      }

      .skeleton-circle {
        width: 48px;
        height: 48px;
        border-radius: 50%;
      }

      .skeleton-value {
        flex: 1;
        height: 1.5rem;
      }

      /* Skeleton Dashboard */
      .skeleton-dashboard {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .skeleton-header {
        height: 2rem;
        width: 200px;
      }

      .skeleton-metrics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
      }

      .skeleton-metric {
        height: 100px;
        border-radius: var(--radius-md);
      }

      .skeleton-content {
        height: 300px;
        border-radius: var(--radius-md);
      }

      /* Loading Overlay */
      .loading-overlay {
        position: absolute;
        inset: 0;
        background: rgba(10, 10, 15, 0.9);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: loading-fade-in 0.3s ease;
      }

      .loading-overlay.with-blur {
        backdrop-filter: blur(8px);
      }

      @keyframes loading-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .loading-overlay.hiding {
        animation: loading-fade-out 0.3s ease forwards;
      }

      @keyframes loading-fade-out {
        to { opacity: 0; }
      }

      .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        text-align: center;
      }

      .loading-spinner {
        width: 48px;
        height: 48px;
        color: var(--accent-primary);
        animation: loading-spin 1s linear infinite;
      }

      @keyframes loading-spin {
        to { transform: rotate(360deg); }
      }

      .loading-spinner svg {
        width: 100%;
        height: 100%;
      }

      .loading-message {
        color: var(--text-secondary);
        font-size: 0.9375rem;
      }

      .loading-progress-container {
        width: 200px;
        height: 4px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-full);
        overflow: hidden;
        margin-top: 0.5rem;
      }

      .loading-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
        border-radius: var(--radius-full);
        transition: width 0.3s ease;
      }

      .loading-progress-text {
        font-size: 0.875rem;
        color: var(--text-muted);
        margin-top: 0.5rem;
      }

      /* Inline Loader */
      .inline-loader {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        margin-left: 0.5rem;
      }

      .inline-loader.small .inline-loader-dot {
        width: 6px;
        height: 6px;
      }

      .inline-loader.medium .inline-loader-dot {
        width: 8px;
        height: 8px;
      }

      .inline-loader.large .inline-loader-dot {
        width: 12px;
        height: 12px;
      }

      .inline-loader-dot {
        background: var(--accent-primary);
        border-radius: 50%;
        animation: inline-loader-bounce 1.4s ease-in-out infinite both;
      }

      .inline-loader-dot:nth-child(1) {
        animation-delay: -0.32s;
      }

      .inline-loader-dot:nth-child(2) {
        animation-delay: -0.16s;
      }

      @keyframes inline-loader-bounce {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }

      /* Reduced Motion */
      @media (prefers-reduced-motion: reduce) {
        .skeleton {
          animation: none;
          background: var(--bg-tertiary);
        }

        .loading-spinner {
          animation: none;
        }

        .loading-overlay {
          animation: none;
        }

        .inline-loader-dot {
          animation: none;
          opacity: 0.5;
        }
      }

      /* Mobile Adjustments */
      @media (max-width: 768px) {
        .loading-overlay {
          position: fixed;
        }

        .skeleton-metrics {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    `
    document.head.appendChild(styles)
  }
}

// Create singleton instance
export const loadingStates = new LoadingStates()

// Expose globally
window.loadingStates = loadingStates

// Auto-add styles on import
loadingStates.addStyles()
