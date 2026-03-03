import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { createFileUploader, createFilePreview } from '../components/FileUploader.js'
import { confirmDelete } from '../components/ConfirmDialog.js'

let currentFilter = 'all'
let searchQuery = ''
let showUploadModal = false

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
    const allDocs = store.getState().documents || []
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
        <button class="btn btn-primary" onclick="openAddDocModal()">
          <span>➕</span>
          <span class="hide-mobile">Add Doc</span>
        </button>
        <button class="btn btn-secondary" onclick="toggleUploadModal()">
          <span>📤</span>
          <span class="hide-mobile">Upload</span>
        </button>
      </div>

      <!-- Search & Filter Toolbar -->
      <div class="docs-toolbar">
        <div class="docs-search">
          <input type="text"
            class="search-input"
            id="docSearchInput"
            placeholder="🔍 Search documents..."
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
          <button class="btn btn-primary" onclick="openAddDocModal()">➕ Add Document</button>
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
    // Initialize uploader after render
    setTimeout(() => {
      const container = document.getElementById('fileUploaderContainer')
      if (container && !container.dataset.initialized) {
        container.dataset.initialized = 'true'
        const uploader = createFileUploader({
          onUpload: (fileData) => {
            const docs = store.get('documents') || []
            docs.push({
              id: fileData.id,
              name: fileData.name,
              type: fileData.name.split('.').pop().toLowerCase(),
              category: fileData.category === 'image' ? 'Photography' : 'Other',
              path: `uploads/${fileData.name}`,
              lastModified: fileData.uploadedAt,
              size: fileData.size,
              data: fileData.data
            })
            store.set('documents', docs)
            toast.success('Document uploaded', fileData.name)
            closeUploadModal()
          }
        })
        container.appendChild(uploader.element)
      }
    }, 0)

    return `
      <div class="modal-overlay active" id="uploadModal" onclick="closeUploadModal(event)">
        <div class="modal" style="max-width: 600px;" onclick="event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">📤 Upload Documents</div>
            <button class="modal-close" onclick="closeUploadModal()">✕</button>
          </div>
          <div class="modal-body">
            <div id="fileUploaderContainer"></div>
          </div>
        </div>
      </div>
    `
  }

  function renderRecentDoc(doc) {
    const catConfig = getCategoryConfig(doc.category)

    return `
      <div class="recent-doc-item" onclick="openDocument(${doc.id})">
        <span class="recent-doc-icon">${getFileIcon(doc.type)}</span>
        <div class="recent-doc-content">
          <div class="recent-doc-name">${escapeHtml(doc.name)}</div>
          <div class="recent-doc-meta">
            <span class="recent-doc-category" style="color: ${catConfig.color};"
            >${catConfig.icon} ${doc.category}</span>
            <span class="recent-doc-date">${formatDate(doc.lastModified)}</span>
          </div>
        </div>
        <span class="recent-doc-type">.${doc.type}</span>
      </div>
    `
  }

  function renderDocCard(doc) {
    const catConfig = getCategoryConfig(doc.category)

    return `
      <div class="doc-card" onclick="openDocument(${doc.id})"
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
        </div>
        <div class="doc-card-footer">
          <span class="doc-date">🕐 ${formatDate(doc.lastModified)}</span>
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
    const doc = store.get('documents').find(d => d.id === id)
    if (doc) {
      toast.info(doc.name, `${doc.category} • ${doc.type}`)
    }
  }

  store.subscribe((state, path) => {
    if (!path || path.includes('documents')) render()
  })

  render()
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
  // Force re-render by updating a dummy state value
  const docs = store.get('documents') || []
  store.set('documents', [...docs])
}

window.closeUploadModal = (e) => {
  if (e && e.target !== e.currentTarget) return
  showUploadModal = false
  const docs = store.get('documents') || []
  store.set('documents', [...docs])
}

// Add document modal - opens upload modal
window.openAddDocModal = () => {
  window.toggleUploadModal()
}