// File Upload Component
import { Toast } from './Toast.js'
import { sanitizeInput } from '../utils/sanitize.js'
import { icon } from '../utils/icons.js'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = {
  'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  'document': ['application/pdf', 'text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  'spreadsheet': ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
  'code': ['text/javascript', 'text/html', 'text/css', 'application/json', 'text/x-python', 'text/x-java']
}

export function createFileUploader(options) {
  const {
    onUpload,
    multiple = true,
    accept = '*/*',
    maxSize = MAX_FILE_SIZE
  } = options
  
  const container = document.createElement('div')
  container.className = 'file-uploader'
  
  let isDragging = false
  let uploadQueue = []
  
  function render() {
    container.innerHTML = `
      <div class="upload-zone ${isDragging ? 'dragging' : ''}"
           onclick="document.getElementById('fileInput').click()"
      >
        <input type="file" 
               id="fileInput" 
               ${multiple ? 'multiple' : ''}
               accept="${accept}"
               style="display: none;"
               onchange="handleFileSelect(this.files)"
        >
        
        <div class="upload-icon">${icon('folder-open')}</div>
        <div class="upload-text">
          <strong>Click to upload</strong> or drag and drop
        </div>
        <div class="upload-hint">
          ${formatAcceptTypes(accept)} • Max ${formatFileSize(maxSize)}
        </div>
      </div>
      
      <div class="upload-queue" id="uploadQueue"></div>
    `
    
    attachEventListeners()
  }
  
  function attachEventListeners() {
    const zone = container.querySelector('.upload-zone')
    
    zone.addEventListener('dragenter', handleDragEnter)
    zone.addEventListener('dragover', handleDragOver)
    zone.addEventListener('dragleave', handleDragLeave)
    zone.addEventListener('drop', handleDrop)
  }
  
  function handleDragEnter(e) {
    e.preventDefault()
    e.stopPropagation()
    isDragging = true
    updateDragState()
  }
  
  function handleDragOver(e) {
    e.preventDefault()
    e.stopPropagation()
  }
  
  function handleDragLeave(e) {
    e.preventDefault()
    e.stopPropagation()
    isDragging = false
    updateDragState()
  }
  
  function handleDrop(e) {
    e.preventDefault()
    e.stopPropagation()
    isDragging = false
    updateDragState()
    
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }
  
  function updateDragState() {
    const zone = container.querySelector('.upload-zone')
    if (zone) {
      zone.classList.toggle('dragging', isDragging)
    }
  }
  
  window.handleFileSelect = (files) => {
    processFiles(Array.from(files))
  }
  
  function processFiles(files) {
    const validFiles = files.filter(file => {
      // Check file size
      if (file.size > maxSize) {
        Toast.error('File too large', `${file.name} exceeds ${formatFileSize(maxSize)}`)
        return false
      }
      
      // Check file type if accept is specified
      if (accept !== '*/*' && !isFileTypeAllowed(file, accept)) {
        Toast.error('File type not allowed', file.name)
        return false
      }
      
      return true
    })
    
    if (validFiles.length === 0) return
    
    uploadQueue = [...uploadQueue, ...validFiles]
    renderQueue()
    
    // Process uploads
    validFiles.forEach(file => {
      uploadFile(file)
    })
  }
  
  function isFileTypeAllowed(file, accept) {
    const acceptedTypes = accept.split(',').map(t => t.trim())
    return acceptedTypes.some(type => {
      if (type === '*/*') return true
      if (type.endsWith('/*')) {
        const category = type.replace('/*', '')
        return file.type.startsWith(category + '/')
      }
      return file.type === type
    })
  }
  
  async function uploadFile(file) {
    const queueItem = uploadQueue.find(f => f.name === file.name && f.size === file.size)
    if (!queueItem) return
    
    queueItem.status = 'uploading'
    queueItem.progress = 0
    renderQueue()
    
    try {
      // Read file as base64 for storage
      const base64 = await readFileAsBase64(file)
      
      const fileData = {
        id: Date.now() + Math.random(),
        name: sanitizeInput(file.name),
        type: file.type,
        size: file.size,
        data: base64,
        uploadedAt: new Date().toISOString(),
        category: getFileCategory(file.type)
      }
      
      queueItem.status = 'complete'
      queueItem.progress = 100
      renderQueue()
      
      if (onUpload) onUpload(fileData)
      
      Toast.success('File uploaded', file.name)
      
    } catch (err) {
      queueItem.status = 'error'
      queueItem.error = err.message
      renderQueue()
      Toast.error('Upload failed', file.name)
    }
  }
  
  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  function renderQueue() {
    const queueEl = container.querySelector('#uploadQueue')
    if (!queueEl) return
    
    if (uploadQueue.length === 0) {
      queueEl.innerHTML = ''
      return
    }
    
    queueEl.innerHTML = `
      <div class="upload-queue-header">Uploading ${uploadQueue.length} file${uploadQueue.length > 1 ? 's' : ''}</div>
      ${uploadQueue.map(file => `
        <div class="upload-queue-item ${file.status || 'pending'}">
          <div class="queue-file-icon">${getFileIcon(file.type)}</div>
          <div class="queue-file-info">
            <div class="queue-file-name">${escapeHtml(file.name)}</div>
            <div class="queue-file-meta">${formatFileSize(file.size)}</div>
          </div>
          <div class="queue-file-status">
            ${file.status === 'uploading' ? `
              <div class="queue-progress">
                <div class="queue-progress-bar" style="width: ${file.progress || 0}%"></div>
              </div>
            ` : file.status === 'complete' ? icon('check-circle', 'queue-status-icon') : file.status === 'error' ? icon('x-circle', 'queue-status-icon') : icon('clock', 'queue-status-icon')}
          </div>
        </div>
      `).join('')}
    `
  }
  
  function getFileCategory(mimeType) {
    for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
      if (types.includes(mimeType)) return category
    }
    return 'other'
  }
  
  function getFileIcon(mimeType) {
    if (mimeType.startsWith('image/')) return icon('image', 'file-type-icon')
    if (mimeType === 'application/pdf') return icon('file-text', 'file-type-icon')
    if (mimeType.includes('word')) return icon('file-type', 'file-type-icon')
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return icon('table', 'file-type-icon')
    if (mimeType.startsWith('text/')) return icon('file-text', 'file-type-icon')
    if (mimeType.includes('json') || mimeType.includes('javascript')) return icon('code', 'file-type-icon')
    return icon('paperclip', 'file-type-icon')
  }
  
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
  
  function formatAcceptTypes(accept) {
    if (accept === '*/*') return 'Any file type'
    const types = accept.split(',').map(t => t.trim())
    if (types.length <= 3) return types.join(', ')
    return types.slice(0, 2).join(', ') + ` +${types.length - 2} more`
  }
  
  function escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  render()
  
  return {
    element: container,
    destroy: () => {
      container.remove()
    }
  }
}

