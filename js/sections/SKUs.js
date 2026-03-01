import { store } from '../state/store.js'
import { parseSKUCSV, readFile, exportToCSV } from '../utils/csv.js'
import { toast } from '../components/Toast.js'
import { filterByBoard } from '../components/BoardSelector.js'
import { openSKUModal, deleteSKU } from '../components/SKUModal.js'

let currentFilter = 'all'
let searchQuery = ''

const STOCK_LEVELS = {
  low: { threshold: 5, label: 'Low', color: 'var(--accent-danger)', bg: 'rgba(239, 68, 68, 0.1)' },
  medium: { threshold: 10, label: 'Medium', color: 'var(--accent-warning)', bg: 'rgba(245, 158, 11, 0.1)' },
  good: { threshold: Infinity, label: 'Good', color: 'var(--accent-success)', bg: 'rgba(16, 185, 129, 0.1)' }
}

export function createSKUsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function getFilteredSKUs(skus) {
    let filtered = filterByBoard(skus, 'board')
    
    // Apply stock filter
    if (currentFilter === 'low') {
      filtered = filtered.filter(s => s.stock < STOCK_LEVELS.low.threshold)
    } else if (currentFilter === 'medium') {
      filtered = filtered.filter(s => s.stock >= STOCK_LEVELS.low.threshold && s.stock < STOCK_LEVELS.medium.threshold)
    } else if (currentFilter === 'good') {
      filtered = filtered.filter(s => s.stock >= STOCK_LEVELS.medium.threshold)
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.code.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query)
      )
    }
    
    // Sort by stock (lowest first), then by code
    return filtered.sort((a, b) => {
      if (a.stock !== b.stock) return a.stock - b.stock
      return a.code.localeCompare(b.code)
    })
  }
  
  function getStockLevel(stock) {
    if (stock < STOCK_LEVELS.low.threshold) return STOCK_LEVELS.low
    if (stock < STOCK_LEVELS.medium.threshold) return STOCK_LEVELS.medium
    return STOCK_LEVELS.good
  }
  
  function getStockStats(skus) {
    const low = skus.filter(s => s.stock < STOCK_LEVELS.low.threshold).length
    const medium = skus.filter(s => s.stock >= STOCK_LEVELS.low.threshold && s.stock < STOCK_LEVELS.medium.threshold).length
    const good = skus.filter(s => s.stock >= STOCK_LEVELS.medium.threshold).length
    const totalStock = skus.reduce((sum, s) => sum + s.stock, 0)
    return { low, medium, good, total: skus.length, totalStock }
  }
  
  function render() {
    const allSkus = store.getState().skus || []
    const skus = getFilteredSKUs(allSkus)
    const stats = getStockStats(allSkus)
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting">📦 SKU Stock</div>
          <div class="welcome-status">
            ${stats.low > 0 ? `
              <span class="status-badge" style="background: ${STOCK_LEVELS.low.bg}; color: ${STOCK_LEVELS.low.color};"
              >⚠️ ${stats.low} low stock</span>
            ` : `
              <span class="status-badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-success);"
              >✅ Stock OK</span>
            `}
            <span class="status-badge">${stats.total} SKUs</span>
          </div>
        </div>
        <div class="welcome-actions">
          <button class="btn btn-sm btn-secondary hide-mobile" onclick="downloadSkuTemplate()">
            📥 Template
          </button>
          <button class="btn btn-sm btn-secondary" onclick="exportSKUs()">
            📤 Export
          </button>
          <button class="btn btn-primary" onclick="openSKUModal()">
            <span>➕</span>
            <span class="hide-mobile">Add SKU</span>
          </button>
          <button class="btn btn-sm btn-secondary" onclick="document.getElementById('skuFileInput').click()">
            <span>📁</span>
            <span class="hide-mobile">Import</span>
          </button>
        </div>
      </div>
      
      <input type="file" id="skuFileInput" accept=".csv" style="display: none;"
             onchange="handleSkuFileSelect(this)">
      
      <!-- Stock Stats Card -->
      <div class="card stock-stats-card">
        <div class="stock-stats">
          <div class="stock-stat low">
            <div class="stock-value" style="color: ${STOCK_LEVELS.low.color};">${stats.low}</div>
            <div class="stock-label">Low (<5)</div>
          </div>
          <div class="stock-stat medium">
            <div class="stock-value" style="color: ${STOCK_LEVELS.medium.color};">${stats.medium}</div>
            <div class="stock-label">Medium (5-9)</div>
          </div>
          <div class="stock-stat good">
            <div class="stock-value" style="color: ${STOCK_LEVELS.good.color};">${stats.good}</div>
            <div class="stock-label">Good (10+)</div>
          </div>
          <div class="stock-divider"></div>
          <div class="stock-stat total">
            <div class="stock-value">${stats.totalStock}</div>
            <div class="stock-label">Total Units</div>
          </div>
        </div>
      </div>
      
      <!-- Filters & Search -->
      <div class="sku-toolbar">
        <div class="filter-bar sku-filters">
          <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
            onclick="setSkuFilter('all')"
          >
            <span>All</span>
            <span class="filter-count">${stats.total}</span>
          </button>
          <button class="filter-btn ${currentFilter === 'low' ? 'active' : ''}" 
            onclick="setSkuFilter('low')"
            style="${currentFilter === 'low' ? `border-color: ${STOCK_LEVELS.low.color};` : ''}"
          >
            <span>⚠️ Low</span>
            <span class="filter-count" style="background: ${STOCK_LEVELS.low.bg}; color: ${STOCK_LEVELS.low.color};"
            >${stats.low}</span>
          </button>
          <button class="filter-btn ${currentFilter === 'medium' ? 'active' : ''}" 
            onclick="setSkuFilter('medium')"
            style="${currentFilter === 'medium' ? `border-color: ${STOCK_LEVELS.medium.color};` : ''}"
          >
            <span>📊 Medium</span>
          </button>
          <button class="filter-btn ${currentFilter === 'good' ? 'active' : ''}" 
            onclick="setSkuFilter('good')"
            style="${currentFilter === 'good' ? `border-color: ${STOCK_LEVELS.good.color};` : ''}"
          >
            <span>✅ Good</span>
          </button>
        </div>
        
        <div class="sku-search">
          <input type="text" 
            class="search-input" 
            placeholder="🔍 Search SKUs..."
            value="${searchQuery}"
            oninput="setSkuSearch(this.value)"
          >
        </div>
      </div>
      
      <!-- SKU List -->
      ${skus.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-title">${allSkus.length === 0 ? 'No SKUs loaded' : 'No SKUs match'}</div>
          <div class="empty-state-text">
            ${allSkus.length === 0 
              ? 'Import your SKU inventory from CSV to start tracking stock levels.'
              : 'Try adjusting your filters or search query.'}
          </div>
          ${allSkus.length === 0 ? `
            <button class="btn btn-primary" onclick="document.getElementById('skuFileInput').click()">
              📁 Import CSV
            </button>
          ` : ''}
        </div>
      ` : `
        <div class="sku-list">
          <div class="sku-list-header">
            <span>SKU Code</span>
            <span>Product Name</span>
            <span class="numeric">Stock</span>
            <span class="numeric">Status</span>
          </div>
          ${skus.map(sku => renderSkuRow(sku)).join('')}
        </div>
      `}
    `
  }
  
  function renderSkuRow(sku) {
    const level = getStockLevel(sku.stock)
    
    return `
      <div class="sku-row ${sku.stock < STOCK_LEVELS.low.threshold ? 'low-stock' : ''}">
        <div class="sku-code">
          <span class="sku-code-text">${escapeHtml(sku.code)}</span>
        </div>
        <div class="sku-name">${escapeHtml(sku.name)}</div>
        
        <div class="sku-stock numeric">
          <input type="number" 
            class="stock-input"
            value="${sku.stock}" 
            min="0"
            onchange="updateSkuStock('${sku.code}', this.value)"
          >
        </div>
        
        <div class="sku-status numeric">
          <span class="status-pill" style="background: ${level.bg}; color: ${level.color};"
          >${level.label}</span>
        </div>
        
        <div class="sku-actions">
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); openSKUModal(${sku.id})"
          >✏️ Edit</button>
          <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); deleteSKU(${sku.id})"
          >🗑️ Delete</button>
        </div>
      </div>
    `
  }
  
  window.editSkuStock = (code) => {
    // Focus the stock input for this SKU
    const input = document.querySelector(`input[onchange*="${code}"]`)
    if (input) {
      input.focus()
      input.select()
    }
  }
  
  window.setSkuSearch = (query) => {
    searchQuery = query
    render()
  }
  
  window.setSkuFilter = (filter) => {
    currentFilter = filter
    render()
  }
  
  window.handleSkuFileSelect = async (input) => {
    const file = input.files[0]
    if (!file) return
    
    try {
      toast.info('Reading file...', file.name)
      const text = await readFile(file)
      const rows = parseSKUCSV(text)
      
      if (rows.length === 0) {
        toast.error('No valid SKUs found', 'Expected: SKU Code, Product Name, Stock')
        return
      }
      
      // Replace all SKUs (not merge)
      store.set('skus', rows)
      toast.success('SKUs imported', `${rows.length} items loaded`)
      
    } catch (err) {
      console.error('SKU import error:', err)
      toast.error('Import failed', err.message)
    }
    
    input.value = ''
  }
  
  window.updateSkuStock = (code, value) => {
    const skus = store.get('skus')
    const sku = skus.find(s => s.code === code)
    if (sku) {
      const oldStock = sku.stock
      sku.stock = parseInt(value) || 0
      store.set('skus', skus)
      
      if (oldStock !== sku.stock) {
        toast.success(`Stock updated`, `${code}: ${sku.stock} units`)
      }
    }
  }
  
  window.editSkuStock = (code) => {
    const sku = store.get('skus').find(s => s.code === code)
    if (sku) {
      // Focus the input for this row
      const input = document.querySelector(`input[onchange*="${code}"]`)
      if (input) {
        input.focus()
        input.select()
      }
    }
  }
  
  window.downloadSkuTemplate = () => {
    const template = 'SKU Code,Product Name,Stock\nMRC-BK-01,Mini Round Case Black,10\nMRC-WH-01,Mini Round Case White,5'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sku-template.csv'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded')
  }
  
  window.exportSKUs = () => {
    const skus = store.get('skus')
    if (skus.length === 0) {
      toast.warning('No SKUs to export')
      return
    }
    
    exportToCSV(skus, 'skus-export.csv')
    toast.success('SKUs exported')
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('skus') || path.includes('currentBoard')) render()
  })
  
  render()
  return { render }
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}