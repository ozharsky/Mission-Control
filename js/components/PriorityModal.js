import { store } from '../state/store.js'
import { Toast } from './Toast.js'
import { logActivity } from '../utils/taskUtils.js'
import { lockBodyScroll, unlockBodyScroll } from '../utils/modalScrollLock.js'
import { icons } from '../utils/icons.js'

// Priority templates with rich preview data
const PRIORITY_TEMPLATES = {
  'etsy-listing': {
    label: 'Etsy Listing',
    icon: 'store',
    description: 'Create a new product listing on Etsy',
    preview: ['Write SEO title', 'Upload product photos', 'Set price & inventory', 'Add tags'],
    text: 'Create Etsy listing for new product',
    desc: 'Write title, description, tags, upload photos',
    tags: ['listing', 'etsy'],
    timeEstimate: 60,
    color: '#f59e0b'
  },
  'photo-shoot': {
    label: 'Photo Shoot',
    icon: 'camera',
    description: 'Product photography session',
    preview: ['Set up lighting', 'Take product shots', 'Edit photos', 'Export for web'],
    text: 'Product photography session',
    desc: 'Set up lighting, take photos, edit and export',
    tags: ['photo', 'content'],
    timeEstimate: 120,
    color: '#06b6d4'
  },
  'wholesale-lead': {
    label: 'Wholesale Lead',
    icon: 'users',
    description: 'Contact and follow up with wholesale prospects',
    preview: ['Research company', 'Draft outreach email', 'Send proposal', 'Schedule follow-up'],
    text: 'Contact wholesale prospect',
    desc: 'Research company, send email, follow up',
    tags: ['wholesale', 'sales'],
    timeEstimate: 30,
    color: '#8b5cf6'
  },
  'inventory-check': {
    label: 'Inventory Check',
    icon: 'package',
    description: 'Count and update stock levels',
    preview: ['Count physical stock', 'Update SKU levels', 'Check reorder points', 'Update system'],
    text: 'Check and update inventory',
    desc: 'Count stock, update SKU levels, reorder if needed',
    tags: ['operations', 'inventory'],
    timeEstimate: 45,
    color: '#10b981'
  },
  'seo-optimization': {
    label: 'SEO Optimization',
    icon: 'search',
    description: 'Improve Etsy search rankings',
    preview: ['Research keywords', 'Update titles', 'Optimize tags', 'Check analytics'],
    text: 'Optimize Etsy SEO',
    desc: 'Research keywords, update titles and tags',
    tags: ['seo', 'etsy'],
    timeEstimate: 90,
    color: '#ec4899'
  },
  'custom': {
    label: 'Custom Task',
    icon: 'pencil',
    description: 'Create a task from scratch',
    preview: ['Define your own task', 'Set custom parameters', 'Add any tags'],
    text: '',
    desc: '',
    tags: [],
    timeEstimate: 0,
    color: '#6366f1'
  }
}

// Form auto-save key
const FORM_AUTOSAVE_KEY = 'priorityModalDraft'

