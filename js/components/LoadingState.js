/**
 * Enhanced Loading States Component
 * Beautiful loading animations for Mission Control V5
 */

export class LoadingState {
  constructor(options = {}) {
    this.container = options.container || document.body
    this.type = options.type || 'spinner'
    this.message = options.message || 'Loading...'
    this.overlay = options.overlay !== false
    this.element = null
  }

  /**
   * Show loading state
   */
  show() {
    if (this.element) return

    this.element = document.createElement('div')
    this.element.className = `loading-state loading-${this.type}`
    
    if (this.overlay) {
      this.element.classList.add('loading-overlay')
    }

    this.element.innerHTML = this.getTemplate()
    this.container.appendChild(this.element)

    // Animate in
    requestAnimationFrame(() => {
      this.element.classList.add('loading-visible')
    })

    return this
  }

  /**
   * Hide loading state
   */
  hide() {
    if (!this.element) return

    this.element.classList.remove('loading-visible')
    this.element.classList.add('loading-hiding')

    setTimeout(() => {
      if (this.element) {
        this.element.remove()
        this.element = null
      }
    }, 300)

    return this
  }

  /**
   * Update loading message
   */
  update(message) {
    this.message = message
    const messageEl = this.element?.querySelector('.loading-message')
    if (messageEl) {
      messageEl.textContent = message
    }
    return this
  }

  /**
   * Get loading template based on type
   */
  getTemplate() {
    const templates = {
      spinner: `
        <div class="loading-content">
          <div class="loading-spinner-enhanced"></div>
          ${this.message ? `<div class="loading-message">${this.message}</div>` : ''}
        </div>
      `,
      
      dots: `
        <div class="loading-content">
          <div class="loading-dots-enhanced">
            <span></span>
            <span></span>
            <span></span>
          </div>
          ${this.message ? `<div class="loading-message">${this.message}</div>` : ''}
        </div>
      `,
      
      pulse: `
        <div class="loading-content">
          <div class="loading-pulse-ring"></div>
          ${this.message ? `<div class="loading-message">${this.message}</div>` : ''}
        </div>
      `,
      
      circular: `
        <div class="loading-content">
          <div class="loading-circular">
            <svg viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke-width="3"></circle>
            </svg>
          </div>
          ${this.message ? `<div class="loading-message">${this.message}</div>` : ''}
        </div>
      `,
      
      skeleton: `
        <div class="loading-skeleton-container">
          <div class="skeleton-header">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-lines">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </div>
          <div class="skeleton-content">
            <div class="skeleton-line"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
          </div>
        </div>
      `,
      
      wave: `
        <div class="loading-content">
          <div class="loading-wave">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          ${this.message ? `<div class="loading-message">${this.message}</div>` : ''}
        </div>
      `,
      
      orbit: `
        <div class="loading-content">
          <div class="loading-orbit-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          ${this.message ? `<div class="loading-message">${this.message}</div>` : ''}
        </div>
      `
    }

    return templates[this.type] || templates.spinner
  }

  /**
   * Static method to show quick loading
   */
  static show(options = {}) {
    const loader = new LoadingState(options)
    loader.show()
    return loader
  }

  /**
   * Static method to show skeleton loading
   */
  static skeleton(container) {
    return new LoadingState({ 
      container, 
      type: 'skeleton', 
      overlay: false 
    }).show()
  }
}

