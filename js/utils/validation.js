// Form validation utilities

export const validators = {
  required(value) {
    return value?.trim()?.length > 0
  },
  
  minLength(value, min) {
    return value?.length >= min
  },
  
  maxLength(value, max) {
    return value?.length <= max
  },
  
  email(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  },
  
  url(value) {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },
  
  number(value, min, max) {
    const num = parseFloat(value)
    if (isNaN(num)) return false
    if (min !== undefined && num < min) return false
    if (max !== undefined && num > max) return false
    return true
  },
  
  date(value) {
    return !isNaN(Date.parse(value))
  }
}

/**
 * Sanitize input to prevent XSS attacks
 * Removes script tags, javascript: URLs, and event handlers
 */
export function sanitizeInput(text) {
  if (!text) return ''
  
  return text
    // Remove script tags and their contents
    .replace(/\u003cscript\b[^\u003c]*(?:(?!\u003c\/script\u003e)\u003c[^\u003c]*)*\u003c\/script\u003e/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers (onclick, onload, etc.)
    .replace(/on\w+\s*=/gi, '')
    // Remove data: URLs that could execute code
    .replace(/data:text\/html/gi, '')
}

export function validateField(fieldId, rules = []) {
  const field = document.getElementById(fieldId)
  if (!field) return { valid: true }
  
  const value = field.value
  const errors = []
  
  for (const rule of rules) {
    const { type, message, ...params } = rule
    
    let valid = true
    switch (type) {
      case 'required':
        valid = validators.required(value)
        break
      case 'minLength':
        valid = validators.minLength(value, params.min)
        break
      case 'maxLength':
        valid = validators.maxLength(value, params.max)
        break
      case 'email':
        valid = validators.email(value)
        break
      case 'url':
        valid = validators.url(value)
        break
      case 'number':
        valid = validators.number(value, params.min, params.max)
        break
      case 'date':
        valid = validators.date(value)
        break
    }
    
    if (!valid) {
      errors.push(message || `Invalid ${type}`)
    }
  }
  
  const result = { valid: errors.length === 0, errors }
  
  // Update UI
  if (result.valid) {
    field.classList.remove('invalid')
    field.classList.add('valid')
    const errorEl = document.getElementById(`${fieldId}-error`)
    if (errorEl) errorEl.remove()
  } else {
    field.classList.add('invalid')
    field.classList.remove('valid')
    showFieldError(fieldId, errors[0])
  }
  
  return result
}

export function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId)
  if (!field) return
  
  let errorEl = document.getElementById(`${fieldId}-error`)
  if (!errorEl) {
    errorEl = document.createElement('div')
    errorEl.id = `${fieldId}-error`
    errorEl.className = 'field-error'
    field.parentNode.appendChild(errorEl)
  }
  
  errorEl.textContent = message
}

export function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId)
  if (field) {
    field.classList.remove('invalid', 'valid')
  }
  const errorEl = document.getElementById(`${fieldId}-error`)
  if (errorEl) errorEl.remove()
}

export function validateForm(fieldValidations) {
  let allValid = true
  const results = {}
  
  for (const [fieldId, rules] of Object.entries(fieldValidations)) {
    const result = validateField(fieldId, rules)
    results[fieldId] = result
    if (!result.valid) allValid = false
  }
  
  return { valid: allValid, results }
}

// Expose globally
window.validateField = validateField
window.validateForm = validateForm
window.clearFieldError = clearFieldError
window.sanitizeInput = sanitizeInput
