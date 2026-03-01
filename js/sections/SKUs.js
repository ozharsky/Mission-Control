import { store } from '../state/store.js'
import { parseSKUCSV, readFile, exportToCSV } from '../utils/csv.js'
import { toast } from '../components/Toast.js'
import { filterByBoard } from '../components/BoardSelector.js'
import { openSKUModal, deleteSKU } from '../components/SKUModal.js'
import { icons } from '../utils/icons.js'

let currentFilter = 'all'

const STOCK_LEVELS = {
  low: { threshold: 5, label: 'Low', colorClass: 'm-badge-danger' },
  medium: { threshold: 10, label: 'Medium', colorClass: 'm-badge-warning' },
  good: { threshold: Infinity, label: 'Good', colorClass: 'm-badge-success' }
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
          <div class="welcome-greeting m-title">${icons.package()} SKU Stock</div>
          <div class="welcome-status">
            ${stats.low > 0 ? `
              <span class="m-badge-danger"
              >${icons.alert()} ${stats.low} low stock</span>
            ` : `
              <span class="m-badge-success"
              >${icons.check()} Stock OK</span>
            `}
            <span class="m-badge-secondary">${stats.total} SKUs</span>
          </div>
        </div>
        <div class="welcome-actions">
          <button class="m-btn-secondary m-touch hide-mobile" onclick="downloadSkuTemplate()">
            ${icons.download()} Template
          </button>
          <button class="m-btn-secondary m-touch" onclick="exportSKUs()">
            ${icons.upload()} Export
          </button>
          <button class="m-btn-primary m-touch" onclick="openSKUModal()">
            <span>${icons.plus()}</span>
            <span class="hide-mobile">Add SKU</span>
          </button>
          <button class="m-btn-secondary m-touch" onclick="document.getElementById('skuFileInput').click()">
            <span>${icons.folder()}</span>
            <span class="hide-mobile">Import</span>
          </button>
        </div>
      </div>
      
      <input type="file" id="skuFileInput" accept=".csv" style="display: none;"
             onchange="handleSkuFileSelect(this)">
      
      <!-- Stock Stats Card -->
      <div class="m-card stock-stats-card">
        <div class="stock-stats">
          <div class="stock-stat low">
            <div class="stock-value m-title m-badge-danger">${stats.low}</div>
            <div class="stock-label m-caption">Low (<5)</div>
          </div>
          <div class="stock-stat medium">
            <div class="stock-value m-title m-badge-warning">${stats.medium}</div>
            <div class="stock-label m-caption">Medium (5-9)</div>
          </div>
          <div class="stock-stat good">
            <div class="stock-value m-title m-badge-success">${stats.good}</div>
            <div class="stock-label m-caption">Good (10+)</div>
          </div>
          <div class="stock-divider"></div>
          <div class="stock-stat total">
            <div class="stock-value m-title">${stats.totalStock}</div>
            <div class="stock-label m-caption">Total Units</div>
          </div>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="sku-toolbar">
        <div class="filter-bar sku-filters">
          <button class="m-btn-secondary ${currentFilter === 'all' ? 'active' : ''} m-touch" 
            onclick="setSkuFilter('all')"
          >
            <span>All</span>
            <span class="filter-count m-badge-secondary">${stats.total}</span>
          </button>
          <button class="m-btn-secondary ${currentFilter === 'low' ? 'active' : ''} m-touch" 
            onclick="setSkuFilter('low')"
          >
            <span>${icons.alert()} Low</span>
            <span class="filter-count m-badge-danger">${stats.low}</span>
          </button>
          <button class="m-btn-secondary ${currentFilter === 'medium' ? 'active' : ''} m-touch" 
            onclick="setSkuFilter('medium')"
          >
            <span>${icons.chart()} Medium</span>
          </button>
          <button class="m-btn-secondary ${currentFilter === 'good' ? 'active' : ''} m-touch" 
            onclick="setSkuFilter('good')"
          >
            <span>${icons.check()} Good</span>
          </button>
        </div>
      </div>
      
      <!-- SKU List -->
      ${skus.length === 0 ? `
        <div class="empty-state m-card">
          <div class="empty-state-icon">${icons.package()}</div>
          <div class="empty-state-title m-title">${allSkus.length === 0 ? 'No SKUs loaded' : 'No SKUs match'}</div>
          <div class="empty-state-text m-body">
            ${allSkus.length === 0 
              ? 'Import your SKU inventory from CSV to start tracking stock levels.'
              : 'Try adjusting your filters or search query.'}
          </div>
          ${allSkus.length === 0 ? `
            <button class="m-btn-primary m-touch" onclick="document.getElementById('skuFileInput').click()">
              ${icons.folder()} Import CSV
            </button>
          ` : ''}
        </div>
      ` : `
        <div class="sku-list m-card">
          <div class="sku-list-header m-caption">
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
          <span class="sku-code-text m-body">${escapeHtml(sku.code)}</span>
        </div>
        <div class="sku-name m-body">${escapeHtml(sku.name)}</div>
        
        <div class="sku-stock numeric">
          <input type="number" 
            class="stock-input m-input"
            value="${sku.stock}" 
            min="0"
            onchange="updateSkuStock('${sku.code}', this.value)"
          >
        </div>
        
        <div class="sku-status numeric">
          <span class="${level.colorClass} m-caption"
          >${level.label}</span>
        </div>
        
        <div class="sku-actions">
          <button class="m-btn-secondary m-touch" onclick="event.stopPropagation(); openSKUModal(${sku.id})"
          >${icons.edit()} Edit</button>
          <button class="m-btn-danger m-touch" onclick="event.stopPropagation(); deleteSKU(${sku.id})"
          >${icons.delete()} Delete</button>
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
