import { store } from '../state/store.js'
import { toast } from './Toast.js'
import { logActivity } from '../utils/taskUtils.js'

// Priority templates
const PRIORITY_TEMPLATES = {
  'etsy-listing': {
    label: '🏪 Etsy Listing',
    text: 'Create Etsy listing for new product',
    desc: 'Write title, description, tags, upload photos',
    tags: ['listing', 'etsy'],
    timeEstimate: 60
  },
  'photo-shoot': {
    label: '📸 Photo Shoot',
    text: 'Product photography session',
    desc: 'Set up lighting, take photos, edit and export',
    tags: ['photo', 'content'],
    timeEstimate: 120
  },
  'wholesale-lead': {
    label: '🤝 Wholesale Lead',
    text: 'Contact wholesale prospect',
    desc: 'Research company, send email, follow up',
    tags: ['wholesale', 'sales'],
    timeEstimate: 30
  },
  'inventory-check': {
    label: '📦 Inventory Check',
    text: 'Check and update inventory',
    desc: 'Count stock, update SKU levels, reorder if needed',
    tags: ['operations', 'inventory'],
    timeEstimate: 45
  },
  'seo-optimization': {
    label: '🔍 SEO Optimization',
    text: 'Optimize Etsy SEO',
    desc: 'Research keywords, update titles and tags',
    tags: ['seo', 'etsy'],
    timeEstimate: 90
  },
  'custom': {
    label: '✏️ Custom Task',
    text: '',
    desc: '',
    tags: [],
    timeEstimate: 0
  }
}

// Form auto-save key
const FORM_AUTOSAVE_KEY = 'priorityModalDraft'

export function openPriorityModal() {
  const existing = document.getElementById('priorityModal')
  if (existing) existing.remove()
  
  // Load auto-saved data if exists
  const saved = loadFormAutoSave()
  
  const modal = document.createElement('div')
  modal.id = 'priorityModal'
  modal.className = 'modal-overlay active'
  modal.onclick = (e) => {
    if (e.target === modal) closePriorityModal()
  }
  
  modal.innerHTML = `
    <div class="modal" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <div class="modal-title">➕ New Priority</div>
        <button class="modal-close" onclick="closePriorityModal()">✕</button>
      </div>
      
      <div class="modal-body">
        <!-- Template Selector -->
        <div class="form-group">
          <label class="form-label">Template</label>
          <select class="form-input" id="priorityTemplate" onchange="applyPriorityTemplate(this.value)">
            ${Object.entries(PRIORITY_TEMPLATES).map(([key, tmpl]) => `
              <option value="${key}">${tmpl.label}</option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Task *</label>
          <input type="text" class="form-input" id="priorityText" placeholder="What needs to be done?" required
                 value="${escapeHtml(saved?.text || '')}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="priorityDesc" rows="2" placeholder="Add details...">${escapeHtml(saved?.desc || '')}</textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input type="date" class="form-input" id="priorityDueDate" value="${saved?.dueDate || ''}">
            <div style="display: flex; gap: 0.25rem; margin-top: 0.5rem;">
              <button type="button" class="btn btn-sm btn-secondary" onclick="setDatePreset('priorityDueDate', 'today')" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">Today</button>
              <button type="button" class="btn btn-sm btn-secondary" onclick="setDatePreset('priorityDueDate', 'tomorrow')" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">Tomorrow</button>
              <button type="button" class="btn btn-sm btn-secondary" onclick="setDatePreset('priorityDueDate', 'nextWeek')" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">+7d</button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" id="priorityStatus">
              <option value="later">📥 Later</option>
              <option value="now">⚡ Now</option>
            </select>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Time Estimate (minutes)</label>
            <input type="number" class="form-input" id="priorityTimeEstimate" placeholder="e.g., 60" min="0"
                   value="${saved?.timeEstimate || ''}">
          </div>
          
          <div class="form-group">
            <label class="form-label">Recurring</label>
            <select class="form-input" id="priorityRecurring">
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tags (comma separated)</label>
          <input type="text" class="form-input" id="priorityTags" placeholder="urgent, seo, client"
                 value="${(saved?.tags || []).join(', ')}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Assignee</label>
          <select class="form-input" id="priorityAssignee">
            <option value="">Unassigned</option>
            <option value="KimiClaw">🤖 KimiClaw</option>
            <option value="Oleg">👤 Oleg</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Board</label>
          <select class="form-input" id="priorityBoard">
            <option value="all">🏢 All</option>
            <option value="etsy">🛒 Etsy</option>
            <option value="photography">📸 Photo</option>
            <option value="wholesale">🏪 B2B</option>
            <option value="3dprint">🖨️ 3D Print</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Document Path</label>
          <input type="text" class="form-input" id="priorityDocPath" placeholder="path/to/file.md"
                 value="${escapeHtml(saved?.docPath || '')}">
        </div>
        
        ${saved ? `
          <div style="padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 0.875rem; color: var(--text-secondary);">
            💾 Auto-saved draft loaded
          </div>
        ` : ''}
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closePriorityModal()">Cancel</button>
        <button class="btn btn-primary" onclick="savePriority()">✅ Create Priority</button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Setup auto-save
  setupPriorityAutoSave()
  
  // Focus text input
  setTimeout(() => document.getElementById('priorityText')?.focus(), 100)
}

