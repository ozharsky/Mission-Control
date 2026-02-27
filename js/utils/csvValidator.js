// CSV Validation Utilities
import { sanitizeInput, sanitizeNumber } from './sanitize.js'

// Validation schemas for different CSV types
const VALIDATION_SCHEMAS = {
  etsy: {
    required: ['date'],
    optional: ['orderId', 'items', 'value', 'net'],
    validators: {
      date: (val) => {
        if (!val) return { valid: false, error: 'Date is required' }
        const date = new Date(val)
        if (isNaN(date.getTime())) return { valid: false, error: 'Invalid date format' }
        return { valid: true, value: val }
      },
      value: (val) => {
        const num = parseFloat(String(val).replace(/[$,]/g, ''))
        if (isNaN(num) || num < 0) return { valid: false, error: 'Value must be a positive number' }
        return { valid: true, value: num }
      },
      items: (val) => {
        const num = parseInt(val) || 1
        if (num < 1) return { valid: false, error: 'Items must be at least 1' }
        return { valid: true, value: num }
      }
    }
  },
  
  sku: {
    required: ['code', 'name'],
    optional: ['stock', 'status'],
    validators: {
      code: (val) => {
        if (!val || String(val).trim().length === 0) {
          return { valid: false, error: 'SKU Code is required' }
        }
        const sanitized = sanitizeInput(val, { maxLength: 50 })
        if (!/^[A-Z0-9-_]+$/i.test(sanitized)) {
          return { valid: false, error: 'SKU Code can only contain letters, numbers, hyphens, and underscores' }
        }
        return { valid: true, value: sanitized }
      },
      name: (val) => {
        if (!val || String(val).trim().length === 0) {
          return { valid: false, error: 'Product Name is required' }
        }
        const sanitized = sanitizeInput(val, { maxLength: 200 })
        return { valid: true, value: sanitized }
      },
      stock: (val) => {
        const num = parseInt(val) || 0
        if (num < 0 || num > 99999) {
          return { valid: false, error: 'Stock must be between 0 and 99999' }
        }
        return { valid: true, value: num }
      },
      status: (val) => {
        const allowed = ['active', 'inactive', 'discontinued']
        const status = String(val).toLowerCase() || 'active'
        if (!allowed.includes(status)) {
          return { valid: true, value: 'active' } // Default to active
        }
        return { valid: true, value: status }
      }
    }
  }
}

/**
 * Validate CSV data against schema
 * @param {Array} data - Parsed CSV rows
 * @param {string} type - 'etsy' or 'sku'
 * @returns {object} Validation result
 */
export function validateCSV(data, type) {
  const schema = VALIDATION_SCHEMAS[type]
  if (!schema) {
    return { valid: false, errors: ['Unknown validation type'], data: [] }
  }
  
  const errors = []
  const validRows = []
  
  data.forEach((row, index) => {
    const rowNum = index + 2 // +2 because row 1 is header
    const validatedRow = {}
    let rowValid = true
    
    // Check required fields
    for (const field of schema.required) {
      const validator = schema.validators[field]
      const value = row[field] || row[field.toLowerCase()] || row[field.toUpperCase()]
      
      if (validator) {
        const result = validator(value)
        if (!result.valid) {
          errors.push(`Row ${rowNum}: ${result.error}`)
          rowValid = false
        } else {
          validatedRow[field] = result.value
        }
      } else if (!value) {
        errors.push(`Row ${rowNum}: ${field} is required`)
        rowValid = false
      } else {
        validatedRow[field] = value
      }
    }
    
    // Validate optional fields
    for (const field of schema.optional) {
      const validator = schema.validators[field]
      const value = row[field] || row[field.toLowerCase()] || row[field.toUpperCase()]
      
      if (value !== undefined && validator) {
        const result = validator(value)
        if (result.valid) {
          validatedRow[field] = result.value
        }
      } else if (value !== undefined) {
        validatedRow[field] = value
      }
    }
    
    // Copy any additional fields that don't need validation
    Object.keys(row).forEach(key => {
      if (!(key in validatedRow)) {
        validatedRow[key] = sanitizeInput(row[key], { maxLength: 1000 })
      }
    })
    
    if (rowValid) {
      validRows.push(validatedRow)
    }
  })
  
  return {
    valid: errors.length === 0 || validRows.length > 0,
    errors: errors.slice(0, 20), // Limit to first 20 errors
    data: validRows,
    totalRows: data.length,
    validRows: validRows.length
  }
}

/**
 * Check for potential malicious content in CSV
 * @param {string} csvText - Raw CSV text
 * @returns {object} Security check result
 */
export function securityCheckCSV(csvText) {
  const threats = []
  
  // Check for formula injection (starts with =, +, -, @)
  const dangerousPatterns = [
    { pattern: /^[=+\-@]/, desc: 'Formula injection attempt' },
    { pattern: /\b(eval|function|script)\b/i, desc: 'Code injection attempt' },
    { pattern: /javascript:/i, desc: 'JavaScript protocol' },
    { pattern: /data:text\/html/i, desc: 'Data URI' },
    { pattern: /<script\b/i, desc: 'Script tag' }
  ]
  
  const lines = csvText.split('\n')
  lines.forEach((line, idx) => {
    dangerousPatterns.forEach(({ pattern, desc }) => {
      if (pattern.test(line)) {
        threats.push(`Line ${idx + 1}: ${desc}`)
      }
    })
  })
  
  return {
    safe: threats.length === 0,
    threats: threats.slice(0, 10)
  }
}

/**
 * Safe CSV parser with validation
 * @param {string} csvText - CSV content
 * @param {string} type - 'etsy' or 'sku'
 * @returns {object} Parsed and validated data
 */
export async function parseAndValidateCSV(csvText, type) {
  // Security check first
  const security = securityCheckCSV(csvText)
  if (!security.safe) {
    return {
      valid: false,
      errors: ['Security threats detected:', ...security.threats],
      data: []
    }
  }
  
  // Parse CSV
  const { parseCSV } = await import('./csv.js')
  const rows = parseCSV(csvText)
  
  if (rows.length === 0) {
    return { valid: false, errors: ['No data found in CSV'], data: [] }
  }
  
  // Validate
  return validateCSV(rows, type)
}
