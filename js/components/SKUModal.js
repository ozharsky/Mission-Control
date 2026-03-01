// SKU Modal - Create and edit SKUs
import { store } from '../state/store.js'
import { toast } from './Toast.js'
import { sanitizeInput, sanitizeNumber } from '../utils/sanitize.js'

const COLOR_OPTIONS = [
  { value: 'BK', label: '⚫ Black' },
  { value: 'WH', label: '⚪ White' },
  { value: 'GY', label: '⚪ Grey' },
  { value: 'BL', label: '🔵 Blue' },
  { value: 'RD', label: '🔴 Red' },
  { value: 'GN', label: '🟢 Green' },
  { value: 'OR', label: '🟠 Orange' },
  { value: 'YL', label: '🟡 Yellow' },
  { value: 'PR', label: '🟣 Purple' },
  { value: 'PK', label: '🩷 Pink' }
]

const PRODUCT_TYPES = [
  { value: 'MIN', label: 'Mini Keychain' },
  { value: 'STD', label: 'Standard Case' },
  { value: 'MAG', label: 'Magnetic Case' },
  { value: 'BND', label: 'Bundle' },
  { value: 'ACC', label: 'Accessory' }
]

export function openSKUModal(skuId = null) {
  const existing = document.getElementById('skuModal')
  if (existing) existing.remove()
  
  const isEdit = !!skuId
  const sku = isEdit ? store.get('skus').find(s => s.id === skuId) : null
  
  const modal = document.createElement('div')
  modal.id = 'skuModal'
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal" style="max-width: 500px;">
      <div class="modal-header">
        <div class="modal-title">${isEdit ? '✏️ Edit SKU' : '➕ Add SKU'}</div>
        <button class="modal-close" onclick="closeSKUModal()">✕</button>
      </div>
      
      <form id="skuForm" class="modal-body">
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">SKU Code *</label>
            <input type="text" class="form-input" id="skuCode" 
              value="${isEdit ? sanitizeInput(sku.code) : ''}" 
              placeholder="e.g., MIN-BK-01"
              ${isEdit ? 'disabled' : ''}
              required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Stock *</label>
            <input type="number" class="form-input" id="skuStock" 
              value="${isEdit ? sku.stock : '0'}" 
              min="0"
              max="9999"
              required>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Product Name *</label>
          <input type="text" class="form-input" id="skuName" 
            value="${isEdit ? sanitizeInput(sku.name) : ''}" 
            placeholder="e.g., Black Mini Nicotine Pouch Keychain"
            required>
        </div>
        
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Product Type</label>
            <select class="form-select" id="skuType">
              ${PRODUCT_TYPES.map(opt => `
                <option value="${opt.value}" ${isEdit && sku.code?.startsWith(opt.value) ? 'selected' : ''}>
                  ${opt.label}
                </option>
              `).join('')}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Color</label>
            <select class="form-select" id="skuColor">
              ${COLOR_OPTIONS.map(opt => `
                <option value="${opt.value}" ${isEdit && sku.code?.includes(opt.value) ? 'selected' : ''}>
                  ${opt.label}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        
      </form>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeSKUModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveSKU(${isEdit ? skuId : 'null'})">
          ${isEdit ? '💾 Save Changes' : '➕ Add SKU'}
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Focus first input
  setTimeout(() => {
    const input = document.getElementById(isEdit ? 'skuStock' : 'skuCode')
    input?.focus()
  }, 100)
  
  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) closeSKUModal()
  }
  
  // Close on Escape
  document.addEventListener('keydown', handleEscape)
  function handleEscape(e) {
    if (e.key === 'Escape') {
      closeSKUModal()
      document.removeEventListener('keydown', handleEscape)
    }
  }
}

export function closeSKUModal() {
  const modal = document.getElementById('skuModal')
  if (modal) modal.remove()
}

export async function saveSKU(skuId = null) {
  const code = document.getElementById('skuCode').value.trim().toUpperCase()
  const name = document.getElementById('skuName').value.trim()
  const stock = sanitizeNumber(document.getElementById('skuStock').value, { defaultValue: 0, min: 0 })
  
  // Validation
  if (!code) {
    toast.error('SKU code is required')
    document.getElementById('skuCode')?.focus()
    return
  }
  
  if (!name) {
    toast.error('Product name is required')
    document.getElementById('skuName')?.focus()
    return
  }
  
  // Validate SKU format (XXX-CC-V)
  const skuRegex = /^[A-Z]{3}-[A-Z]{2}-\d{2}$/
  if (!skuRegex.test(code)) {
    toast.error('Invalid SKU format', 'Use format: XXX-CC-01 (e.g., MIN-BK-01)')
    document.getElementById('skuCode')?.focus()
    return
  }
  
  const skus = store.get('skus') || []
  
  // Check for duplicate code
  const existing = skus.find(s => s.code === code && s.id !== skuId)
  if (existing) {
    toast.error('SKU code already exists', code)
    return
  }
  
  if (skuId) {
    // Update existing
    const index = skus.findIndex(s => s.id === skuId)
    if (index !== -1) {
      skus[index] = {
        ...skus[index],
        stock,
        updatedAt: new Date().toISOString()
      }
      toast.success('SKU updated', code)
    }
  } else {
    // Create new
    skus.push({
      id: Date.now(),
      code,
      name: sanitizeInput(name),
      stock,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    toast.success('SKU added', code)
  }
  
  store.set('skus', skus)
  closeSKUModal()
}

export async function deleteSKU(id) {
  const { confirmDelete } = await import('./ConfirmDialog.js')
  const sku = store.get('skus').find(s => s.id === id)
  const confirmed = await confirmDelete(sku?.code || 'this SKU')
  if (!confirmed) return
  
  const skus = store.get('skus').filter(s => s.id !== id)
  store.set('skus', skus)
  toast.success('SKU deleted')
}

// Expose globally
window.openSKUModal = openSKUModal
window.closeSKUModal = closeSKUModal
window.saveSKU = saveSKU
window.deleteSKU = deleteSKU