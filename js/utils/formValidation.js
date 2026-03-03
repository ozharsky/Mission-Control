// Form Validation Utility
// Unified validation for all forms

import { sanitizeInput, sanitizeEmail, sanitizeNumber, sanitizeUrl } from './sanitize.js'
import { toast } from '../components/Toast.js'

export class FormValidator {
  constructor(schema) {
    this.schema = schema
    this.errors = {}
  }
  
  // Validate a single field
  validateField(name, value) {
    const rules = this.schema[name]
    if (!rules) return { valid: true, error: null }
    
    const errors = []
    
    // Required check
    if (rules.required && (value == null || value === '')) {
      errors.push(rules.requiredMessage || `${this.formatLabel(name)} is required`)
    }
    
    // Skip other checks if empty and not required
    if (!value && !rules.required) {
      return { valid: true, error: null, value: rules.default || null }
    }
    
    // Type validation
    if (value && rules.type) {
      const typeError = this.validateType(value, rules.type, name)
      if (typeError) errors.push(typeError)
    }
    
    // Length validation
    if (value && rules.minLength && String(value).length < rules.minLength) {
      errors.push(`${this.formatLabel(name)} must be at least ${rules.minLength} characters`)
    }
    
    if (value && rules.maxLength && String(value).length > rules.maxLength) {
      errors.push(`${this.formatLabel(name)} must be at most ${rules.maxLength} characters`)
    }
    
    // Pattern validation
    if (value && rules.pattern && !rules.pattern.test(String(value))) {
      errors.push(rules.patternMessage || `${this.formatLabel(name)} format is invalid`)
    }
    
    // Range validation for numbers
    if (value != null && rules.type === 'number') {
      const num = Number(value)
      if (rules.min != null && num < rules.min) {
        errors.push(`${this.formatLabel(name)} must be at least ${rules.min}`)
      }
      if (rules.max != null && num > rules.max) {
        errors.push(`${this.formatLabel(name)} must be at most ${rules.max}`)
      }
    }
    
    // Custom validator
    if (value && rules.validate) {
      const customError = rules.validate(value)
      if (customError) errors.push(customError)
    }
    
    // Sanitize value
    let sanitized = value
    if (value && rules.sanitize !== false) {
      sanitized = this.sanitizeValue(value, rules.type)
    }
    
    const error = errors.length > 0 ? errors[0] : null
    if (error) {
      this.errors[name] = error
    } else {
      delete this.errors[name]
    }
    
    return { valid: !error, error, value: sanitized }
  }
  
  // Validate entire form
  validate(data) {
    this.errors = {}
    const sanitized = {}
    let isValid = true
    
    for (const [name, rules] of Object.entries(this.schema)) {
      const value = data[name]
      const result = this.validateField(name, value)
      
      if (!result.valid) {
        isValid = false
      }
      
      sanitized[name] = result.value
    }
    
    return { valid: isValid, errors: this.errors, data: sanitized }
  }
  
  // Validate type
  validateType(value, type, name) {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return `${this.formatLabel(name)} must be text`
        }
        break
      case 'number':
        if (isNaN(Number(value))) {
          return `${this.formatLabel(name)} must be a number`
        }
        break
      case 'email':
        if (!this.isValidEmail(value)) {
          return `${this.formatLabel(name)} must be a valid email`
        }
        break
      case 'url':
        if (!this.isValidUrl(value)) {
          return `${this.formatLabel(name)} must be a valid URL`
        }
        break
      case 'date':
        if (isNaN(Date.parse(value))) {
          return `${this.formatLabel(name)} must be a valid date`
        }
        break
      case 'array':
        if (!Array.isArray(value)) {
          return `${this.formatLabel(name)} must be a list`
        }
        break
    }
    return null
  }
  
  // Sanitize value based on type
  sanitizeValue(value, type) {
    switch (type) {
      case 'email':
        return sanitizeEmail(value) || value
      case 'url':
        return sanitizeUrl(value) || value
      case 'number':
        return sanitizeNumber(value)
      case 'string':
        return sanitizeInput(value, { maxLength: 10000 })
      default:
        return value
    }
  }
  
  // Check if email is valid
  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(String(email).toLowerCase())
  }
  
  // Check if URL is valid
  isValidUrl(url) {
    try {
      new URL(String(url))
      return true
    } catch {
      return false
    }
  }
  
  // Format field name for display
  formatLabel(name) {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }
  
  // Get current errors
  getErrors() {
    return this.errors
  }
  
  // Clear errors
  clearErrors() {
    this.errors = {}
  }
  
  // Check if field has error
  hasError(name) {
    return !!this.errors[name]
  }
  
  // Get error for field
  getError(name) {
    return this.errors[name] || null
  }
}

// Common validation schemas
export const schemas = {
  priority: {
    text: { 
      required: true, 
      minLength: 1, 
      maxLength: 500,
      requiredMessage: 'Priority text is required'
    },
    desc: { 
      maxLength: 2000 
    },
    dueDate: { 
      type: 'date' 
    },
    assignee: { 
      maxLength: 100 
    }
  },
  
  project: {
    title: { 
      required: true, 
      minLength: 1, 
      maxLength: 200,
      requiredMessage: 'Project title is required'
    },
    desc: { 
      maxLength: 2000 
    },
    dueDate: { 
      type: 'date' 
    }
  },
  
  lead: {
    name: { 
      required: true, 
      maxLength: 200 
    },
    company: { 
      maxLength: 200 
    },
    email: { 
      type: 'email', 
      maxLength: 200 
    },
    phone: { 
      maxLength: 50 
    },
    value: { 
      type: 'number', 
      min: 0 
    }
  },
  
  event: {
    name: { 
      required: true, 
      maxLength: 200 
    },
    date: { 
      required: true, 
      type: 'date',
      requiredMessage: 'Event date is required'
    },
    location: { 
      maxLength: 500 
    }
  },
  
  sku: {
    code: { 
      required: true, 
      maxLength: 50,
      pattern: /^[A-Z0-9-_]+$/i,
      patternMessage: 'SKU code can only contain letters, numbers, hyphens, and underscores'
    },
    name: { 
      required: true, 
      maxLength: 200 
    },
    stock: { 
      type: 'number', 
      min: 0, 
      max: 99999 
    }
  },
  
  note: {
    title: { 
      maxLength: 200 
    },
    text: { 
      required: true, 
      maxLength: 10000,
      requiredMessage: 'Note content is required'
    }
  }
}

// Helper to create validator from schema
export function createValidator(schemaName) {
  const schema = schemas[schemaName]
  if (!schema) {
    throw new Error(`Unknown schema: ${schemaName}`)
  }
  return new FormValidator(schema)
}

// Validate and show toast on error
export function validateWithToast(data, schemaName) {
  const validator = createValidator(schemaName)
  const result = validator.validate(data)
  
  if (!result.valid) {
    const firstError = Object.values(result.errors)[0]
    toast.error('Validation Error', firstError)
  }
  
  return result
}
