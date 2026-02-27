// Type Checking Utilities
// Runtime type validation for better error messages

export const types = {
  // Check if value is a string
  string(value, allowEmpty = false) {
    if (typeof value !== 'string') {
      throw new TypeError(`Expected string, got ${typeof value}`)
    }
    if (!allowEmpty && value.length === 0) {
      throw new TypeError('Expected non-empty string')
    }
    return value
  },
  
  // Check if value is a number
  number(value, allowNaN = false) {
    if (typeof value !== 'number' || (!allowNaN && isNaN(value))) {
      throw new TypeError(`Expected number, got ${typeof value}`)
    }
    return value
  },
  
  // Check if value is an integer
  integer(value) {
    if (!Number.isInteger(value)) {
      throw new TypeError(`Expected integer, got ${value}`)
    }
    return value
  },
  
  // Check if value is a boolean
  boolean(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError(`Expected boolean, got ${typeof value}`)
    }
    return value
  },
  
  // Check if value is an array
  array(value, minLength = 0) {
    if (!Array.isArray(value)) {
      throw new TypeError(`Expected array, got ${typeof value}`)
    }
    if (value.length < minLength) {
      throw new TypeError(`Expected array with at least ${minLength} items`)
    }
    return value
  },
  
  // Check if value is an object
  object(value, allowNull = false) {
    if (typeof value !== 'object' || (!allowNull && value === null)) {
      throw new TypeError(`Expected object, got ${typeof value}`)
    }
    return value
  },
  
  // Check if value is a function
  function(value) {
    if (typeof value !== 'function') {
      throw new TypeError(`Expected function, got ${typeof value}`)
    }
    return value
  },
  
  // Check if value is a Date
  date(value) {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      throw new TypeError('Expected valid Date')
    }
    return value
  },
  
  // Check if value matches one of allowed values
  oneOf(value, allowed) {
    if (!allowed.includes(value)) {
      throw new TypeError(`Expected one of ${allowed.join(', ')}, got ${value}`)
    }
    return value
  },
  
  // Check if value matches regex pattern
  pattern(value, regex, message) {
    if (!regex.test(value)) {
      throw new TypeError(message || `Value does not match required pattern`)
    }
    return value
  },
  
  // Check if value is within range
  range(value, min, max) {
    if (value < min || value > max) {
      throw new TypeError(`Expected value between ${min} and ${max}, got ${value}`)
    }
    return value
  },
  
  // Check if value is an email
  email(value) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(value)) {
      throw new TypeError('Expected valid email address')
    }
    return value
  },
  
  // Check if value is a URL
  url(value) {
    try {
      new URL(value)
      return value
    } catch {
      throw new TypeError('Expected valid URL')
    }
  },
  
  // Check if value is not null/undefined
  required(value, name = 'Value') {
    if (value == null) {
      throw new TypeError(`${name} is required`)
    }
    return value
  },
  
  // Check object shape
  shape(value, schema) {
    this.object(value)
    
    for (const [key, validator] of Object.entries(schema)) {
      try {
        if (typeof validator === 'function') {
          validator(value[key])
        }
      } catch (e) {
        throw new TypeError(`Invalid ${key}: ${e.message}`)
      }
    }
    
    return value
  }
}

// Type checking decorator for functions
export function checkTypes(paramTypes, returnType) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function(...args) {
      // Check parameter types
      paramTypes.forEach((type, index) => {
        if (type && args[index] != null) {
          try {
            type(args[index])
          } catch (e) {
            throw new TypeError(`${propertyKey} param ${index}: ${e.message}`)
          }
        }
      })
      
      // Call original method
      const result = originalMethod.apply(this, args)
      
      // Check return type
      if (returnType && result != null) {
        try {
          returnType(result)
        } catch (e) {
          throw new TypeError(`${propertyKey} return: ${e.message}`)
        }
      }
      
      return result
    }
    
    return descriptor
  }
}

// Assert type (non-throwing version)
export function assertType(value, typeChecker, defaultValue) {
  try {
    return typeChecker(value)
  } catch {
    return defaultValue
  }
}

// Safe type coercion
export function coerceType(value, targetType) {
  switch (targetType) {
    case 'string':
      return String(value)
    case 'number':
      return Number(value) || 0
    case 'boolean':
      return Boolean(value)
    case 'date':
      return new Date(value)
    case 'array':
      return Array.isArray(value) ? value : [value]
    default:
      return value
  }
}
