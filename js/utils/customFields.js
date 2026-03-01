// Custom fields system for extending tasks

import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'

class CustomFieldsManager {
  constructor() {
    this.fields = this.loadFields()
  }
  
  loadFields() {
    const saved = localStorage.getItem('custom_fields')
    return saved ? JSON.parse(saved) : []
  }
  
  saveFields() {
    localStorage.setItem('custom_fields', JSON.stringify(this.fields))
  }
  
  /**
   * Field types
   */
  getFieldTypes() {
    return [
      { id: 'text', name: 'Text', icon: '📝' },
      { id: 'number', name: 'Number', icon: '🔢' },
      { id: 'date', name: 'Date', icon: '📅' },
      { id: 'select', name: 'Select', icon: '📋' },
      { id: 'checkbox', name: 'Checkbox', icon: '☑️' },
      { id: 'url', name: 'URL', icon: '🔗' },
      { id: 'email', name: 'Email', icon: '📧' }
    ]
  }
  
  /**
   * Create a new custom field
   */
  create(config) {
    const field = {
      id: `cf_${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...config
    }
    
    this.fields.push(field)
    this.saveFields()
    
    toast.success('Custom field created', field.name)
    return field
  }
  
  /**
   * Update a custom field
   */
  update(id, updates) {
    const field = this.fields.find(f => f.id === id)
    if (field) {
      Object.assign(field, updates)
      this.saveFields()
    }
    return field
  }
  
  /**
   * Delete a custom field
   */
  delete(id) {
    this.fields = this.fields.filter(f => f.id !== id)
    this.saveFields()
    
    // Also remove from all items
    const priorities = store.get('priorities') || []
    priorities.forEach(p => {
      if (p.customFields) {
        delete p.customFields[id]
      }
    })
    store.set('priorities', priorities)
  }
  
  /**
   * Get field value for an item
   */
  getValue(item, fieldId) {
    return item.customFields?.[fieldId]
  }
  
  /**
   * Set field value for an item
   */
  setValue(item, fieldId, value) {
    if (!item.customFields) {
      item.customFields = {}
    }
    item.customFields[fieldId] = value
  }
  
  /**
   * Render field input
   */
  renderInput(field, value = '', onChange) {
    const inputId = `cf_${field.id}`
    
    switch (field.type) {
      case 'text':
        return `
          <div class="form-group">
            <label class="form-label">${field.name}</label>
            <input type="text" 
                   class="form-input" 
                   id="${inputId}"
                   value="${escapeHtml(value)}"
                   placeholder="${field.placeholder || ''}"
                   onchange="${onChange}('${field.id}', this.value)">
          </div>
        `
        
      case 'number':
        return `
          <div class="form-group">
            <label class="form-label">${field.name}</label>
            <input type="number" 
                   class="form-input" 
                   id="${inputId}"
                   value="${value}"
                   min="${field.min || ''}"
                   max="${field.max || ''}"
                   step="${field.step || '1'}"
                   onchange="${onChange}('${field.id}', parseFloat(this.value))">
          </div>
        `
        
      case 'date':
        return `
          <div class="form-group">
            <label class="form-label">${field.name}</label>
            <input type="date" 
                   class="form-input" 
                   id="${inputId}"
                   value="${value}"
                   onchange="${onChange}('${field.id}', this.value)">
          </div>
        `
        
      case 'select':
        return `
          <div class="form-group">
            <label class="form-label">${field.name}</label>
            <select class="form-input" 
                    id="${inputId}"
                    onchange="${onChange}('${field.id}', this.value)">
              <option value="">-- Select --</option>
              ${field.options?.map(opt => `
                <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
                  ${opt.label}
                </option>
              `).join('')}
            </select>
          </div>
        `
        
      case 'checkbox':
        return `
          <div class="form-group">
            <label class="form-label" style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" 
                     ${value ? 'checked' : ''}
                     onchange="${onChange}('${field.id}', this.checked)">
              ${field.name}
            </label>
          </div>
        `
        
      case 'url':
        return `
          <div class="form-group">
            <label class="form-label">${field.name}</label>
            <input type="url" 
                   class="form-input" 
                   id="${inputId}"
                   value="${escapeHtml(value)}"
                   placeholder="https://..."
                   onchange="${onChange}('${field.id}', this.value)">
            ${value ? `<a href="${value}" target="_blank" class="form-hint">🔗 Open link</a>` : ''}
          </div>
        `
        
      case 'email':
        return `
          <div class="form-group">
            <label class="form-label">${field.name}</label>
            <input type="email" 
                   class="form-input" 
                   id="${inputId}"
                   value="${escapeHtml(value)}"
                   placeholder="email@example.com"
                   onchange="${onChange}('${field.id}', this.value)">
          </div>
        `
        
      default:
        return ''
    }
  }
  
  /**
   * Render field display (read-only)
   */
  renderDisplay(field, value) {
    if (value === undefined || value === null || value === '') {
      return '<span class="text-muted">--</span>'
    }
    
    switch (field.type) {
      case 'url':
        return `<a href="${value}" target="_blank" class="link">${escapeHtml(value)}</a>`
      case 'email':
        return `<a href="mailto:${value}" class="link">${escapeHtml(value)}</a>`
      case 'checkbox':
        return value ? '☑️ Yes' : '⬜ No'
      case 'date':
        return new Date(value).toLocaleDateString()
      default:
        return escapeHtml(String(value))
    }
  }
  
  /**
   * Render settings UI for managing fields
   */
  renderSettings(containerId) {
    const container = document.getElementById(containerId)
    if (!container) return
    
    container.innerHTML = `
      <div class="card">
        <div class="card-title">🔧 Custom Fields</div>
        
        <div style="margin-bottom: 1rem;">
          <button class="btn btn-primary" onclick="customFields.showCreateDialog()">➕ Add Field</button>
        </div>
        
        ${this.fields.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🔧</div>
            <div class="empty-state-title">No custom fields</div>
            <div class="empty-state-desc">Add custom fields to track additional information</div>
          </div>
        ` : `
          <div class="custom-fields-list">
            ${this.fields.map(f => `
              <div class="custom-field-item" data-id="${f.id}">
                <div class="custom-field-info">
                  <span class="custom-field-icon">${this.getFieldTypes().find(t => t.id === f.type)?.icon || '🔧'}</span>
                  <span class="custom-field-name">${f.name}</span>
                  <span class="custom-field-type">${f.type}</span>
                </div>
                <div class="custom-field-actions">
                  <button class="btn btn-sm btn-secondary" onclick="customFields.editField('${f.id}')">Edit</button>
                  <button class="btn btn-sm btn-danger" onclick="customFields.deleteField('${f.id}')">Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `
  }
  
  showCreateDialog() {
    const name = prompt('Field name:')
    if (!name) return
    
    const types = this.getFieldTypes()
    const type = prompt(`Field type (${types.map(t => t.id).join(', ')}):`)
    if (!type || !types.find(t => t.id === type)) return
    
    const config = { name, type }
    
    if (type === 'select') {
      const options = prompt('Options (comma-separated):')
      if (options) {
        config.options = options.split(',').map(o => ({
          value: o.trim().toLowerCase().replace(/\s+/g, '-'),
          label: o.trim()
        }))
      }
    }
    
    this.create(config)
    this.renderSettings('customFieldsSettings')
  }
  
  editField(id) {
    const field = this.fields.find(f => f.id === id)
    if (!field) return
    
    const newName = prompt('Field name:', field.name)
    if (newName) {
      this.update(id, { name: newName })
      this.renderSettings('customFieldsSettings')
    }
  }
  
  deleteField(id) {
    if (confirm('Delete this custom field? This will remove the data from all items.')) {
      this.delete(id)
      this.renderSettings('customFieldsSettings')
    }
  }
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export const customFields = new CustomFieldsManager()

// Expose globally
window.customFields = customFields
