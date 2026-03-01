// Pagination Component
// Handles large lists with page navigation

export function createPagination(options) {
  const {
    container,
    items,
    itemsPerPage = 10,
    renderItem,
    onPageChange = null
  } = options
  
  let currentPage = 1
  const totalPages = Math.ceil(items.length / itemsPerPage)
  
  function getPageItems(page) {
    const start = (page - 1) * itemsPerPage
    const end = start + itemsPerPage
    return items.slice(start, end)
  }
  
  function render() {
    const pageItems = getPageItems(currentPage)
    
    container.innerHTML = `
      <div class="paginated-list">
        ${pageItems.map(renderItem).join('')}
      </div>
      ${totalPages > 1 ? renderControls() : ''}
    `
    
    attachEventListeners()
  }
  
  function renderControls() {
    const pages = getPageNumbers()
    
    return `
      <div class="pagination-controls">
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="goToPage(${currentPage - 1})"
                ${currentPage === 1 ? 'disabled' : ''}>
          ◀ Prev
        </button>
        
        <div class="pagination-pages">
          ${pages.map(page => `
            ${page === '...' 
              ? '<span class="pagination-ellipsis">...</span>'
              : `<button class="pagination-page ${page === currentPage ? 'active' : ''}"
                        onclick="goToPage(${page})">${page}</button>
              `
            }
          `).join('')}
        </div>
        
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}"
                onclick="goToPage(${currentPage + 1})"
                ${currentPage === totalPages ? 'disabled' : ''}>
          Next ▶
        </button>
        
        <span class="pagination-info">
          ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, items.length)} of ${items.length}
        </span>
      </div>
    `
  }
  
  function getPageNumbers() {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      // Always show first page
      pages.push(1)
      
      // Calculate middle range
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)
      
      // Adjust for edges
      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, 4)
      } else if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3)
      }
      
      // Add ellipsis if needed
      if (start > 2) pages.push('...')
      
      // Add middle pages
      for (let i = start; i <= end; i++) pages.push(i)
      
      // Add ellipsis if needed
      if (end < totalPages - 1) pages.push('...')
      
      // Always show last page
      pages.push(totalPages)
    }
    
    return pages
  }
  
  function attachEventListeners() {
    // Event listeners attached via onclick in HTML
  }
  
  window.goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    
    currentPage = page
    render()
    
    if (onPageChange) {
      onPageChange(page)
    }
    
    // Scroll to top of list
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  
  render()
  
  return {
    goToPage: window.goToPage,
    getCurrentPage: () => currentPage,
    getTotalPages: () => totalPages,
    updateItems: (newItems) => {
      items = newItems
      currentPage = 1
      render()
    }
  }
}

// Infinite scroll alternative
export function createInfiniteScroll(options) {
  const {
    container,
    loadMore,
    threshold = 100,
    loadingMessage = 'Loading...',
    endMessage = 'No more items'
  } = options
  
  let isLoading = false
  let hasMore = true
  let page = 1
  
  const loader = document.createElement('div')
  loader.className = 'infinite-scroll-loader'
  loader.innerHTML = `
    <div class="spinner"></div>
    <span>${loadingMessage}</span>
  `
  
  const endMarker = document.createElement('div')
  endMarker.className = 'infinite-scroll-end'
  endMarker.textContent = endMessage
  
  async function checkScroll() {
    if (isLoading || !hasMore) return
    
    const scrollBottom = window.innerHeight + window.scrollY
    const containerBottom = container.offsetTop + container.offsetHeight
    
    if (scrollBottom >= containerBottom - threshold) {
      await loadMoreItems()
    }
  }
  
  async function loadMoreItems() {
    isLoading = true
    container.appendChild(loader)
    
    try {
      const result = await loadMore(page)
      
      if (!result || result.length === 0) {
        hasMore = false
        loader.remove()
        container.appendChild(endMarker)
      } else {
        page++
        loader.remove()
      }
    } catch (error) {
      console.error('Infinite scroll error:', error)
      loader.innerHTML = '<span class="error">Failed to load. <a href="#" onclick="location.reload()">Retry</a></span>'
    } finally {
      isLoading = false
    }
  }
  
  window.addEventListener('scroll', checkScroll)
  
  // Initial load
  loadMoreItems()
  
  return {
    destroy: () => {
      window.removeEventListener('scroll', checkScroll)
    },
    reset: () => {
      page = 1
      hasMore = true
      isLoading = false
      endMarker.remove()
      loader.remove()
    }
  }
}
