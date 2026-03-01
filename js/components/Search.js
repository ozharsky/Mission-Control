import { store } from '../state/store.js'

// Debounce utility with cancel method
function debounce(fn, delay) {
  let timeoutId
  const debounced = function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
  debounced.cancel = function() {
    clearTimeout(timeoutId)
  }
  return debounced
}

class SearchManager {
  constructor() {
    this.modal = null
    this.filter = 'all'
    this.query = ''
    this.selectedResultIndex = -1
    this.resultElements = []
    // Bind handlers once to ensure proper cleanup
    this.handleKeydown = this.handleKeydown.bind(this)
    this.handleResize = this.handleResize.bind(this)
    this.debouncedSearch = debounce(() => this.performSearch(), 150)
  }
  
  open() {
    if (this.modal) return
    
    this.modal = document.createElement('div')
    this.modal.className = 'modal-overlay active search-modal-overlay'
    this.modal.setAttribute('role', 'dialog')
    this.modal.setAttribute('aria-modal', 'true')
    this.modal.setAttribute('aria-label', 'Search')
    
    const isMobile = window.innerWidth <= 768
    
    this.modal.innerHTML = `
      <div class="search-modal ${isMobile ? 'search-modal-mobile' : ''}" onclick="event.stopPropagation()">
        <div class="search-header">
          <span class="search-icon" aria-hidden="true">🔍</span>
          <input type="text" 
                 class="search-input" 
                 id="searchInput" 
                 placeholder="Search priorities, projects, SKUs..." 
                 autocomplete="off"
                 autocorrect="off"
                 autocapitalize="off"
                 spellcheck="false"
                 aria-label="Search query">
          <kbd class="search-shortcut" aria-label="Press Escape to close">ESC</kbd>
          <button class="search-close-mobile" onclick="search.close()" aria-label="Close search">✕</button>
        </div>
        <div class="search-filters" role="tablist" aria-label="Search filters">
          <button class="search-filter active" data-filter="all" onclick="search.setFilter('all')" role="tab" aria-selected="true">All</button>
          <button class="search-filter" data-filter="priorities" onclick="search.setFilter('priorities')" role="tab" aria-selected="false">Priorities</button>
          <button class="search-filter" data-filter="projects" onclick="search.setFilter('projects')" role="tab" aria-selected="false">Projects</button>
          <button class="search-filter" data-filter="skus" onclick="search.setFilter('skus')" role="tab" aria-selected="false">SKUs</button>
        </div>
        <div class="search-results" id="searchResults" role="region" aria-live="polite" aria-label="Search results">
          <div class="search-empty">
            <div class="search-empty-icon" aria-hidden="true">🔍</div>
            <div>Type to search...</div>
          </div>
        </div>
        <div class="search-footer">
          <span class="search-hint"><kbd>↑</kbd><kbd>↓</kbd> to navigate</span>
          <span class="search-hint"><kbd>↵</kbd> to select</span>
        </div>
      </div>
    `
    
    document.body.appendChild(this.modal)
    
    // Add enhanced styles
    this.addEnhancedStyles()
    
    // Focus input with slight delay for animation
    requestAnimationFrame(() => {
      const input = document.getElementById('searchInput')
      if (input) {
        input.focus()
        // Add entrance animation class
        this.modal.querySelector('.search-modal').classList.add('search-modal-enter')
      }
    })
    
    // Reset state
    this.selectedResultIndex = -1
    this.resultElements = []
    
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      this.query = e.target.value
      this.selectedResultIndex = -1
      this.debouncedSearch()
    })
    
    // Add keyboard navigation
    document.addEventListener('keydown', this.handleKeydown)
    
    // Close on backdrop click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close()
    })
    
    // Handle resize for mobile/desktop switching
    window.addEventListener('resize', this.handleResize)
  }
  
  handleKeydown(e) {
    if (!this.modal) return
    
    if (e.key === 'Escape') {
      e.preventDefault()
      this.close()
      return
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      this.selectNextResult()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      this.selectPreviousResult()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (this.selectedResultIndex >= 0 && this.resultElements[this.selectedResultIndex]) {
        this.resultElements[this.selectedResultIndex].click()
      }
    }
  }
  
  handleResize() {
    const modal = this.modal?.querySelector('.search-modal')
    if (modal) {
      const isMobile = window.innerWidth <= 768
      modal.classList.toggle('search-modal-mobile', isMobile)
    }
  }
  
  selectNextResult() {
    if (!this.resultElements.length) return
    this.selectedResultIndex = (this.selectedResultIndex + 1) % this.resultElements.length
    this.updateResultSelection()
  }
  
  selectPreviousResult() {
    if (!this.resultElements.length) return
    this.selectedResultIndex = this.selectedResultIndex <= 0 
      ? this.resultElements.length - 1 
      : this.selectedResultIndex - 1
    this.updateResultSelection()
  }
  
  updateResultSelection() {
    this.resultElements.forEach((el, i) => {
      el.classList.toggle('selected', i === this.selectedResultIndex)
      if (i === this.selectedResultIndex) {
        el.scrollIntoView({ block: 'nearest' })
      }
    })
  }
  
  addEnhancedStyles() {
    if (document.getElementById('search-enhanced-styles')) return
    
    const styles = document.createElement('style')
    styles.id = 'search-enhanced-styles'
    styles.textContent = `
      .search-modal-overlay {
        animation: searchOverlayIn 0.2s ease;
      }
      
      @keyframes searchOverlayIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .search-modal-enter {
        animation: searchModalIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      
      @keyframes searchModalIn {
        from {
          opacity: 0;
          transform: translateX(-50%) scale(0.95) translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) scale(1) translateY(0);
        }
      }
      
      .search-modal-mobile {
        top: auto !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        transform: none !important;
        width: 100% !important;
        max-width: none !important;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0 !important;
        animation: searchModalMobileIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      }
      
      @keyframes searchModalMobileIn {
        from {
          opacity: 0;
          transform: translateY(100%);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .search-close-mobile {
        display: none;
        background: none;
        border: none;
        color: var(--text-muted);
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.5rem;
        margin-left: 0.5rem;
        border-radius: var(--radius-sm);
        transition: all 0.2s;
      }
      
      .search-close-mobile:hover {
        background: var(--bg-tertiary);
        color: var(--text-primary);
      }
      
      @media (max-width: 768px) {
        .search-close-mobile {
          display: block;
        }
        .search-shortcut {
          display: none;
        }
      }
      
      .search-icon {
        font-size: 1.25rem;
        opacity: 0.7;
      }
      
      .search-footer {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--border-color);
        background: var(--bg-tertiary);
        font-size: 0.75rem;
        color: var(--text-muted);
      }
      
      @media (max-width: 768px) {
        .search-footer {
          display: none;
        }
      }
      
      .search-hint {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }
      
      .search-hint kbd {
        background: var(--bg-secondary);
        padding: 0.125rem 0.375rem;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-color);
        font-family: inherit;
        font-size: 0.6875rem;
      }
      
      .search-result {
        transition: all 0.15s ease;
      }
      
      .search-result.selected,
      .search-result:hover {
        background: var(--bg-tertiary);
        transform: translateX(4px);
      }
      
      .search-result.selected {
        border-left: 3px solid var(--accent-primary);
      }
    `
    document.head.appendChild(styles)
  }
  
  close() {
    if (!this.modal) return
    
    // Remove event listeners - now properly bound handlers
    document.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('resize', this.handleResize)
    
    // Clear debounced search to prevent memory leaks
    this.debouncedSearch.cancel?.()
    
    // Add exit animation
    const modalEl = this.modal.querySelector('.search-modal')
    if (modalEl) {
      modalEl.style.animation = 'searchModalOut 0.2s ease forwards'
    }
    this.modal.style.animation = 'searchOverlayOut 0.2s ease forwards'
    
    setTimeout(() => {
      this.modal?.remove()
      this.modal = null
      this.resultElements = []
      this.selectedResultIndex = -1
      this.query = ''
    }, 200)
  }
  
  setFilter(filter) {
    this.filter = filter
    
    // Update UI
    document.querySelectorAll('.search-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter)
      btn.setAttribute('aria-selected', btn.dataset.filter === filter)
    })
    
    this.performSearch()
  }
  
  performSearch() {
    const results = this.getResults()
    this.renderResults(results)
  }
  
  // Debounced search for better performance - now defined in constructor
  // debouncedSearch is bound in constructor
  
  getResults() {
    const state = store.getState()
    const query = this.query.toLowerCase().trim()
    
    if (!query) return []
    
    const results = []
    
    // Search priorities
    if (this.filter === 'all' || this.filter === 'priorities') {
      (state.priorities || []).forEach(p => {
        const text = (p.text || '').toLowerCase()
        const desc = (p.desc || '').toLowerCase()
        if (text.includes(query) || desc.includes(query)) {
          results.push({
            type: 'priority',
            item: p,
            title: p.text,
            subtitle: p.dueDate ? `Due: ${p.dueDate}` : 'No due date',
            icon: p.completed ? '✅' : '⏳',
            match: this.getMatchText(p.text, query)
          })
        }
      })
    }
    
    // Search projects
    if (this.filter === 'all' || this.filter === 'projects') {
      Object.entries(state.projects || {}).forEach(([status, projects]) => {
        projects.forEach(p => {
          const title = (p.title || '').toLowerCase()
          const desc = (p.desc || '').toLowerCase()
          if (title.includes(query) || desc.includes(query)) {
            results.push({
              type: 'project',
              item: p,
              status,
              title: p.title,
              subtitle: `${status} • ${p.desc || 'No description'}`,
              icon: '📋',
              match: this.getMatchText(p.title, query)
            })
          }
        })
      })
    }
    
    // Search SKUs
    if (this.filter === 'all' || this.filter === 'skus') {
      (state.skus || []).forEach(s => {
        const code = (s.code || '').toLowerCase()
        const name = (s.name || '').toLowerCase()
        if (code.includes(query) || name.includes(query)) {
          results.push({
            type: 'sku',
            item: s,
            title: s.code,
            subtitle: `${s.name} • ${s.stock} in stock`,
            icon: '📦',
            match: this.getMatchText(s.code, query)
          })
        }
      })
    }
    
    return results.slice(0, 20) // Limit results
  }
  
  getMatchText(text, query) {
    if (!text) return ''
    const index = text.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return text.slice(0, 60)
    
    const start = Math.max(0, index - 20)
    const end = Math.min(text.length, index + query.length + 40)
    let snippet = text.slice(start, end)
    
    if (start > 0) snippet = '...' + snippet
    if (end < text.length) snippet = snippet + '...'
    
    return snippet
  }
  
  highlightMatch(text, query) {
    if (!query) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<span class="search-result-match">$1</span>')
  }
  
  renderResults(results) {
    const container = document.getElementById('searchResults')
    const input = document.getElementById('searchInput')
    if (!container) return
    
    // Save input focus state
    const wasFocused = input && document.activeElement === input
    const cursorPosition = input?.selectionStart || 0
    
    if (results.length === 0) {
      container.innerHTML = `
        <div class="search-empty">
          <div class="search-empty-icon" aria-hidden="true">🔍</div>
          <div>${this.query ? 'No results found' : 'Type to search...'}</div>
        </div>
      `
      this.resultElements = []
    } else {
      container.innerHTML = results.map((r, i) => `
        <div class="search-result" 
             onclick="search.openResult('${r.type}', ${r.item.id})"
             data-index="${i}"
             role="option"
             aria-selected="${i === this.selectedResultIndex}">
          <div class="search-result-icon" aria-hidden="true">${r.icon}</div>
          <div class="search-result-content">
            <div class="search-result-title">${this.highlightMatch(r.title, this.query)}</div>
            <div class="search-result-subtitle">${r.subtitle}</div>
          </div>
        </div>
      `).join('')
      
      // Store result elements for keyboard navigation
      this.resultElements = Array.from(container.querySelectorAll('.search-result'))
    }
    
    // Restore focus
    if (wasFocused && input) {
      input.focus()
      input.setSelectionRange(cursorPosition, cursorPosition)
    }
  }
  
  openResult(type, id) {
    this.close()
    
    // Navigate to appropriate section
    const sectionMap = {
      priority: 'priorities',
      project: 'projects',
      sku: 'skus'
    }
    
    if (window.mc?.showSection) {
      window.mc.showSection(sectionMap[type] || 'dashboard')
    }
    
    // Scroll to and highlight the item after navigation
    setTimeout(() => {
      const element = document.querySelector(`[data-id="${id}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.classList.add('highlight-pulse')
        setTimeout(() => element.classList.remove('highlight-pulse'), 2000)
      }
    }, 100)
  }
}

export const search = new SearchManager()

// Expose for onclick handlers
window.search = search
