// Lead Modal - Create and edit leads
import { store } from '../state/store.js'
import { toast } from './Toast.js'
import { sanitizeInput, sanitizeNumber } from '../utils/sanitize.js'

const STATUS_OPTIONS = [
  { value: 'new', label: '🆕 New', color: '#6366f1' },
  { value: 'contacted', label: '📧 Contacted', color: '#f59e0b' },
  { value: 'qualified', label: '✅ Qualified', color: '#10b981' },
  { value: 'proposal', label: '📄 Proposal', color: '#8b5cf6' },
  { value: 'closed', label: '🔒 Closed', color: '#64748b' },
  { value: 'lost', label: '❌ Lost', color: '#ef4444' }
]

const BOARD_OPTIONS = [
  { value: 'all', label: '📋 All Boards' },
  { value: 'etsy', label: '🛒 Etsy' },
  { value: 'photography', label: '📸 Photography' },
  { value: 'wholesale', label: '🏢 Wholesale' },
  { value: '3dprint', label: '🖨️ 3D Printing' }
]

export function openLeadModal(leadId = null) {
  const existing = document.getElementById('leadModal')
  if (existing) existing.remove()
  
  const isEdit = !!leadId
  const lead = isEdit ? store.get('leads').find(l => l.id === leadId) : null
  
  const modal = document.createElement('div')
  modal.id = 'leadModal'
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal" style="max-width: 500px;">
      <div class="modal-header">
        <div class="modal-title">${isEdit ? '✏️ Edit Lead' : '➕ Add Lead'}</div>
        <button class="modal-close" onclick="closeLeadModal()">✕</button>
      </div>
      
      <form id="leadForm" class="modal-body">
        <div class="form-group">
          <label class="form-label">Company Name *</label>
          <input type="text" class="form-input" id="leadCompany" 
            value="${isEdit ? sanitizeInput(lead.company) : ''}" 
            placeholder="e.g., Soulshine Cannabis" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Contact Name *</label>
          <input type="text" class="form-input" id="leadName" 
            value="${isEdit ? sanitizeInput(lead.name) : ''}" 
            placeholder="e.g., John Smith" required>
        </div>
        
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" id="leadEmail" 
              value="${isEdit ? sanitizeInput(lead.email) : ''}" 
              placeholder="john@example.com">
          </div>
          
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" class="form-input" id="leadPhone" 
              value="${isEdit ? sanitizeInput(lead.phone) : ''}" 
              placeholder="(555) 123-4567">
          </div>
        </div>
        
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Potential Value ($)</label>
            <input type="number" class="form-input" id="leadValue" 
              value="${isEdit ? lead.value : ''}" 
              placeholder="5000" min="0" step="100">
          </div>
          
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="leadStatus">
              ${STATUS_OPTIONS.map(opt => `
                <option value="${opt.value}" ${isEdit && lead.status === opt.value ? 'selected' : ''}
                  style="color: ${opt.color}">
                  ${opt.label}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Board</label>
          <select class="form-select" id="leadBoard">
            ${BOARD_OPTIONS.map(opt => `
              <option value="${opt.value}" ${isEdit && lead.board === opt.value ? 'selected' : (opt.value === 'all' ? 'selected' : '')}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="leadNotes" rows="3" 
            placeholder="Any additional information about this lead...">${isEdit ? sanitizeInput(lead.notes) : ''}</textarea>
        </div>
        
      </form>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeLeadModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveLead(${isEdit ? leadId : 'null'})">
          ${isEdit ? '💾 Save Changes' : '➕ Add Lead'}
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Focus first input
  setTimeout(() => document.getElementById('leadCompany')?.focus(), 100)
  
  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) closeLeadModal()
  }
  
  // Close on Escape
  document.addEventListener('keydown', handleEscape)
  function handleEscape(e) {
    if (e.key === 'Escape') {
      closeLeadModal()
      document.removeEventListener('keydown', handleEscape)
    }
  }
}

export function closeLeadModal() {
  const modal = document.getElementById('leadModal')
  if (modal) modal.remove()
}

export async function saveLead(leadId = null) {
  const company = document.getElementById('leadCompany').value.trim()
  const name = document.getElementById('leadName').value.trim()
  const email = document.getElementById('leadEmail').value.trim()
  const phone = document.getElementById('leadPhone').value.trim()
  const value = sanitizeNumber(document.getElementById('leadValue').value, { defaultValue: 0 })
  const status = document.getElementById('leadStatus').value
  const board = document.getElementById('leadBoard').value
  const notes = document.getElementById('leadNotes').value.trim()
  
  // Validation
  if (!company) {
    toast.error('Company name is required')
    document.getElementById('leadCompany').focus()
    return
  }
  
  if (!name) {
    toast.error('Contact name is required')
    document.getElementById('leadName').focus()
    return
  }
  
  const leads = store.get('leads') || []
  
  if (leadId) {
    // Update existing
    const index = leads.findIndex(l => l.id === leadId)
    if (index !== -1) {
      leads[index] = {
        ...leads[index],
        company: sanitizeInput(company),
        name: sanitizeInput(name),
        email: sanitizeInput(email),
        phone: sanitizeInput(phone),
        value,
        status,
        board,
        notes: sanitizeInput(notes),
        updatedAt: new Date().toISOString()
      }
      toast.success('Lead updated')
    }
  } else {
    // Create new
    leads.push({
      id: Date.now(),
      company: sanitizeInput(company),
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      phone: sanitizeInput(phone),
      value,
      status,
      board,
      notes: sanitizeInput(notes),
      lastContact: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    toast.success('Lead added')
  }
  
  store.set('leads', leads)
  closeLeadModal()
}

// Expose globally
window.openLeadModal = openLeadModal
window.closeLeadModal = closeLeadModal
window.saveLead = saveLead