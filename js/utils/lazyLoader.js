// Lazy Loading for Sections
// Dynamically imports sections to reduce initial bundle size

const sectionModules = {
  dashboard: () => import('./sections/Dashboard.js'),
  projects: () => import('./sections/Projects.js'),
  priorities: () => import('./sections/Priorities.js'),
  revenue: () => import('./sections/Revenue.js'),
  leads: () => import('./sections/Leads.js'),
  events: () => import('./sections/Events.js'),
  calendar: () => import('./sections/Calendar.js'),
  inventory: () => import('./sections/Inventory.js'),
  skus: () => import('./sections/SKUs.js'),
  timeline: () => import('./sections/Timeline.js'),
  review: () => import('./sections/Review.js'),
  docs: () => import('./sections/Docs.js'),
  notes: () => import('./sections/Notes.js'),
  settings: () => import('./sections/Settings.js')
}

// Cache for loaded sections
const loadedSections = new Map()

// Load a section dynamically
export async function loadSection(sectionName, containerId) {
  // Check if already loaded
  if (loadedSections.has(sectionName)) {
    return loadedSections.get(sectionName)
  }
  
  const loader = sectionModules[sectionName]
  if (!loader) {
    console.error(`Unknown section: ${sectionName}`)
    return null
  }
  
  try {
    // Show loading state
    const container = document.getElementById(containerId)
    if (container) {
      container.innerHTML = `
        <div class="section-loading">
          <div class="spinner"></div>
          <span>Loading ${sectionName}...</span>
        </div>
      `
    }
    
    // Dynamically import the section
    const module = await loader()
    const section = module[`create${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}Section`]
    
    if (!section) {
      throw new Error(`Section ${sectionName} not found in module`)
    }
    
    // Initialize the section
    const instance = section(containerId)
    loadedSections.set(sectionName, instance)
    
    return instance
  } catch (error) {
    console.error(`Failed to load section ${sectionName}:`, error)
    
    // Show error state
    const container = document.getElementById(containerId)
    if (container) {
      container.innerHTML = `
        <div class="section-error">
          <div class="error-icon">⚠️</div>
          <h3>Failed to load ${sectionName}</h3>
          <button class="btn btn-primary" onclick="loadSection('${sectionName}', '${containerId}')">
            🔄 Retry
          </button>
        </div>
      `
    }
    
    return null
  }
}

// Preload sections that might be visited soon
export function preloadSection(sectionName) {
  const loader = sectionModules[sectionName]
  if (loader && !loadedSections.has(sectionName)) {
    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        loader().catch(() => {}) // Silently fail preloads
      })
    } else {
      setTimeout(() => {
        loader().catch(() => {})
      }, 1000)
    }
  }
}

// Get loaded section instance
export function getSection(sectionName) {
  return loadedSections.get(sectionName)
}

// Check if section is loaded
export function isSectionLoaded(sectionName) {
  return loadedSections.has(sectionName)
}

// Clear loaded section (for memory management)
export function clearSection(sectionName) {
  loadedSections.delete(sectionName)
}

// Clear all sections
export function clearAllSections() {
  loadedSections.clear()
}
