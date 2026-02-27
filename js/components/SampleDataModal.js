import { store } from '../state/store.js'
import { toast } from './Toast.js'

const SAMPLE_DATA = {
  priorities: [
    { text: 'Optimize Etsy listings for SEO', tags: ['etsy', 'seo'], dueDate: '2026-03-01', priority: 'high' },
    { text: 'Create product photography for new items', tags: ['photo', 'etsy'], dueDate: '2026-03-05', priority: 'medium' },
    { text: 'Research wholesale packaging options', tags: ['b2b', 'research'], dueDate: '2026-03-10', priority: 'low' },
    { text: 'Update inventory spreadsheet', tags: ['operations'], dueDate: '2026-02-28', priority: 'medium' },
    { text: 'Design new product bundle', tags: ['product', 'design'], dueDate: '2026-03-15', priority: 'high' }
  ],
  projects: [
    { title: 'Etsy Shop Optimization', desc: 'Improve SEO and conversion rates', status: 'inprogress', priority: 'high' },
    { title: 'Photography Portfolio Update', desc: 'Add new cannabis event photos', status: 'backlog', priority: 'medium' },
    { title: 'B2B Wholesale Launch', desc: 'Create wholesale pricing and outreach', status: 'todo', priority: 'high' },
    { title: 'New Product Line', desc: 'Design and prototype new accessories', status: 'backlog', priority: 'medium' }
  ]
}

export function createSampleDataModal() {
  const existing = document.getElementById('sampleDataModal')
  if (existing) existing.remove()
  
  const modal = document.createElement('div')
  modal.id = 'sampleDataModal'
  modal.className = 'modal-overlay active'
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">📦 Load Sample Data</div>
        <button class="modal-close" onclick="closeSampleDataModal()">✕</button>
      </div>
      
      <div class="modal-body">
        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
          Add sample priorities and projects to get started quickly.
        </p>
        
        <div id="sampleDataPreview" style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
          <div style="color: var(--text-muted); text-align: center; padding: 1rem;">
            Click Preview to see what will be added...
          </div>
        </div>
        
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary" onclick="previewSampleData()">👁️ Preview</button>
          <button class="btn btn-primary" id="loadSampleBtn" onclick="loadSampleData()" disabled>
            📥 Load Data
          </button>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="closeSampleDataModal()">Close</button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  window.closeSampleDataModal = () => {
    modal.remove()
  }
  
  window.previewSampleData = () => {
    const state = store.getState()
    const existingPriorityTexts = new Set((state.priorities || []).map(p => p.text.toLowerCase()))
    const existingProjectTitles = new Set([
      ...(state.projects?.backlog || []).map(p => p.title.toLowerCase()),
      ...(state.projects?.inprogress || []).map(p => p.title.toLowerCase()),
      ...(state.projects?.todo || []).map(p => p.title.toLowerCase()),
      ...(state.projects?.done || []).map(p => p.title.toLowerCase())
    ])
    
    const newPriorities = SAMPLE_DATA.priorities.filter(p => !existingPriorityTexts.has(p.text.toLowerCase()))
    const newProjects = SAMPLE_DATA.projects.filter(p => !existingProjectTitles.has(p.title.toLowerCase()))
    
    const previewDiv = document.getElementById('sampleDataPreview')
    const loadBtn = document.getElementById('loadSampleBtn')
    
    let html = ''
    
    if (newPriorities.length === 0 && newProjects.length === 0) {
      html = '<div style="color: var(--green); text-align: center; padding: 1rem;">✅ All sample data already exists!</div>'
      loadBtn.disabled = true
    } else {
      html = '<div style="font-size: 0.875rem;">'
      
      if (newPriorities.length > 0) {
        html += `<div style="margin-bottom: 1rem;">
          <strong style="color: var(--accent-primary);">⭐ Priorities (${newPriorities.length}):</strong>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            ${newPriorities.map(p => `
              <li style="margin: 0.25rem 0;">
                ${p.text} <span style="color: var(--text-muted);">(${p.tags.join(', ')})</span>
              </li>
            `).join('')}
          </ul>
        </div>`
      }
      
      if (newProjects.length > 0) {
        html += `<div>
          <strong style="color: var(--accent-primary);">📋 Projects (${newProjects.length}):</strong>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            ${newProjects.map(p => `
              <li style="margin: 0.25rem 0;">${p.title}</li>
            `).join('')}
          </ul>
        </div>`
      }
      
      html += '</div>'
      loadBtn.disabled = false
    }
    
    previewDiv.innerHTML = html
  }
  
  window.loadSampleData = () => {
    const state = store.getState()
    const existingPriorityTexts = new Set((state.priorities || []).map(p => p.text.toLowerCase()))
    const existingProjectTitles = new Set([
      ...(state.projects?.backlog || []).map(p => p.title.toLowerCase()),
      ...(state.projects?.inprogress || []).map(p => p.title.toLowerCase()),
      ...(state.projects?.todo || []).map(p => p.title.toLowerCase()),
      ...(state.projects?.done || []).map(p => p.title.toLowerCase())
    ])
    
    const newPriorities = SAMPLE_DATA.priorities
      .filter(p => !existingPriorityTexts.has(p.text.toLowerCase()))
      .map(p => ({
        id: Date.now() + Math.random(),
        ...p,
        status: 'later',
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeEstimate: 0,
        timeSpent: 0,
        recurring: 'none',
        blockedBy: [],
        activityLog: [],
        notes: '',
        desc: ''
      }))
    
    const newProjects = SAMPLE_DATA.projects
      .filter(p => !existingProjectTitles.has(p.title.toLowerCase()))
      .map(p => ({
        id: Date.now() + Math.random(),
        ...p,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
    
    // Add to store
    store.set('priorities', [...state.priorities, ...newPriorities])
    
    newProjects.forEach(p => {
      const status = p.status || 'backlog'
      state.projects[status].push(p)
    })
    store.set('projects', state.projects)
    
    modal.remove()
    toast.success('Sample data loaded', `Added ${newPriorities.length} priorities and ${newProjects.length} projects`)
  }
}

// Expose globally
window.createSampleDataModal = createSampleDataModal
