// Application Constants
// Centralized configuration to eliminate magic numbers

// App Info
export const APP_NAME = 'Mission Control'
export const APP_VERSION = '4.0.0'
export const APP_STORAGE_KEY = 'mc-data'

// Default Goals
export const DEFAULT_ORDERS_TARGET = 150
export const DEFAULT_REVENUE_GOAL = 5400
export const DEFAULT_GOAL_DATE = '2026-05-01'

// Limits
export const MAX_PRIORITIES = 1000
export const MAX_PROJECTS = 500
export const MAX_LEADS = 10000
export const MAX_EVENTS = 500
export const MAX_SKUS = 1000
export const MAX_NOTES = 1000
export const MAX_DOCS = 500

// Text Limits
export const MAX_TITLE_LENGTH = 200
export const MAX_DESC_LENGTH = 2000
export const MAX_NOTE_LENGTH = 10000
export const MAX_TAG_LENGTH = 50
export const MAX_TAGS = 10

// Pagination
export const DEFAULT_ITEMS_PER_PAGE = 10
export const MAX_ITEMS_PER_PAGE = 100
export const PAGINATION_MAX_VISIBLE = 5

// Timeouts (in milliseconds)
export const DEBOUNCE_DELAY = 300
export const THROTTLE_DELAY = 100
export const STORE_NOTIFY_DEBOUNCE = 16
export const TOAST_DURATION = 3000
export const TOAST_DURATION_LONG = 5000
export const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
export const SESSION_WARNING = 5 * 60 * 1000 // 5 minutes before timeout

// Storage
export const STORAGE_QUOTA_WARNING = 80 // percentage
export const STORAGE_QUOTA_CRITICAL = 90 // percentage
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Date Formats
export const DATE_FORMAT_ISO = 'YYYY-MM-DD'
export const DATE_FORMAT_DISPLAY = 'MMM D, YYYY'
export const DATE_FORMAT_SHORT = 'MM/DD/YY'

// Currency
export const DEFAULT_CURRENCY = 'USD'
export const DEFAULT_CURRENCY_SYMBOL = '$'

// Chart Defaults
export const CHART_COLORS = {
  primary: 'rgba(99, 102, 241, 0.6)',
  primaryBorder: 'rgba(99, 102, 241, 1)',
  success: 'rgba(16, 185, 129, 0.6)',
  successBorder: 'rgba(16, 185, 129, 1)',
  warning: 'rgba(245, 158, 11, 0.6)',
  warningBorder: 'rgba(245, 158, 11, 1)',
  danger: 'rgba(239, 68, 68, 0.6)',
  dangerBorder: 'rgba(239, 68, 68, 1)'
}

// Status Colors
export const STATUS_COLORS = {
  new: '#6366f1',
  contacted: '#f59e0b',
  qualified: '#10b981',
  proposal: '#8b5cf6',
  closed: '#6b7280',
  lost: '#ef4444',
  
  upcoming: '#6366f1',
  confirmed: '#10b981',
  tentative: '#f59e0b',
  completed: '#6b7280',
  cancelled: '#ef4444',
  
  backlog: '#6b7280',
  todo: '#f59e0b',
  inprogress: '#6366f1',
  done: '#10b981'
}

// Board Types
export const BOARDS = {
  ALL: 'all',
  ETSY: 'etsy',
  PHOTOGRAPHY: 'photography',
  WHOLESALE: 'wholesale',
  PRINTING: '3dprint'
}

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
}

// Event Types
export const EVENT_TYPES = {
  CANNABIS: 'cannabis',
  TRADE: 'trade',
  PHOTO: 'photo',
  ETSY: 'etsy',
  OTHER: 'other'
}

// Lead Statuses
export const LEAD_STATUSES = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  CLOSED: 'closed',
  LOST: 'lost'
}

// Keyboard Shortcuts
export const KEYBOARD_SHORTCUTS = {
  HELP: '?',
  NEW_PRIORITY: 'n',
  SEARCH: 'k',
  UNDO: 'z',
  DASHBOARD: 'd',
  PROJECTS: 'p',
  PRIORITIES: 't',
  REVENUE: 'r',
  CALENDAR: 'c',
  ESCAPE: 'Escape'
}

// Animation Durations (ms)
export const ANIMATION_DURATION = 300
export const ANIMATION_DURATION_LONG = 500
export const SKELETON_ANIMATION = 1500

// Breakpoints (px)
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280
}

// Touch Targets (px)
export const MIN_TOUCH_TARGET = 44
export const MIN_TOUCH_TARGET_LARGE = 48

// Z-Index Scale
export const Z_INDEX = {
  BASE: 1,
  DROPDOWN: 100,
  STICKY: 200,
  FIXED: 300,
  MODAL_BACKDROP: 400,
  MODAL: 500,
  POPOVER: 600,
  TOOLTIP: 700,
  TOAST: 800
}

// API Endpoints (if needed)
export const API_BASE_URL = import.meta.env?.VITE_API_URL || ''
export const API_TIMEOUT = 30000

// Feature Flags
export const FEATURES = {
  ENABLE_PWA: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: false,
  ENABLE_BETA_FEATURES: import.meta.env?.DEV || false
}