// Add styles
const loadingStyles = document.createElement('style')
loadingStyles.textContent = `
  /* ========================================
     LOADING STATE CONTAINER
     ======================================== */
  
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.3s ease, visibility 0.3s ease;
  }
  
  .loading-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 15, 0.8);
    backdrop-filter: blur(4px);
    z-index: 9999;
    opacity: 0;
    visibility: hidden;
  }
  
  .loading-overlay.loading-visible {
    opacity: 1;
    visibility: visible;
  }
  
  .loading-overlay.loading-hiding {
    opacity: 0;
    visibility: hidden;
  }
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
  }
  
  .loading-message {
    font-size: 0.875rem;
    color: var(--text-secondary);
    text-align: center;
  }
  
  /* ========================================
     ENHANCED SPINNER
     ======================================== */
  
  .loading-spinner-enhanced {
    width: 48px;
    height: 48px;
    border: 3px solid var(--bg-tertiary);
    border-top-color: var(--accent-primary);
    border-radius: 50%;
    animation: loadingSpin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }
  
  @keyframes loadingSpin {
    to { transform: rotate(360deg); }
  }
  
  /* ========================================
     DOTS LOADER
     ======================================== */
  
  .loading-dots-enhanced {
    display: flex;
    gap: 8px;
  }
  
  .loading-dots-enhanced span {
    width: 12px;
    height: 12px;
    background: var(--accent-primary);
    border-radius: 50%;
    animation: loadingDot 1.4s ease-in-out infinite both;
  }
  
  .loading-dots-enhanced span:nth-child(1) { animation-delay: -0.32s; }
  .loading-dots-enhanced span:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes loadingDot {
    0%, 80%, 100% { 
      transform: scale(0.6);
      opacity: 0.5;
    }
    40% { 
      transform: scale(1);
      opacity: 1;
    }
  }
  
  /* ========================================
     PULSE RING LOADER
     ======================================== */
  
  .loading-pulse-ring {
    position: relative;
    width: 60px;
    height: 60px;
  }
  
  .loading-pulse-ring::before,
  .loading-pulse-ring::after {
    content: '';
    position: absolute;
    inset: 0;
    border: 3px solid var(--accent-primary);
    border-radius: 50%;
    animation: pulseRing 1.5s ease-out infinite;
  }
  
  .loading-pulse-ring::after {
    animation-delay: 0.75s;
  }
  
  @keyframes pulseRing {
    0% {
      transform: scale(0.8);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
  
  /* ========================================
     CIRCULAR PROGRESS
     ======================================== */
  
  .loading-circular {
    width: 50px;
    height: 50px;
  }
  
  .loading-circular svg {
    animation: circularRotate 2s linear infinite;
  }
  
  .loading-circular circle {
    fill: none;
    stroke: var(--accent-primary);
    stroke-width: 3;
    stroke-linecap: round;
    animation: circularDash 1.5s ease-in-out infinite;
  }
  
  @keyframes circularRotate {
    100% { transform: rotate(360deg); }
  }
  
  @keyframes circularDash {
    0% {
      stroke-dasharray: 1, 150;
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -35;
    }
    100% {
      stroke-dasharray: 90, 150;
      stroke-dashoffset: -124;
    }
  }
  
  /* ========================================
     SKELETON LOADING
     ======================================== */
  
  .loading-skeleton-container {
    width: 100%;
    padding: 1rem;
  }
  
  .skeleton-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .skeleton-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(
      90deg,
      var(--bg-tertiary) 0%,
      var(--bg-elevated) 50%,
      var(--bg-tertiary) 100%
    );
    background-size: 200% 100%;
    animation: skeletonWave 1.5s ease-in-out infinite;
  }
  
  .skeleton-lines {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .skeleton-line {
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(
      90deg,
      var(--bg-tertiary) 0%,
      var(--bg-elevated) 50%,
      var(--bg-tertiary) 100%
    );
    background-size: 200% 100%;
    animation: skeletonWave 1.5s ease-in-out infinite;
  }
  
  .skeleton-line.short {
    width: 60%;
  }
  
  .skeleton-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  @keyframes skeletonWave {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  /* ========================================
     WAVE LOADER
     ======================================== */
  
  .loading-wave {
    display: flex;
    gap: 4px;
    align-items: center;
    height: 40px;
  }
  
  .loading-wave span {
    width: 6px;
    height: 100%;
    background: var(--accent-primary);
    border-radius: 3px;
    animation: waveBar 1.2s ease-in-out infinite;
  }
  
  .loading-wave span:nth-child(1) { animation-delay: -1.2s; }
  .loading-wave span:nth-child(2) { animation-delay: -1.1s; }
  .loading-wave span:nth-child(3) { animation-delay: -1.0s; }
  .loading-wave span:nth-child(4) { animation-delay: -0.9s; }
  
  @keyframes waveBar {
    0%, 40%, 100% { transform: scaleY(0.4); }
    20% { transform: scaleY(1); }
  }
  
  /* ========================================
     ORBIT DOTS LOADER
     ======================================== */
  
  .loading-orbit-dots {
    position: relative;
    width: 60px;
    height: 60px;
  }
  
  .loading-orbit-dots span {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 12px;
    height: 12px;
    margin: -6px 0 0 -6px;
    border-radius: 50%;
    animation: orbit 1.5s linear infinite;
  }
  
  .loading-orbit-dots span:nth-child(1) {
    background: var(--accent-primary);
    animation-delay: 0s;
  }
  
  .loading-orbit-dots span:nth-child(2) {
    background: var(--accent-secondary);
    animation-delay: -0.5s;
  }
  
  .loading-orbit-dots span:nth-child(3) {
    background: var(--accent-success);
    animation-delay: -1s;
  }
  
  @keyframes orbit {
    0% { transform: rotate(0deg) translateX(20px) rotate(0deg); }
    100% { transform: rotate(360deg) translateX(20px) rotate(-360deg); }
  }
  
  /* ========================================
     REDUCED MOTION
     ======================================== */
  
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner-enhanced,
    .loading-dots-enhanced span,
    .loading-pulse-ring::before,
    .loading-pulse-ring::after,
    .loading-circular svg,
    .loading-circular circle,
    .skeleton-avatar,
    .skeleton-line,
    .loading-wave span,
    .loading-orbit-dots span {
      animation: none !important;
    }
    
    .skeleton-avatar,
    .skeleton-line {
      background: var(--bg-tertiary);
    }
  }
`

document.head.appendChild(loadingStyles)

export default LoadingState
