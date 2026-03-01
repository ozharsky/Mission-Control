// Virtual Scroller - Efficient rendering of large lists
// Only renders visible items, recycling DOM elements for performance

export class VirtualScroller {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.getElementById(container) 
      : container
    
    if (!this.container) {
      throw new Error('VirtualScroller: container not found')
    }
    
    this.options = {
      itemHeight: 50,
      overscan: 5,
      renderItem: null,
      ...options
    }
    
    this.items = []
    this.visibleItems = new Map()
    this.scrollTop = 0
    this.containerHeight = 0
    this.isScrolling = false
    this.scrollTimeout = null
    this.resizeObserver = null
    
    this.init()
  }

  init() {
    // Setup container
    this.container.style.position = 'relative'
    this.container.style.overflow = 'auto'
    this.container.style.contain = 'strict'
    
    // Create spacer for total height
    this.spacer = document.createElement('div')
    this.spacer.style.position = 'absolute'
    this.spacer.style.top = '0'
    this.spacer.style.left = '0'
    this.spacer.style.right = '0'
    this.spacer.style.height = '0px'
    this.container.appendChild(this.spacer)
    
    // Bind scroll handler
    this.handleScroll = this.handleScroll.bind(this)
    this.container.addEventListener('scroll', this.handleScroll, { passive: true })
    
    // Setup resize observer
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.containerHeight = entry.contentRect.height
          this.render()
        }
      })
      this.resizeObserver.observe(this.container)
    } else {
      // Fallback
      this.containerHeight = this.container.clientHeight
      window.addEventListener('resize', () => {
        this.containerHeight = this.container.clientHeight
        this.render()
      })
    }
    
    // Initial measurement
    this.containerHeight = this.container.clientHeight
  }

  /**
   * Set items to display
   * @param {Array} items - Array of item data
   */
  setItems(items) {
    this.items = items || []
    this.updateSpacer()
    this.render()
  }

  /**
   * Update spacer height based on total items
   * @private
   */
  updateSpacer() {
    const totalHeight = this.items.length * this.options.itemHeight
    this.spacer.style.height = `${totalHeight}px`
  }

  /**
   * Handle scroll events
   * @private
   */
  handleScroll() {
    this.scrollTop = this.container.scrollTop
    
    // Throttle rendering during scroll
    if (!this.isScrolling) {
      this.isScrolling = true
      requestAnimationFrame(() => {
        this.render()
        this.isScrolling = false
      })
    }
    
    // Clear previous timeout
    clearTimeout(this.scrollTimeout)
    
    // Render once more after scroll ends
    this.scrollTimeout = setTimeout(() => {
      this.render()
    }, 100)
  }

  /**
   * Render visible items
   * @private
   */
  render() {
    if (!this.options.renderItem) return
    
    const startIndex = Math.max(0, Math.floor(this.scrollTop / this.options.itemHeight) - this.options.overscan)
    const visibleCount = Math.ceil(this.containerHeight / this.options.itemHeight) + (this.options.overscan * 2)
    const endIndex = Math.min(this.items.length, startIndex + visibleCount)
    
    // Track which items should be visible
    const newVisibleItems = new Set()
    
    for (let i = startIndex; i < endIndex; i++) {
      newVisibleItems.add(i)
      
      if (!this.visibleItems.has(i)) {
        // Create new item
        const itemEl = this.createItem(i)
        this.visibleItems.set(i, itemEl)
      }
    }
    
    // Remove items that are no longer visible
    for (const [index, element] of this.visibleItems) {
      if (!newVisibleItems.has(index)) {
        element.remove()
        this.visibleItems.delete(index)
      }
    }
    
    // Update positions
    for (const [index, element] of this.visibleItems) {
      element.style.transform = `translateY(${index * this.options.itemHeight}px)`
    }
  }

  /**
   * Create a single item element
   * @private
   */
  createItem(index) {
    const item = this.items[index]
    const element = this.options.renderItem(item, index)
    
    element.style.position = 'absolute'
    element.style.top = '0'
    element.style.left = '0'
    element.style.right = '0'
    element.style.height = `${this.options.itemHeight}px`
    element.dataset.index = index
    
    this.container.appendChild(element)
    
    return element
  }

  /**
   * Scroll to a specific item
   * @param {number} index - Item index
   * @param {string} behavior - Scroll behavior ('auto' or 'smooth')
   */
  scrollToItem(index, behavior = 'auto') {
    const offset = index * this.options.itemHeight
    this.container.scrollTo({
      top: offset,
      behavior
    })
  }

  /**
   * Refresh the current view
   */
  refresh() {
    // Clear all items and re-render
    this.visibleItems.forEach(el => el.remove())
    this.visibleItems.clear()
    this.render()
  }

  /**
   * Update a specific item
   * @param {number} index - Item index
   * @param {*} newData - New item data
   */
  updateItem(index, newData) {
    if (index < 0 || index >= this.items.length) return
    
    this.items[index] = newData
    
    const element = this.visibleItems.get(index)
    if (element) {
      const newElement = this.options.renderItem(newData, index)
      newElement.style.position = 'absolute'
      newElement.style.top = '0'
      newElement.style.left = '0'
      newElement.style.right = '0'
      newElement.style.height = `${this.options.itemHeight}px`
      newElement.dataset.index = index
      newElement.style.transform = element.style.transform
      
      element.replaceWith(newElement)
      this.visibleItems.set(index, newElement)
    }
  }

  /**
   * Destroy the virtual scroller
   */
  destroy() {
    this.container.removeEventListener('scroll', this.handleScroll)
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    
    clearTimeout(this.scrollTimeout)
    
    this.visibleItems.forEach(el => el.remove())
    this.visibleItems.clear()
    
    if (this.spacer?.parentNode) {
      this.spacer.remove()
    }
  }
}

// Utility function for simple list virtualization
export function createVirtualList(container, items, renderFn, options = {}) {
  const scroller = new VirtualScroller(container, {
    itemHeight: options.itemHeight || 50,
    overscan: options.overscan || 3,
    renderItem: renderFn
  })
  
  scroller.setItems(items)
  return scroller
}
