/**
 * Card Component for Mission Control V5
 * Matches React app card design system
 * 
 * Usage:
 * import { createCard, createCardHeader, createCardContent, createCardFooter } from './components/ui/Card.js';
 * 
 * // Basic card
 * createCard({ children: '<p>Card content</p>' })
 * 
 * // Card with header and content
 * createCard({
 *   header: createCardHeader({ title: 'Projects', action: createButton({...}) }),
 *   children: createCardContent({ children: '...' })
 * })
 * 
 * // Clickable card
 * createCard({ 
 *   children: '...', 
 *   onClick: 'showSection("projects")',
 *   clickable: true 
 * })
 * 
 * // Stats card
 * createStatsCard({ value: '12', label: 'Active', icon: 'zap', trend: 5 })
 */

import { createButton } from './Button.js';
import { createBadge } from './Badge.js';

/**
 * Card variant styles mapping
 */
const CARD_VARIANTS = {
  default: 'm-card',
  elevated: 'm-card m-card-elevated',
  outlined: 'm-card m-card-outlined',
  ghost: 'm-card m-card-ghost'
};

/**
 * Create a card container
 * @param {Object} options - Card configuration
 * @param {string} options.children - Card content HTML
 * @param {string} options.variant - Card variant: 'default' | 'elevated' | 'outlined' | 'ghost'
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.id - Card ID
 * @param {boolean} options.clickable - Whether card is clickable
 * @param {string} options.onClick - Click handler (string for inline)
 * @param {string} options.role - ARIA role
 * @param {string} options.tabindex - Tab index
 * @returns {string} HTML string for the card
 */
export function createCard({
  children,
  variant = 'default',
  className = '',
  id,
  clickable = false,
  onClick,
  role,
  tabindex
}) {
  const variantClass = CARD_VARIANTS[variant] || CARD_VARIANTS.default;
  const clickableClass = clickable ? 'm-card-clickable m-touch' : '';
  const idAttr = id ? `id="${id}"` : '';
  const roleAttr = role ? `role="${role}"` : clickable ? 'role="button"' : '';
  const tabindexAttr = tabindex ? `tabindex="${tabindex}"` : clickable ? 'tabindex="0"' : '';
  
  // Build click handler
  let clickHandler = '';
  if (onClick && typeof onClick === 'string') {
    clickHandler = `onclick="${onClick}"`;
  }
  
  return `
    <div 
      class="${variantClass} ${clickableClass} ${className}"
      ${idAttr}
      ${roleAttr}
      ${tabindexAttr}
      ${clickHandler}
    >
      ${children || ''}
    </div>
  `;
}

/**
 * Create a card header
 * @param {Object} options - Header configuration
 * @param {string} options.title - Card title
 * @param {string} options.subtitle - Card subtitle
 * @param {string} options.icon - Lucide icon name
 * @param {string} options.action - Action button HTML (use createButton or createIconButton)
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for the card header
 */
export function createCardHeader({
  title,
  subtitle,
  icon,
  action,
  className = ''
}) {
  const iconHtml = icon ? `<i data-lucide="${icon}" class="lucide-icon card-header-icon"></i>` : '';
  const subtitleHtml = subtitle ? `<div class="m-caption card-header-subtitle">${subtitle}</div>` : '';
  const actionHtml = action ? `<div class="card-header-action">${action}</div>` : '';
  
  return `
    <div class="m-card-header ${className}">
      <div class="card-header-content">
        ${iconHtml}
        <div class="card-header-text">
          <div class="m-title card-header-title">${title || ''}</div>
          ${subtitleHtml}
        </div>
      </div>
      ${actionHtml}
    </div>
  `;
}

/**
 * Create card content area
 * @param {Object} options - Content configuration
 * @param {string} options.children - Content HTML
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for the card content
 */
export function createCardContent({
  children,
  className = ''
}) {
  return `
    <div class="m-card-content ${className}">
      ${children || ''}
    </div>
  `;
}

/**
 * Create card footer
 * @param {Object} options - Footer configuration
 * @param {string} options.children - Footer content HTML
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for the card footer
 */
export function createCardFooter({
  children,
  className = ''
}) {
  return `
    <div class="m-card-footer ${className}">
      ${children || ''}
    </div>
  `;
}

/**
 * Create a card meta row (for tags, badges, dates)
 * @param {Object} options - Meta configuration
 * @param {Array} options.items - Array of meta items (strings or HTML)
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for the card meta
 */
export function createCardMeta({
  items = [],
  className = ''
}) {
  if (!items.length) return '';
  
  const itemsHtml = items.map(item => `
    <span class="m-card-meta-item">${item}</span>
  `).join('');
  
  return `
    <div class="m-card-meta ${className}">
      ${itemsHtml}
    </div>
  `;
}

/**
 * Create a stats card (for dashboard metrics)
 * @param {Object} options - Stats card configuration
 * @param {string|number} options.value - Main stat value
 * @param {string} options.label - Stat label
 * @param {string} options.icon - Lucide icon name
 * @param {number} options.trend - Trend percentage (positive or negative)
 * @param {string} options.color - Color theme: 'purple' | 'blue' | 'green' | 'amber' | 'red'
 * @param {string} options.suffix - Suffix for value (e.g., '/ 10', '%')
 * @param {string} options.onClick - Click handler
 * @returns {string} HTML string for the stats card
 */
