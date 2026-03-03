// Cache bust: v2 - Advanced filtering and smart lists
// Fixed: callback handling in renderFilterBar

import { store } from '../state/store.js'
import { fuzzySearch } from './search.js'
import { icon } from './icons.js'

class FilterManager {
  constructor() {
    this.filters = this.loadFilters()
    this.activeFilter = null
  }
  
  loadFilters() {
    const saved = localStorage.getItem('saved_filters')
    return saved ? JSON.parse(saved) : this.getDefaultFilters()
  }
  
  saveFilters() {
    localStorage.setItem('saved_filters', JSON.stringify(this.filters))
  }
  
  getDefaultFilters() {
    return [
      {
        id: 'today',
        name: 'Today',
        icon: 'calendar',
        filter: { dueDate: new Date().toISOString().split('T')[0] }
      },
      {
        id: 'overdue',
        name: 'Overdue',
        icon: 'flame',
        filter: { overdue: true }
      },
      {
        id: 'urgent',
        name: 'Urgent',
        icon: 'zap',
        filter: { tags: ['urgent'] }
      },
      {
        id: 'no-due-date',
        name: 'No Due Date',
        icon: 'clipboard-list',
        filter: { noDueDate: true }
      },
      {
        id: 'completed-this-week',
        name: 'Completed This Week',
        icon: 'check',
        filter: { completed: true, completedSince: 7 }
      }
    ]
  }
  
  /**
   * Create a new saved filter
   */
  create(name, filter, iconName = 'search') {
    const newFilter = {
      id: Date.now().toString(),
      name,
      icon: iconName,
      filter,
      createdAt: new Date().toISOString()
    }
    
    this.filters.push(newFilter)
    this.saveFilters()
    
    return newFilter
  }
  
  /**
   * Delete a saved filter
   */
  delete(id) {
    this.filters = this.filters.filter(f => f.id !== id)
    this.saveFilters()
  }
  
  /**
   * Apply filter to items
   */
  apply(items, filter) {
    if (!Array.isArray(items)) return []
    if (!filter) return items
    
    return items.filter(item => {
      // Text search
      if (filter.query) {
        const matches = fuzzySearch([item], filter.query, { threshold: 0.3 })
        if (matches.length === 0) return false
      }
      
      // Status filter
      if (filter.status && item.status !== filter.status) {
        return false
      }
      
      // Completed filter
      if (filter.completed !== undefined && item.completed !== filter.completed) {
        return false
      }
      
      // Tags filter
      if (filter.tags?.length > 0) {
        const hasTag = filter.tags.some(tag => item.tags?.includes(tag))
        if (!hasTag) return false
      }
      
      // Due date filter
      if (filter.dueDate) {
        if (item.dueDate !== filter.dueDate) return false
      }
      
      // No due date
      if (filter.noDueDate && item.dueDate) {
        return false
      }
      
      // Overdue
      if (filter.overdue) {
        if (!item.dueDate || item.completed) return false
        if (new Date(item.dueDate) >= new Date()) return false
      }
      
      // Due soon (next 3 days)
      if (filter.dueSoon) {
        if (!item.dueDate || item.completed) return false
        const due = new Date(item.dueDate)
        const days = (due - new Date()) / (1000 * 60 * 60 * 24)
        if (days < 0 || days > 3) return false
      }
      
      // Date range
      if (filter.dateFrom) {
        const itemDate = new Date(item.dueDate || item.createdAt)
        if (itemDate < new Date(filter.dateFrom)) return false
      }
      
      if (filter.dateTo) {
        const itemDate = new Date(item.dueDate || item.createdAt)
        if (itemDate > new Date(filter.dateTo)) return false
      }
      
      // Priority level
      if (filter.priority && item.priority !== filter.priority) {
        return false
      }
      
      // Assignee
      if (filter.assignee && item.assignee !== filter.assignee) {
        return false
      }
      
      // Completed since
      if (filter.completedSince && item.completed) {
        if (!item.completedAt) return false
        const since = new Date()
        since.setDate(since.getDate() - filter.completedSince)
        if (new Date(item.completedAt) < since) return false
      }
      
      // Time estimate range
      if (filter.timeEstimateMin !== undefined) {
        if ((item.timeEstimate || 0) < filter.timeEstimateMin) return false
      }
      
      if (filter.timeEstimateMax !== undefined) {
        if ((item.timeEstimate || 0) > filter.timeEstimateMax) return false
      }
      
      return true
    })
  }
  
  /**
   * Get filtered priorities
   */
  getPriorities(filter = null) {
    const priorities = store.get('priorities') || []
    return this.apply(priorities, filter || this.activeFilter?.filter)
  }
  
  /**
   * Get filtered projects
   */
  getProjects(filter = null) {
    const projects = store.get('projects') || {}
    const allProjects = Object.values(projects).flat()
    return this.apply(allProjects, filter || this.activeFilter?.filter)
  }
  
  /**
   * Set active filter
   */
  setActiveFilter(filterId) {
    this.activeFilter = this.filters.find(f => f.id === filterId) || null
    return this.activeFilter
  }
  
