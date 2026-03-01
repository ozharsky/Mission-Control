/**
 * Button Component for Mission Control V5
 * Matches React app button design system
 * 
 * Usage:
 * import { createButton, createButtonGroup } from './components/ui/Button.js';
 * 
 * // Primary button
 * createButton({ label: 'Save', variant: 'primary', onClick: handleSave })
 * 
 * // Secondary button with icon
 * createButton({ label: 'Cancel', variant: 'secondary', icon: 'x', onClick: handleCancel })
 * 
 * // Ghost button (icon only)
 * createButton({ variant: 'ghost', icon: 'more-vertical', iconOnly: true, onClick: handleMenu })
 * 
 * // Destructive action
 * createButton({ label: 'Delete', variant: 'destructive', onClick: handleDelete })
 */

/**
 * Button variant styles mapping
 */
const BUTTON_VARIANTS = {
  primary: 'm-btn m-btn-primary m-touch',
  secondary: 'm-btn m-btn-secondary m-touch',
  ghost: 'm-btn m-btn-ghost m-touch',
  destructive: 'm-btn m-btn-destructive m-touch',
  outline: 'm-btn m-btn-outline m-touch'
};

/**
 * Button size styles mapping
 */
const BUTTON_SIZES = {
  sm: 'm-btn-sm',
  default: '',
  lg: 'm-btn-lg',
  icon: 'm-btn-icon'
};

/**
 * Create a button element
 * @param {Object} options - Button configuration
 * @param {string} options.label - Button text label
 * @param {string} options.variant - Button variant: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
 * @param {string} options.size - Button size: 'sm' | 'default' | 'lg' | 'icon'
 * @param {string} options.icon - Lucide icon name (optional)
 * @param {boolean} options.iconOnly - Show only icon, no label
 * @param {boolean} options.disabled - Disabled state
 * @param {Function} options.onClick - Click handler
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.type - Button type: 'button' | 'submit' | 'reset'
 * @param {string} options.id - Button ID
 * @returns {string} HTML string for the button
 */
export function createButton({
  label,
  variant = 'primary',
  size = 'default',
  icon,
  iconOnly = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  id
}) {
  const variantClass = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  const sizeClass = BUTTON_SIZES[size] || '';
  const iconOnlyClass = iconOnly ? 'm-btn-icon' : '';
  const disabledAttr = disabled ? 'disabled' : '';
  const idAttr = id ? `id="${id}"` : '';
  
  // Build click handler
  let clickHandler = '';
  if (onClick && typeof onClick === 'string') {
    clickHandler = `onclick="${onClick}"`;
  }
  
  // Build icon HTML
  let iconHtml = '';
  if (icon) {
    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;
    iconHtml = `<i data-lucide="${icon}" class="lucide-icon" width="${iconSize}" height="${iconSize}"></i>`;
  }
  
  // Build label HTML
  const labelHtml = label && !iconOnly ? `<span>${label}</span>` : '';
  
  return `
    <button 
      type="${type}"
      class="${variantClass} ${sizeClass} ${iconOnlyClass} ${className}"
      ${clickHandler}
      ${disabledAttr}
      ${idAttr}
    >
      ${iconHtml}
      ${labelHtml}
    </button>
  `;
}

/**
 * Create a button group (for related actions)
 * @param {Array} buttons - Array of button configurations
 * @param {string} className - Additional CSS classes
 * @returns {string} HTML string for the button group
 */
export function createButtonGroup(buttons, className = '') {
  if (!Array.isArray(buttons) || buttons.length === 0) {
    return '';
  }
  
  const buttonsHtml = buttons.map(btn => createButton(btn)).join('');
  
  return `
    <div class="m-btn-group ${className}">
      ${buttonsHtml}
    </div>
  `;
}

/**
 * Initialize buttons in a container (adds touch feedback, initializes Lucide icons)
 * @param {HTMLElement} container - Container element
 */
export function initButtons(container = document) {
  // Initialize Lucide icons if available
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({
      attrs: {
        'stroke-width': 2
      },
      nameAttr: 'data-lucide'
    });
  }
  
  // Add touch feedback to all m-btn elements
  container.querySelectorAll('.m-btn').forEach(btn => {
    btn.addEventListener('touchstart', () => {
      btn.style.transform = 'scale(0.98)';
    }, { passive: true });
    
    btn.addEventListener('touchend', () => {
      btn.style.transform = '';
    }, { passive: true });
    
    btn.addEventListener('touchcancel', () => {
      btn.style.transform = '';
    }, { passive: true });
  });
}

/**
 * Create an icon-only button (convenience function)
 * @param {Object} options - Button configuration
 * @returns {string} HTML string for the button
 */
export function createIconButton({
  icon,
  variant = 'ghost',
  size = 'default',
  ...rest
}) {
  return createButton({
    icon,
    variant,
    size: size === 'default' ? 'icon' : `${size}-icon`,
    iconOnly: true,
    ...rest
  });
}
