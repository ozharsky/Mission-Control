/**
 * Modal Component for Mission Control V5
 * Matches React app modal design system
 * 
 * Usage:
 * import { createModal, createModalHeader, createModalBody, createModalFooter } from './components/ui/Modal.js';
 * 
 * // Basic modal
 * createModal({
 *   id: 'myModal',
 *   header: createModalHeader({ title: 'New Item' }),
 *   body: createModalBody({ children: '<p>Content</p>' }),
 *   footer: createModalFooter({ actions: [...] }),
 *   onClose: 'closeMyModal()'
 * })
 * 
 * // Confirmation modal
 * createConfirmModal({
 *   title: 'Delete item?',
 *   message: 'This action cannot be undone.',
 *   confirmLabel: 'Delete',
 *   confirmVariant: 'destructive',
 *   onConfirm: 'handleDelete()'
 * })
 * 
 * // Bottom sheet (mobile)
 * createBottomSheet({
 *   children: '...',
 *   showHandle: true
 * })
 */

import { createButton, createButtonGroup } from './Button.js';

/**
 * Modal size styles mapping
 */
const MODAL_SIZES = {
  sm: 'm-modal-sm',
  md: 'm-modal-md',
  lg: 'm-modal-lg',
  xl: 'm-modal-xl',
  full: 'm-modal-full'
};

/**
 * Create a modal overlay and container
 * @param {Object} options - Modal configuration
 * @param {string} options.id - Modal ID
 * @param {string} options.header - Header HTML (use createModalHeader)
 * @param {string} options.body - Body HTML (use createModalBody)
 * @param {string} options.footer - Footer HTML (use createModalFooter)
 * @param {string} options.size - Modal size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.onClose - Close handler (string for inline)
 * @param {boolean} options.closeOnOverlayClick - Close when clicking overlay
 * @param {boolean} options.showCloseButton - Show close button in header
 * @param {boolean} options.isOpen - Whether modal is initially open
 * @returns {string} HTML string for the modal
 */
export function createModal({
  id,
  header,
  body,
  footer,
  size = 'md',
  className = '',
  onClose,
  closeOnOverlayClick = true,
  showCloseButton = true,
  isOpen = false
}) {
  const sizeClass = MODAL_SIZES[size] || MODAL_SIZES.md;
  const openClass = isOpen ? 'active' : '';
  const idAttr = id ? `id="${id}"` : '';
  
  // Build overlay click handler
  let overlayClick = '';
  if (closeOnOverlayClick && onClose) {
    overlayClick = `onclick="if(event.target === this) ${onClose}"`;
  }
  
  // Build close button
  let closeBtnHtml = '';
  if (showCloseButton && onClose) {
    closeBtnHtml = `
      <button class="m-modal-close m-touch" onclick="${onClose}" aria-label="Close modal">
        <i data-lucide="x" class="lucide-icon" width="20" height="20"></i>
      </button>
    `;
  }
  
  // Inject close button into header if provided
  let headerWithClose = header;
  if (header && showCloseButton) {
    headerWithClose = header.replace('</div>', `${closeBtnHtml}</div>`);
  } else if (!header && showCloseButton) {
    headerWithClose = `
      <div class="m-modal-header">
        ${closeBtnHtml}
      </div>
    `;
  }
  
  return `
    <div class="m-modal-overlay ${openClass} ${className}" 
         ${idAttr ? `${idAttr}-overlay` : ''}
         ${overlayClick}
         role="dialog"
         aria-modal="true">
      <div class="m-modal ${sizeClass}" ${idAttr}>
        ${headerWithClose || ''}
        ${body || ''}
        ${footer || ''}
      </div>
    </div>
  `;
}

/**
 * Create a modal header
 * @param {Object} options - Header configuration
 * @param {string} options.title - Modal title
 * @param {string} options.subtitle - Modal subtitle/description
 * @param {string} options.icon - Lucide icon name
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for the modal header
 */
export function createModalHeader({
  title,
  subtitle,
  icon,
  className = ''
}) {
  const iconHtml = icon ? `<i data-lucide="${icon}" class="lucide-icon m-modal-icon" width="20" height="20"></i>` : '';
  const subtitleHtml = subtitle ? `<p class="m-modal-subtitle">${subtitle}</p>` : '';
  
  return `
    <div class="m-modal-header ${className}">
      <div class="m-modal-header-content">
        ${iconHtml}
        <div>
          <h2 class="m-modal-title">${title || ''}</h2>
          ${subtitleHtml}
        </div>
      </div>
      <!-- Close button will be injected here -->
    </div>
  `;
}

/**
 * Create a modal body
 * @param {Object} options - Body configuration
 * @param {string} options.children - Body content HTML
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for the modal body
 */
