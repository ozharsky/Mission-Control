import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { storageManager } from '../utils/storageManager.js'
import { confirmDelete } from '../components/ConfirmDialog.js'
import { icons } from '../utils/icons.js'

let currentFilter = 'all'
let showUploadModal = false
let uploadedFiles = []
let selectedCategory = 'Other'
let selectedPriorityId = ''

const FILE_ICONS = {
  markdown: 'file',
  md: 'file',
  html: 'globe',
  pdf: 'file',
  doc: 'book',
  docx: 'book',
  xls: 'chart',
  xlsx: 'chart',
  csv: 'chart',
  json: 'settings',
  js: 'settings',
  css: 'palette',
  default: 'file'
}

const CATEGORIES = {
  'Etsy': { icon: 'cart', colorClass: 'badge-category-etsy', cssVar: '--color-category-etsy' },
  'Photography': { icon: 'camera', colorClass: 'badge-category-photography', cssVar: '--color-category-photography' },
  'Strategy': { icon: 'building', colorClass: 'badge-category-strategy', cssVar: '--color-category-strategy' },
  'Research': { icon: 'chart', colorClass: 'badge-category-research', cssVar: '--color-category-research' },
  'Marketing': { icon: 'bell', colorClass: 'badge-category-marketing', cssVar: '--color-category-marketing' },
  'Operations': { icon: 'settings', colorClass: 'badge-category-operations', cssVar: '--color-category-operations' },
  'Other': { icon: 'folder', colorClass: 'badge-category-other', cssVar: '--color-category-other' }
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

    // Sort by last modified (newest first)
    return filtered.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
  }

  function getFileIcon(type) {
    const iconName = FILE_ICONS[type?.toLowerCase()] || FILE_ICONS.default
    return icons[iconName] ? icons[iconName]() : icons.file()
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
          <div class="welcome-greeting m-title">${icons.folder()} Docs</div>
          <div class="welcome-status">
            <span class="m-badge">${allDocs.length} documents</span>
            <span class="m-badge">${Object.keys(categoryCounts).length} categories</span>
          </div>
        </div>
        <button class="m-btn-primary m-touch" onclick="toggleUploadModal()">
          <span>${icons.upload()}</span>
          <span class="hide-mobile">Upload</span>
        </button>
      </div>

      <!-- Filter Toolbar -->
      <div class="docs-toolbar">
        <div class="filter-bar docs-filters">
          <button class="m-btn-secondary ${currentFilter === 'all' ? 'active' : ''} m-touch"
            onclick="setDocFilter('all')"
          >
            <span>All</span>
            <span class="filter-count">${allDocs.length}</span>
          </button>
          ${Object.entries(CATEGORIES).map(([cat, config]) =>
            categoryCounts[cat] ? `
              <button class="m-btn-secondary ${currentFilter === cat ? 'active' : ''} m-touch"
                onclick="setDocFilter('${cat}')"
              >
                <span>${icons[config.icon]()} ${cat}</span>
                <span class="filter-count">${categoryCounts[cat] || 0}</span>
              </button>
            ` : ''
          ).join('')}
        </div>
      </div>
      <!-- Recent Docs (only when no filter) -->
      ${currentFilter === 'all' && recentDocs.length > 0 ? `
        <div class="m-card recent-docs-card">
          <div class="card-header">
            <div class="card-title m-title">${icons.clock()} Recently Updated</div>
          </div>
          <div class="recent-docs-list">
            ${recentDocs.map(doc => renderRecentDoc(doc)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Documents Grid -->
      ${docs.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">${icons.folder()}</div>
          <div class="empty-state-title m-title">${allDocs.length === 0 ? 'No documents yet' : 'No documents match'}</div>
          <div class="empty-state-text m-body">
            ${allDocs.length === 0
              ? 'Add your first document to start organizing your files.'
              : 'Try adjusting your search or filter.'}
          </div>
          <button class="m-btn-primary m-touch" onclick="toggleUploadModal()">${icons.upload()} Upload Document</button>
        </div>
      ` : `
        <div class="docs-grid">
          ${docs.map(doc => renderDocCard(doc)).join('')}
        </div>
      `}

      <!-- Quick Links Section -->
      <div class="m-card quick-links-card">
        <div class="card-title m-title">${icons.link()} Quick Links</div>
        <div class="quick-links-grid">
          <a href="https://oz3dprint.etsy.com" target="_blank" class="quick-link">
            <span class="quick-link-icon">${icons.cart()}</span>
            <div class="quick-link-content">
              <div class="quick-link-title m-body">Etsy Shop</div>
              <div class="quick-link-url m-caption">oz3dprint.etsy.com</div>
            </div>
          </a>
          <a href="https://oz3dprint.vercel.app" target="_blank" class="quick-link">
            <span class="quick-link-icon">${icons.globe()}</span>
            <div class="quick-link-content">
              <div class="quick-link-title m-body">Website</div>
              <div class="quick-link-url m-caption">oz3dprint.vercel.app</div>
            </div>
          </a>
          <a href="https://simplyprint.io" target="_blank" class="quick-link">
            <span class="quick-link-icon">${icons.printer()}</span>
            <div class="quick-link-content">
              <div class="quick-link-title m-body">SimplyPrint</div>
              <div class="quick-link-url m-caption">Printer management</div>
            </div>
          </a>
          <a href="https://instagram.com/oleg.photos" target="_blank" class="quick-link">
            <span class="quick-link-icon">${icons.camera()}</span>
            <div class="quick-link-content">
              <div class="quick-link-title m-body">Instagram</div>
              <div class="quick-link-url m-caption">@oleg.photos</div>
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
            <div class="modal-title m-title">${icons.upload()} Upload Documents</div>
            <button class="m-btn-secondary m-touch" onclick="closeUploadModal()">${icons.x()}</button>
          </div>
          <div class="modal-body upload-modal-body">
            <!-- Category Selector -->
            <div class="form-group upload-form-group">
              <label class="form-label m-body">Category/Board</label>
              <div class="select-wrapper">
                <select class="m-select upload-form-select" id="categorySelect" onchange="setUploadCategory(this.value)">
                  ${Object.entries(CATEGORIES).map(([cat, config]) => `
                    <option value="${cat}" ${selectedCategory === cat ? 'selected' : ''}>
                      ${cat}
                    </option>
                  `).join('')}
                </select>
                <span class="select-arrow">${icons.chevronDown()}</span>
              </div>
            </div>
            
            <!-- Priority Link Selector -->
            <div class="form-group upload-form-group">
              <label class="form-label m-body">Link to Priority (Optional)</label>
              <div class="select-wrapper">
                <select class="m-select upload-form-select" id="prioritySelect" onchange="setUploadPriority(this.value)">
                  <option value="">-- No Priority --</option>
                  ${priorities.map(p => `
                    <option value="${p.id}" ${selectedPriorityId === p.id ? 'selected' : ''}>
                      ${p.text || p.title || 'Untitled'} ${p.status ? `(${p.status})` : ''}
                    </option>
                  `).join('')}
                </select>
                <span class="select-arrow">${icons.chevronDown()}</span>
              </div>
              ${priorities.length === 0 ? '<small class="form-hint m-caption">No priorities available. Create priorities first to link files.</small>' : ''}
            </div>
            
            <div id="fileDropzoneContainer" class="upload-dropzone-container"></div>
            <div class="upload-instructions m-caption">
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
        priorityIndicator = ` ${icons.link()}`
      }
    }

    return `
      <div class="recent-doc-item" onclick="openDocument('${doc.id}')">
        <span class="recent-doc-icon">${getFileIcon(doc.type)}</span>
        <div class="recent-doc-content">
          <div class="recent-doc-name m-body">${escapeHtml(doc.name)}${priorityIndicator}</div>
          <div class="recent-doc-meta">
            <span class="recent-doc-category ${catConfig.colorClass} m-caption"
            >${icons[catConfig.icon]()} ${doc.category}</span>
            <span class="recent-doc-date m-caption">${formatDate(doc.uploadedAt || doc.lastModified)}</span>
          </div>
        </div>
        <span class="recent-doc-type m-caption">.${doc.type}</span>
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
          <div class="doc-priority-link m-caption">
            <span>${icons.link()}</span>
            <span>${escapeHtml(priorityText)}</span>
          </div>
        `
      }
    }

    return `
      <div class="m-card doc-card doc-card-${doc.category.toLowerCase().replace(/\s+/g, '-')}"
           onclick="openDocument('${doc.id}')">
        <div class="doc-card-header">
          <span class="doc-icon">${getFileIcon(doc.type)}</span>
          <span class="doc-category-badge ${catConfig.colorClass} m-badge"
          >${icons[catConfig.icon]()} ${doc.category}</span>
        </div>
        <div class="doc-card-content">
          <h4 class="doc-name m-title">${escapeHtml(doc.name)}</h4>
          ${doc.path ? `
            <div class="doc-path m-caption">${escapeHtml(doc.path)}</div>
          ` : ''}
          ${linkedPriorityHtml}
        </div>
        <div class="doc-card-footer">
          <span class="doc-date m-caption">${icons.clock()} ${formatDate(doc.uploadedAt || doc.lastModified)}</span>
          <span class="doc-type m-caption">.${doc.type}</span>
        </div>
      </div>
    `
  }

  // Global functions
  window.setDocFilter = (filter) => {
    currentFilter = filter
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