// Track auto-save state
let autoSaveIndicator = null

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
    <div class="modal" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <div class="modal-title">${icons.plus()} New Priority</div>
        <button class="modal-close m-touch" onclick="closePriorityModal()">${icons.x()}</button>
      </div>
      
      <div class="modal-body">
        <!-- Template Cards -->
        <div class="form-group">
          <label class="form-label">Choose Template</label>
          <div class="template-grid" id="templateGrid">
            ${Object.entries(PRIORITY_TEMPLATES).map(([key, tmpl]) => `
              <div class="template-card ${key === 'custom' ? 'selected' : ''}" 
                   data-template="${key}"
                   onclick="selectTemplate('${key}')"
                   style="--template-color: ${tmpl.color}">
                <div class="template-icon">${icons[tmpl.icon]()}</div>
                <div class="template-name">${tmpl.label}</div>
                <div class="template-preview">
                  ${tmpl.preview.map(p => `<span class="preview-item">• ${p}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
          <input type="hidden" id="priorityTemplate" value="custom">
        </div>
        
        <div class="form-group">
          <label class="form-label">
            Task *
            <span class="validation-hint" id="textValidation"></span>
          </label>
          <input type="text" 
                 class="form-input" 
                 id="priorityText" 
                 placeholder="What needs to be done?" 
                 required
                 oninput="validateField('priorityText', this.value)"
                 value="${escapeHtml(saved?.text || '')}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" 
                    id="priorityDesc" 
                    rows="2" 
                    placeholder="Add details...">${escapeHtml(saved?.desc || '')}</textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input type="date" 
                   class="form-input" 
                   id="priorityDueDate" 
                   value="${saved?.dueDate || ''}">
            <div style="display: flex; gap: 0.25rem; margin-top: 0.5rem;">
              <button type="button" 
                      class="btn btn-sm btn-secondary" 
                      onclick="setDatePreset('priorityDueDate', 'today')" 
                      style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">Today</button>
              <button type="button" 
                      class="btn btn-sm btn-secondary" 
                      onclick="setDatePreset('priorityDueDate', 'tomorrow')" 
                      style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">Tomorrow</button>
              <button type="button" 
                      class="btn btn-sm btn-secondary" 
                      onclick="setDatePreset('priorityDueDate', 'nextWeek')" 
                      style="font-size: 0.7rem; padding: 0.25rem 0.5rem;">+7d</button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" id="priorityStatus">
              <option value="later">Later</option>
              <option value="now">Now</option>
            </select>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Time Estimate</label>
            <div class="time-estimate-input">
              <input type="number" 
                     class="form-input" 
                     id="priorityTimeEstimate" 
                     placeholder="60" 
                     min="0"
                     value="${saved?.timeEstimate || ''}">
              <span class="time-unit">min</span>
            </div>
            <div class="time-presets">
              <button type="button" class="time-preset" onclick="setTimeEstimate(15)">15m</button>
              <button type="button" class="time-preset" onclick="setTimeEstimate(30)">30m</button>
              <button type="button" class="time-preset" onclick="setTimeEstimate(60)">1h</button>
              <button type="button" class="time-preset" onclick="setTimeEstimate(120)">2h</button>
            </div>
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
          <input type="text" 
                 class="form-input" 
                 id="priorityTags" 
                 placeholder="urgent, seo, client"
                 value="${(saved?.tags || []).join(', ')}">
          <div class="tag-suggestions">
            <span class="tag-suggestion" onclick="addTag('urgent')">+ urgent</span>
            <span class="tag-suggestion" onclick="addTag('etsy')">+ etsy</span>
            <span class="tag-suggestion" onclick="addTag('photo')">+ photo</span>
            <span class="tag-suggestion" onclick="addTag('wholesale')">+ wholesale</span>
            <span class="tag-suggestion" onclick="addTag('seo')">+ seo</span>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Assignee</label>
            <select class="form-input" id="priorityAssignee">
              <option value="">Unassigned</option>
              <option value="KimiClaw">KimiClaw</option>
              <option value="Oleg">Oleg</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Board</label>
            <select class="form-input" id="priorityBoard">
              <option value="all">All</option>
              <option value="etsy">Etsy</option>
              <option value="photography">Photo</option>
              <option value="wholesale">B2B</option>
              <option value="3dprint">3D Print</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Document Path</label>
          <input type="text" 
                 class="form-input" 
                 id="priorityDocPath" 
                 placeholder="path/to/file.md"
                 value="${escapeHtml(saved?.docPath || '')}">
        </div>
        
        <!-- Auto-save Indicator -->
        <div class="autosave-indicator" id="autosaveIndicator">
          <span class="autosave-icon">${icons.save()}</span>
          <span class="autosave-text">Draft saved</span>
        </div>
        
        ${saved ? `
          <div class="draft-loaded-notice">
            <span>${icons.clipboard()} Draft loaded from ${formatTime(saved.timestamp)}</span>
            <button type="button" class="btn btn-sm btn-text" onclick="clearDraft()">Clear</button>
          </div>
        ` : ''}
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary m-touch" onclick="closePriorityModal()">Cancel</button>
        <button class="btn btn-primary m-touch" id="savePriorityBtn" onclick="savePriority()">
          <span class="btn-text">${icons.check()} Create Priority</span>
          <span class="btn-spinner" style="display: none;">${icons.refresh()}</span>
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Lock body scroll on mobile
  if (window.innerWidth <= 768) {
    lockBodyScroll()
  }
  
  // Add styles
  addPriorityModalStyles()
  
  // Setup auto-save
  setupPriorityAutoSave()
  
  // Focus text input
  setTimeout(() => document.getElementById('priorityText')?.focus(), 100)
}

function addPriorityModalStyles() {
  if (document.getElementById('priorityModalStyles')) return
  
  const styles = document.createElement('style')
  styles.id = 'priorityModalStyles'
  styles.textContent = `
    .template-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    
    @media (max-width: 600px) {
      .template-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .template-card {
      padding: 1rem;
      background: var(--bg-secondary);
      border: 2px solid transparent;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    
    .template-card:hover {
      background: var(--bg-tertiary);
      transform: translateY(-2px);
    }
    
    .template-card.selected {
      border-color: var(--template-color, var(--primary));
      background: color-mix(in srgb, var(--template-color, var(--primary)) 10%, var(--bg-secondary));
    }
    
    .template-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .template-name {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    
    .template-preview {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      font-size: 0.7rem;
      color: var(--text-secondary);
      text-align: left;
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .template-card:hover .template-preview,
    .template-card.selected .template-preview {
      opacity: 1;
      max-height: 100px;
      margin-top: 0.5rem;
    }
    
    .preview-item {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .time-estimate-input {
      position: relative;
    }
    
    .time-estimate-input .form-input {
      padding-right: 3rem;
    }
    
    .time-unit {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    .time-presets {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .time-preset {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .time-preset:hover {
      background: var(--primary);
      color: white;
      border-color: var(--primary);
    }
    
    .tag-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .tag-suggestion {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      background: var(--bg-tertiary);
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .tag-suggestion:hover {
      background: var(--primary);
      color: white;
    }
    
    .autosave-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--success-bg, rgba(16, 185, 129, 0.1));
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      color: var(--success, #10b981);
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
    }
    
    .autosave-indicator.visible {
      opacity: 1;
      transform: translateY(0);
    }
    
    .autosave-icon {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .draft-loaded-notice {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--info-bg, rgba(6, 182, 212, 0.1));
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      color: var(--info, #06b6d4);
    }
    
    .validation-hint {
      float: right;
      font-size: 0.75rem;
      color: var(--danger, #ef4444);
    }
    
    .form-input.error {
      border-color: var(--danger, #ef4444);
      background: var(--danger-bg, rgba(239, 68, 68, 0.05));
    }
    
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-spinner {
      display: inline-block;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(styles)
}

export function closePriorityModal() {
  const modal = document.getElementById('priorityModal')
  if (modal) {
    modal.remove()
  }
  
  // Unlock body scroll
  unlockBodyScroll()
}

export function selectTemplate(templateKey) {
  // Update hidden input
  document.getElementById('priorityTemplate').value = templateKey
  
  // Update visual selection
  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.remove('selected')
  })
  document.querySelector(`[data-template="${templateKey}"]`)?.classList.add('selected')
  
  // Apply template data
  applyPriorityTemplate(templateKey)
}

export function applyPriorityTemplate(templateKey) {
  const template = PRIORITY_TEMPLATES[templateKey]
  if (!template) return
  
  if (template.text) {
    document.getElementById('priorityText').value = template.text
    validateField('priorityText', template.text)
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
      break
    case 'tomorrow':
      date.setDate(date.getDate() + 1)
      break
    case 'nextWeek':
      date.setDate(date.getDate() + 7)
      break
  }
  
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  field.value = `${yyyy}-${mm}-${dd}`
  
  showAutoSaveIndicator()
}

window.setTimeEstimate = function(minutes) {
  const field = document.getElementById('priorityTimeEstimate')
  if (field) {
    field.value = minutes
    showAutoSaveIndicator()
  }
}

window.addTag = function(tag) {
  const field = document.getElementById('priorityTags')
  if (!field) return
  
  const current = field.value.split(',').map(t => t.trim()).filter(t => t)
  if (!current.includes(tag)) {
    current.push(tag)
    field.value = current.join(', ')
    showAutoSaveIndicator()
  }
}

window.validateField = function(fieldId, value) {
  const field = document.getElementById(fieldId)
  const hint = document.getElementById(fieldId.replace('priority', '').toLowerCase() + 'Validation')
  
  if (!field) return
  
  if (fieldId === 'priorityText') {
    if (!value.trim()) {
      field.classList.add('error')
      if (hint) hint.textContent = 'Required'
      return false
    } else {
      field.classList.remove('error')
      if (hint) hint.textContent = ''
      return true
    }
  }
  
  return true
}

window.clearDraft = function() {
  clearFormAutoSave()
  closePriorityModal()
  openPriorityModal()
  Toast.success('Draft cleared')
}

export function savePriority() {
  const text = document.getElementById('priorityText').value.trim()
  
  if (!text) {
    Toast.error('Please enter a task description')
    document.getElementById('priorityText').focus()
    document.getElementById('priorityText').classList.add('error')
    return
  }
  
  // Show loading state
  const btn = document.getElementById('savePriorityBtn')
  const btnText = btn.querySelector('.btn-text')
  const btnSpinner = btn.querySelector('.btn-spinner')
  
  btn.disabled = true
  btnText.style.display = 'none'
  btnSpinner.style.display = 'inline-block'
  
  const desc = document.getElementById('priorityDesc').value.trim()
  const dueDate = document.getElementById('priorityDueDate').value
  const status = document.getElementById('priorityStatus').value
  const timeEstimate = parseInt(document.getElementById('priorityTimeEstimate').value) || 0
  const recurring = document.getElementById('priorityRecurring').value
  const docPath = document.getElementById('priorityDocPath').value.trim()
  const assignee = document.getElementById('priorityAssignee').value
  const board = document.getElementById('priorityBoard').value
  
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
  
  Toast.success('Priority created', text)
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
        showAutoSaveIndicator()
      }, 1000))
    }
  })
}

function showAutoSaveIndicator() {
  const indicator = document.getElementById('autosaveIndicator')
  if (!indicator) return
  
  indicator.classList.add('visible')
  
  // Hide after 3 seconds
  clearTimeout(autoSaveIndicator)
  autoSaveIndicator = setTimeout(() => {
    indicator.classList.remove('visible')
  }, 3000)
}

function saveFormAutoSave() {
  const data = {
    text: document.getElementById('priorityText')?.value || '',
    desc: document.getElementById('priorityDesc')?.value || '',
    dueDate: document.getElementById('priorityDueDate')?.value || '',
    timeEstimate: document.getElementById('priorityTimeEstimate')?.value || '',
    tags: (document.getElementById('priorityTags')?.value || '').split(',').map(t => t.trim()).filter(t => t),
    docPath: document.getElementById('priorityDocPath')?.value || '',
    timestamp: new Date().toISOString()
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

function formatTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date
  
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return date.toLocaleDateString()
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
window.selectTemplate = selectTemplate
window.applyPriorityTemplate = applyPriorityTemplate
window.savePriority = savePriority
window.setDatePreset = setDatePreset
window.setTimeEstimate = setTimeEstimate
window.addTag = addTag
window.validateField = validateField
window.clearDraft = clearDraft
