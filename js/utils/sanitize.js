// Input sanitization utilities to prevent XSS

// HTML escape map
const escapeMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;'
}

// Regex to match characters that need escaping
const escapeRegex = /[&<>'"/`]/g

/**
 * Escape HTML entities to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHtml(text) {
  if (text == null) return ''
  if (typeof text !== 'string') text = String(text)
  return text.replace(escapeRegex, char => escapeMap[char])
}

/**
 * Sanitize user input for display
 * Removes potentially dangerous HTML/JS
 * @param {string} input - User input
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input, options = {}) {
  const {
    maxLength = 1000,
    allowNewlines = true,
    trim = true
  } = options
  
  if (input == null) return ''
  
  let sanitized = String(input)
  
  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim()
  }
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  // Escape HTML
  sanitized = escapeHtml(sanitized)
  
  // Handle newlines
  if (allowNewlines) {
    // Convert newlines to <br> for display
    // Note: This should be done AFTER escaping
  }
  
  return sanitized
}

/**
 * Sanitize URL to prevent javascript: protocol injection
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
  if (!url) return null
  
  const trimmed = url.trim()
  
  // Block javascript: and data: protocols
  const dangerousProtocols = /^(javascript|data|vbscript):/i
  if (dangerousProtocols.test(trimmed)) {
    console.warn('Blocked dangerous URL protocol:', trimmed)
    return null
  }
  
  // Allow http, https, mailto, tel, and relative URLs
  const allowedProtocols = /^(https?|mailto|tel|ftp):|^\/|^#/i
  if (!allowedProtocols.test(trimmed)) {
    // If no protocol, assume https
    return `https://${trimmed}`
  }
  
  return trimmed
}

/**
 * Validate and sanitize email address
 * @param {string} email - Email to validate
 * @returns {string|null} Validated email or null
 */
export function sanitizeEmail(email) {
  if (!email) return null
  
  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(trimmed)) {
    return null
  }
  
  return trimmed
}

/**
 * Sanitize number input
 * @param {*} value - Value to sanitize
 * @param {object} options - Options
 * @returns {number} Sanitized number
 */
export function sanitizeNumber(value, options = {}) {
  const { min = null, max = null, defaultValue = 0 } = options
  
  let num = Number(value)
  
  if (isNaN(num)) {
    return defaultValue
  }
  
  if (min !== null && num < min) num = min
  if (max !== null && num > max) num = max
  
  return num
}

/**
 * Create a safe template literal function
 * Automatically escapes all interpolated values
 */
export function html(strings, ...values) {
  return strings.reduce((result, string, i) => {
    const value = values[i]
    if (value == null) return result + string
    return result + string + escapeHtml(String(value))
  }, '')
}

/**
 * Validate data object against schema
 * @param {object} data - Data to validate
 * @param {object} schema - Validation schema
 * @returns {object} Validation result
 */
export function validateData(data, schema) {
  const errors = []
  const sanitized = {}
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key]
    
    // Check required
    if (rules.required && (value == null || value === '')) {
      errors.push(`${key} is required`)
      continue
    }
    
    // Skip if optional and not provided
    if (!rules.required && (value == null || value === '')) {
      sanitized[key] = rules.default ?? null
      continue
    }
    
    // Type checking
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (actualType !== rules.type) {
        errors.push(`${key} must be ${rules.type}, got ${actualType}`)
        continue
      }
    }
    
    // Sanitize based on type
    if (rules.sanitize !== false) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value, {
          maxLength: rules.maxLength || 1000,
          allowNewlines: rules.allowNewlines !== false
        })
      } else {
        sanitized[key] = value
      }
    } else {
      sanitized[key] = value
    }
    
    // Length validation
    if (rules.minLength && String(value).length < rules.minLength) {
      errors.push(`${key} must be at least ${rules.minLength} characters`)
    }
    
    if (rules.maxLength && String(value).length > rules.maxLength) {
      errors.push(`${key} must be at most ${rules.maxLength} characters`)
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${key} format is invalid`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    sanitized
  }
}

// Export all as default
export default {
  escapeHtml,
  sanitizeInput,
  sanitizeUrl,
  sanitizeEmail,
  sanitizeNumber,
  html,
  validateData
}