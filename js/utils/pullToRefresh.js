// Pull to Refresh
// Mobile pull-to-refresh gesture for lists

class PullToRefresh {
  constructor(container, onRefresh) {
    this.container = container
    this.onRefresh = onRefresh
    this.isRefreshing = false
    this.startY = 0
    this.currentY = 0
    this.threshold = 80
    this.maxPull = 120
    
    this.init()
  }
  
  init() {
    // Create pull indicator
    this.indicator = document.createElement('div')
    this.indicator.className = 'pull-to-refresh'
    this.indicator.innerHTML = `
      <div class="pull-indicator">
        <div class="pull-spinner"></div>
        <span class="pull-text">Pull to refresh</span>
      </div>
    `
    this.container.prepend(this.indicator)
    
    // Bind events
    this.handleTouchStart = this.handleTouchStart.bind(this)
    this.handleTouchMove = this.handleTouchMove.bind(this)
    this.handleTouchEnd = this.handleTouchEnd.bind(this)
    
    this.container.addEventListener('touchstart', this.handleTouchStart, { passive: true })
    this.container.addEventListener('touchmove', this.handleTouchMove, { passive: false })
    this.container.addEventListener('touchend', this.handleTouchEnd)
  }
  
  handleTouchStart(e) {
    if (this.isRefreshing) return
    
    // Only trigger at top of scroll
    if (this.container.scrollTop > 0) return
    
    this.startY = e.touches[0].clientY
    this.indicator.classList.add('pulling')
  }
  
  handleTouchMove(e) {
    if (this.isRefreshing || !this.startY) return
    
    this.currentY = e.touches[0].clientY
    const pullDistance = this.currentY - this.startY
    
    // Only pull down
    if (pullDistance < 0) return
    
    // Prevent default scrolling when pulling
    if (this.container.scrollTop === 0 && pullDistance > 0) {
      e.preventDefault()
    }
    
    // Calculate pull progress
    const progress = Math.min(pullDistance / this.threshold, 1)
    const translateY = Math.min(pullDistance * 0.5, this.maxPull)
    
    // Update indicator
    this.indicator.style.transform = `translateY(${translateY}px)`
    this.indicator.style.opacity = progress
    
    const text = this.indicator.querySelector('.pull-text')
    const spinner = this.indicator.querySelector('.pull-spinner')
    
    if (pullDistance >= this.threshold) {
      text.textContent = 'Release to refresh'
      spinner.style.transform = `rotate(${progress * 360}deg)`
      this.indicator.classList.add('ready')
    } else {
      text.textContent = 'Pull to refresh'
      spinner.style.transform = `rotate(${progress * 180}deg)`
      this.indicator.classList.remove('ready')
    }
  }
  
  handleTouchEnd() {
    if (this.isRefreshing || !this.startY) return
    
    const pullDistance = this.currentY - this.startY
    
    if (pullDistance >= this.threshold) {
      this.refresh()
    } else {
      this.reset()
    }
    
    this.startY = 0
    this.currentY = 0
  }
  
  async refresh() {
    this.isRefreshing = true
    this.indicator.classList.add('refreshing')
    this.indicator.querySelector('.pull-text').textContent = 'Refreshing...'
    
    try {
      await this.onRefresh()
      this.indicator.querySelector('.pull-text').textContent = 'Updated!'
      setTimeout(() => this.reset(), 500)
    } catch (err) {
      this.indicator.querySelector('.pull-text').textContent = 'Failed to refresh'
      setTimeout(() => this.reset(), 1500)
    } finally {
      this.isRefreshing = false
      this.indicator.classList.remove('refreshing')
    }
  }
  
  reset() {
    this.indicator.style.transform = 'translateY(0)'
    this.indicator.style.opacity = '0'
    this.indicator.classList.remove('pulling', 'ready')
    this.indicator.querySelector('.pull-text').textContent = 'Pull to refresh'
  }
  
  destroy() {
    this.container.removeEventListener('touchstart', this.handleTouchStart)
    this.container.removeEventListener('touchmove', this.handleTouchMove)
    this.container.removeEventListener('touchend', this.handleTouchEnd)
    this.indicator.remove()
  }
}

// Initialize on scrollable containers
export function initPullToRefresh(selector, onRefresh) {
  const containers = document.querySelectorAll(selector)
  containers.forEach(container => {
    new PullToRefresh(container, onRefresh)
  })
}

export default PullToRefresh
