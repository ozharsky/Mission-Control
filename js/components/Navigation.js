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
  
  // Click handler
  if (onNavigate && !item.disabled) {
    button.addEventListener('click', () => onNavigate(item.id));
  }
  
  if (isSidebar) {
    const li = document.createElement('li');
    li.appendChild(button);
    return li;
  }
  
  return button;
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

export default Navigation;