export function createModalBody({
  children,
  className = ''
}) {
  return `
    <div class="m-modal-body ${className}">
      ${children || ''}
    </div>
  `;
}

/**
 * Create a modal footer with action buttons
 * @param {Object} options - Footer configuration
 * @param {Array} options.actions - Array of button configurations
 * @param {string} options.className - Additional CSS classes
 * @returns {string} HTML string for the modal footer
 */
export function createModalFooter({
  actions = [],
  className = ''
}) {
  if (!actions.length) return '';
  
  const buttonsHtml = actions.map(action => createButton(action)).join('');
  
  return `
    <div class="m-modal-footer ${className}">
      ${buttonsHtml}
    </div>
  `;
}

/**
 * Create a confirmation modal
 * @param {Object} options - Confirmation modal configuration
 * @param {string} options.id - Modal ID
 * @param {string} options.title - Modal title
 * @param {string} options.message - Confirmation message
 * @param {string} options.icon - Lucide icon name (default: 'alert-triangle')
 * @param {string} options.confirmLabel - Confirm button label (default: 'Confirm')
 * @param {string} options.cancelLabel - Cancel button label (default: 'Cancel')
 * @param {string} options.confirmVariant - Confirm button variant (default: 'primary')
 * @param {string} options.onConfirm - Confirm handler
 * @param {string} options.onCancel - Cancel handler
 * @returns {string} HTML string for the confirmation modal
 */
export function createConfirmModal({
  id,
  title = 'Are you sure?',
  message,
  icon = 'alert-triangle',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel
}) {
  const bodyContent = `
    <div class="m-modal-confirm">
      <div class="m-modal-confirm-icon ${confirmVariant === 'destructive' ? 'danger' : ''}">
        <i data-lucide="${icon}" class="lucide-icon" width="32" height="32"></i>
      </div>
      <h3 class="m-modal-confirm-title">${title}</h3>
      ${message ? `<p class="m-modal-confirm-message">${message}</p>` : ''}
    </div>
  `;
  
  return createModal({
    id,
    size: 'sm',
    header: '', // No header for confirm modal
    body: createModalBody({ children: bodyContent }),
    footer: createModalFooter({
      actions: [
        {
          label: cancelLabel,
          variant: 'secondary',
          onClick: onCancel
        },
        {
          label: confirmLabel,
          variant: confirmVariant,
          onClick: onConfirm
        }
      ]
    }),
    onClose: onCancel,
    showCloseButton: false
  });
}

/**
 * Create a bottom sheet (mobile-optimized modal)
 * @param {Object} options - Bottom sheet configuration
 * @param {string} options.id - Bottom sheet ID
 * @param {string} options.children - Content HTML
 * @param {string} options.title - Title (optional)
 * @param {boolean} options.showHandle - Show drag handle
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.onClose - Close handler
 * @returns {string} HTML string for the bottom sheet
 */
export function createBottomSheet({
  id,
  children,
  title,
  showHandle = true,
  className = '',
  onClose
}) {
  const idAttr = id ? `id="${id}"` : '';
  const handleHtml = showHandle ? '<div class="m-bottom-sheet-handle"></div>' : '';
  const titleHtml = title ? `<h3 class="m-bottom-sheet-title">${title}</h3>` : '';
  
  let overlayClick = '';
  if (onClose) {
    overlayClick = `onclick="if(event.target === this) ${onClose}"`;
  }
  
  return `
    <div class="m-bottom-sheet-overlay" ${idAttr ? `${idAttr}-overlay` : ''} ${overlayClick}>
      <div class="m-bottom-sheet ${className}" ${idAttr}>
        ${handleHtml}
        ${titleHtml}
        <div class="m-bottom-sheet-content">
          ${children || ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Open a modal by ID
 * @param {string} id - Modal ID
 */
export function openModal(id) {
  const overlay = document.getElementById(`${id}-overlay`) || document.getElementById(id);
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons({
        attrs: { 'stroke-width': 2 },
        nameAttr: 'data-lucide'
      });
    }
  }
}

/**
 * Close a modal by ID
 * @param {string} id - Modal ID
 */
export function closeModal(id) {
  const overlay = document.getElementById(`${id}-overlay`) || document.getElementById(id);
  if (overlay) {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Initialize modals in a container
 * @param {HTMLElement} container - Container element
 */
export function initModals(container = document) {
  // Initialize Lucide icons if available
  if (typeof lucide !== 'undefined') {
    lucide.createIcons({
      attrs: { 'stroke-width': 2 },
      nameAttr: 'data-lucide'
    });
  }
  
  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = container.querySelector('.m-modal-overlay.active');
      if (openModal) {
        openModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });
}

// Expose globally for inline handlers
window.openModal = openModal;
window.closeModal = closeModal;
