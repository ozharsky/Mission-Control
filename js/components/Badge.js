/**
 * Badge Component
 * Reusable badge with multiple variants
 * 
 * Usage:
 *   Badge({
 *     text: 'Active',
 *     variant: 'primary', // primary | success | warning | danger | neutral
 *     icon: 'check',      // Lucide icon name (optional)
 *     className: ''       // Additional CSS classes
 *   })
 */

/**
 * Create Lucide icon element
 * @param {string} name - Lucide icon name
 * @returns {HTMLElement} Icon element
 */
function createIcon(name) {
  const icon = document.createElement('i');
  icon.setAttribute('data-lucide', name);
  icon.style.width = '1em';
  icon.style.height = '1em';
  return icon;
}

/**
 * Badge component
 * @param {Object} props - Badge properties
 * @param {string} props.text - Badge text
 * @param {string} props.variant - Badge variant (primary, success, warning, danger, neutral)
 * @param {string} [props.icon] - Optional Lucide icon name
 * @param {string} [props.className] - Additional CSS classes
 * @returns {HTMLElement} Badge element
 */
export const Badge = ({
  text,
  variant = 'primary',
  icon = null,
  className = ''
}) => {
  const badge = document.createElement('span');
  
  // Base classes
  const classes = ['badge', `badge--${variant}`, className].filter(Boolean);
  badge.className = classes.join(' ');
  
  // Build content
  if (icon) {
    badge.appendChild(createIcon(icon));
  }
  
  if (text) {
    const textNode = document.createTextNode(text);
    badge.appendChild(textNode);
  }
  
  return badge;
};

/**
 * Status badge helper - maps status strings to appropriate variants
 * @param {string} status - Status string (active, inactive, pending, error, etc.)
 * @param {Object} options - Additional options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Badge element
 */
export const StatusBadge = (status, { className = '' } = {}) => {
  const statusMap = {
    active: { text: 'Active', variant: 'success', icon: 'check-circle' },
    inactive: { text: 'Inactive', variant: 'neutral', icon: 'circle-off' },
    pending: { text: 'Pending', variant: 'warning', icon: 'clock' },
    error: { text: 'Error', variant: 'danger', icon: 'alert-circle' },
    warning: { text: 'Warning', variant: 'warning', icon: 'alert-triangle' },
    running: { text: 'Running', variant: 'primary', icon: 'zap' },
    completed: { text: 'Completed', variant: 'success', icon: 'check' },
    blocked: { text: 'Blocked', variant: 'danger', icon: 'lock' },
    idle: { text: 'Idle', variant: 'neutral', icon: 'minus' }
  };
  
  const config = statusMap[status?.toLowerCase()] || { 
    text: status || 'Unknown', 
    variant: 'neutral',
    icon: null 
  };
  
  return Badge({
    text: config.text,
    variant: config.variant,
    icon: config.icon,
    className
  });
};

/**
 * Priority badge helper - maps priority strings to appropriate variants
 * @param {string} priority - Priority string (high, medium, low, urgent)
 * @param {Object} options - Additional options
 * @param {string} [options.className] - Additional CSS classes
 * @returns {HTMLElement} Badge element
 */
export const PriorityBadge = (priority, { className = '' } = {}) => {
  const priorityMap = {
    high: { text: 'High', variant: 'danger', icon: 'arrow-up' },
    medium: { text: 'Medium', variant: 'warning', icon: 'minus' },
    low: { text: 'Low', variant: 'success', icon: 'arrow-down' },
    urgent: { text: 'Urgent', variant: 'danger', icon: 'flame' }
  };
  
  const config = priorityMap[priority?.toLowerCase()] || { 
    text: priority || 'Normal', 
    variant: 'neutral',
    icon: null 
  };
  
  return Badge({
    text: config.text,
    variant: config.variant,
    icon: config.icon,
    className
  });
};

/**
 * Count badge helper - displays a number count
 * @param {number} count - The count to display
 * @param {Object} options - Additional options
 * @param {string} [options.variant] - Badge variant
 * @param {string} [options.className] - Additional CSS classes
 * @param {number} [options.max] - Maximum number before showing "{max}+"
 * @returns {HTMLElement} Badge element
 */
export const CountBadge = (count, { 
  variant = 'primary', 
  className = '',
  max = 99 
} = {}) => {
  const displayCount = count > max ? `${max}+` : String(count);
  
  return Badge({
    text: displayCount,
    variant,
    className: `badge--count ${className}`
  });
};

export default Badge;