// File preview component
export function createFilePreview(fileData) {
  const { type, data, name } = fileData
  
  if (type.startsWith('image/')) {
    return `
      <div class="file-preview image">
        <img src="${data}" alt="${escapeHtml(name)}" loading="lazy">
        <div class="preview-overlay">
          <span class="preview-name">${escapeHtml(name)}</span>
        </div>
      </div>
    `
  }
  
  if (type === 'text/plain' || type === 'text/markdown') {
    // Extract text content from data URL
    const text = atob(data.split(',')[1])
    return `
      <div class="file-preview text">
        <pre>${escapeHtml(text.substring(0, 500))}${text.length > 500 ? '...' : ''}</pre>
      </div>
    `
  }
  
  return `
    <div class="file-preview generic">
      <div class="preview-icon">${icon('file-text')}</div>
      <div class="preview-name">${escapeHtml(name)}</div>
    </div>
  `
}

// Preview modal for files
export function showFilePreview(fileData) {
  const { type, data, name } = fileData
  
  const modal = document.createElement('div')
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal" style="max-width: 90vw; max-height: 90vh;">
      <div class="modal-header">
        <div class="modal-title">${escapeHtml(name)}</div>
        <button class="modal-close m-touch" onclick="this.closest('.modal-overlay').remove()">${icon('x')}</button>
      </div>
      <div class="modal-body" style="padding: 0; overflow: auto;">
        ${type.startsWith('image/') 
          ? `<img src="${data}" style="max-width: 100%; display: block;">`
          : `<iframe src="${data}" style="width: 100%; height: 70vh; border: none;"></iframe>`
        }
      </div>
      <div class="modal-footer">
        <a href="${data}" download="${escapeHtml(name)}" class="btn btn-primary m-touch">${icon('download')} Download</a>
        <button class="btn btn-secondary m-touch" onclick="this.closest('.modal-overlay').remove()">Close</button>
      </div>
    </div>
  `
  
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove()
  }
  
  document.body.appendChild(modal)
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