export function createStatsCard({
  value,
  label,
  icon,
  trend,
  color = 'purple',
  suffix = '',
  onClick
}) {
  const colorClasses = {
    purple: 'stat-card-purple',
    blue: 'stat-card-blue',
    green: 'stat-card-green',
    amber: 'stat-card-amber',
    red: 'stat-card-red'
  };
  
  const colorClass = colorClasses[color] || colorClasses.purple;
  const clickableClass = onClick ? 'm-card-clickable m-touch' : '';
  const clickHandler = onClick ? `onclick="${onClick}"` : '';
  const roleAttr = onClick ? 'role="button" tabindex="0"' : '';
  
  // Trend indicator
  let trendHtml = '';
  if (trend !== undefined) {
    const trendIcon = trend >= 0 ? 'trending-up' : 'trending-down';
    const trendClass = trend >= 0 ? 'trend-up' : 'trend-down';
    const trendSign = trend >= 0 ? '+' : '';
    trendHtml = `
      <div class="stat-card-trend ${trendClass}">
        <i data-lucide="${trendIcon}" class="lucide-icon"></i>
        <span>${trendSign}${trend}%</span>
      </div>
    `;
  }
  
  // Icon HTML
  const iconHtml = icon ? `
    <div class="stat-card-icon">
      <i data-lucide="${icon}" class="lucide-icon"></i>
    </div>
  ` : '';
  
  const children = `
    <div class="stat-card-inner ${colorClass}">
      <div class="stat-card-header">
        ${iconHtml}
        ${trendHtml}
      </div>
      <div class="stat-card-value">${value}${suffix ? `<span class="stat-card-suffix">${suffix}</span>` : ''}</div>
      <div class="stat-card-label">${label}</div>
    </div>
  `;
  
  return `
    <div class="m-card stat-card ${clickableClass}" ${clickHandler} ${roleAttr}>
      ${children}
    </div>
  `;
}

/**
 * Create an info card with icon, title, and description
 * @param {Object} options - Info card configuration
 * @param {string} options.title - Card title
 * @param {string} options.description - Card description
 * @param {string} options.icon - Lucide icon name
 * @param {string} options.variant - Visual variant: 'default' | 'info' | 'success' | 'warning' | 'error'
 * @param {string} options.action - Action button HTML
 * @returns {string} HTML string for the info card
 */
export function createInfoCard({
  title,
  description,
  icon,
  variant = 'default',
  action
}) {
  const variantClasses = {
    default: '',
    info: 'info-card-info',
    success: 'info-card-success',
    warning: 'info-card-warning',
    error: 'info-card-error'
  };
  
  const variantClass = variantClasses[variant] || '';
  const iconHtml = icon ? `<i data-lucide="${icon}" class="lucide-icon info-card-icon"></i>` : '';
  const actionHtml = action ? `<div class="info-card-action">${action}</div>` : '';
  
  return createCard({
    children: `
      <div class="info-card ${variantClass}">
        ${iconHtml}
        <div class="info-card-content">
          <div class="m-title info-card-title">${title}</div>
          <div class="m-body info-card-description">${description}</div>
        </div>
        ${actionHtml}
      </div>
    `
  });
}

/**
 * Create an empty state card
 * @param {Object} options - Empty state configuration
 * @param {string} options.icon - Lucide icon name
 * @param {string} options.title - Empty state title
 * @param {string} options.description - Empty state description
 * @param {string} options.action - Action button HTML
 * @returns {string} HTML string for the empty state card
 */
export function createEmptyStateCard({
  icon = 'inbox',
  title,
  description,
  action
}) {
  return createCard({
    variant: 'ghost',
    children: `
      <div class="empty-state-card">
        <div class="empty-state-icon">
          <i data-lucide="${icon}" class="lucide-icon"></i>
        </div>
        <div class="m-title empty-state-title">${title || 'Nothing here yet'}</div>
        ${description ? `<div class="m-body empty-state-description">${description}</div>` : ''}
        ${action ? `<div class="empty-state-action">${action}</div>` : ''}
      </div>
    `
  });
}

/**
 * Initialize cards in a container (adds touch feedback, initializes Lucide icons)
 * @param {HTMLElement} container - Container element
 */
export function initCards(container = document) {
  // Initialize Lucide icons if available
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({
      attrs: {
        'stroke-width': 2
      },
      nameAttr: 'data-lucide'
    });
  }
  
  // Add touch feedback to clickable cards
  container.querySelectorAll('.m-card-clickable').forEach(card => {
    card.addEventListener('touchstart', () => {
      card.style.transform = 'scale(0.99)';
    }, { passive: true });
    
    card.addEventListener('touchend', () => {
      card.style.transform = '';
    }, { passive: true });
    
    card.addEventListener('touchcancel', () => {
      card.style.transform = '';
    }, { passive: true });
  });
}
