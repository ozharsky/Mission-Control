// Sort Options
// Adds sorting capabilities to lists

export const sortOptions = {
  // Priority sorting
  priorities: [
    { value: 'dueDate-asc', label: '📅 Due Date (Earliest)', icon: '📅' },
    { value: 'dueDate-desc', label: '📅 Due Date (Latest)', icon: '📅' },
    { value: 'created-desc', label: '🆕 Newest First', icon: '🆕' },
    { value: 'created-asc', label: '📜 Oldest First', icon: '📜' },
    { value: 'priority-desc', label: '🔥 Priority (High-Low)', icon: '🔥' },
    { value: 'priority-asc', label: '🔥 Priority (Low-High)', icon: '🔥' },
    { value: 'title-asc', label: '🔤 Title (A-Z)', icon: '🔤' },
    { value: 'title-desc', label: '🔤 Title (Z-A)', icon: '🔤' }
  ],
  
  // Project sorting
  projects: [
    { value: 'updated-desc', label: '🔄 Recently Updated', icon: '🔄' },
    { value: 'created-desc', label: '🆕 Newest First', icon: '🆕' },
    { value: 'title-asc', label: '🔤 Title (A-Z)', icon: '🔤' },
    { value: 'title-desc', label: '🔤 Title (Z-A)', icon: '🔤' },
    { value: 'status-asc', label: '📊 Status', icon: '📊' }
  ],
  
  // Lead sorting
  leads: [
    { value: 'updated-desc', label: '🔄 Recently Updated', icon: '🔄' },
    { value: 'created-desc', label: '🆕 Newest First', icon: '🆕' },
    { value: 'name-asc', label: '🔤 Name (A-Z)', icon: '🔤' },
    { value: 'name-desc', label: '🔤 Name (Z-A)', icon: '🔤' },
    { value: 'status-asc', label: '📊 Status', icon: '📊' },
    { value: 'value-desc', label: '💰 Value (High-Low)', icon: '💰' }
  ],
  
  // Event sorting
  events: [
    { value: 'date-asc', label: '📅 Date (Soonest)', icon: '📅' },
    { value: 'date-desc', label: '📅 Date (Latest)', icon: '📅' },
    { value: 'name-asc', label: '🔤 Name (A-Z)', icon: '🔤' },
    { value: 'type-asc', label: '📂 Type', icon: '📂' }
  ],
  
  // SKU sorting
  skus: [
    { value: 'sku-asc', label: '🔤 SKU (A-Z)', icon: '🔤' },
    { value: 'name-asc', label: '📝 Name (A-Z)', icon: '📝' },
    { value: 'stock-asc', label: '📦 Stock (Low-High)', icon: '📦' },
    { value: 'stock-desc', label: '📦 Stock (High-Low)', icon: '📦' },
    { value: 'price-desc', label: '💰 Price (High-Low)', icon: '💰' }
  ],
  
  // Note sorting
  notes: [
    { value: 'updated-desc', label: '🔄 Recently Updated', icon: '🔄' },
    { value: 'created-desc', label: '🆕 Newest First', icon: '🆕' },
    { value: 'title-asc', label: '🔤 Title (A-Z)', icon: '🔤' }
  ],
  
  // Document sorting
  docs: [
    { value: 'updated-desc', label: '🔄 Recently Updated', icon: '🔄' },
    { value: 'name-asc', label: '🔤 Name (A-Z)', icon: '🔤' },
    { value: 'type-asc', label: '📂 Type', icon: '📂' },
    { value: 'size-desc', label: '📊 Size (Large-Small)', icon: '📊' }
  ]
}

// Sort function
export function sortItems(items, sortValue) {
  const [field, direction] = sortValue.split('-')
  const multiplier = direction === 'asc' ? 1 : -1
  
  return [...items].sort((a, b) => {
    let valA = a[field]
    let valB = b[field]
    
    // Handle dates
    if (field.includes('Date') || field === 'created' || field === 'updated') {
      valA = new Date(valA || 0).getTime()
      valB = new Date(valB || 0).getTime()
    }
    // Handle numbers
    else if (typeof valA === 'number' && typeof valB === 'number') {
      // Keep as numbers
    }
    // Handle strings
    else {
      valA = String(valA || '').toLowerCase()
      valB = String(valB || '').toLowerCase()
    }
    
    if (valA < valB) return -1 * multiplier
    if (valA > valB) return 1 * multiplier
    return 0
  })
}

// Create sort dropdown
export function createSortDropdown(section, currentSort, onChange) {
  const options = sortOptions[section] || []
  
  const select = document.createElement('select')
  select.className = 'sort-select'
  select.innerHTML = `
    <option value="">Sort by...</option>
    ${options.map(opt => `
      <option value="${opt.value}" ${currentSort === opt.value ? 'selected' : ''}>
        ${opt.label}
      </option>
    `).join('')}
  `
  
  select.onchange = (e) => {
    if (e.target.value) {
      onChange(e.target.value)
    }
  }
  
  return select
}

// Create sort button group
export function createSortButtons(section, currentSort, onChange) {
  const options = sortOptions[section] || []
  const container = document.createElement('div')
  container.className = 'sort-buttons'
  
  options.forEach(opt => {
    const btn = document.createElement('button')
    btn.className = `sort-btn ${currentSort === opt.value ? 'active' : ''}`
    btn.innerHTML = opt.icon
    btn.title = opt.label
    btn.onclick = () => {
      onChange(opt.value)
      container.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    }
    container.appendChild(btn)
  })
  
  return container
}
