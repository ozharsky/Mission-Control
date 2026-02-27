import { store } from '../state/store.js'

class SearchManager {
  constructor() {
    this.modal = null
    this.filter = 'all'
    this.query = ''
  }
  
  open() {
    if (this.modal) return
    
    this.modal = document.createElement('div')
    this.modal.className = 'modal-overlay active'
    this.modal.innerHTML = `
      <div class="search-modal" onclick="event.stopPropagation()">
        <div class="search-header">
          <span>🔍</span>
          <input type="text" class="search-input" id="searchInput" placeholder="Search priorities, projects, SKUs..." autofocus>
          <span class="search-shortcut">ESC to close</span>
        </div>
        <div class="search-filters">
          <button class="search-filter active" data-filter="all" onclick="search.setFilter('all')">All</button>
          <button class="search-filter" data-filter="priorities" onclick="search.setFilter('priorities')">Priorities</button>
          <button class="search-filter" data-filter="projects" onclick="search.setFilter('projects')">Projects</button>
          <button class="search-filter" data-filter="skus" onclick="search.setFilter('skus')">SKUs</button>
        </div>
        <div class="search-results" id="searchResults">
          <div class="search-empty">
            <div class="search-empty-icon">🔍</div>
            <div>Type to search...</div>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(this.modal)
    
    // Focus input
    setTimeout(() => {
      document.getElementById('searchInput')?.focus()
    }, 100)
    
    // Event listeners
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      this.query = e.target.value
      this.performSearch()
    })
    
    // Close on overlay click
    this.modal.addEventListener('click', () => this.close())
    
    // Close on Escape
    this.handleEscape = (e) => {
      if (e.key === 'Escape') this.close()
    }
    document.addEventListener('keydown', this.handleEscape)
  }
  
  close() {
    if (!this.modal) return
    document.removeEventListener('keydown', this.handleEscape)
    this.modal.remove()
    this.modal = null
  }
  
  setFilter(filter) {
    this.filter = filter
    
    // Update UI
    document.querySelectorAll('.search-filter').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter)
    })
    
    this.performSearch()
  }
  
  performSearch() {
    const results = this.getResults()
    this.renderResults(results)
  }
  
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
    if (!container) return
    
    if (results.length === 0) {
      container.innerHTML = `
        <div class="search-empty">
          <div class="search-empty-icon">🔍</div>
          <div>No results found</div>
        </div>
      `
      return
    }
    
    container.innerHTML = results.map(r => `
      <div class="search-result" onclick="search.openResult('${r.type}', ${r.item.id})">
        <div class="search-result-icon">${r.icon}</div>
        <div class="search-result-content">
          <div class="search-result-title" dangerouslySetInnerHTML="${this.highlightMatch(r.match || r.title, this.query)}">${this.highlightMatch(r.title, this.query)}</div>
          <div class="search-result-subtitle">${r.subtitle}</div>
        </div>
      </div>
    `).join('')
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
