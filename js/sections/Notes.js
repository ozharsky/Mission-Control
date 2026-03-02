// Notes Section - Dashboard Style
import { store } from '../state/store.js'
import { Toast } from '../components/Toast.js'
import { confirmDelete } from '../components/ConfirmDialog.js'
import { icons } from '../utils/icons.js'

let currentFilter = 'all'
let editingNoteId = null
let quickNoteColor = 'default'

const NOTE_COLORS = [
  { id: 'default', bg: 'var(--color-surface)', border: 'var(--color-border)' },
  { id: 'yellow', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  { id: 'blue', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)' },
  { id: 'green', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
  { id: 'red', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' },
  { id: 'purple', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)' }
]

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function createNotesSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  function getFilteredNotes(notes) {
    if (!Array.isArray(notes)) return []
    
    let filtered = [...notes]
    
    if (currentFilter === 'pinned') {
      filtered = filtered.filter(n => n.pinned)
    }
    
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    })
  }

  function getNoteColor(colorId) {
    return NOTE_COLORS.find(c => c.id === colorId) || NOTE_COLORS[0]
  }

  function getNoteStats(notes) {
    const total = notes.length
    const pinned = notes.filter(n => n.pinned).length
    const withTitle = notes.filter(n => n.title).length
    const thisWeek = notes.filter(n => {
      const date = new Date(n.createdAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return date > weekAgo
    }).length
    return { total, pinned, withTitle, thisWeek }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    
    if (diff < 24 * 60 * 60 * 1000) {
      return 'Today'
    } else if (diff < 48 * 60 * 60 * 1000) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  function renderNoteCard(note) {
    const color = getNoteColor(note.color)
    const isEditing = editingNoteId === note.id
    
    if (isEditing) {
      return `
        <div class="note-card editing" style="background: ${color.bg}; border-color: ${color.border};"
             onclick="event.stopPropagation()">
          <input type="text" class="m-input" id="editNoteTitle-${note.id}"
            value="${escapeHtml(note.title || '')}" placeholder="Note title..."
            style="margin-bottom: var(--space-3);"
          >
          <textarea class="m-input" id="editNoteText-${note.id}" rows="4"
            style="margin-bottom: var(--space-3);"
          >${escapeHtml(note.text)}</textarea>
          <div style="display: flex; gap: var(--space-3); justify-content: flex-end;"
            onclick="event.stopPropagation()">
            <button class="m-btn-secondary" onclick="cancelEditNote()">Cancel</button>
            <button class="m-btn-primary" onclick="saveEditNote(${note.id})">Save</button>
          </div>
        </div>
      `
    }
    
    return `
      <div class="note-card ${note.pinned ? 'pinned' : ''}"
           style="background: ${color.bg}; border-color: ${color.border};"
           onclick="startEditNote(${note.id})">
        ${note.pinned ? `<div class="note-pin">${icons.pin()}</div>` : ''}
        
        ${note.title ? `
          <h4 class="note-title">${escapeHtml(note.title)}</h4>
        ` : ''}
        
        <div class="note-text">${escapeHtml(note.text).substring(0, 200)}${note.text.length > 200 ? '...' : ''}</div>
        
        <div class="note-footer">
          <span class="note-date">${formatDate(note.updatedAt || note.createdAt)}</span>
          <div class="note-actions" onclick="event.stopPropagation()">
            <button class="m-btn-secondary" onclick="togglePinNote(${note.id})" title="${note.pinned ? 'Unpin' : 'Pin'}">
              ${note.pinned ? icons.pin() : icons.mapPin()}
            </button>
            <button class="m-btn-secondary" onclick="deleteNote(${note.id})" title="Delete">
              ${icons.delete()}
            </button>
          </div>
        </div>
      </div>
    `
  }

  function render() {
    let allNotes = store.get('notes') || []
    if (!Array.isArray(allNotes)) allNotes = []
    
    const notes = getFilteredNotes(allNotes)
    const stats = getNoteStats(allNotes)

    container.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <div>
            <h1 class="dashboard-title">${icons.file()} Notes</h1>
            <p class="dashboard-subtitle">Capture ideas, track thoughts, organize your mind</p>
          </div>
          <div class="dashboard-actions">
            <button class="m-btn-primary" onclick="startNewNote()">
              ${icons.plus()} New Note
            </button>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-tile">
            <div class="stat-tile-header">
              <span class="stat-tile-label">Total Notes</span>
              <div class="stat-tile-icon">${icons.file()}</div>
            </div>
            <div class="stat-tile-value">${stats.total}</div>
          </div>
          <div class="stat-tile warning">
            <div class="stat-tile-header">
              <span class="stat-tile-label">Pinned</span>
              <div class="stat-tile-icon">${icons.pin()}</div>
            </div>
            <div class="stat-tile-value">${stats.pinned}</div>
          </div>
          <div class="stat-tile success">
            <div class="stat-tile-header">
              <span class="stat-tile-label">With Title</span>
              <div class="stat-tile-icon">${icons.type()}</div>
            </div>
            <div class="stat-tile-value">${stats.withTitle}</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-header">
              <span class="stat-tile-label">This Week</span>
              <div class="stat-tile-icon">${icons.calendar()}</div>
            </div>
            <div class="stat-tile-value">${stats.thisWeek}</div>
          </div>
        </div>

        <div class="quick-actions">
          <button class="quick-action-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="setNoteFilter('all')">
            ${icons.list()} All Notes
          </button>
          <button class="quick-action-btn ${currentFilter === 'pinned' ? 'active' : ''}" onclick="setNoteFilter('pinned')">
            ${icons.pin()} Pinned
          </button>
        </div>

        <div class="dashboard-grid">
          <div class="dashboard-main">
            <div class="dashboard-panel">
              <div class="dashboard-panel-header">
                <div class="dashboard-panel-title">
                  ${currentFilter === 'pinned' ? icons.pin() : icons.file()}
                  ${currentFilter === 'pinned' ? 'Pinned Notes' : 'All Notes'}
                </div>
                <span class="status-badge">${notes.length} items</span>
              </div>
              <div class="dashboard-panel-body">
                ${notes.length === 0 ? `
                  <div class="empty-state">
                    <div class="empty-state-icon">${icons.file()}</div>
                    <div class="empty-state-title">No notes yet</div>
                    <div class="empty-state-text">
                      ${currentFilter === 'pinned' 
                        ? 'Pin important notes to see them here' 
                        : 'Create your first note to get started'}
                    </div>
                  </div>
                ` : `
                  <div class="notes-grid">
                    ${notes.map(note => renderNoteCard(note)).join('')}
                  </div>
                `}
              </div>
            </div>
          </div>

          <div class="dashboard-sidebar">
            <div class="dashboard-panel">
              <div class="dashboard-panel-header">
                <div class="dashboard-panel-title">${icons.plus()} Quick Note</div>
              </div>
              <div class="dashboard-panel-body">
                <textarea class="m-input" id="quickNoteText" 
                  placeholder="Type a quick note..." rows="3"
                  style="margin-bottom: var(--space-3);"></textarea>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div class="note-color-picker">
                    ${NOTE_COLORS.map(c => `
                      <button class="color-option ${c.id === quickNoteColor ? 'active' : ''}" 
                        data-color="${c.id}"
                        style="background: ${c.bg}; border-color: ${c.border};"
                        onclick="selectQuickColor('${c.id}')"
                      ></button>
                    `).join('')}
                  </div>
                  <button class="m-btn-primary" onclick="saveQuickNote()">Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  // Global functions
  window.startNewNote = () => {
    document.getElementById('quickNoteText')?.focus()
  }

  window.selectQuickColor = (colorId) => {
    quickNoteColor = colorId
    render()
  }

  window.saveQuickNote = () => {
    const text = document.getElementById('quickNoteText')?.value.trim()
    if (!text) {
      Toast.error('Note cannot be empty')
      return
    }
    
    const notes = store.get('notes') || []
    notes.unshift({
      id: Date.now(),
      text,
      color: quickNoteColor,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    store.set('notes', notes)
    quickNoteColor = 'default'
    Toast.success('Note saved')
    render()
  }

  window.startEditNote = (id) => {
    editingNoteId = id
    render()
  }

  window.cancelEditNote = () => {
    editingNoteId = null
    render()
  }

  window.saveEditNote = (id) => {
    const title = document.getElementById(`editNoteTitle-${id}`)?.value.trim() || ''
    const text = document.getElementById(`editNoteText-${id}`)?.value.trim()
    
    if (!text) {
      Toast.error('Note cannot be empty')
      return
    }
    
    const notes = store.get('notes')
    const note = notes.find(n => n.id === id)
    if (note) {
      note.title = title
      note.text = text
      note.updatedAt = new Date().toISOString()
      store.set('notes', notes)
      editingNoteId = null
      Toast.success('Note updated')
      render()
    }
  }

  window.togglePinNote = (id) => {
    const notes = store.get('notes')
    const note = notes.find(n => n.id === id)
    if (note) {
      note.pinned = !note.pinned
      store.set('notes', notes)
      Toast.success(note.pinned ? 'Note pinned' : 'Note unpinned')
      render()
    }
  }

  window.deleteNote = async (id) => {
    const note = store.get('notes').find(n => n.id === id)
    const confirmed = await confirmDelete(note?.title || 'this note')
    if (!confirmed) return
    
    const notes = store.get('notes').filter(n => n.id !== id)
    store.set('notes', notes)
    Toast.success('Note deleted')
    render()
  }

  window.setNoteFilter = (filter) => {
    currentFilter = filter
    render()
  }

  store.subscribe((state, path) => {
    if (!path || path.includes('notes')) render()
  })

  render()
  return { render }
}

export default createNotesSection