  /**
   * Clear active filter
   */
  clearActiveFilter() {
    this.activeFilter = null
  }
  
  /**
   * Get all available tags
   */
  getAllTags() {
    const priorities = store.get('priorities') || []
    const tags = new Set()
    
    priorities.forEach(p => {
      p.tags?.forEach(tag => tags.add(tag))
    })
    
    return Array.from(tags).sort()
  }
  
  /**
   * Get filter suggestions based on current data
   */
  getSuggestions() {
    const priorities = store.get('priorities') || []
    const suggestions = []
    
    // High priority items
    const highPriority = priorities.filter(p => p.priority === 'high' && !p.completed).length
    if (highPriority > 0) {
      suggestions.push({
        name: `High Priority (${highPriority})`,
        filter: { priority: 'high', completed: false }
      })
    }
    
    // Items due this week
    const thisWeek = priorities.filter(p => {
      if (!p.dueDate || p.completed) return false
      const due = new Date(p.dueDate)
      const days = (due - new Date()) / (1000 * 60 * 60 * 24)
      return days >= 0 && days <= 7
    }).length
    if (thisWeek > 0) {
      suggestions.push({
        name: `Due This Week (${thisWeek})`,
        filter: { dueSoon: true }
      })
    }
    
    // Untagged items
    const untagged = priorities.filter(p => !p.tags?.length && !p.completed).length
    if (untagged > 0) {
      suggestions.push({
        name: `Untagged (${untagged})`,
        filter: { tags: [], completed: false }
      })
    }
    
    return suggestions
  }
  
  /**
   * Render filter UI
   */
  renderFilterBar(containerId, onFilterChange) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    const tags = this.getAllTags()
    
    // Store callback for later use
    this._filterCallback = onFilterChange
    
    container.innerHTML = `
      <div class="filter-bar">
        <div class="filter-group">
          <select class="filter-select m-touch" id="savedFilter" onchange="filterManager.handleSavedFilterChange(this.value)">
            <option value="">${icon('search')} All Items</option>
            ${this.filters.map(f => `
              <option value="${f.id}" ${this.activeFilter?.id === f.id ? 'selected' : ''}>${f.name}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="filter-group">
          <input type="text" 
                 class="filter-input m-touch" 
                 placeholder="Search..." 
                 id="filterQuery"
                 oninput="filterManager.handleQueryChange(this.value)"
                 value="${this.activeFilter?.filter?.query || ''}">
        </div>
        
        <div class="filter-group">
          <select class="filter-select m-touch" id="filterStatus" onchange="filterManager.handleStatusChange(this.value)">
            <option value="">All Status</option>
            <option value="later">Later</option>
            <option value="now">Now</option>
            <option value="done">Done</option>
          </select>
        </div>
        
        ${tags.length > 0 ? `
          <div class="filter-group">
            <select class="filter-select m-touch" id="filterTag" onchange="filterManager.handleTagChange(this.value)">
              <option value="">All Tags</option>
              ${tags.map(tag => `<option value="${tag}">#${tag}</option>`).join('')}
            </select>
          </div>
        ` : ''}
        
        <button class="btn btn-secondary m-touch" onclick="filterManager.clearFilters()">Clear</button>
        <button class="btn btn-primary m-touch" onclick="filterManager.showSaveDialog()">${icon('save')} Save</button>
      </div>
    `
  }
  
  handleSavedFilterChange(filterId) {
    this.setActiveFilter(filterId)
    this._filterCallback?.()
  }
  
  handleQueryChange(query) {
    if (!this.activeFilter) {
      this.activeFilter = { filter: {} }
    }
    this.activeFilter.filter.query = query
    this._filterCallback?.()
  }
  
  handleStatusChange(status) {
    if (!this.activeFilter) {
      this.activeFilter = { filter: {} }
    }
    this.activeFilter.filter.status = status || undefined
    this._filterCallback?.()
  }
  
  handleTagChange(tag) {
    if (!this.activeFilter) {
      this.activeFilter = { filter: {} }
    }
    this.activeFilter.filter.tags = tag ? [tag] : undefined
    this._filterCallback?.()
  }
  
  clearFilters() {
    this.clearActiveFilter()
    const savedFilter = document.getElementById('savedFilter')
    const filterQuery = document.getElementById('filterQuery')
    const filterStatus = document.getElementById('filterStatus')
    const filterTag = document.getElementById('filterTag')
    
    if (savedFilter) savedFilter.value = ''
    if (filterQuery) filterQuery.value = ''
    if (filterStatus) filterStatus.value = ''
    if (filterTag) filterTag.value = ''
    
    this._filterCallback?.()
  }
  
  showSaveDialog() {
    const name = prompt('Filter name:')
    if (name && this.activeFilter?.filter) {
      this.create(name, this.activeFilter.filter)
      alert('Filter saved!')
    }
  }
}

export const filterManager = new FilterManager()

// Expose globally
window.filterManager = filterManager
