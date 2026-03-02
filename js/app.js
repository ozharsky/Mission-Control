// Mission Control V5 - Application Entry Point
// This file serves as the entry point and imports from main.js

// Import main.js which handles all the core initialization
import '../main.js';

// Import components for any additional initialization
import { createNavigation } from './components/Navigation.js';
import { createMobileNav } from './components/MobileNav.js';
import { Toast } from './components/Toast.js';

// Additional app-level initialization
document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Mission Control V5 entry point loaded');
  
  // Initialize Lucide icons after a short delay to ensure DOM is ready
  setTimeout(() => {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons({
        attrs: { 'stroke-width': 2 },
        nameAttr: 'data-lucide'
      });
    }
  }, 100);
});

// Export components for external use
export { createNavigation, createMobileNav, Toast };
