/**
 * List Component - Unified list item system for Mission Control V5
 * 
 * Provides consistent list item rendering with:
 * - Touch-friendly 44px+ targets
 * - Swipe actions support
 * - Checkbox selection for bulk operations
 * - Leading/trailing content areas
 * - Consistent styling with .m-* classes
 * 
 * @example
 * import { createListItem, createListGroup, createListView } from './components/ui/List.js'
 */

import { addTouchFeedback } from '../utils/mobileInteractions.js'

/**
 * Creates a standard list item
 * @param {Object} options - List item options
 * @param {string} options.id - Unique identifier
 * @param {string} options.title - Primary text
 * @param {string} [options.subtitle] - Secondary text
 * @param {string} [options.description] - Body text (truncated)
 * @param {string|HTMLElement} [options.leading] - Leading content (icon, avatar, checkbox)
 * @param {string|HTMLElement} [options.trailing] - Trailing content (actions, chevron)
 * @param {Array} [options.meta] - Array of meta items (badges, dates, etc.)
 * @param {Array} [options.tags] - Array of tag strings
 * @param {string} [options.variant='default'] - 'default', 'interactive', 'completed', 'blocked'
 * @param {Function} [options.onClick] - Click handler
 * @param {boolean} [options.swipeable=false] - Enable swipe actions
 * @param {Array} [options.swipeActions] - Swipe action config
 * @returns {HTMLElement} List item element
 */
export function createListItem(options = {}) {
  const {
    id,
    title,
    subtitle,
    description,
    leading,
    trailing,
    meta = [],
    tags = [],
    variant = 'default',
    onClick,
    swipeable = false,
    swipeActions = []
  } = options

  const item = document.createElement('div')
  item.className = `m-list-item m-list-item--${variant}`
  item.dataset.id = id
  
  if (onClick) {
    item.classList.add('m-list-item--clickable')
    item.addEventListener('click', (e) => {
      // Don't trigger if clicking checkbox or action buttons
      if (e.target.closest('.m-list-item-checkbox') || 
          e.target.closest('.m-list-item-action')) {
        return
      }
      onClick(e, id)
    })
    addTouchFeedback(item)
  }

  // Build inner HTML
  let html = ''

  // Leading content
  if (leading) {
    html += `<div class="m-list-item-leading">${leading}</div>`
  }

  // Main content
  html += `<div class="m-list-item-content">`
  
  if (title) {
    html += `<div class="m-list-item-title">${escapeHtml(title)}</div>`
  }
  
  if (subtitle) {
    html += `<div class="m-list-item-subtitle">${escapeHtml(subtitle)}</div>`
  }
  
  if (description) {
    html += `<div class="m-list-item-description">${escapeHtml(description)}</div>`
  }
  
  // Meta row
  if (meta.length > 0) {
    html += `<div class="m-list-item-meta">${meta.map(m => `<span class="m-list-item-meta-item">${m}</span>`).join('')}</div>`
  }
  
  // Tags
  if (tags.length > 0) {
    html += `<div class="m-list-item-tags">${tags.slice(0, 3).map(tag => 
      `<span class="m-list-item-tag">${escapeHtml(tag)}</span>`
    ).join('')}${tags.length > 3 ? `<span class="m-list-item-tag-more">+${tags.length - 3}</span>` : ''}</div>`
  }
  
  html += `</div>` // End content

  // Trailing content
  if (trailing) {
    html += `<div class="m-list-item-trailing">${trailing}</div>`
  }

  item.innerHTML = html

  // Initialize swipe if enabled
  if (swipeable && swipeActions.length > 0) {
    initSwipeActions(item, swipeActions, id)
  }

  return item
}

/**
 * Creates a checkbox for list item selection
 * @param {string|number} id - Item ID
 * @param {boolean} checked - Initial checked state
 * @param {Function} onChange - Change handler
 * @returns {string} Checkbox HTML
 */
export function createListCheckbox(id, checked = false, onChange) {
  const checkboxId = `list-checkbox-${id}`
  return `
    <div class="m-list-item-checkbox-wrapper">
      <input type="checkbox" 
             id="${checkboxId}" 
             class="m-list-item-checkbox-input" 
             ${checked ? 'checked' : ''}
             data-id="${id}">
      <label for="${checkboxId}" class="m-list-item-checkbox">
        <svg class="m-list-item-checkbox-check" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </label>
    </div>
  `
}

/**
 * Creates a list group (collapsible section)
 * @param {Object} options - Group options
 * @param {string} options.id - Group identifier
 * @param {string} options.label - Group label
 * @param {string} [options.icon] - Group icon (Lucide icon name)
 * @param {number} [options.count] - Item count badge
 * @param {Array} options.items - Array of list item elements or HTML strings
 * @param {boolean} [options.collapsible=true] - Allow collapsing
 * @param {boolean} [options.collapsed=false] - Initial collapsed state
 * @returns {HTMLElement} List group element
 */
