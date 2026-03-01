import { store } from '../state/store.js';

// Navigation items configuration
const navItems = [
  { id: 'dashboard', label: 'Home', icon: '🏠' },
  { id: 'projects', label: 'Projects', icon: '📋' },
  { id: 'priorities', label: 'Tasks', icon: '⭐' },
  { id: 'revenue', label: 'Revenue', icon: '💰' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'inventory', label: 'Printers', icon: '🖨️' },
  { id: 'docs', label: 'Docs', icon: '📁' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

// Primary items for bottom tab bar (first 5)
const primaryItems = navItems.slice(0, 5);

// Secondary items for grid menu (remaining 4)
const secondaryItems = navItems.slice(5);

export function createMobileNav() {
  let isMenuOpen = false;
  let currentView = 'dashboard';
  
  // Create container
  const container = document.createElement('div');
  container.id = 'mobileNav';
  container.className = 'mobile-nav-container';
  
  function render() {
    container.innerHTML = `
      <!-- Top Header -->
      <header class="mobile-header">
        <div class="mobile-header-logo">
          <div class="mobile-logo-icon">🚀</div>
          <span class="mobile-logo-text">Mission Control</span>
        </div>
        <button class="mobile-menu-toggle m-touch" aria-label="Toggle menu">
          ${isMenuOpen ? '✕' : '☰'}
        </button>
      </header>
      
      <!-- Grid Menu (shown when isMenuOpen is true) -->
      ${isMenuOpen ? `
        <div class="mobile-menu-overlay" id="mobileMenuOverlay"></div>
        <nav class="mobile-grid-menu">
          <div class="mobile-grid-items">
            ${navItems.map(item => `
              <button 
                class="mobile-grid-item m-touch ${currentView === item.id ? 'active' : ''}"
                data-view="${item.id}"
              >
                <span class="mobile-grid-icon">${item.icon}</span>
                <span class="mobile-grid-label">${item.label}</span>
              </button>
            `).join('')}
          </div>
        </nav>
      ` : ''}
      
      <!-- Bottom Tab Bar -->
      <nav class="mobile-bottom-tabs">
        ${primaryItems.map(item => `
          <button 
            class="mobile-tab-item m-touch ${currentView === item.id ? 'active' : ''}"
            data-view="${item.id}"
          >
            <span class="mobile-tab-icon">${item.icon}</span>
            <span class="mobile-tab-label">${item.label}</span>
          </button>
        `).join('')}
        <button class="mobile-tab-item m-touch" id="mobileMoreBtn">
          <span class="mobile-tab-icon">☰</span>
          <span class="mobile-tab-label">More</span>
        </button>
      </nav>
    `;
    
    attachListeners();
  }
  
  function attachListeners() {
    // Menu toggle button
    const toggleBtn = container.querySelector('.mobile-menu-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        render();
      });
    }
    
    // Overlay click to close
    const overlay = container.querySelector('#mobileMenuOverlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        isMenuOpen = false;
        render();
      });
    }
    
    // Grid menu items
    container.querySelectorAll('.mobile-grid-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const viewId = btn.dataset.view;
        navigateTo(viewId);
        isMenuOpen = false;
        render();
      });
    });
    
    // Bottom tab items
    container.querySelectorAll('.mobile-tab-item[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        const viewId = btn.dataset.view;
        navigateTo(viewId);
      });
    });
    
    // More button
    const moreBtn = container.querySelector('#mobileMoreBtn');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        render();
      });
    }
  }
  
  function navigateTo(viewId) {
    currentView = viewId;
    if (window.showSection) {
      window.showSection(viewId);
    }
    render();
  }
  
  // Subscribe to store changes
  store.subscribe((state) => {
    // Update if needed based on store changes
  });
  
  // Initial render
  render();
  
  return container;
}
