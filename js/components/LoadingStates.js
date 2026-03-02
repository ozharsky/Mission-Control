/**
 * LoadingStates.js - Loading state components for Mission Control V5
 * Provides skeleton loaders, spinners, and progress indicators
 */

/**
 * SkeletonCard - Card placeholder with shimmer effect
 * @param {Object} options - Configuration options
 * @param {string} options.className - Additional CSS classes
 * @param {boolean} options.hasImage - Whether to show image placeholder
 * @param {boolean} options.hasFooter - Whether to show footer placeholder
 * @returns {HTMLElement} Skeleton card element
 */
export function SkeletonCard(options = {}) {
  const { className = '', hasImage = true, hasFooter = true } = options;
  
  const card = document.createElement('div');
  card.className = `card skeleton-card ${className}`;
  
  let html = '';
  
  // Header
  html += `
    <div class="card__header">
      <div class="skeleton skeleton--title" style="width: 60%; height: 24px;"></div>
      <div class="skeleton skeleton--circle" style="width: 24px; height: 24px;"></div>
    </div>
  `;
  
  // Body
  html += '<div class="card__body">';
  
  if (hasImage) {
    html += '<div class="skeleton skeleton--image" style="width: 100%; height: 150px; margin-bottom: 16px;"></div>';
  }
  
  html += `
    <div class="skeleton skeleton--text" style="width: 100%;"></div>
    <div class="skeleton skeleton--text" style="width: 90%;"></div>
    <div class="skeleton skeleton--text" style="width: 75%;"></div>
  `;
  
  html += '</div>';
  
  // Footer
  if (hasFooter) {
    html += `
      <div class="card__footer">
        <div class="skeleton skeleton--button" style="width: 80px; height: 36px;"></div>
        <div class="skeleton skeleton--button" style="width: 100px; height: 36px;"></div>
      </div>
    `;
  }
  
  card.innerHTML = html;
  return card;
}

/**
 * SkeletonList - List of skeleton items
 * @param {Object} options - Configuration options
 * @param {number} options.count - Number of items to render
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.itemType - Type of list item ('default', 'compact', 'detailed')
 * @returns {HTMLElement} Skeleton list element
 */
export function SkeletonList(options = {}) {
  const { count = 5, className = '', itemType = 'default' } = options;
  
  const list = document.createElement('div');
  list.className = `skeleton-list ${className}`;
  
  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.className = 'skeleton-list-item';
    item.style.animationDelay = `${i * 50}ms`;
    
    if (itemType === 'compact') {
      item.innerHTML = `
        <div class="skeleton-list-item__compact">
          <div class="skeleton skeleton--circle" style="width: 32px; height: 32px; flex-shrink: 0;"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton--text" style="width: 70%; height: 14px; margin-bottom: 4px;"></div>
            <div class="skeleton skeleton--text" style="width: 40%; height: 12px;"></div>
          </div>
        </div>
      `;
    } else if (itemType === 'detailed') {
      item.innerHTML = `
        <div class="skeleton-list-item__detailed">
          <div class="skeleton skeleton--title" style="width: 80%; height: 18px; margin-bottom: 8px;"></div>
          <div class="skeleton skeleton--text" style="width: 100%; height: 14px; margin-bottom: 4px;"></div>
          <div class="skeleton skeleton--text" style="width: 60%; height: 14px; margin-bottom: 8px;"></div>
          <div style="display: flex; gap: 8px;">
            <div class="skeleton" style="width: 60px; height: 20px; border-radius: 9999px;"></div>
            <div class="skeleton" style="width: 80px; height: 20px; border-radius: 9999px;"></div>
          </div>
        </div>
      `;
    } else {
      // Default
      item.innerHTML = `
        <div class="skeleton-list-item__default">
          <div class="skeleton skeleton--circle" style="width: 40px; height: 40px; flex-shrink: 0;"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton--text" style="width: 60%; height: 16px; margin-bottom: 8px;"></div>
            <div class="skeleton skeleton--text" style="width: 80%; height: 14px;"></div>
          </div>
          <div class="skeleton" style="width: 60px; height: 24px; border-radius: 4px; flex-shrink: 0;"></div>
        </div>
      `;
    }
    
    list.appendChild(item);
  }
  
  return list;
}

/**
 * SkeletonText - Text line placeholder
 * @param {Object} options - Configuration options
 * @param {number} options.lines - Number of lines
 * @param {string} options.className - Additional CSS classes
 * @param {Array<number>} options.widths - Array of widths for each line (percentage)
 * @returns {HTMLElement} Skeleton text element
 */
