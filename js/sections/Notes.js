import { store } from '../state/store.js'
import { Toast } from '../components/Toast.js'
import { filterByBoard } from '../components/BoardSelector.js'
import { confirmDelete } from '../components/ConfirmDialog.js'
import { parseMarkdown, hasMarkdown, stripMarkdown } from '../utils/markdown.js'
import { icons } from '../utils/icons.js'

let currentFilter = 'all'
let editingNoteId = null
let previewMode = false

const NOTE_COLORS = [
  { id: 'default', bg: 'var(--color-surface)', border: 'var(--color-border)' },
  { id: 'yellow', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)' },
  { id: 'blue', bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)' },
  { id: 'green', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)' },
  { id: 'red', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)' },
  { id: 'purple', bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.3)' }
]

// Utility function - defined at module level
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
    // Ensure notes is an array
    if (!Array.isArray(notes)) return []
    
    let filtered = filterByBoard(notes, 'board')
    
    // Sort by pinned first, then by date
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  }
  
  function getNoteColor(colorId) {
    return NOTE_COLORS.find(c => c.id === colorId) || NOTE_COLORS[0]
  }
  
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      const diffHours = Math.floor((now - date) / (1000 * 60 * 60))
      if (diffHours === 0) return 'Just now'
      if (diffHours === 1) return '1 hour ago'
      return `${diffHours} hours ago`
    }
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  
  function render() {
    let allNotes = store.getState().notes || []
    
    // Handle V3 data where notes might be a string
    if (typeof allNotes === 'string') {
      allNotes = [{
        id: Date.now(),
        title: 'Imported Notes',
        text: allNotes,
        color: 'default',
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]
    }
    
    // Ensure it's an array
    if (!Array.isArray(allNotes)) {
      allNotes = []
    }
    
    const notes = getFilteredNotes(allNotes)
    
    const pinnedCount = Array.isArray(allNotes) ? allNotes.filter(n => n.pinned).length : 0
    const totalCount = Array.isArray(allNotes) ? allNotes.length : 0
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar m-card">
        <div class="welcome-content">
          <div class="welcome-greeting m-title">${icons.file()} Notes</div>
          <div class="welcome-status">
            ${pinnedCount > 0 ? `
              <span class="m-badge m-badge-warning">${icons.pin()} ${pinnedCount} pinned</span>
            ` : ''}
            <span class="m-badge">${totalCount} notes</span>
          </div>
        </div>
        <button class="m-btn-primary m-touch" onclick="startNewNote()">
          <span>${icons.plus()}</span>
          <span class="hide-mobile">New Note</span>
        </button>
      </div>      
      
      <!-- Filter -->
      <div class="notes-toolbar">
        <div class="filter-bar notes-filters">
          <button class="m-btn-secondary ${currentFilter === 'all' ? 'active' : ''} m-touch" 
            onclick="setNoteFilter('all')"
          >
            <span>All</span>
            <span class="filter-count">${totalCount}</span>
          </button>          
          <button class="m-btn-secondary ${currentFilter === 'pinned' ? 'active' : ''} m-touch" 
            onclick="setNoteFilter('pinned')"
          >
            <span>${icons.pin()} Pinned</span>
            <span class="filter-count">${pinnedCount}</span>
          </button>        
        </div>      
      </div>      
      <!-- New Note Input -->
      <div class="m-card new-note-card" id="newNoteCard" style="display: none;">
        <div class="new-note-header">
          <input type="text" 
            class="m-input" 
            id="newNoteTitle" 
            placeholder="Note title (optional)..."
          >          
          <div class="note-color-picker">
            ${NOTE_COLORS.map(c => `
              <button class="color-option ${c.id === 'default' ? 'active' : ''} m-touch" 
                data-color="${c.id}"
                style="background: ${c.bg}; border-color: ${c.border};"
                onclick="selectNoteColor('${c.id}')"
              ></button>
            `).join('')}
          </div>        
        </div>        
        <textarea 
          class="m-input" 
          id="newNoteText" 
          placeholder="Type your note here..."
          rows="4"
        ></textarea>
        
        <!-- Markdown Toolbar -->
        <div class="markdown-toolbar">
          <button type="button" class="m-btn-secondary m-touch" onclick="insertMarkdown('**', '**')" title="Bold">${icons.bold()}</button>
          <button type="button" class="m-btn-secondary m-touch" onclick="insertMarkdown('*', '*')" title="Italic">${icons.italic()}</button>
          <button type="button" class="m-btn-secondary m-touch" onclick="insertMarkdown('# ', '')" title="Heading">${icons.heading()}</button>
          <button type="button" class="m-btn-secondary m-touch" onclick="insertMarkdown('- ', '')" title="List">${icons.list()}</button>
          <button type="button" class="m-btn-secondary m-touch" onclick="insertMarkdown('[]()', '')" title="Link">${icons.link()}</button>
          <button type="button" class="m-btn-secondary m-touch" onclick="insertMarkdown('\`', '\`')" title="Code">${icons.code()}</button>
          <span class="m-caption" style="color: var(--text-muted); margin-left: auto;">
            ${icons.lightbulb()} Markdown supported
          </span>
        </div>
        
        <div class="new-note-actions">
          <button class="m-btn-secondary m-touch" onclick="cancelNewNote()">Cancel</button>          
          <button class="m-btn-primary m-touch" onclick="saveNewNote()">Save Note</button>        
        </div>      
      </div>      
      <!-- Quick Add (when not editing) -->
      <div class="m-card quick-add-card" id="quickAddCard" onclick="startNewNote()">
        <div class="quick-add-placeholder">
          <span>${icons.edit()}</span>
          <span class="m-body">Click to add a quick note...</span>        
        </div>      
      </div>      
      <!-- Notes Grid -->
      ${notes.length === 0 ? `
        <div class="empty-state m-card">
          <div class="empty-state-icon">${icons.file()}</div>
          <div class="empty-state-title m-title">${allNotes.length === 0 ? 'No notes yet' : 'No notes match'}</div>
          <div class="empty-state-text m-body">
            ${allNotes.length === 0 
              ? 'Add your first note to capture quick thoughts and ideas.'
              : 'Try adjusting your search or filter.'}
          </div>        
        </div>
      ` : `
        <div class="notes-grid">
          ${notes.map(note => renderNoteCard(note)).join('')}
        </div>
      `}
    `
  }
  
  function renderNoteCard(note) {
    const color = getNoteColor(note.color)
    const isEditing = editingNoteId === note.id
    
    if (isEditing) {
      return `
        <div class="note-card editing m-card" 
             style="background: ${color.bg}; border-color: ${color.border};">
          <input type="text" 
            class="m-input" 
            id="editNoteTitle-${note.id}"
            value="${escapeHtml(note.title || '')}"
            placeholder="Note title..."
          >
          <textarea 
            class="m-input" 
            id="editNoteText-${note.id}"
            rows="4"
          >${escapeHtml(note.text)}</textarea>
          
          <!-- Markdown Toolbar for Edit -->
          <div class="markdown-toolbar">
            <button type="button" class="m-btn-secondary m-touch" onclick="insertEditMarkdown(${note.id}, '**', '**')" title="Bold">${icons.bold()}</button>
            <button type="button" class="m-btn-secondary m-touch" onclick="insertEditMarkdown(${note.id}, '*', '*')" title="Italic">${icons.italic()}</button>
            <button type="button" class="m-btn-secondary m-touch" onclick="insertEditMarkdown(${note.id}, '# ', '')" title="Heading">${icons.heading()}</button>
            <button type="button" class="m-btn-secondary m-touch" onclick="insertEditMarkdown(${note.id}, '- ', '')" title="List">${icons.list()}</button>
            <button type="button" class="m-btn-secondary m-touch" onclick="insertEditMarkdown(${note.id}, '[]()', '')" title="Link">${icons.link()}</button>
            <button type="button" class="m-btn-secondary m-touch" onclick="insertEditMarkdown(${note.id}, '\`', '\`')" title="Code">${icons.code()}</button>
          </div>
          
          <div class="note-actions">
            <button class="m-btn-secondary m-touch" onclick="cancelEditNote()">Cancel</button>
            <button class="m-btn-primary m-touch" onclick="saveEditNote(${note.id})">Save</button>
          </div>
        </div>
      `
    }
    
    return `
      <div class="note-card ${note.pinned ? 'pinned' : ''} ${hasMarkdown(note.text) ? 'has-markdown' : ''} m-card"
           style="background: ${color.bg}; border-color: ${color.border};"
           onclick="startEditNote(${note.id})">        
        ${note.pinned ? '<div class="note-pin">' + icons.pin() + '</div>' : ''}
        
        ${note.title ? `
          <h4 class="note-title m-title">${escapeHtml(note.title)}</h4>
        ` : ''}
        
        <div class="note-text markdown-content m-body">${parseMarkdown(note.text)}</div>        
        <div class="note-footer">
          <span class="note-date m-caption">${formatDate(note.createdAt)}</span>          
          <div class="note-actions-row" onclick="event.stopPropagation()">            
            <button class="m-btn-secondary m-touch" onclick="togglePinNote(${note.id})"
              title="${note.pinned ? 'Unpin' : 'Pin'}"
            >
              ${note.pinned ? icons.pin() : icons.mapPin()}
            </button>            
            <button class="m-btn-danger m-touch" onclick="deleteNote(${note.id})"
              title="Delete"
            >
              ${icons.delete()}
            </button>          
          </div>        
        </div>      
      </div>
    `
  }
  
  let selectedColor = 'default'
  
  // Global functions
  window.startNewNote = () => {
    document.getElementById('newNoteCard').style.display = 'block'
    document.getElementById('quickAddCard').style.display = 'none'
    document.getElementById('newNoteText').focus()
  }
  
  window.cancelNewNote = () => {
    document.getElementById('newNoteCard').style.display = 'none'
    document.getElementById('quickAddCard').style.display = 'block'
    document.getElementById('newNoteTitle').value = ''
    document.getElementById('newNoteText').value = ''
    selectedColor = 'default'
    updateColorPicker()
  }
  
  window.selectNoteColor = (colorId) => {
    selectedColor = colorId
    updateColorPicker()
  }
  
  function updateColorPicker() {
    document.querySelectorAll('.color-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === selectedColor)
    })
  }
  
  window.saveNewNote = () => {
    const title = document.getElementById('newNoteTitle').value.trim()
    const text = document.getElementById('newNoteText').value.trim()
    
    if (!text) {
      Toast.error('Please enter note text')
      return
    }
    
    const notes = store.get('notes') || []
    notes.unshift({
      id: Date.now(),
      title,
      text,
      color: selectedColor,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    
    store.set('notes', notes)
    cancelNewNote()
    Toast.success('Note added')
  }
  
  window.insertEditMarkdown = (id, before, after) => {
    const textarea = document.getElementById(`editNoteText-${id}`)
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    const selected = value.substring(start, end)
    const replacement = before + selected + after
    
    textarea.value = value.substring(0, start) + replacement + value.substring(end)
    textarea.focus()
    textarea.setSelectionRange(start + before.length, start + replacement.length - after.length)
  }
  
  window.insertMarkdown = (before, after) => {
    const textarea = document.getElementById('newNoteText')
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    const selected = value.substring(start, end)
    const replacement = before + selected + after
    
    textarea.value = value.substring(0, start) + replacement + value.substring(end)
    textarea.focus()
    textarea.setSelectionRange(start + before.length, start + replacement.length - after.length)
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
    const title = document.getElementById(`editNoteTitle-${id}`).value.trim()
    const text = document.getElementById(`editNoteText-${id}`).value.trim()
    
    if (!text) {
      Toast.error('Note text cannot be empty')
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
      render()
      Toast.success('Note updated')
    }
  }
  
  window.togglePinNote = (id) => {
    const notes = store.get('notes')
    const note = notes.find(n => n.id === id)
    if (note) {
      note.pinned = !note.pinned
      store.set('notes', notes)
      Toast.success(note.pinned ? 'Note pinned' : 'Note unpinned')
    }
  }
  
  window.deleteNote = async (id) => {
    const note = store.get('notes').find(n => n.id === id)
    const confirmed = await confirmDelete(note?.title || 'this note')
    if (!confirmed) return
    
    const notes = store.get('notes')
    const filtered = notes.filter(n => n.id !== id)
    store.set('notes', filtered)
    Toast.success('Note deleted')
  }
  
  window.setNoteFilter = (filter) => {
    currentFilter = filter
    render()
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('notes') || path.includes('currentBoard')) render()
  })
  
  render()
  return { render }
}
