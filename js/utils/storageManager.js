// Firebase Storage Integration for Mission Control V5
import { getFirebase } from '../firebase.js'
import { toast } from '../components/Toast.js'
import { loadingStates } from '../components/LoadingStates.js'

class StorageManager {
  constructor() {
    this.uploadQueue = []
    this.isUploading = false
    this.maxFileSize = 10 * 1024 * 1024 // 10MB
    this.allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/markdown',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    this.storage = null
    this.init()
  }

  init() {
    // Wait for Firebase to be ready
    setTimeout(() => {
      const firebase = getFirebase()
      if (firebase && firebase.storage) {
        this.storage = firebase.storage
        console.log('✅ Storage manager initialized')
      } else {
        console.log('⚠️ Firebase Storage not available - configure in Settings')
      }
    }, 100)
  }

  /**
   * Check if storage is available
   */
  isAvailable() {
    return this.storage !== null
  }

  /**
   * Validate file before upload
   */
  validateFile(file) {
    if (file.size > this.maxFileSize) {
      return { valid: false, error: `File too large. Max size: ${this.formatFileSize(this.maxFileSize)}` }
    }
    
    if (!this.allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type not allowed: ${file.type}` }
    }
    
    return { valid: true }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Upload a single file
   */
  async uploadFile(file, path = 'documents') {
    // Check if storage is available
    if (!this.isAvailable()) {
      toast.error('Storage not configured', 'Please configure Firebase in Settings first')
      return null
    }

    const validation = this.validateFile(file)
    if (!validation.valid) {
      toast.error('Upload failed', validation.error)
      return null
    }

    const fileId = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    
    try {
      // Show loading state
      const loadingOverlay = loadingStates.showFullScreen('Uploading file...')
      
      // Import Firebase Storage functions dynamically
      const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js')
      
      const fileRef = ref(this.storage, `${path}/${fileId}`)
      
      const snapshot = await uploadBytes(fileRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      })
      
      const downloadUrl = await getDownloadURL(snapshot.ref)
      
      const fileData = {
        id: fileId,
        name: file.name,
        path: `${path}/${fileId}`,
        url: downloadUrl,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }
      
      toast.success('File uploaded', file.name)
      return fileData
      
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Upload failed', error.message)
      return null
    } finally {
      // Hide loading state
      const overlay = document.getElementById('loadingOverlay')
      if (overlay) overlay.remove()
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(files, path = 'documents') {
    const results = []
    
    for (const file of files) {
      const result = await this.uploadFile(file, path)
      if (result) results.push(result)
    }
    
    return results
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    if (!this.isAvailable()) {
      toast.error('Storage not configured')
      return false
    }

    try {
      const { ref, deleteObject } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js')
      const fileRef = ref(this.storage, filePath)
      await deleteObject(fileRef)
      toast.success('File deleted')
      return true
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Delete failed', error.message)
      return false
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(path = 'documents') {
    if (!this.isAvailable()) {
      return []
    }

    try {
      const { ref, listAll, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js')
      const listRef = ref(this.storage, path)
      const result = await listAll(listRef)
      
      const files = await Promise.all(
        result.items.map(async (item) => {
          const url = await getDownloadURL(item)
          return {
            name: item.name,
            path: item.fullPath,
            url: url
          }
        })
      )
      
      return files
    } catch (error) {
      console.error('List error:', error)
      return []
    }
  }

  /**
   * Create file upload input
   */
  createFileInput(options = {}) {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = options.multiple !== false
    input.accept = options.accept || this.allowedTypes.join(',')
    input.style.display = 'none'
    
    // Store reference for cleanup
    this._fileInputHandler = async (e) => {
      if (e.target.files.length > 0) {
        const files = Array.from(e.target.files)
        
        if (options.onSelect) {
          try {
            options.onSelect(files)
          } catch (error) {
            console.error('onSelect callback error:', error)
          }
        }
        
        if (options.autoUpload) {
          const path = options.path || 'documents'
          const uploaded = await this.uploadFiles(files, path)
          
          if (options.onUpload) {
            try {
              options.onUpload(uploaded)
            } catch (error) {
              console.error('onUpload callback error:', error)
            }
          }
        }
      }
    }
    
    input.addEventListener('change', this._fileInputHandler)
    
    return input
  }

  /**
   * Cleanup file input event listener
   */
  cleanupFileInput(input) {
    if (input && this._fileInputHandler) {
      input.removeEventListener('change', this._fileInputHandler)
      this._fileInputHandler = null
    }
  }

  /**
   * Render file upload dropzone
   */
  renderDropzone(containerId, options = {}) {
    const container = document.getElementById(containerId)
    if (!container) return

    // Check if storage is available
    if (!this.isAvailable()) {
      container.innerHTML = `
        <div class="file-dropzone" style="border-color: var(--accent-warning);">
          <div class="dropzone-content">
            <div class="dropzone-icon">⚠️</div>
            <div class="dropzone-text">Firebase Storage not configured</div>
            <div class="dropzone-hint">Go to Settings → Firebase to configure storage</div>
          </div>
        </div>
      `
      return
    }

    const dropzone = document.createElement('div')
    dropzone.className = 'file-dropzone'
    dropzone.innerHTML = `
      <div class="dropzone-content">
        <div class="dropzone-icon">📁</div>
        <div class="dropzone-text">Drop files here or click to browse</div>
        <div class="dropzone-hint">Max ${this.formatFileSize(this.maxFileSize)} per file</div>
      </div>
      <input type="file" class="dropzone-input" multiple 
             accept="${this.allowedTypes.join(',')}">
    `

    const input = dropzone.querySelector('.dropzone-input')
    const content = dropzone.querySelector('.dropzone-content')

    // Click to browse
    content.addEventListener('click', () => input.click())

    // File selection
    input.addEventListener('change', async (e) => {
      if (e.target.files.length > 0) {
        const files = Array.from(e.target.files)
        await this.handleFiles(files, options)
      }
    })

    // Drag and drop
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropzone.classList.add('dragover')
    })

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover')
    })

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault()
      dropzone.classList.remove('dragover')
      
      const files = Array.from(e.dataTransfer.files)
      await this.handleFiles(files, options)
    })

    container.appendChild(dropzone)
    return dropzone
  }

  /**
   * Handle uploaded files
   */
  async handleFiles(files, options = {}) {
    const validFiles = files.filter(file => {
      const validation = this.validateFile(file)
      if (!validation.valid) {
        toast.warning('Skipped file', `${file.name}: ${validation.error}`)
      }
      return validation.valid
    })

    if (validFiles.length === 0) return

    const path = options.path || 'documents'
    const uploaded = await this.uploadFiles(validFiles, path)

    if (options.onUpload) {
      options.onUpload(uploaded)
    }

    return uploaded
  }

  /**
   * Render file list
   */
  renderFileList(files, options = {}) {
    if (!files || files.length === 0) {
      return `
        <div class="file-list-empty">
          <div class="file-list-empty-icon">📂</div>
          <div>No files uploaded yet</div>
        </div>
      `
    }

    return `
      <div class="file-list">
        ${files.map(file => `
          <div class="file-item" data-file-id="${file.id}" data-file-path="${file.path}">
            <div class="file-icon">${this.getFileIcon(file.type)}</div>
            <div class="file-info">
              <div class="file-name">${file.name}</div>
              <div class="file-meta">
                <span>${this.formatFileSize(file.size)}</span>
                <span>•</span>
                <span>${new Date(file.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div class="file-actions">
              <a href="${file.url}" target="_blank" class="btn btn-sm btn-text" title="View">
                👁️
              </a>
              ${options.allowDelete !== false ? `
                <button class="btn btn-sm btn-text btn-danger" onclick="storageManager.deleteFile('${file.path}')" title="Delete">
                  🗑️
                </button>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  /**
   * Get icon for file type
   */
  getFileIcon(type) {
    if (type.startsWith('image/')) return '🖼️'
    if (type === 'application/pdf') return '📄'
    if (type.includes('word')) return '📝'
    if (type.includes('excel') || type.includes('sheet')) return '📊'
    if (type.startsWith('text/')) return '📃'
    return '📎'
  }
}

// Create global instance
export const storageManager = new StorageManager()

// Expose for onclick handlers
window.storageManager = storageManager
