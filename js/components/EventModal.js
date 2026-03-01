// Event Modal - Create and edit events
import { store } from '../state/store.js'
import { toast } from './Toast.js'
import { sanitizeInput } from '../utils/sanitize.js'
import { lockBodyScroll, unlockBodyScroll } from '../utils/modalScrollLock.js'

const EVENT_TYPES = [
  { value: 'cannabis', label: '🌿 Cannabis', color: '#4ade80' },
  { value: 'trade', label: '🏢 Trade Show', color: '#60a5fa' },
  { value: 'photo', label: '📸 Photography', color: '#f472b6' },
  { value: 'etsy', label: '🛒 Etsy', color: '#f59e0b' },
  { value: 'other', label: '📅 Other', color: '#9ca3af' }
]

const STATUS_OPTIONS = [
  { value: 'upcoming', label: '📅 Upcoming' },
  { value: 'confirmed', label: '✅ Confirmed' },
  { value: 'tentative', label: '❓ Tentative' },
  { value: 'completed', label: '✓ Completed' },
  { value: 'cancelled', label: '✕ Cancelled' }
]

const BOARD_OPTIONS = [
  { value: 'all', label: '📋 All Boards' },
  { value: 'etsy', label: '🛒 Etsy' },
  { value: 'photography', label: '📸 Photography' },
  { value: 'wholesale', label: '🏢 Wholesale' },
  { value: '3dprint', label: '🖨️ 3D Printing' }
]

export function openEventModal(eventId = null, prefillData = null) {
  const existing = document.getElementById('eventModal')
  if (existing) existing.remove()
  
  const isEdit = !!eventId
  const event = isEdit ? store.get('events').find(e => e.id === eventId) : null
  
  // Check for prefill data from calendar or other sources
  let defaultDate
  if (prefillData?.date) {
    defaultDate = prefillData.date
  } else if (window._calendarSelectedDate && !isEdit) {
    defaultDate = window._calendarSelectedDate
    window._calendarSelectedDate = null
  } else {
    // Default date is tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    defaultDate = tomorrow.toISOString().split('T')[0]
  }
  
  const modal = document.createElement('div')
  modal.id = 'eventModal'
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal" style="max-width: 500px;">
      <div class="modal-header">
        <div class="modal-title">${isEdit ? '✏️ Edit Event' : '➕ Add Event'}</div>
        <button class="modal-close" onclick="closeEventModal()">✕</button>
      </div>
      
      <form id="eventForm" class="modal-body">
        <div class="form-group">
          <label class="form-label">Event Name *</label>
          <input type="text" class="form-input" id="eventName" 
            value="${isEdit ? sanitizeInput(event.name) : ''}" 
            placeholder="e.g., Emerald Cup 2026" required>
        </div>
        
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Date *</label>
            <input type="date" class="form-input" id="eventDate" 
              value="${isEdit ? event.date : defaultDate}" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-select" id="eventType">
              ${EVENT_TYPES.map(opt => `
                <option value="${opt.value}" ${isEdit && event.type === opt.value ? 'selected' : ''}>
                  ${opt.label}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" class="form-input" id="eventLocation" 
              value="${isEdit ? sanitizeInput(event.location) : ''}" 
              placeholder="e.g., Seattle, WA">
          </div>
          
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-select" id="eventStatus">
              ${STATUS_OPTIONS.map(opt => `
                <option value="${opt.value}" ${isEdit && event.status === opt.value ? 'selected' : (opt.value === 'upcoming' ? 'selected' : '')}>
                  ${opt.label}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Board</label>
          <select class="form-select" id="eventBoard">
            ${BOARD_OPTIONS.map(opt => `
              <option value="${opt.value}" ${isEdit && event.board === opt.value ? 'selected' : (opt.value === 'all' ? 'selected' : '')}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="eventNotes" rows="3" 
            placeholder="Any additional details about this event...">${isEdit ? sanitizeInput(event.notes) : ''}</textarea>
        </div>
        
      </form>
      
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeEventModal()">Cancel</button>
        <button type="button" class="btn btn-primary" onclick="saveEvent(${isEdit ? eventId : 'null'})">
          ${isEdit ? '💾 Save Changes' : '➕ Add Event'}
        </button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Lock body scroll on mobile
  if (window.innerWidth <= 768) {
    lockBodyScroll()
  }
  
  // Focus first input
  setTimeout(() => document.getElementById('eventName')?.focus(), 100)
  
  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) closeEventModal()
  }
  
  // Close on Escape
  document.addEventListener('keydown', handleEscape)
  function handleEscape(e) {
    if (e.key === 'Escape') {
      closeEventModal()
      document.removeEventListener('keydown', handleEscape)
    }
  }
}

export function closeEventModal() {
  const modal = document.getElementById('eventModal')
  if (modal) modal.remove()
  
  // Unlock body scroll
  unlockBodyScroll()
}

export async function saveEvent(eventId = null) {
  const name = document.getElementById('eventName').value.trim()
  const date = document.getElementById('eventDate').value
  const type = document.getElementById('eventType').value
  const location = document.getElementById('eventLocation').value.trim()
  const status = document.getElementById('eventStatus').value
  const board = document.getElementById('eventBoard').value
  const notes = document.getElementById('eventNotes').value.trim()
  
  // Validation
  if (!name) {
    toast.error('Event name is required')
    document.getElementById('eventName').focus()
    return
  }
  
  if (!date) {
    toast.error('Event date is required')
    document.getElementById('eventDate').focus()
    return
  }
  
  const events = store.get('events') || []
  
  if (eventId) {
    // Update existing
    const index = events.findIndex(e => e.id === eventId)
    if (index !== -1) {
      events[index] = {
        ...events[index],
        name: sanitizeInput(name),
        date,
        type,
        location: sanitizeInput(location),
        status,
        board,
        notes: sanitizeInput(notes),
        updatedAt: new Date().toISOString()
      }
      toast.success('Event updated')
    }
  } else {
    // Create new
    events.push({
      id: Date.now(),
      name: sanitizeInput(name),
      date,
      type,
      location: sanitizeInput(location),
      status,
      board,
      notes: sanitizeInput(notes),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    toast.success('Event added')
  }
  
  store.set('events', events)
  closeEventModal()
}

// Expose globally
window.openEventModal = openEventModal
window.closeEventModal = closeEventModal
window.saveEvent = saveEvent