export function SkeletonText(options = {}) {
  const { lines = 3, className = '', widths = [] } = options;
  
  const container = document.createElement('div');
  container.className = `skeleton-text ${className}`;
  
  for (let i = 0; i < lines; i++) {
    const line = document.createElement('div');
    line.className = 'skeleton skeleton--text';
    
    // Use provided width or default pattern
    const width = widths[i] || (i === lines - 1 ? 75 : 100);
    line.style.width = `${width}%`;
    line.style.height = '1em';
    line.style.marginBottom = i < lines - 1 ? '0.5em' : '0';
    
    container.appendChild(line);
  }
  
  return container;
}

/**
 * LoadingSpinner - Circular loading spinner
 * @param {Object} options - Configuration options
 * @param {string} options.size - Size variant ('sm', 'md', 'lg')
 * @param {string} options.variant - Color variant ('primary', 'success', 'danger', 'neutral')
 * @param {string} options.className - Additional CSS classes
 * @returns {HTMLElement} Loading spinner element
 */
export function LoadingSpinner(options = {}) {
  const { size = 'md', variant = 'primary', className = '' } = options;
  
  const spinner = document.createElement('div');
  spinner.className = `loading-spinner loading-spinner--${size} loading-spinner--${variant} ${className}`;
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', 'Loading');
  
  const circle = document.createElement('div');
  circle.className = 'loading-spinner__circle';
  
  spinner.appendChild(circle);
  
  return spinner;
}

/**
 * ProgressBar - Linear progress indicator
 * @param {Object} options - Configuration options
 * @param {number} options.progress - Progress value (0-100)
 * @param {string} options.size - Size variant ('sm', 'md', 'lg')
 * @param {boolean} options.indeterminate - Whether to show indeterminate animation
 * @param {string} options.className - Additional CSS classes
 * @returns {HTMLElement} Progress bar element
 */
export function ProgressBar(options = {}) {
  const { progress = 0, size = 'md', indeterminate = false, className = '' } = options;
  
  const container = document.createElement('div');
  container.className = `progress-bar progress-bar--${size} ${indeterminate ? 'progress-bar--indeterminate' : ''} ${className}`;
  container.setAttribute('role', 'progressbar');
  container.setAttribute('aria-valuemin', '0');
  container.setAttribute('aria-valuemax', '100');
  container.setAttribute('aria-valuenow', indeterminate ? '' : progress.toString());
  
  const fill = document.createElement('div');
  fill.className = 'progress-bar__fill';
  fill.style.width = indeterminate ? '50%' : `${progress}%`;
  
  container.appendChild(fill);
  
  return container;
}

/**
 * Update progress bar value
 * @param {HTMLElement} progressBar - Progress bar element
 * @param {number} value - New progress value (0-100)
 */
export function updateProgressBar(progressBar, value) {
  if (!progressBar) return;
  
  const fill = progressBar.querySelector('.progress-bar__fill');
  if (fill) {
    fill.style.width = `${Math.max(0, Math.min(100, value))}%`;
  }
  
  progressBar.setAttribute('aria-valuenow', value.toString());
}

/**
 * SkeletonGrid - Grid of skeleton cards
 * @param {Object} options - Configuration options
 * @param {number} options.columns - Number of columns
 * @param {number} options.rows - Number of rows
 * @param {string} options.className - Additional CSS classes
 * @returns {HTMLElement} Skeleton grid element
 */
export function SkeletonGrid(options = {}) {
  const { columns = 3, rows = 2, className = '' } = options;
  
  const grid = document.createElement('div');
  grid.className = `skeleton-grid grid grid--${columns} ${className}`;
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  grid.style.gap = 'var(--space-4)';
  
  for (let i = 0; i < columns * rows; i++) {
    const card = SkeletonCard({ hasImage: true, hasFooter: false });
    card.style.animationDelay = `${i * 50}ms`;
    grid.appendChild(card);
  }
  
  return grid;
}

/**
 * SkeletonTable - Table placeholder with rows
 * @param {Object} options - Configuration options
 * @param {number} options.rows - Number of rows
 * @param {number} options.columns - Number of columns
 * @param {boolean} options.hasHeader - Whether to show header row
 * @param {string} options.className - Additional CSS classes
 * @returns {HTMLElement} Skeleton table element
 */
export function SkeletonTable(options = {}) {
  const { rows = 5, columns = 4, hasHeader = true, className = '' } = options;
  
  const table = document.createElement('div');
  table.className = `skeleton-table ${className}`;
  table.style.width = '100%';
  
  let html = '';
  
  // Header
  if (hasHeader) {
    html += '<div class="skeleton-table-header" style="display: grid; grid-template-columns: repeat(' + columns + ', 1fr); gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--color-border);">';
    for (let i = 0; i < columns; i++) {
      html += `<div class="skeleton" style="height: 16px; width: ${60 + Math.random() * 30}%;"></div>`;
    }
    html += '</div>';
  }
  
  // Rows
  html += '<div class="skeleton-table-body">';
  for (let i = 0; i < rows; i++) {
    html += `<div class="skeleton-table-row" style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--color-border); animation-delay: ${i * 50}ms;">`;
    for (let j = 0; j < columns; j++) {
      html += `<div class="skeleton" style="height: 14px; width: ${50 + Math.random() * 40}%;"></div>`;
    }
    html += '</div>';
  }
  html += '</div>';
  
  table.innerHTML = html;
  return table;
}

