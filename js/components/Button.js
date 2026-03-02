/**
 * Button Component
 * Reusable button with multiple variants and sizes
 * 
 * Usage:
 *   Button({
 *     text: 'Click me',
 *     variant: 'primary', // primary | secondary | danger | ghost
 *     size: 'md',         // sm | md | lg
 *     icon: 'check',      // Lucide icon name (optional)
 *     iconPosition: 'left', // left | right
 *     disabled: false,
 *     onClick: () => {}
 *   })
 */

export const Button = ({
  text,
  variant = 'primary',
  size = 'md',
  icon = null,
  iconPosition = 'left',
  disabled = false,
  type = 'button',
  className = '',
  onClick,
  ...props
}) => {
  const btn = document.createElement('button');
  
  // Base classes
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, className].filter(Boolean);
  btn.className = classes.join(' ');
  
  btn.type = type;
  btn.disabled = disabled;
  
  // Build content
  const content = [];
  
  if (icon && iconPosition === 'left') {
    content.push(createIcon(icon));
  }
  
  if (text) {
    const span = document.createElement('span');
    span.textContent = text;
    content.push(span);
  }
  
  if (icon && iconPosition === 'right') {
    content.push(createIcon(icon));
  }
  
  btn.append(...content);
  
  // Event handler
  if (onClick && !disabled) {
    btn.addEventListener('click', onClick);
  }
  
  // Apply additional props as data attributes
  Object.entries(props).forEach(([key, value]) => {
    if (key.startsWith('data-')) {
      btn.setAttribute(key, value);
    }
  });
  
  return btn;
};

/**
 * Icon-only button
 */
export const IconButton = ({
  icon,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  title = '',
  onClick,
  className = '',
  ...props
}) => {
  const btn = Button({
    variant,
    size,
    disabled,
    onClick,
    className: `btn--icon ${className}`,
    ...props
  });
  
  btn.appendChild(createIcon(icon));
  
  if (title) {
    btn.title = title;
    btn.setAttribute('aria-label', title);
  }
  
  return btn;
};

/**
 * Create Lucide icon element
 */
function createIcon(name) {
  const icon = document.createElement('i');
  icon.setAttribute('data-lucide', name);
  icon.style.width = '1em';
  icon.style.height = '1em';
  return icon;
}

/**
 * Initialize Lucide icons in a container
 */
export const initIcons = (container = document) => {
  if (window.lucide) {
    window.lucide.createIcons({
      attrs: {
        'stroke-width': 2
      },
      nameAttr: 'data-lucide'
    });
  }
};

export default Button;