export function createListGroup(options = {}) {
  const {
    id,
    label,
    icon,
    count,
    items = [],
    collapsible = true,
    collapsed = false
  } = options

  const group = document.createElement('div')
  group.className = 'm-list-group'
  group.dataset.groupId = id

  const iconHtml = icon ? `<span class="m-list-group-icon">${getLucideIcon(icon)}</span>` : ''
  const countHtml = count !== undefined ? `<span class="m-list-group-count">${count}</span>` : ''
  const chevronHtml = collapsible ? `
    <svg class="m-list-group-chevron ${collapsed ? 'collapsed' : ''}" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  ` : ''

  group.innerHTML = `
    <div class="m-list-group-header ${collapsible ? 'm-list-group-header--collapsible' : ''}">
      <div class="m-list-group-title">
        ${iconHtml}
        <span>${escapeHtml(label)}</span>
        ${countHtml}
      </div>
      ${chevronHtml}
    </div>
    <div class="m-list-group-content ${collapsed ? 'collapsed' : ''}">
      ${items.map(item => typeof item === 'string' ? item : item.outerHTML).join('')}
    </div>
  `

  // Add collapse toggle
  if (collapsible) {
    const header = group.querySelector('.m-list-group-header')
    const content = group.querySelector('.m-list-group-content')
    const chevron = group.querySelector('.m-list-group-chevron')
    
    header.addEventListener('click', () => {
      content.classList.toggle('collapsed')
      chevron?.classList.toggle('collapsed')
    })
    addTouchFeedback(header)
  }

  return group
}

/**
 * Creates a complete list view with groups
 * @param {Object} options - List view options
 * @param {Array} options.groups - Array of group configs
 * @param {string} [options.emptyText='No items'] - Empty state text
 * @returns {HTMLElement} List view container
 */
export function createListView(options = {}) {
  const { groups = [], emptyText = 'No items' } = options

  const container = document.createElement('div')
  container.className = 'm-list-view'

  if (groups.length === 0 || groups.every(g => !g.items || g.items.length === 0)) {
    container.innerHTML = `
      <div class="m-list-empty">
        <div class="m-list-empty-icon">${getLucideIcon('inbox')}</div>
        <div class="m-list-empty-text">${escapeHtml(emptyText)}</div>
      </div>
    `
    return container
  }

  groups.forEach(groupConfig => {
    const group = createListGroup(groupConfig)
    container.appendChild(group)
  })

  return container
}

/**
 * Renders a simple action button for list items
 * @param {string} icon - Lucide icon name
 * @param {string} label - Button label (for aria)
 * @param {Function} onClick - Click handler
 * @param {string} [variant='default'] - 'default', 'primary', 'danger'
 * @returns {string} Button HTML
 */
export function createListAction(icon, label, onClick, variant = 'default') {
  return `
    <button class="m-list-item-action m-list-item-action--${variant}" 
            aria-label="${escapeHtml(label)}"
            onclick="${onClick}">
      ${getLucideIcon(icon)}
    </button>
  `
}

// Helper: Initialize swipe actions (placeholder - actual implementation in mobileInteractions.js)
function initSwipeActions(element, actions, itemId) {
  // Swipe actions are initialized via mobileInteractions.js
  // This is a marker for the swipe system to pick up
  element.dataset.swipeable = 'true'
  element.dataset.swipeActions = JSON.stringify(actions)
  element.dataset.itemId = itemId
}

// Helper: Get Lucide icon SVG
function getLucideIcon(name) {
  const icons = {
    'inbox': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>',
    'check': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    'chevron-right': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>',
    'more-vertical': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>',
    'edit': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    'trash': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    'star': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
    'clock': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    'calendar': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    'user': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    'tag': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>',
    'folder': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>',
    'alert-circle': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
    'lock': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>',
    'zap': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    'archive': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>',
    'circle': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>',
    'check-circle': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    'flame': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>',
    'shopping-cart': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>',
    'camera': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
    'store': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18"></path></svg>',
    'printer': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',
    'building': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><line x1="9" y1="12" x2="9.01" y2="12"></line><line x1="9" y1="16" x2="9.01" y2="16"></line><line x1="13" y1="12" x2="13.01" y2="12"></line><line x1="13" y1="16" x2="13.01" y2="16"></line></svg>'
  }
  
  return icons[name] || icons['circle']
}

// Helper: Escape HTML
function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Export for use in other modules
export default {
  createListItem,
  createListGroup,
  createListView,
  createListCheckbox,
  createListAction
}
