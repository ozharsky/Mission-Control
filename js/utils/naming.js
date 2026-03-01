// Naming Consistency Utilities
// Centralizes naming conventions across the app

export const naming = {
  // Section names (UI display)
  sections: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    priorities: 'Priorities',
    revenue: 'Revenue',
    leads: 'Leads',
    events: 'Events',
    calendar: 'Calendar',
    inventory: 'Inventory',  // Changed from Printers
    skus: 'SKU Stock',       // Changed from SKUs
    timeline: 'Timeline',
    review: 'Review',
    docs: 'Documents',       // Changed from Docs
    notes: 'Notes',
    settings: 'Settings'
  },
  
  // Store keys (internal)
  storeKeys: {
    dashboard: 'dashboard',
    projects: 'projects',
    priorities: 'priorities',
    revenue: 'revenue',
    leads: 'leads',
    events: 'events',
    calendar: 'calendar',
    inventory: 'inventory',
    skus: 'skus',
    timeline: 'timeline',
    review: 'review',
    docs: 'docs',
    notes: 'notes',
    settings: 'settings'
  },
  
  // Route paths
  routes: {
    dashboard: '/dashboard',
    projects: '/projects',
    priorities: '/priorities',
    revenue: '/revenue',
    leads: '/leads',
    events: '/events',
    calendar: '/calendar',
    inventory: '/inventory',
    skus: '/skus',
    timeline: '/timeline',
    review: '/review',
    docs: '/docs',
    notes: '/notes',
    settings: '/settings'
  },
  
  // Get display name
  getDisplayName(key) {
    return this.sections[key] || key
  },
  
  // Get store key
  getStoreKey(displayName) {
    const entry = Object.entries(this.sections).find(([_, name]) => 
      name.toLowerCase() === displayName.toLowerCase()
    )
    return entry?.[0] || displayName.toLowerCase()
  },
  
  // Pluralization helpers
  pluralize(count, singular, plural) {
    return count === 1 ? singular : (plural || singular + 's')
  },
  
  // Format count with proper pluralization
  formatCount(count, type) {
    const labels = {
      priority: { singular: 'priority', plural: 'priorities' },
      project: { singular: 'project', plural: 'projects' },
      lead: { singular: 'lead', plural: 'leads' },
      event: { singular: 'event', plural: 'events' },
      sku: { singular: 'SKU', plural: 'SKUs' },
      doc: { singular: 'document', plural: 'documents' },
      note: { singular: 'note', plural: 'notes' }
    }
    
    const label = labels[type]
    if (!label) return `${count} ${type}`
    
    return `${count} ${count === 1 ? label.singular : label.plural}`
  }
}

// Export individual helpers
export const { getDisplayName, getStoreKey, pluralize, formatCount } = naming
