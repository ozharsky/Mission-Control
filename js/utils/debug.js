// Debug utility - controlled logging
const DEBUG = localStorage.getItem('mc-debug') === 'true' || location.search.includes('debug=true')

export const debug = {
  log(...args) {
    if (DEBUG) console.log(...args)
  },
  
  warn(...args) {
    if (DEBUG) console.warn(...args)
  },
  
  error(...args) {
    // Always log errors
    console.error(...args)
  },
  
  info(...args) {
    if (DEBUG) console.info(...args)
  },
  
  // Group related logs
  group(label, fn) {
    if (DEBUG) {
      console.group(label)
      fn()
      console.groupEnd()
    }
  },
  
  // Time operations
  time(label) {
    if (DEBUG) console.time(label)
  },
  
  timeEnd(label) {
    if (DEBUG) console.timeEnd(label)
  },
  
  // Table for data
  table(data, columns) {
    if (DEBUG) console.table(data, columns)
  }
}

// Expose globally for legacy code
window.debug = debug