// Shared Utilities - Reduces Code Duplication
// Centralize common functions used across the app

// Date formatting
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return ''
  
  const { 
    format = 'short', // 'short', 'long', 'relative', 'iso'
    includeTime = false 
  } = options
  
  const date = new Date(dateStr)
  
  if (isNaN(date.getTime())) return ''
  
  switch (format) {
    case 'long':
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        ...(includeTime && { hour: '2-digit', minute: '2-digit' })
      })
    
    case 'relative':
      return getRelativeTime(date)
    
    case 'iso':
      return date.toISOString().split('T')[0]
    
    case 'short':
    default:
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
  }
}

// Relative time (e.g., "2 days ago")
export function getRelativeTime(date) {
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Currency formatting
export function formatCurrency(value, options = {}) {
  const { 
    currency = 'USD',
    decimals = 2,
    compact = false
  } = options
  
  const num = Number(value) || 0
  
  if (compact && num >= 1000) {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    }
    return `$${(num / 1000).toFixed(1)}k`
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

// Number formatting
export function formatNumber(num, options = {}) {
  const { compact = false, decimals = 0 } = options
  
  const value = Number(num) || 0
  
  if (compact) {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`
  }
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// Percentage formatting
export function formatPercent(value, decimals = 1) {
  const num = Number(value) || 0
  return `${num.toFixed(decimals)}%`
}

// Duration formatting (seconds to readable)
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0m'
  
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

// Truncate text with ellipsis
export function truncateText(text, maxLength = 100, suffix = '...') {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

// Generate unique ID
let idCounter = 0
export function generateId(prefix = 'mc') {
  return `${prefix}-${++idCounter}-${Date.now().toString(36)}`
}

// Deep clone object
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (Array.isArray(obj)) return obj.map(deepClone)
  
  const cloned = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

// Deep merge objects
export function deepMerge(target, source) {
  const output = { ...target }
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isObject(source[key]) && isObject(target[key])) {
        output[key] = deepMerge(target[key], source[key])
      } else {
        output[key] = source[key]
      }
    }
  }
  
  return output
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item)
}

// Group array by key
export function groupBy(array, key) {
  return array.reduce((groups, item) => {
    const group = item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

// Sort array by key
export function sortBy(array, key, direction = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}

// Filter array by search query
export function filterByQuery(array, query, keys) {
  if (!query) return array
  
  const lowerQuery = query.toLowerCase()
  
  return array.filter(item => {
    return keys.some(key => {
      const value = item[key]
      if (value == null) return false
      return String(value).toLowerCase().includes(lowerQuery)
    })
  })
}

// Chunk array into smaller arrays
export function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Debounce function
export function debounce(fn, delay) {
  let timeoutId
  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

// Throttle function
export function throttle(fn, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Check if element is in viewport
export function isInViewport(element, offset = 0) {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= -offset &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

// Download file helper
export function downloadFile(content, filename, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy:', err)
    return false
  }
}

// Local storage with error handling
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },
  
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (e) {
      console.error('Storage remove error:', e)
      return false
    }
  }
}
