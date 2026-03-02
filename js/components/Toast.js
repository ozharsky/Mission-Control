/**
 * Toast Component
 * Toast notification system with success, error, info, and warning methods
 * 
 * Usage:
 *   // Show a success toast
 *   Toast.success('Operation completed successfully');
 *   
 *   // Show an error toast
 *   Toast.error('Something went wrong');
 *   
 *   // Show an info toast
 *   Toast.info('New update available');
 *   
 *   // Show a warning toast
 *   Toast.warning('Please check your settings');
 */

/**
 * Toast configuration
 */
const TOAST_CONFIG = {
  duration: 3000, // Auto-dismiss after 3 seconds
  maxToasts: 3    // Maximum concurrent toasts
};

/**
 * Toast type configurations
 */
const TOAST_TYPES = {
  success: {
    icon: 'check-circle',
    color: 'var(--color-success)',
    bgColor: 'var(--color-success-light)'
  },
  error: {
    icon: 'alert-circle',
    color: 'var(--color-danger)',
    bgColor: 'var(--color-danger-light)'
  },
  info: {
    icon: 'info',
    color: 'var(--color-info)',
    bgColor: 'var(--color-info-light)'
  },
  warning: {
    icon: 'alert-triangle',
    color: 'var(--color-warning)',
    bgColor: 'var(--color-warning-light)'
  }
};

/**
 * Toast manager class
 */
class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.init();
  }

  /**
   * Initialize the toast container
   */
  init() {
    if (typeof document === 'undefined') return;
    
    // Create container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('role', 'region');
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-label', 'Toast notifications');
      document.body.appendChild(this.container);
    }
  }

  /**
   * Create Lucide icon element
   * @param {string} name - Lucide icon name
   * @returns {HTMLElement} Icon element
   */
  createIcon(name) {
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', name);
    icon.style.width = '20px';
    icon.style.height = '20px';
    return icon;
  }

  /**
   * Show a toast notification
   * @param {string} message - Toast message
   * @param {string} type - Toast type (success, error, info, warning)
   * @param {number} [duration] - Duration in milliseconds
   * @returns {string} Toast ID
   */
  show(message, type = 'info', duration = TOAST_CONFIG.duration) {
    if (typeof document === 'undefined') return null;

    // Limit max toasts
    if (this.toasts.size >= TOAST_CONFIG.maxToasts) {
      const oldestId = this.toasts.keys().next().value;
      this.dismiss(oldestId);
    }

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const config = TOAST_TYPES[type] || TOAST_TYPES.info;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.id = id;
    toast.setAttribute('role', 'alert');

    // Icon
    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'toast__icon';
    iconWrapper.style.color = config.color;
    iconWrapper.appendChild(this.createIcon(config.icon));

    // Content
    const content = document.createElement('div');
    content.className = 'toast__content';

    const messageEl = document.createElement('p');
    messageEl.className = 'toast__message';
    messageEl.textContent = message;
    content.appendChild(messageEl);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast__close';
    closeBtn.setAttribute('aria-label', 'Close notification');
    closeBtn.appendChild(this.createIcon('x'));
    closeBtn.addEventListener('click', () => this.dismiss(id));

    // Assemble toast
    toast.appendChild(iconWrapper);
    toast.appendChild(content);
    toast.appendChild(closeBtn);

    // Add to container
    this.container.appendChild(toast);
    this.toasts.set(id, toast);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    // Initialize Lucide icons if available
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons({
        attrs: { 'stroke-width': 2 },
        nameAttr: 'data-lucide'
      });
    }

    return id;
  }

  /**
   * Dismiss a toast by ID
   * @param {string} id - Toast ID
   */
  dismiss(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.classList.add('toast--exiting');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(id);
    }, 200);
  }

  /**
   * Clear all toasts
   */
  clearAll() {
    this.toasts.forEach((_, id) => this.dismiss(id));
  }

  /**
   * Show a success toast
   * @param {string} message - Success message
   * @param {number} [duration] - Duration in milliseconds
   * @returns {string} Toast ID
   */
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  /**
   * Show an error toast
   * @param {string} message - Error message
   * @param {number} [duration] - Duration in milliseconds
   * @returns {string} Toast ID
   */
  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  /**
   * Show an info toast
   * @param {string} message - Info message
   * @param {number} [duration] - Duration in milliseconds
   * @returns {string} Toast ID
   */
  info(message, duration) {
    return this.show(message, 'info', duration);
  }

  /**
   * Show a warning toast
   * @param {string} message - Warning message
   * @param {number} [duration] - Duration in milliseconds
   * @returns {string} Toast ID
   */
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }
}

// Create singleton instance
const Toast = new ToastManager();

export { Toast };
export default Toast;
