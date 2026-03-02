/**
 * Navigation Component
 * Responsive navigation with sidebar (desktop) and bottom nav (mobile) modes
 * 
 * Usage:
 *   Navigation({
 *     items: [
 *       { id: 'dashboard', label: 'Dashboard', icon: 'home', active: true },
 *       { id: 'printers', label: 'Printers', icon: 'printer', active: false }
 *     ],
 *     mode: 'sidebar', // 'sidebar' | 'bottom'
 *     onNavigate: (itemId) => {}
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
 * Navigation component
 * @param {Object} props - Navigation properties
 * @param {Array} props.items - Navigation items array [{id, label, icon, active}]
 * @param {string} props.mode - Navigation mode ('sidebar' or 'bottom')
 * @param {Function} props.onNavigate - Click handler for navigation items
 * @param {string} [props.className] - Additional CSS classes
 * @returns {HTMLElement} Navigation element
 */
export const Navigation = ({
  items = [],
  mode = 'sidebar',
  onNavigate,
  className = ''
}) => {
  if (mode === 'bottom') {
    return createBottomNav({ items, onNavigate, className });
  }
  return createSidebar({ items, onNavigate, className });
};

/**
 * Create sidebar navigation (desktop)
 * @param {Object} props - Sidebar properties
 * @returns {HTMLElement} Sidebar element
 */
function createSidebar({ items, onNavigate, className }) {
  const sidebar = document.createElement('nav');
  sidebar.className = ['sidebar', className].filter(Boolean).join(' ');
  sidebar.setAttribute('role', 'navigation');
  sidebar.setAttribute('aria-label', 'Main navigation');
  
  // Create nav list
  const navList = document.createElement('ul');
  navList.className = 'nav-list';
  
  items.forEach(item => {
    const navItem = createNavItem(item, onNavigate, 'sidebar');
    navList.appendChild(navItem);
  });
  
  sidebar.appendChild(navList);
  return sidebar;
}

/**
 * Create bottom navigation (mobile)
 * @param {Object} props - Bottom nav properties
 * @returns {HTMLElement} Bottom nav element
 */
function createBottomNav({ items, onNavigate, className }) {
  const bottomNav = document.createElement('nav');
  bottomNav.className = ['bottom-nav', className].filter(Boolean).join(' ');
  bottomNav.setAttribute('role', 'navigation');
  bottomNav.setAttribute('aria-label', 'Main navigation');
  
  // Ensure fixed 70px height
  bottomNav.style.height = '70px';
  bottomNav.style.minHeight = '70px';
  
  items.forEach(item => {
    const navItem = createNavItem(item, onNavigate, 'bottom');
    bottomNav.appendChild(navItem);
  });
  
  return bottomNav;
}

/**
 * Create a navigation item
 * @param {Object} item - Navigation item data
 * @param {Function} onNavigate - Click handler
 * @param {string} mode - 'sidebar' or 'bottom'
 * @returns {HTMLElement} Nav item element
 */
function createNavItem(item, onNavigate, mode) {
  const isSidebar = mode === 'sidebar';
  
  const button = document.createElement('button');
  button.className = [
    isSidebar ? 'nav-item' : 'bottom-nav__item',
    item.active ? (isSidebar ? 'nav-item--active' : 'bottom-nav__item--active') : ''
  ].filter(Boolean).join(' ');
  
  button.setAttribute('data-nav-id', item.id);
  button.setAttribute('aria-current', item.active ? 'page' : 'false');
  
  // Add touch feedback for mobile
  if (!isSidebar) {
    button.addEventListener('touchstart', () => {
      button.style.transform = 'scale(0.95)';
    }, { passive: true });
    
    button.addEventListener('touchend', () => {
      button.style.transform = '';
    }, { passive: true });
    
    button.addEventListener('touchcancel', () => {
      button.style.transform = '';
    }, { passive: true });
  }
  
  // Icon
  if (item.icon) {
    const iconEl = createIcon(item.icon);
    iconEl.style.width = isSidebar ? '20px' : '24px';
    iconEl.style.height = isSidebar ? '20px' : '24px';
    button.appendChild(iconEl);
  }
  
  // Label
  const label = document.createElement('span');
  label.textContent = item.label;
  button.appendChild(label);
  
  // Click handler with smooth transition
  if (onNavigate && !item.disabled) {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Add active state immediately for better UX
      if (!isSidebar) {
        const parent = button.parentElement;
        if (parent) {
          parent.querySelectorAll('.bottom-nav__item').forEach(el => {
            el.classList.remove('bottom-nav__item--active');
            el.setAttribute('aria-current', 'false');
          });
        }
        button.classList.add('bottom-nav__item--active');
        button.setAttribute('aria-current', 'page');
      }
      
      // Small delay for visual feedback before navigation
      requestAnimationFrame(() => {
        onNavigate(item.id);
      });
    });
  }
  
  if (isSidebar) {
    const li = document.createElement('li');
    li.appendChild(button);
    return li;
  }
  
  return button;
}

/**
 * Update active navigation item
 * @param {HTMLElement} navElement - Navigation element
 * @param {string} activeId - ID of active item
 * @param {string} mode - 'sidebar' or 'bottom'
 */
