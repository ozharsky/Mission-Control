import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { storageManager } from '../utils/storageManager.js'
import { confirmDelete } from '../components/ConfirmDialog.js'

let currentFilter = 'all'
let searchQuery = ''
let showUploadModal = false
let uploadedFiles = []
let selectedCategory = 'Other'
let selectedPriorityId = ''

const FILE_ICONS = {
  markdown: '📝',
  md: '📝',
  html: '🌐',
  pdf: '📄',
  doc: '📘',
  docx: '📘',
  xls: '📊',
  xlsx: '📊',
  csv: '📊',
  json: '⚙️',
  js: '⚙️',
  css: '🎨',
  default: '📄'
}

const CATEGORIES = {
  'Etsy': { icon: '🛒', color: '#ff6b6b' },
  'Photography': { icon: '📸', color: '#4ecdc4' },
  'Strategy': { icon: '🏢', color: '#45b7d1' },
  'Research': { icon: '📊', color: '#96ceb4' },
  'Marketing': { icon: '📢', color: '#feca57' },
  'Operations': { icon: '⚙️', color: '#dfe6e9' },
  'Other': { icon: '📁', color: '#b2bec3' }
}

export function createDocsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  function getFilteredDocs(docs) {
    let filtered = [...docs]

    // Apply category filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(d => d.category === currentFilter)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.category?.toLowerCase().includes(query) ||
        d.path?.toLowerCase().includes(query)
      )
    }

    // Sort by last modified (newest first)
    return filtered.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
  }

  function getFileIcon(type) {
    return FILE_ICONS[type?.toLowerCase()] || FILE_ICONS.default
  }

  function getCategoryConfig(category) {
    return CATEGORIES[category] || CATEGORIES['Other']
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  function render() {
    const allDocs = store.getState().docs || []
    const docs = getFilteredDocs(allDocs)

    // Get category counts
    const categoryCounts = {}
    allDocs.forEach(d => {
      const cat = d.category || 'Other'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    // Get recent docs (last 5)
    const recentDocs = [...allDocs]
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, 5)

    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting">📁 Docs</div>
          <div class="welcome-status">
            <span class="status-badge">${allDocs.length} documents</span>
            <span class="status-badge">${Object.keys(categoryCounts).length} categories</span>
          </div>
        </div>
        <button class="btn btn-primary" onclick="toggleUploadModal()">
          <span>📤</span>
          <span class="hide-mobile">Upload</span>
        </button>
      </div>

      <!-- Search & Filter Toolbar -->
      <div class="docs-toolbar">
        <div class="docs-search">
          <input type="text"
            class="search-input"
            placeholder="🔍 Search documents..."
            value="${searchQuery}"
            oninput="setDocSearch(this.value)"
          >
        </div>
        <div class="filter-bar docs-filters">
          <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}"
            onclick="setDocFilter('all')"
          >
            <span>All</span>
            <span class="filter-count">${allDocs.length}</span>
          </button>
          ${Object.entries(CATEGORIES).map(([cat, config]) =>
            categoryCounts[cat] ? `
              <button class="filter-btn ${currentFilter === cat ? 'active' : ''}"
                onclick="setDocFilter('${cat}')"
              >
                <span>${config.icon} ${cat}</span>
                <span class="filter-count">${categoryCounts[cat] || 0}</span>
              </button>
            ` : ''
          ).join('')}
        </div>
      </div>
      <!-- Recent Docs (only when no filter/search) -->
      ${!searchQuery && currentFilter === 'all' && recentDocs.length > 0 ? `
        <div class="card recent-docs-card">
          <div class="card-header">
            <div class="card-title">🕐 Recently Updated</div>
          </div>
          <div class="recent-docs-list">
            ${recentDocs.map(doc => renderRecentDoc(doc)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Documents Grid -->
      ${docs.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">${allDocs.length === 0 ? 'No documents yet' : 'No documents match'}</div>
          <div class="empty-state-text">
            ${allDocs.length === 0
              ? 'Add your first document to start organizing your files.'
              : 'Try adjusting your search or filter.'}
          </div>
          <button class="btn btn-primary" onclick="toggleUploadModal()">📤 Upload Document</button>
        </div>
      ` : `
        <div class="docs-grid">
          ${docs.map(doc => renderDocCard(doc)).join('')}
        </div>
      `}

      <!-- Quick Links Section -->
      <div class="card quick-links-card">
        <div class="card-title">🔗 Quick Links</div>
        <div class="quick-links-grid">
          <a href="https://oz3dprint.etsy.com" target="_blank" class="quick-link">
            <span class="quick-link-icon">🛒</span>
            <div class="quick-link-content">
              <div class="quick-link-title">Etsy Shop</div>
              <div class="quick-link-url">oz3dprint.etsy.com</div>
            </div>
          </a>
          <a href="https://oz3dprint.vercel.app" target="_blank" class="quick-link">
            <span class="quick-link-icon">🌐</span>
            <div class="quick-link-content">
              <div class="quick-link-title">Website</div>
              <div class="quick-link-url">oz3dprint.vercel.app</div>
            </div>
          </a>
          <a href="https://simplyprint.io" target="_blank" class="quick-link">
            <span class="quick-link-icon">🖨️</span>
            <div class="quick-link-content">
              <div class="quick-link-title">SimplyPrint</div>
              <div class="quick-link-url">Printer management</div>
            </div>
          </a>
          <a href="https://instagram.com/oleg.photos" target="_blank" class="quick-link">
            <span class="quick-link-icon">📸</span>
            <div class="quick-link-content">
              <div class="quick-link-title">Instagram</div>
              <div class="quick-link-url">@oleg.photos</div>
            </div>
          </a>
        </div>
      </div>
      ${showUploadModal ? renderUploadModal() : ''}
    `
  }

  function renderUploadModal() {
    // Get priorities for the dropdown
    const priorities = store.get('priorities') || []
    
    // Initialize uploader after render
    setTimeout(() => {
      const container = document.getElementById('fileDropzoneContainer')
      if (container && !container.dataset.initialized) {
        container.dataset.initialized = 'true'
        
        // Create dropzone
        storageManager.renderDropzone('fileDropzoneContainer', {
          path: 'documents',
          onUpload: (files) => {
            const docs = store.get('docs') || []
            files.forEach(fileData => {
              const newDoc = {
                id: fileData.id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: fileData.name,
                type: fileData.name.split('.').pop().toLowerCase(),
                category: selectedCategory,
                path: fileData.path,
                url: fileData.url,
                uploadedAt: fileData.uploadedAt || new Date().toISOString(),
                size: fileData.size
              }
              // Only add priorityId if a priority is selected
              if (selectedPriorityId && selectedPriorityId !== '') {
                newDoc.priorityId = selectedPriorityId
              }
              docs.push(newDoc)
            })
            store.set('docs', docs)
            // Reset selections
            selectedCategory = 'Other'
            selectedPriorityId = ''
            closeUploadModal()
          }
        })
      }
    }, 0)

    return `
      <div class="modal-overlay active upload-modal-overlay" id="uploadModal" onclick="closeUploadModal(event)">
        <div class="modal upload-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">📤 Upload Documents</div>
            <button class="modal-close" onclick="closeUploadModal()">✕</button>
          </div>
          <div class="modal-body upload-modal-body">
            <!-- Category Selector -->
            <div class="form-group upload-form-group">
              <label class="form-label">Category/Board</label>
              <div class="select-wrapper">
                <select class="form-select upload-form-select" id="categorySelect" onchange="setUploadCategory(this.value)">
                  ${Object.entries(CATEGORIES).map(([cat, config]) => `
                    <option value="${cat}" ${selectedCategory === cat ? 'selected' : ''}>
                      ${config.icon} ${cat}
                    </option>
                  `).join('')}
                </select>
                <span class="select-arrow">▼</span>
              </div>
            </div>
            
            <!-- Priority Link Selector -->
            <div class="form-group upload-form-group">
              <label class="form-label">Link to Priority (Optional)</label>
              <div class="select-wrapper">
                <select class="form-select upload-form-select" id="prioritySelect" onchange="setUploadPriority(this.value)">
                  <option value="">-- No Priority --</option>
                  ${priorities.map(p => `
                    <option value="${p.id}" ${selectedPriorityId === p.id ? 'selected' : ''}>
                      ${p.text || p.title || 'Untitled'} ${p.status ? `(${p.status})` : ''}
                    </option>
                  `).join('')}
                </select>
                <span class="select-arrow">▼</span>
              </div>
              ${priorities.length === 0 ? '<small class="form-hint">No priorities available. Create priorities first to link files.</small>' : ''}
            </div>
            
            <div id="fileDropzoneContainer" class="upload-dropzone-container"></div>
            <div class="upload-instructions">
              <p>Supported files: Images, PDFs, Documents, Spreadsheets</p>
              <p>Max file size: 10MB</p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  function renderRecentDoc(doc) {
    const catConfig = getCategoryConfig(doc.category)
    
    // Get linked priority info if exists
    let priorityIndicator = ''
    if (doc.priorityId) {
      const priorities = store.get('priorities') || []
      const linkedPriority = priorities.find(p => p.id === doc.priorityId || p.id === parseInt(doc.priorityId))
      if (linkedPriority) {
        priorityIndicator = ' 🔗'
      }
    }

    return `
      <div class="recent-doc-item" onclick="openDocument('${doc.id}')">
        <span class="recent-doc-icon">${getFileIcon(doc.type)}</span>
        <div class="recent-doc-content">
          <div class="recent-doc-name">${escapeHtml(doc.name)}${priorityIndicator}</div>
          <div class="recent-doc-meta">
            <span class="recent-doc-category" style="color: ${catConfig.color};"
            >${catConfig.icon} ${doc.category}</span>
            <span class="recent-doc-date">${formatDate(doc.uploadedAt || doc.lastModified)}</span>
          </div>
        </div>
        <span class="recent-doc-type">.${doc.type}</span>
      </div>
    `
  }

  function renderDocCard(doc) {
    const catConfig = getCategoryConfig(doc.category)
    
    // Get linked priority info if exists
    let linkedPriorityHtml = ''
    if (doc.priorityId) {
      const priorities = store.get('priorities') || []
      const linkedPriority = priorities.find(p => p.id === doc.priorityId || p.id === parseInt(doc.priorityId))
      if (linkedPriority) {
        const priorityText = linkedPriority.text || linkedPriority.title || 'Linked Priority'
        linkedPriorityHtml = `
          <div class="doc-priority-link" style="margin-top: 8px; padding: 4px 8px; background: rgba(78, 205, 196, 0.1); border-radius: 4px; font-size: 12px; color: #4ecdc4; display: flex; align-items: center; gap: 4px;">
            <span>🔗</span>
            <span>${escapeHtml(priorityText)}</span>
          </div>
        `
      }
    }

    return `
      <div class="doc-card" onclick="openDocument('${doc.id}')"
           style="border-top-color: ${catConfig.color};">
        <div class="doc-card-header">
          <span class="doc-icon">${getFileIcon(doc.type)}</span>
          <span class="doc-category-badge" style="background: ${catConfig.color}20; color: ${catConfig.color};"
          >${catConfig.icon} ${doc.category}</span>
        </div>
        <div class="doc-card-content">
          <h4 class="doc-name">${escapeHtml(doc.name)}</h4>
          ${doc.path ? `
            <div class="doc-path">${escapeHtml(doc.path)}</div>
          ` : ''}
          ${linkedPriorityHtml}
        </div>
        <div class="doc-card-footer">
          <span class="doc-date">🕐 ${formatDate(doc.uploadedAt || doc.lastModified)}</span>
          <span class="doc-type">.${doc.type}</span>
        </div>
      </div>
    `
  }

  // Global functions
  window.setDocFilter = (filter) => {
    currentFilter = filter
    render()
  }

  window.setDocSearch = (query) => {
    searchQuery = query
    render()
  }

  window.openDocument = (id) => {
    const docs = store.get('docs') || []
    const doc = docs.find(d => d.id === id)
    if (doc && doc.url) {
      // Open the file in a new tab
      window.open(doc.url, '_blank')
    } else if (doc) {
      toast.info(doc.name, `${doc.category} • ${doc.type}`)
    }
  }

  store.subscribe((state, path) => {
    if (!path || path.includes('docs')) render()
  })

  render()
  
  // Expose render function globally for modal updates
  window.renderDocsSection = render
  
  return { render }
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Upload modal functions
window.toggleUploadModal = () => {
  showUploadModal = !showUploadModal
  // Reset selections when opening
  if (showUploadModal) {
    selectedCategory = 'Other'
    selectedPriorityId = ''
  }
  // Trigger re-render
  if (window.renderDocsSection) {
    window.renderDocsSection()
  }
}

window.closeUploadModal = (e) => {
  // Only close if clicking the overlay itself, not the modal content
  if (e && e.target !== e.currentTarget) return
  showUploadModal = false
  // Reset selections
  selectedCategory = 'Other'
  selectedPriorityId = ''
  if (window.renderDocsSection) {
    window.renderDocsSection()
  }
}

// Set upload category
window.setUploadCategory = (category) => {
  selectedCategory = category
}

// Set upload priority
window.setUploadPriority = (priorityId) => {
  selectedPriorityId = priorityId
}

// Add document modal - opens upload modal
window.openAddDocModal = () => {
  window.toggleUploadModal()
}