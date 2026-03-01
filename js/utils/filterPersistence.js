// Filter Persistence
// Saves and restores filter states across navigation

class FilterPersistence {
  constructor() {
    this.storageKey = 'mc-filters'
    this.filters = this.load()
    this.section = null
  }
  
  // Load saved filters
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '{}')
    } catch {
      return {}
    }
  }
  
  // Save filters
  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.filters))
  }
  
  // Set current section
  setSection(section) {
    this.section = section
  }
  
  // Save filter state for current section
  saveFilters(filterState) {
    if (!this.section) return
    
    this.filters[this.section] = {
      ...filterState,
      savedAt: Date.now()
    }
    this.save()
  }
  
  // Get saved filters for section
  getFilters(section = this.section) {
    if (!section) return null
    return this.filters[section] || null
  }
  
  // Restore filters to form elements
  restoreFilters(container, section = this.section) {
    const saved = this.getFilters(section)
    if (!saved) return false
    
    // Check if filters are too old (24 hours)
    if (Date.now() - saved.savedAt > 24 * 60 * 60 * 1000) {
      this.clearFilters(section)
      return false
    }
    
    // Restore status filters
    if (saved.status) {
      const statusBtns = container.querySelectorAll('.filter-btn[data-filter="status"]')
      statusBtns.forEach(btn => {
        btn.classList.toggle('active', saved.status.includes(btn.dataset.value))
      })
    }
    
    // Restore board filters
    if (saved.board) {
      const boardSelect = container.querySelector('.board-select')
      if (boardSelect) boardSelect.value = saved.board
    }
    
    // Restore sort
    if (saved.sort) {
      const sortSelect = container.querySelector('.sort-select')
      if (sortSelect) sortSelect.value = saved.sort
    }
    
    // Restore date range
    if (saved.dateFrom) {
      const dateFrom = container.querySelector('.date-from')
      if (dateFrom) dateFrom.value = saved.dateFrom
    }
    if (saved.dateTo) {
      const dateTo = container.querySelector('.date-to')
      if (dateTo) dateTo.value = saved.dateTo
    }
    
    return true
  }
  
  // Clear filters for section
  clearFilters(section = this.section) {
    if (!section) return
    delete this.filters[section]
    this.save()
  }
  
  // Clear all filters
  clearAll() {
    this.filters = {}
    this.save()
  }
  
  // Auto-save on filter change
  autoSave(container) {
    const save = () => {
      const state = this.captureState(container)
      this.saveFilters(state)
    }
    
    // Debounced save
    let timeout
    const debouncedSave = () => {
      clearTimeout(timeout)
      timeout = setTimeout(save, 500)
    }
    
    // Listen for changes
    container.addEventListener('input', debouncedSave)
    container.addEventListener('change', debouncedSave)
    
    return () => {
      container.removeEventListener('input', debouncedSave)
      container.removeEventListener('change', debouncedSave)
    }
  }
  
  // Capture current filter state
  captureState(container) {
    const state = {}
    
    // Status filters
    const activeStatus = container.querySelectorAll('.filter-btn[data-filter="status"].active')
    if (activeStatus.length) {
      state.status = Array.from(activeStatus).map(btn => btn.dataset.value)
    }
    
    // Board
    const boardSelect = container.querySelector('.board-select')
    if (boardSelect) state.board = boardSelect.value
    
    // Sort
    const sortSelect = container.querySelector('.sort-select')
    if (sortSelect) state.sort = sortSelect.value
    
    // Date range
    const dateFrom = container.querySelector('.date-from')
    const dateTo = container.querySelector('.date-to')
    if (dateFrom) state.dateFrom = dateFrom.value
    if (dateTo) state.dateTo = dateTo.value
    
    return state
  }
  
  // Create "Clear Filters" button
  createClearButton(onClear) {
    const btn = document.createElement('button')
    btn.className = 'btn btn-text btn-sm'
    btn.innerHTML = '🗑️ Clear Filters'
    btn.onclick = () => {
      this.clearFilters()
      if (onClear) onClear()
    }
    return btn
  }
  
  // Create filter status indicator
  createStatusIndicator(container) {
    const saved = this.getFilters()
    if (!saved) return null
    
    const indicator = document.createElement('span')
    indicator.className = 'filter-status'
    indicator.innerHTML = `
      💾 Filters saved 
      <button class="btn-text" onclick="filterPersistence.restoreFilters(this.closest('.section'))">Restore</button>
      <button class="btn-text" onclick="filterPersistence.clearFilters(); this.parentElement.remove()">Clear</button>
    `
    return indicator
  }
}

// Create singleton
export const filterPersistence = new FilterPersistence()

// Helper for sections
export function initFilterPersistence(sectionName, container) {
  filterPersistence.setSection(sectionName)
  
  // Try to restore
  const restored = filterPersistence.restoreFilters(container, sectionName)
  
  // Setup auto-save
  const cleanup = filterPersistence.autoSave(container)
  
  return {
    restored,
    cleanup,
    clear: () => filterPersistence.clearFilters(sectionName)
  }
}

export default filterPersistence
