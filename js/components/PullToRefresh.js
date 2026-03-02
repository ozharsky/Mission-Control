// Pull to Refresh - Mobile gesture for refreshing data

import { Toast } from './Toast.js'

class PullToRefresh {
  constructor(options = {}) {
    this.container = options.container || document.querySelector('.content')
    this.onRefresh = options.onRefresh || (() => location.reload())
    this.threshold = options.threshold || 120  // Increased from 80
    this.maxPull = options.maxPull || 150      // Increased from 120
    this.minPull = options.minPull || 20       // Minimum to start showing indicator
    
    this.startY = 0
    this.currentY = 0
    this.isPulling = false
    this.isRefreshing = false
    this.startTime = 0
    
    this.indicator = null
    this.init()
  }

  init() {
    if (!this.container) return
    
    // Only enable on mobile
    if (!this.isMobile()) return
    
    this.createIndicator()
    this.bindEvents()
  }

  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
      || window.innerWidth <= 768
  }

  createIndicator() {
    this.indicator = document.createElement('div')
    this.indicator.className = 'pull-to-refresh'
    this.indicator.style.cssText = `
      position: fixed;
      top: -60px;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      pointer-events: none;
      transform: translateY(0);
      transition: transform 0.2s ease;
    `
    this.indicator.innerHTML = `
      <div class="pull-indicator" style="
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.25rem;
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        opacity: 0;
        transition: opacity 0.2s ease;
      ">
        <div class="pull-spinner" style="
          width: 20px;
          height: 20px;
          border: 2px solid var(--bg-tertiary);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          transition: transform 0.1s ease;
        "></div>
        <span class="pull-text" style="
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 500;
        ">Pull to refresh</span>
      </div>
    `
    document.body.appendChild(this.indicator)
  }

  bindEvents() {
    // Touch events only (remove mouse events to prevent conflicts)
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true })
    this.container.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.container.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true })
    this.container.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: true })
  }

  handleTouchStart(e) {
    if (this.isRefreshing) return
    
    // Only trigger if at top of scroll
    if (this.container.scrollTop > 5) return
    
    this.startY = e.touches[0].clientY
    this.startTime = Date.now()
    this.isPulling = true
    this.hasMoved = false
  }

  handleTouchMove(e) {
    if (!this.isPulling || this.isRefreshing) return
    
    // Cancel if scrolled down
    if (this.container.scrollTop > 5) {
      this.isPulling = false
      this.hideIndicator()
      return
    }

    this.currentY = e.touches[0].clientY
    const pullDistance = this.currentY - this.startY
    
    // Only show if pulling down (not up or horizontal)
    if (pullDistance > this.minPull) {
      this.hasMoved = true
      e.preventDefault()
      this.updateIndicator(pullDistance)
    }
  }

  handleTouchEnd() {
    if (!this.isPulling) return
    this.isPulling = false

    const pullDistance = this.currentY - this.startY
    const pullTime = Date.now() - this.startTime
    
    // Only trigger if pulled far enough AND took some time (not accidental swipe)
    if (pullDistance >= this.threshold && pullTime > 300) {
      this.triggerRefresh()
    } else {
      this.hideIndicator()
    }
  }

  updateIndicator(distance) {
    // Resistance curve - harder to pull as you go further
    const resistance = 0.5 + (0.5 * (1 - Math.min(distance / this.maxPull, 1)))
    const adjustedDistance = distance * resistance
    
    const clampedDistance = Math.min(adjustedDistance, this.maxPull)
    const progress = Math.min(distance / this.threshold, 1)
    
    // Move indicator
    this.indicator.style.transform = `translateY(${clampedDistance + 60}px)`
    
    // Show indicator
    const indicatorEl = this.indicator.querySelector('.pull-indicator')
    indicatorEl.style.opacity = Math.min(progress * 2, 1)
    
    // Update text and state
    indicatorEl.classList.toggle('ready', progress >= 1)
    
    const text = this.indicator.querySelector('.pull-text')
    if (progress >= 1) {
      text.textContent = 'Release to refresh'
      text.style.color = 'var(--accent-primary)'
    } else {
      text.textContent = 'Pull to refresh'
      text.style.color = 'var(--text-secondary)'
    }
    
    // Rotate spinner
    const spinner = this.indicator.querySelector('.pull-spinner')
    spinner.style.transform = `rotate(${progress * 360}deg)`
  }

  hideIndicator() {
    this.indicator.style.transition = 'transform 0.3s ease'
    this.indicator.style.transform = 'translateY(0)'
    
    const indicatorEl = this.indicator.querySelector('.pull-indicator')
    indicatorEl.style.opacity = '0'
    indicatorEl.classList.remove('ready')
    
    setTimeout(() => {
      this.indicator.style.transition = ''
    }, 300)
  }

  async triggerRefresh() {
    this.isRefreshing = true
    
    const indicatorEl = this.indicator.querySelector('.pull-indicator')
    const spinner = this.indicator.querySelector('.pull-spinner')
    const text = this.indicator.querySelector('.pull-text')
    
    // Show refreshing state
    indicatorEl.classList.add('refreshing')
    spinner.style.animation = 'pull-spin 1s linear infinite'
    text.textContent = 'Refreshing...'
    
    // Keep indicator visible
    this.indicator.style.transform = `translateY(${this.threshold + 60}px)`

    try {
      await this.onRefresh()
      Toast.success('Refreshed', 'Data updated successfully')
    } catch (err) {
      Toast.error('Refresh failed', err.message)
    } finally {
      this.isRefreshing = false
      indicatorEl.classList.remove('refreshing')
      spinner.style.animation = ''
      this.hideIndicator()
    }
  }

  destroy() {
    this.indicator?.remove()
  }
}

// Auto-initialize for dashboard
export function initPullToRefresh(onRefresh) {
  const content = document.querySelector('.content')
  if (!content) return null
  
  return new PullToRefresh({
    container: content,
    onRefresh: onRefresh || (() => location.reload())
  })
}

export { PullToRefresh }