import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { filterByBoard } from '../components/BoardSelector.js'
import { confirmDelete } from '../components/ConfirmDialog.js'
import { parseMarkdown, hasMarkdown, stripMarkdown } from '../utils/markdown.js'

let currentFilter = 'all'
let searchQuery = ''
let editingNoteId = null
let previewMode = false

const NOTE_COLORS = [
  { id: 'default', bg: 'var(--bg-tertiary)', border: 'var(--border-color)' },
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
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n => 
        n.text.toLowerCase().includes(query) ||
        n.title?.toLowerCase().includes(query)
      )
    }
    
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
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting">📝 Notes</div>
          <div class="welcome-status">
            ${pinnedCount > 0 ? `
              <span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-warning);"
              >📌 ${pinnedCount} pinned</span>
            ` : ''}
            <span class="status-badge">${totalCount} notes</span>
          </div>
        </div>
        <button class="btn btn-primary" onclick="startNewNote()">
          <span>➕</span>
          <span class="hide-mobile">New Note</span>
        </button>
      </div>      
      
      <!-- Search & Filter -->
      <div class="notes-toolbar">
        <div class="notes-search">
          <input type="text" 
            class="search-input" 
            placeholder="🔍 Search notes..."
            value="${searchQuery}"
            oninput="setNoteSearch(this.value)"
          >
        </div>        
        <div class="filter-bar notes-filters">
          <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
            onclick="setNoteFilter('all')"
          >
            <span>All</span>
            <span class="filter-count">${totalCount}</span>
          </button>          
          <button class="filter-btn ${currentFilter === 'pinned' ? 'active' : ''}" 
            onclick="setNoteFilter('pinned')"
          >
            <span>📌 Pinned</span>
            <span class="filter-count">${pinnedCount}</span>
          </button>        
        </div>      
      </div>      
      <!-- New Note Input -->
      <div class="card new-note-card" id="newNoteCard" style="display: none;">
        <div class="new-note-header">
          <input type="text" 
            class="new-note-title-input" 
            id="newNoteTitle" 
            placeholder="Note title (optional)..."
          >          
          <div class="note-color-picker">
            ${NOTE_COLORS.map(c => `
              <button class="color-option ${c.id === 'default' ? 'active' : ''}" 
                data-color="${c.id}"
                style="background: ${c.bg}; border-color: ${c.border};"
                onclick="selectNoteColor('${c.id}')"
              ></button>
            `).join('')}
          </div>        
        </div>        
        <textarea 
          class="new-note-textarea" 
          id="newNoteText" 
          placeholder="Type your note here..."
          rows="4"
        ></textarea>
        
        <!-- Markdown Toolbar -->
        <div class="markdown-toolbar" style="display: flex; gap: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px; margin-bottom: 0.5rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-sm btn-text" onclick="insertMarkdown('**', '**')" title="Bold"><strong>B</strong></button>
          <button type="button" class="btn btn-sm btn-text" onclick="insertMarkdown('*', '*')" title="Italic"><em>I</em></button>
          <button type="button" class="btn btn-sm btn-text" onclick="insertMarkdown('# ', '')" title="Heading">H</button>
          <button type="button" class="btn btn-sm btn-text" onclick="insertMarkdown('- ', '')" title="List">•</button>
          <button type="button" class="btn btn-sm btn-text" onclick="insertMarkdown('[]()', '')" title="Link">🔗</button>
          <button type="button" class="btn btn-sm btn-text" onclick="insertMarkdown('\`', '\`')" title="Code">&lt;/&gt;</button>
          <span style="color: var(--text-muted); margin-left: auto; font-size: 0.75rem;">
            💡 Markdown supported
          </span>
        </div>
        
        <div class="new-note-actions">
          <button class="btn btn-secondary" onclick="cancelNewNote()">Cancel</button>          
          <button class="btn btn-primary" onclick="saveNewNote()">Save Note</button>        
        </div>      
      </div>      
      <!-- Quick Add (when not editing) -->
      <div class="card quick-add-card" id="quickAddCard" onclick="startNewNote()">
        <div class="quick-add-placeholder">
          <span>✏️</span>
          <span>Click to add a quick note...</span>        
        </div>      
      </div>      
      <!-- Notes Grid -->
      ${notes.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📝</div>
          <div class="empty-state-title">${allNotes.length === 0 ? 'No notes yet' : 'No notes match'}</div>
          <div class="empty-state-text">
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
        <div class="note-card editing" 
             style="background: ${color.bg}; border-color: ${color.border};">
          <input type="text" 
            class="edit-note-title" 
            id="editNoteTitle-${note.id}"
            value="${escapeHtml(note.title || '')}"
            placeholder="Note title..."
          >
          <textarea 
            class="edit-note-text" 
            id="editNoteText-${note.id}"
            rows="4"
          >${escapeHtml(note.text)}</textarea>
          
          <!-- Markdown Toolbar for Edit -->
          <div class="markdown-toolbar" style="display: flex; gap: 0.5rem; padding: 0.5rem; background: var(--bg-secondary); border-radius: 4px; margin: 0.5rem 0; flex-wrap: wrap;"
          >
            <button type="button" class="btn btn-sm btn-text" onclick="insertEditMarkdown(${note.id}, '**', '**')" title="Bold"
            ><strong>B</strong></button>
            <button type="button" class="btn btn-sm btn-text" onclick="insertEditMarkdown(${note.id}, '*', '*')" title="Italic"
            ><em>I</em></button>
            <button type="button" class="btn btn-sm btn-text" onclick="insertEditMarkdown(${note.id}, '# ', '')" title="Heading"
            >H</button>
            <button type="button" class="btn btn-sm btn-text" onclick="insertEditMarkdown(${note.id}, '- ', '')" title="List"
            >•</button>
            <button type="button" class="btn btn-sm btn-text" onclick="insertEditMarkdown(${note.id}, '[]()', '')" title="Link"
            >🔗</button>
            <button type="button" class="btn btn-sm btn-text" onclick="insertEditMarkdown(${note.id}, '\`', '\`')" title="Code"
            >&lt;/&gt;</button>
          </div>
          
          <div class="note-actions">
            <button class="btn btn-sm btn-secondary" onclick="cancelEditNote()">Cancel</button>
            <button class="btn btn-sm btn-primary" onclick="saveEditNote(${note.id})">Save</button>
          </div>
        </div>
      `
    }
    
    return `
      <div class="note-card ${note.pinned ? 'pinned' : ''} ${hasMarkdown(note.text) ? 'has-markdown' : ''}"
           style="background: ${color.bg}; border-color: ${color.border};"
           onclick="startEditNote(${note.id})">        
        ${note.pinned ? '<div class="note-pin">📌</div>' : ''}
        
        ${note.title ? `
          <h4 class="note-title">${escapeHtml(note.title)}</h4>
        ` : ''}
        
        <div class="note-text markdown-content">${parseMarkdown(note.text)}</div>        
        <div class="note-footer">
          <span class="note-date">${formatDate(note.createdAt)}</span>          
          <div class="note-actions-row" onclick="event.stopPropagation()">            
            <button class="note-action-btn" onclick="togglePinNote(${note.id})"
              title="${note.pinned ? 'Unpin' : 'Pin'}"
            >
              ${note.pinned ? '📌' : '📍'}
            </button>            
            <button class="note-action-btn delete" onclick="deleteNote(${note.id})"
              title="Delete"
            >
              🗑️
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
      toast.error('Please enter note text')
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
    toast.success('Note added')
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
      toast.error('Note text cannot be empty')
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
      toast.success('Note updated')
    }
  }
  
  window.togglePinNote = (id) => {
    const notes = store.get('notes')
    const note = notes.find(n => n.id === id)
    if (note) {
      note.pinned = !note.pinned
      store.set('notes', notes)
      toast.success(note.pinned ? 'Note pinned' : 'Note unpinned')
    }
  }
  
  window.deleteNote = async (id) => {
    const note = store.get('notes').find(n => n.id === id)
    const confirmed = await confirmDelete(note?.title || 'this note')
    if (!confirmed) return
    
    const notes = store.get('notes')
    const filtered = notes.filter(n => n.id !== id)
    store.set('notes', filtered)
    toast.success('Note deleted')
  }
  
  window.setNoteFilter = (filter) => {
    currentFilter = filter
    render()
  }
  
  window.setNoteSearch = (query) => {
    searchQuery = query
    render()
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('notes') || path.includes('currentBoard')) render()
  })
  
  render()
  return { render }
}