export function closePriorityModal() {
  const modal = document.getElementById('priorityModal')
  if (modal) {
    modal.remove()
  }
}

export function applyPriorityTemplate(templateKey) {
  const template = PRIORITY_TEMPLATES[templateKey]
  if (!template) return
  
  if (template.text) {
    document.getElementById('priorityText').value = template.text
  }
  if (template.desc) {
    document.getElementById('priorityDesc').value = template.desc
  }
  if (template.tags?.length) {
    document.getElementById('priorityTags').value = template.tags.join(', ')
  }
  if (template.timeEstimate) {
    document.getElementById('priorityTimeEstimate').value = template.timeEstimate
  }
}

// Date preset helper
window.setDatePreset = function(fieldId, preset) {
  const field = document.getElementById(fieldId)
  if (!field) return
  
  const date = new Date()
  
  switch(preset) {
    case 'today':
      // Date is already today
      break
    case 'tomorrow':
      date.setDate(date.getDate() + 1)
      break
    case 'nextWeek':
      date.setDate(date.getDate() + 7)
      break
  }
  
  // Format as YYYY-MM-DD for input
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  field.value = `${yyyy}-${mm}-${dd}`
}

export function savePriority() {
  const text = document.getElementById('priorityText').value.trim()
  
  if (!text) {
    toast.error('Please enter a task description')
    document.getElementById('priorityText').focus()
    return
  }
  
  const desc = document.getElementById('priorityDesc').value.trim()
  const dueDate = document.getElementById('priorityDueDate').value
  const status = document.getElementById('priorityStatus').value
  const timeEstimate = parseInt(document.getElementById('priorityTimeEstimate').value) || 0
  const recurring = document.getElementById('priorityRecurring').value
  const docPath = document.getElementById('priorityDocPath').value.trim()
  const assignee = document.getElementById('priorityAssignee').value
  const board = document.getElementById('priorityBoard').value
  
  // Parse tags
  const tagsInput = document.getElementById('priorityTags').value
  const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t)
  
  const priority = {
    id: Date.now(),
    text,
    desc,
    dueDate,
    status,
    completed: false,
    tags,
    timeEstimate,
    timeSpent: 0,
    recurring,
    docPath,
    assignee,
    board,
    blockedBy: [],
    activityLog: [{
      timestamp: new Date().toISOString(),
      action: 'Created',
      details: 'Priority created'
    }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  // Add to store
  const priorities = store.get('priorities') || []
  priorities.unshift(priority)
  store.set('priorities', priorities)
  
  // Clear auto-save
  clearFormAutoSave()
  
  toast.success('Priority created', text)
  closePriorityModal()
}

// Auto-save functionality
function setupPriorityAutoSave() {
  const fields = ['priorityText', 'priorityDesc', 'priorityDueDate', 'priorityTimeEstimate', 'priorityTags', 'priorityDocPath']
  
  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId)
    if (field) {
      field.addEventListener('input', debounce(() => {
        saveFormAutoSave()
      }, 1000))
    }
  })
}

function saveFormAutoSave() {
  const data = {
    text: document.getElementById('priorityText')?.value || '',
    desc: document.getElementById('priorityDesc')?.value || '',
    dueDate: document.getElementById('priorityDueDate')?.value || '',
    timeEstimate: document.getElementById('priorityTimeEstimate')?.value || '',
    tags: (document.getElementById('priorityTags')?.value || '').split(',').map(t => t.trim()).filter(t => t),
    docPath: document.getElementById('priorityDocPath')?.value || ''
  }
  
  localStorage.setItem(FORM_AUTOSAVE_KEY, JSON.stringify(data))
}

function loadFormAutoSave() {
  try {
    const saved = localStorage.getItem(FORM_AUTOSAVE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

function clearFormAutoSave() {
  localStorage.removeItem(FORM_AUTOSAVE_KEY)
}

function debounce(fn, delay) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Expose globally
window.openPriorityModal = openPriorityModal
window.closePriorityModal = closePriorityModal
window.applyPriorityTemplate = applyPriorityTemplate
window.savePriority = savePriority
