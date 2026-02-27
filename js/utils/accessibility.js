// Accessibility Utilities
// ARIA labels, roles, and keyboard navigation helpers

// Common ARIA attributes for components
export const aria = {
  // Button with proper labeling
  button: (label, options = {}) => {
    const { expanded, controls, pressed, describedBy } = options
    const attrs = { 'aria-label': label }
    
    if (expanded != null) attrs['aria-expanded'] = expanded
    if (controls) attrs['aria-controls'] = controls
    if (pressed != null) attrs['aria-pressed'] = pressed
    if (describedBy) attrs['aria-describedby'] = describedBy
    
    return attrs
  },
  
  // Modal/dialog
  modal: (titleId, options = {}) => {
    const { labelledBy = titleId, describedBy } = options
    return {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': labelledBy,
      ...(describedBy && { 'aria-describedby': describedBy })
    }
  },
  
  // Alert/notification
  alert: (type = 'info') => ({
    role: type === 'error' ? 'alert' : 'status',
    'aria-live': type === 'error' ? 'assertive' : 'polite',
    'aria-atomic': 'true'
  }),
  
  // Form input
  input: (label, options = {}) => {
    const { required, invalid, describedBy, autocomplete } = options
    const attrs = { 'aria-label': label }
    
    if (required) attrs['aria-required'] = 'true'
    if (invalid) attrs['aria-invalid'] = 'true'
    if (describedBy) attrs['aria-describedby'] = describedBy
    if (autocomplete) attrs.autocomplete = autocomplete
    
    return attrs
  },
  
  // Navigation
  navigation: (label = 'Main') => ({
    role: 'navigation',
    'aria-label': label
  }),
  
  // Tab list
  tablist: (label) => ({
    role: 'tablist',
    'aria-label': label
  }),
  
  // Tab
  tab: (label, selected, controls) => ({
    role: 'tab',
    'aria-selected': selected ? 'true' : 'false',
    'aria-controls': controls,
    'aria-label': label
  }),
  
  // Tab panel
  tabpanel: (labelledBy) => ({
    role: 'tabpanel',
    'aria-labelledby': labelledBy
  }),
  
  // Progress bar
  progress: (value, max, label) => ({
    role: 'progressbar',
    'aria-valuenow': value,
    'aria-valuemin': 0,
    'aria-valuemax': max,
    'aria-label': label
  }),
  
  // Loading state
  loading: (label = 'Loading') => ({
    role: 'status',
    'aria-live': 'polite',
    'aria-label': label
  }),
  
  // Search input
  search: (label = 'Search') => ({
    role: 'searchbox',
    'aria-label': label
  }),
  
  // List
  list: (label) => ({
    role: 'list',
    'aria-label': label
  }),
  
  // List item
  listitem: () => ({
    role: 'listitem'
  }),
  
  // Checkbox
  checkbox: (label, checked, mixed = false) => ({
    role: 'checkbox',
    'aria-label': label,
    'aria-checked': mixed ? 'mixed' : checked ? 'true' : 'false'
  }),
  
  // Tooltip
  tooltip: (id) => ({
    role: 'tooltip',
    id
  })
}

// Generate unique ID for ARIA relationships
let idCounter = 0
export function generateId(prefix = 'mc') {
  return `${prefix}-${++idCounter}-${Date.now().toString(36)}`
}

// Skip link for keyboard navigation
export function createSkipLink(targetId, label = 'Skip to main content') {
  const link = document.createElement('a')
  link.href = `#${targetId}`
  link.className = 'skip-link'
  link.textContent = label
  link.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--accent-primary);
    color: white;
    padding: 8px 16px;
    z-index: 10000;
    transition: top 0.3s;
  `
  
  link.addEventListener('focus', () => {
    link.style.top = '0'
  })
  
  link.addEventListener('blur', () => {
    link.style.top = '-40px'
  })
  
  return link
}

// Announce to screen readers
export function announce(message, priority = 'polite') {
  const announcer = document.createElement('div')
  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', priority)
  announcer.setAttribute('aria-atomic', 'true')
  announcer.className = 'sr-only'
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `
  
  document.body.appendChild(announcer)
  
  // Delay to ensure screen reader picks it up
  setTimeout(() => {
    announcer.textContent = message
  }, 100)
  
  // Clean up
  setTimeout(() => {
    announcer.remove()
  }, 1000)
}

// Focus management
export const focusManager = {
  save: () => {
    return document.activeElement
  },
  
  restore: (element) => {
    if (element && element.focus) {
      element.focus()
    }
  },
  
  trap: (container, options = {}) => {
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    
    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    })
    
    if (options.autoFocus !== false && first) {
      first.focus()
    }
  }
}

// Check if reduced motion is preferred
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Check if high contrast is preferred
export function prefersHighContrast() {
  return window.matchMedia('(prefers-contrast: high)').matches
}

// Apply accessibility enhancements to existing elements
export function enhanceAccessibility() {
  // Add skip link
  const mainContent = document.getElementById('mainContent')
  if (mainContent) {
    mainContent.id = mainContent.id || 'main-content'
    const skipLink = createSkipLink(mainContent.id)
    document.body.insertBefore(skipLink, document.body.firstChild)
  }
  
  // Add aria-label to navigation
  const nav = document.querySelector('.nav')
  if (nav && !nav.getAttribute('aria-label')) {
    nav.setAttribute('aria-label', 'Main navigation')
  }
  
  // Add aria-label to buttons without text
  document.querySelectorAll('button:not([aria-label])').forEach(btn => {
    if (!btn.textContent.trim() && btn.title) {
      btn.setAttribute('aria-label', btn.title)
    }
  })
}
