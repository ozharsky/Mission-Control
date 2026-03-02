import { Toast } from './Toast.js'

/**
 * Copy text to clipboard
 */
export function copyToClipboard(text) {
  if (!text) return
  
  navigator.clipboard.writeText(text).then(() => {
    Toast.success('📋 Copied to clipboard')
  }).catch(err => {
    console.error('Failed to copy:', err)
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    
    try {
      document.execCommand('copy')
      Toast.success('📋 Copied to clipboard')
    } catch (err) {
      Toast.error('Failed to copy')
    }
    
    document.body.removeChild(textarea)
  })
}

/**
 * Copy file path to clipboard
 */
export function copyPath(path) {
  copyToClipboard(path)
}

/**
 * Open file in local system
 * Uses file:// protocol for local files
 */
export function openFile(path) {
  if (!path) return
  
  // Convert relative path to absolute file URL
  const basePath = '/Users/olegzharsky/OpenClaw-Workspace/'
  const fullPath = path.startsWith('/') ? path : basePath + path
  const fileUrl = `file://${fullPath}`
  
  window.open(fileUrl, '_blank')
  Toast.success('📂 Opening file...')
}

/**
 * Open external URL
 */
export function openExternal(url) {
  if (!url) return
  
  // Ensure URL has protocol
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  window.open(fullUrl, '_blank', 'noopener,noreferrer')
}

// Expose globally
window.copyToClipboard = copyToClipboard
window.copyPath = copyPath
window.openFile = openFile
window.openExternal = openExternal
