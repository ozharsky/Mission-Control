// Input validation utilities
// Provides consistent validation across the application

export const validators = {
  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean}
   */
  email(email) {
    if (typeof email !== 'string') return false
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email.trim())
  },
  
  /**
   * Validate URL
   * @param {string} url - URL to validate
   * @returns {boolean}
   */
  url(url) {
    if (typeof url !== 'string') return false
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  },
  
  /**
   * Validate date string (YYYY-MM-DD format)
   * @param {string} date - Date string to validate
   * @returns {boolean}
   */
  date(date) {
    if (typeof date !== 'string') return false
    const re = /^\d{4}-\d{2}-\d{2}$/
    if (!re.test(date)) return false
    
    const d = new Date(date)
    return d instanceof Date && !isNaN(d) && d.toISOString().startsWith(date)
  },
  
  /**
   * Validate that value is not empty
   * @param {*} value - Value to check
   * @returns {boolean}
   */
  required(value) {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
  },
  
  /**
   * Validate minimum length
   * @param {string} value - String to check
   * @param {number} min - Minimum length
   * @returns {boolean}
   */
  minLength(value, min) {
    if (typeof value !== 'string') return false
    return value.trim().length >= min
  },
  
  /**
   * Validate maximum length
   * @param {string} value - String to check
   * @param {number} max - Maximum length
   * @returns {boolean}
   */
  maxLength(value, max) {
    if (typeof value !== 'string') return false
    return value.trim().length <= max
  },
  
  /**
   * Validate number is within range
   * @param {number} value - Number to check
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean}
   */
  range(value, min, max) {
    const num = Number(value)
    return !isNaN(num) && num >= min && num <= max
  },
  
  /**
   * Validate priority status
   * @param {string} status - Status to validate
   * @returns {boolean}
   */
  priorityStatus(status) {
    const valid = ['now', 'next', 'later', 'done', 'completed']
    return valid.includes(status?.toLowerCase())
  },
  
  /**
   * Validate hex color
   * @param {string} color - Color to validate
   * @returns {boolean}
   */
  hexColor(color) {
    if (typeof color !== 'string') return false
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
  }
}

/**
 * Validate an object against a schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validate(data, schema) {
  const errors = []
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field]
    
    for (const rule of rules) {
      const { type, message, ...params } = rule
      
      switch (type) {
        case 'required':
          if (!validators.required(value)) {
            errors.push(message || `${field} is required`)
          }
          break
        case 'email':
          if (value && !validators.email(value)) {
            errors.push(message || `${field} must be a valid email`)
          }
          break
        case 'url':
          if (value && !validators.url(value)) {
            errors.push(message || `${field} must be a valid URL`)
          }
          break
        case 'date':
          if (value && !validators.date(value)) {
            errors.push(message || `${field} must be a valid date (YYYY-MM-DD)`)
          }
          break
        case 'minLength':
          if (value && !validators.minLength(value, params.min)) {
            errors.push(message || `${field} must be at least ${params.min} characters`)
          }
          break
        case 'maxLength':
          if (value && !validators.maxLength(value, params.max)) {
            errors.push(message || `${field} must be at most ${params.max} characters`)
          }
          break
        case 'range':
          if (value !== undefined && !validators.range(value, params.min, params.max)) {
            errors.push(message || `${field} must be between ${params.min} and ${params.max}`)
          }
          break
        case 'custom':
          if (value !== undefined && params.fn && !params.fn(value)) {
            errors.push(message || `${field} is invalid`)
          }
          break
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @returns {string}
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return ''
  return str.trim().replace(/[<>]/g, '')
}

/**
 * Sanitize object values
 * @param {Object} obj - Object to sanitize
 * @param {string[]} fields - Fields to sanitize
 * @returns {Object}
 */
export function sanitizeObject(obj, fields) {
  const result = { ...obj }
  for (const field of fields) {
    if (result[field] !== undefined) {
      result[field] = sanitizeString(result[field])
    }
  }
  return result
}
