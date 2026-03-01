// Virtual Scrolling - Efficient rendering of large lists
// Only renders visible items + buffer, recycling DOM elements

export class VirtualScroller {
  constructor(options) {
    this.container = options.container
    this.itemHeight = options.itemHeight || 50
    this.buffer = options.buffer || 5
    this.renderItem = options.renderItem
    this.items = options.items || []
    
    this.visibleStart = 0
    this.visibleEnd = 0
    this.scrollTop = 0
    this.containerHeight = 0
    
    this.init()
  }

  init() {
    // Create wrapper structure
    this.wrapper = document.createElement('div')
    this.wrapper.className = 'virtual-scroll-wrapper'
    this.wrapper.style.position = 'relative'
    this.wrapper.style.width = '100%'
    
    this.content = document.createElement('div')
    this.content.className = 'virtual-scroll-content'
    this.content.style.position = 'relative'
    
    this.wrapper.appendChild(this.content)
    
    // Clear container and add wrapper
    this.container.innerHTML = ''
    this.container.appendChild(this.wrapper)
    
    // Set container styles
    this.container.style.overflow = 'auto'
    this.container.style.position = 'relative'
    
    // Bind events
    this.handleScroll = this.handleScroll.bind(this)
    this.handleResize = this.handleResize.bind(this)
    
    this.container.addEventListener('scroll', this.handleScroll, { passive: true })
    window.addEventListener('resize', this.handleResize)
    
    // Initial render
    this.updateDimensions()
    this.render()
  }

  updateDimensions() {
    this.containerHeight = this.container.clientHeight
    this.visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + (this.buffer * 2)
  }

  handleScroll() {
    this.scrollTop = this.container.scrollTop
    this.render()
  }

  handleResize() {
    this.updateDimensions()
    this.render()
  }

  render() {
    const totalHeight = this.items.length * this.itemHeight
    
    // Update content height
    this.content.style.height = `${totalHeight}px`
    
    // Calculate visible range
    const startIndex = Math.floor(this.scrollTop / this.itemHeight) - this.buffer
    const endIndex = startIndex + this.visibleCount
    
    const clampedStart = Math.max(0, startIndex)
    const clampedEnd = Math.min(this.items.length, endIndex)
    
    // Only re-render if range changed
    if (clampedStart === this.visibleStart && clampedEnd === this.visibleEnd) {
      return
    }
    
    this.visibleStart = clampedStart
    this.visibleEnd = clampedEnd
    
    // Clear and render visible items
    this.content.innerHTML = ''
    
    for (let i = clampedStart; i < clampedEnd; i++) {
      const item = this.items[i]
      if (!item) continue
      
      const el = document.createElement('div')
      el.className = 'virtual-scroll-item'
      el.style.position = 'absolute'
      el.style.top = `${i * this.itemHeight}px`
      el.style.left = '0'
      el.style.right = '0'
      el.style.height = `${this.itemHeight}px`
      el.dataset.index = i
      
      el.innerHTML = this.renderItem(item, i)
      this.content.appendChild(el)
    }
  }

  setItems(newItems) {
    this.items = newItems
    this.visibleStart = -1
    this.visibleEnd = -1
    this.render()
  }

  scrollToIndex(index) {
    this.container.scrollTop = index * this.itemHeight
  }

  scrollToItem(predicate) {
    const index = this.items.findIndex(predicate)
    if (index !== -1) {
      this.scrollToIndex(index)
    }
  }

  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll)
    window.removeEventListener('resize', this.handleResize)
  }
}

// Simpler version for priority lists
export function createVirtualList(container, items, renderFn, options = {}) {
  const itemHeight = options.itemHeight || 80
  const buffer = options.buffer || 3
  
  // Don't virtualize small lists
  if (items.length < 20) {
    container.innerHTML = items.map((item, i) => renderFn(item, i)).join('')
    return null
  }
  
  return new VirtualScroller({
    container,
    items,
    itemHeight,
    buffer,
    renderItem: renderFn
  })
}

// Hook for React-like usage
export function useVirtualScroll(containerRef, items, options = {}) {
  let scroller = null
  
  return {
    mount() {
      if (containerRef.current && items.length > 20) {
        scroller = new VirtualScroller({
          container: containerRef.current,
          items,
          ...options
        })
      }
    },
    
    update(newItems) {
      if (scroller) {
        scroller.setItems(newItems)
      } else if (containerRef.current) {
        // Fallback for small lists
        containerRef.current.innerHTML = newItems.map(options.renderItem).join('')
      }
    },
    
    destroy() {
      if (scroller) {
        scroller.destroy()
        scroller = null
      }
    }
  }
}