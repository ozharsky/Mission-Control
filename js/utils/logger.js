// Production Logger
// Replaces console.log with environment-aware logging

const isDev = import.meta.env?.DEV || location.hostname === 'localhost'
const isTest = import.meta.env?.TEST || location.search.includes('test=true')

// Log levels
const LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
}

// Current log level (can be changed at runtime)
let currentLevel = isDev ? LEVELS.DEBUG : LEVELS.WARN

// Log history for debugging
const logHistory = []
const MAX_HISTORY = 100

// Base logger
const logger = {
  // Set minimum log level
  setLevel(level) {
    if (typeof level === 'string') {
      currentLevel = LEVELS[level.toUpperCase()] ?? LEVELS.WARN
    } else {
      currentLevel = level
    }
  },
  
  // Get current level
  getLevel() {
    return Object.keys(LEVELS).find(k => LEVELS[k] === currentLevel)
  },
  
  // Debug logging (dev only)
  debug(...args) {
    if (currentLevel <= LEVELS.DEBUG) {
      console.debug('[DEBUG]', ...args)
      addToHistory('debug', args)
    }
  },
  
  // Info logging
  info(...args) {
    if (currentLevel <= LEVELS.INFO) {
      console.info('[INFO]', ...args)
      addToHistory('info', args)
    }
  },
  
  // Warning logging
  warn(...args) {
    if (currentLevel <= LEVELS.WARN) {
      console.warn('[WARN]', ...args)
      addToHistory('warn', args)
    }
  },
  
  // Error logging (always shown)
  error(...args) {
    if (currentLevel <= LEVELS.ERROR) {
      console.error('[ERROR]', ...args)
      addToHistory('error', args)
    }
  },
  
  // Group logging
  group(label) {
    if (currentLevel <= LEVELS.DEBUG && isDev) {
      console.group(label)
    }
  },
  
  groupEnd() {
    if (currentLevel <= LEVELS.DEBUG && isDev) {
      console.groupEnd()
    }
  },
  
  // Time logging
  time(label) {
    if (currentLevel <= LEVELS.DEBUG) {
      console.time(label)
    }
  },
  
  timeEnd(label) {
    if (currentLevel <= LEVELS.DEBUG) {
      console.timeEnd(label)
    }
  },
  
  // Get log history
  getHistory() {
    return [...logHistory]
  },
  
  // Clear history
  clearHistory() {
    logHistory.length = 0
  },
  
  // Export logs as JSON
  exportLogs() {
    return JSON.stringify(logHistory, null, 2)
  },
  
  // Log app initialization
  appInit(version) {
    if (isDev) {
      console.log(`%c🚀 Mission Control v${version}`, 'font-size: 20px; font-weight: bold; color: #6366f1;')
      console.log('%cDevelopment Mode', 'color: #f59e0b;')
    } else {
      console.log(`🚀 Mission Control v${version}`)
    }
  },
  
  // Log section load
  sectionLoaded(name) {
    this.debug(`📄 Section loaded: ${name}`)
  },
  
  // Log store update
  storeUpdate(path) {
    this.debug(`💾 Store update: ${path}`)
  },
  
  // Log API call
  apiCall(method, url) {
    this.debug(`🌐 API ${method}: ${url}`)
  },
  
  // Log performance metric
  perf(label, duration) {
    if (duration > 100) {
      this.warn(`⏱️ ${label}: ${duration}ms (slow)`)
    } else {
      this.debug(`⏱️ ${label}: ${duration}ms`)
    }
  }
}

// Add to history
function addToHistory(level, args) {
  logHistory.push({
    timestamp: new Date().toISOString(),
    level,
    message: args.map(formatArg).join(' ')
  })
  
  // Trim history
  if (logHistory.length > MAX_HISTORY) {
    logHistory.shift()
  }
}

// Format argument for history
function formatArg(arg) {
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg)
    } catch {
      return '[Object]'
    }
  }
  return String(arg)
}

// No-op functions for production
const noop = () => {}

// Override console in production
if (!isDev) {
  console.debug = noop
  console.log = (...args) => logger.info(...args)
}

export default logger
export { LEVELS }
