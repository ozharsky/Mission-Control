/**
 * Badge Component for Mission Control V5
 * Matches React app badge design system
 * 
 * Usage:
 * import { createBadge, createStatusBadge, createPriorityBadge } from './components/ui/Badge.js';
 * 
 * // Default badge
 * createBadge({ label: 'New', variant: 'primary' })
 * 
 * // Status badge
 * createStatusBadge('active')  // Shows 'Active' with appropriate styling
 * 
 * // Priority badge
 * createPriorityBadge('high')  // Shows 'High' with danger styling
 * 
 * // Badge with icon
 * createBadge({ label: 'Completed', variant: 'success', icon: 'check' })
 */

/**
 * Badge variant styles mapping
 */
const BADGE_VARIANTS = {
  default: 'm-badge',
  primary: 'm-badge m-badge-primary',
  secondary: 'm-badge m-badge-secondary',
  success: 'm-badge m-badge-success',
  warning: 'm-badge m-badge-warning',
  danger: 'm-badge m-badge-danger',
  info: 'm-badge m-badge-info',
  outline: 'm-badge m-badge-outline'
};

/**
 * Status to badge variant mapping
 */
const STATUS_VARIANTS = {
  active: { variant: 'primary', label: 'Active', icon: 'activity' },
  inactive: { variant: 'secondary', label: 'Inactive', icon: 'pause' },
  done: { variant: 'success', label: 'Done', icon: 'check' },
  completed: { variant: 'success', label: 'Completed', icon: 'check-circle' },
  pending: { variant: 'warning', label: 'Pending', icon: 'clock' },
  blocked: { variant: 'danger', label: 'Blocked', icon: 'lock' },
  running: { variant: 'primary', label: 'Running', icon: 'zap' },
  idle: { variant: 'secondary', label: 'Idle', icon: 'minus' },
  error: { variant: 'danger', label: 'Error', icon: 'alert-circle' },
  warning: { variant: 'warning', label: 'Warning', icon: 'alert-triangle' },
  operational: { variant: 'success', label: 'Operational', icon: 'check' }
};

/**
 * Priority to badge variant mapping
 */
const PRIORITY_VARIANTS = {
  high: { variant: 'danger', label: 'High', icon: 'arrow-up' },
  medium: { variant: 'warning', label: 'Medium', icon: 'minus' },
  low: { variant: 'success', label: 'Low', icon: 'arrow-down' },
  urgent: { variant: 'danger', label: 'Urgent', icon: 'flame' }
};

/**
 * Create a badge element
 * @param {Object} options - Badge configuration
 * @param {string} options.label - Badge text label
 * @param {string} options.variant - Badge variant: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
 * @param {string} options.icon - Lucide icon name (optional)
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for the badge
 */
export function createBadge({
  label,
  variant = 'default',
  icon,
  className = ''
}) {
  const variantClass = BADGE_VARIANTS[variant] || BADGE_VARIANTS.default;
  
  // Build icon HTML
  let iconHtml = '';
  if (icon) {
    iconHtml = `<i data-lucide="${icon}" class="lucide-icon" width="12" height="12"></i>`;
  }
  
  return `
    <span class="${variantClass} ${className}">
      ${iconHtml}
      ${label || ''}
    </span>
  `;
}

/**
 * Create a status badge
 * @param {string} status - Status key: 'active' | 'inactive' | 'done' | 'completed' | 'pending' | 'blocked' | 'running' | 'idle' | 'error' | 'warning' | 'operational'
 * @param {Object} options - Additional options
 * @param {string} options.className - Additional CSS classes
 * @param {boolean} options.showIcon - Whether to show the icon
 * @returns {string} HTML string for the badge
 */
export function createStatusBadge(status, { className = '', showIcon = true } = {}) {
  const statusConfig = STATUS_VARIANTS[status?.toLowerCase()];
  
  if (!statusConfig) {
    // Fallback for unknown status
    return createBadge({ 
      label: status || 'Unknown', 
      variant: 'secondary',
      className 
    });
  }
  
  return createBadge({
    label: statusConfig.label,
    variant: statusConfig.variant,
    icon: showIcon ? statusConfig.icon : null,
    className
  });
}

/**
 * Create a priority badge
 * @param {string} priority - Priority key: 'high' | 'medium' | 'low' | 'urgent'
 * @param {Object} options - Additional options
 * @param {string} options.className - Additional CSS classes
 * @param {boolean} options.showIcon - Whether to show the icon
 * @returns {string} HTML string for the badge
 */
export function createPriorityBadge(priority, { className = '', showIcon = true } = {}) {
  const priorityConfig = PRIORITY_VARIANTS[priority?.toLowerCase()];
  
  if (!priorityConfig) {
    // Fallback for unknown priority
    return createBadge({ 
      label: priority || 'Normal', 
      variant: 'secondary',
      className 
    });
  }
  
  return createBadge({
    label: priorityConfig.label,
    variant: priorityConfig.variant,
    icon: showIcon ? priorityConfig.icon : null,
    className
  });
}

/**
 * Create a count badge (for notifications, item counts, etc.)
 * @param {number} count - The count to display
 * @param {Object} options - Additional options
 * @param {string} options.variant - Badge variant
 * @param {string} options.className - Additional CSS classes
 * @param {number} options.max - Maximum number to display (shows "{max}+" if exceeded)
 * @returns {string} HTML string for the badge
 */
export function createCountBadge(count, { 
  variant = 'primary', 
  className = '',
  max = 99 
} = {}) {
  const displayCount = count > max ? `${max}+` : count;
  
  return createBadge({
    label: String(displayCount),
    variant,
    className: `m-badge-count ${className}`
  });
}

/**
 * Initialize badges in a container (initializes Lucide icons)
 * @param {HTMLElement} container - Container element
 */
export function initBadges(container = document) {
  // Initialize Lucide icons if available
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({
      attrs: {
        'stroke-width': 2
      },
      nameAttr: 'data-lucide'
    });
  }
}