export function updateActiveNavItem(navElement, activeId, mode) {
  const isSidebar = mode === 'sidebar';
  const selector = isSidebar ? '.nav-item' : '.bottom-nav__item';
  const activeClass = isSidebar ? 'nav-item--active' : 'bottom-nav__item--active';
  
  navElement.querySelectorAll(selector).forEach(item => {
    const itemId = item.getAttribute('data-nav-id');
    if (itemId === activeId) {
      item.classList.add(activeClass);
      item.setAttribute('aria-current', 'page');
    } else {
      item.classList.remove(activeClass);
      item.setAttribute('aria-current', 'false');
    }
  });
}

/**
 * Handle keyboard appearance (resize events)
 * Hides bottom nav when virtual keyboard is likely open
 */
export function initKeyboardHandling() {
  const bottomNav = document.querySelector('.bottom-nav');
  if (!bottomNav) return;
  
  let initialWindowHeight = window.innerHeight;
  
  // Store initial height
  window.addEventListener('resize', () => {
    const currentHeight = window.innerHeight;
    const heightDiff = initialWindowHeight - currentHeight;
    
    // If height decreased significantly (keyboard opened)
    if (heightDiff > 150) {
      bottomNav.style.transform = 'translateY(100%)';
      bottomNav.style.transition = 'transform 200ms ease';
    } else {
      bottomNav.style.transform = '';
    }
  });
  
  // Reset on orientation change
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      initialWindowHeight = window.innerHeight;
      bottomNav.style.transform = '';
    }, 300);
  });
}

/**
 * Initialize smooth transitions between views
 * Adds CSS class for view transitions
 */
export function initViewTransitions() {
  // Add transition class to main content
  const mainContent = document.querySelector('.main__content');
  if (mainContent) {
    mainContent.classList.add('view-transition');
  }
  
  // Intercept navigation for smooth transitions
  document.addEventListener('navigate', (e) => {
    const mainContent = document.querySelector('.main__content');
    if (mainContent) {
      mainContent.style.opacity = '0';
      mainContent.style.transform = 'translateY(8px)';
      
      setTimeout(() => {
        mainContent.style.opacity = '';
        mainContent.style.transform = '';
      }, 200);
    }
  });
}

/**
 * Sidebar navigation variant
 * @param {Object} props - Sidebar properties
 * @param {Array} props.items - Navigation items
 * @param {Function} props.onNavigate - Click handler
 * @param {string} [props.className] - Additional CSS classes
 * @returns {HTMLElement} Sidebar element
 */
export const Sidebar = ({
  items = [],
  onNavigate,
  className = ''
}) => {
  return createSidebar({ items, onNavigate, className });
};

/**
 * Bottom navigation variant
 * @param {Object} props - Bottom nav properties
 * @param {Array} props.items - Navigation items
 * @param {Function} props.onNavigate - Click handler
 * @param {string} [props.className] - Additional CSS classes
 * @returns {HTMLElement} Bottom nav element
 */
export const BottomNav = ({
  items = [],
  onNavigate,
  className = ''
}) => {
  return createBottomNav({ items, onNavigate, className });
};

/**
 * Create mobile navigation with "More" menu
 * @param {Object} props - Navigation properties
 * @param {Array} props.primaryItems - Primary items (shown in bottom nav)
 * @param {Array} props.moreItems - Additional items (shown in "More" sheet)
 * @param {Function} props.onNavigate - Click handler
 * @returns {Object} Object with primary nav and more sheet
 */
export const MobileNavWithMore = ({
  primaryItems = [],
  moreItems = [],
  onNavigate
}) => {
  // Create primary bottom nav
  const bottomNav = createBottomNav({
    items: primaryItems,
    onNavigate: (id) => {
      if (id === 'more') {
        toggleMoreSheet();
      } else if (onNavigate) {
        onNavigate(id);
      }
    }
  });
  
  // Create "More" sheet
  const moreSheet = document.createElement('div');
  moreSheet.className = 'more-sheet';
  moreSheet.style.cssText = `
    position: fixed;
    bottom: 70px;
    left: 0;
    right: 0;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    padding: var(--space-4);
    padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom, 0));
    transform: translateY(100%);
    transition: transform 300ms ease-out;
    z-index: 99;
    box-shadow: var(--shadow-lg);
  `;
  
  // Add more items
  const moreList = document.createElement('div');
  moreList.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
  `;
  
  moreItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'more-sheet-item';
    btn.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--color-surface-hover);
      border: none;
      border-radius: var(--radius-md);
      color: var(--color-text);
      cursor: pointer;
      min-height: 44px;
    `;
    
    const icon = createIcon(item.icon);
    icon.style.width = '24px';
    icon.style.height = '24px';
    
    const label = document.createElement('span');
    label.textContent = item.label;
    label.style.fontSize = 'var(--font-size-xs)';
    
    btn.appendChild(icon);
    btn.appendChild(label);
    
    btn.addEventListener('click', () => {
      toggleMoreSheet();
      if (onNavigate) onNavigate(item.id);
    });
    
    moreList.appendChild(btn);
  });
  
  moreSheet.appendChild(moreList);
  
  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'more-sheet-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    visibility: hidden;
    transition: opacity 300ms ease, visibility 300ms ease;
    z-index: 98;
  `;
  
  overlay.addEventListener('click', toggleMoreSheet);
  
  let isOpen = false;
  
  function toggleMoreSheet() {
    isOpen = !isOpen;
    if (isOpen) {
      moreSheet.style.transform = 'translateY(0)';
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
    } else {
      moreSheet.style.transform = 'translateY(100%)';
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
    }
  }
  
  return {
    bottomNav,
    moreSheet,
    overlay,
    toggleMoreSheet
  };
};

export default Navigation;