/**
 * LoadingOverlay - Full-screen loading overlay
 * @param {Object} options - Configuration options
 * @param {string} options.message - Loading message
 * @param {string} options.className - Additional CSS classes
 * @returns {HTMLElement} Loading overlay element
 */
export function LoadingOverlay(options = {}) {
  const { message = 'Loading...', className = '' } = options;
  
  const overlay = document.createElement('div');
  overlay.className = `loading-overlay ${className}`;
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background-color: rgba(15, 15, 26, 0.8);
    backdrop-filter: blur(4px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 9999;
    animation: fadeIn 200ms ease;
  `;
  
  const spinner = LoadingSpinner({ size: 'lg', variant: 'primary' });
  
  const text = document.createElement('p');
  text.className = 'loading-overlay__message';
  text.textContent = message;
  text.style.cssText = `
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
    margin: 0;
  `;
  
  overlay.appendChild(spinner);
  overlay.appendChild(text);
  
  return overlay;
}

/**
 * InlineLoader - Inline loading indicator for buttons/forms
 * @param {Object} options - Configuration options
 * @param {string} options.text - Loading text
 * @param {string} options.size - Size variant ('sm', 'md')
 * @returns {HTMLElement} Inline loader element
 */
export function InlineLoader(options = {}) {
  const { text = 'Loading...', size = 'md' } = options;
  
  const loader = document.createElement('span');
  loader.className = `inline-loader inline-loader--${size}`;
  loader.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: inherit;
  `;
  
  const spinner = LoadingSpinner({ size: size === 'sm' ? 'sm' : 'md', variant: 'neutral' });
  spinner.style.cssText = `
    width: ${size === 'sm' ? '14px' : '18px'};
    height: ${size === 'sm' ? '14px' : '18px'};
  `;
  
  const textSpan = document.createElement('span');
  textSpan.textContent = text;
  
  loader.appendChild(spinner);
  loader.appendChild(textSpan);
  
  return loader;
}

/**
 * ContentLoader - Wrapper that shows skeleton while loading
 * @param {HTMLElement} container - Container element
 * @param {string} type - Loader type ('card', 'list', 'text', 'grid')
 * @param {Object} options - Loader options
 */
export function showContentLoader(container, type = 'card', options = {}) {
  if (!container) return;
  
  // Store original content
  container.dataset.originalContent = container.innerHTML;
  
  let loader;
  switch (type) {
    case 'list':
      loader = SkeletonList(options);
      break;
    case 'text':
      loader = SkeletonText(options);
      break;
    case 'grid':
      loader = SkeletonGrid(options);
      break;
    case 'table':
      loader = SkeletonTable(options);
      break;
    case 'card':
    default:
      loader = SkeletonCard(options);
      break;
  }
  
  container.innerHTML = '';
  container.appendChild(loader);
  container.classList.add('is-loading');
}

/**
 * Hide content loader and restore original content
 * @param {HTMLElement} container - Container element
 */
export function hideContentLoader(container) {
  if (!container) return;
  
  container.classList.remove('is-loading');
  
  if (container.dataset.originalContent) {
    container.innerHTML = container.dataset.originalContent;
    delete container.dataset.originalContent;
  }
}

/**
 * Button loading state
 * @param {HTMLButtonElement} button - Button element
 * @param {boolean} isLoading - Whether button is loading
 * @param {string} loadingText - Text to show while loading
 */
export function setButtonLoading(button, isLoading, loadingText = '') {
  if (!button) return;
  
  if (isLoading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.classList.add('btn--loading');
    
    if (loadingText) {
      button.innerHTML = `<span class="btn__loader"></span>${loadingText}`;
    }
  } else {
    button.disabled = false;
    button.classList.remove('btn--loading');
    
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  }
}

// Export all components
export default {
  SkeletonCard,
  SkeletonList,
  SkeletonText,
  SkeletonGrid,
  SkeletonTable,
  LoadingSpinner,
  ProgressBar,
  updateProgressBar,
  LoadingOverlay,
  InlineLoader,
  showContentLoader,
  hideContentLoader,
  setButtonLoading
};

// Convenience wrapper object for backward compatibility
export const loadingStates = {
  showOverlay: LoadingOverlay,
  showInline: InlineLoader,
  showButtonLoading: setButtonLoading,
  updateProgress: updateProgressBar,
  showContent: showContentLoader,
  hideContent: hideContentLoader,
  SkeletonCard,
  SkeletonList,
  SkeletonText,
  SkeletonGrid,
  SkeletonTable,
  LoadingSpinner,
  ProgressBar,
  LoadingOverlay,
  InlineLoader
};
