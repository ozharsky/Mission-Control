import { store } from '../state/store.js'
import { Toast } from './Toast.js'
import { lockBodyScroll, unlockBodyScroll } from '../utils/modalScrollLock.js'
import { icon } from '../utils/icons.js'

export function openProjectModal(status = 'backlog') {
  const existing = document.getElementById('projectModal')
  if (existing) existing.remove()
  
  const modal = document.createElement('div')
  modal.id = 'projectModal'
  modal.className = 'modal-overlay active'
  modal.onclick = (e) => {
    if (e.target === modal) closeProjectModal()
  }
  
  modal.innerHTML = `
    <div class="modal" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <div class="modal-title">${icon('folder', 'm-icon')} New Project</div>
        <button class="modal-close m-touch" onclick="closeProjectModal()">${icon('x')}</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Project Title *</label>
          <input type="text" class="form-input m-input" id="projectTitle" placeholder="Enter project title" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea m-input" id="projectDesc" rows="3" placeholder="Describe the project..."></textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input m-input" id="projectStatus">
              <option value="backlog" ${status === 'backlog' ? 'selected' : ''}>${icon('inbox', 'select-icon')} Backlog</option>
              <option value="todo" ${status === 'todo' ? 'selected' : ''}>${icon('file-text', 'select-icon')} To Do</option>
              <option value="inprogress" ${status === 'inprogress' ? 'selected' : ''}>${icon('zap', 'select-icon')} In Progress</option>
              <option value="done" ${status === 'done' ? 'selected' : ''}>${icon('check-circle', 'select-icon')} Done</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-input m-input" id="projectPriority">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input type="date" class="form-input m-input" id="projectDueDate">
          </div>
          
          <div class="form-group">
            <label class="form-label">Board</label>
            <select class="form-input m-input" id="projectBoard">
              <option value="all">${icon('building-2', 'select-icon')} All</option>
              <option value="etsy">${icon('shopping-bag', 'select-icon')} Etsy</option>
              <option value="photography">${icon('camera', 'select-icon')} Photo</option>
              <option value="wholesale">${icon('store', 'select-icon')} B2B</option>
              <option value="3dprint">${icon('printer', 'select-icon')} 3D Print</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tags (comma separated)</label>
          <input type="text" class="form-input m-input" id="projectTags" placeholder="etsy, marketing, urgent">
        </div>
        
        <div class="form-group">
          <label class="form-label">Document Path</label>
          <input type="text" class="form-input m-input" id="projectDocPath" placeholder="path/to/document.md">
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn btn-secondary m-touch" onclick="closeProjectModal()">Cancel</button>
        <button class="btn btn-primary m-touch" onclick="saveProject()">${icon('check', 'btn-icon')} Create Project</button>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Lock body scroll on mobile
  if (window.innerWidth <= 768) {
    lockBodyScroll()
  }
  
  // Focus title input
  setTimeout(() => document.getElementById('projectTitle')?.focus(), 100)
}

export function closeProjectModal() {
  const modal = document.getElementById('projectModal')
  if (modal) modal.remove()
  
  // Unlock body scroll
  unlockBodyScroll()
}

export function saveProject() {
  const title = document.getElementById('projectTitle').value.trim()
  
  if (!title) {
    Toast.error('Please enter a project title')
    document.getElementById('projectTitle').focus()
    return
  }
  
  const desc = document.getElementById('projectDesc').value.trim()
  const status = document.getElementById('projectStatus').value
  const priority = document.getElementById('projectPriority').value
  const dueDate = document.getElementById('projectDueDate').value
  const board = document.getElementById('projectBoard').value
  const docPath = document.getElementById('projectDocPath').value.trim()
  
  // Parse tags
  const tagsInput = document.getElementById('projectTags').value
  const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t)
  
  const project = {
    id: Date.now(),
    title,
    desc,
    status,
    priority,
    dueDate,
    board,
    tags,
    docPath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  // Add to store
  const projects = store.get('projects') || { backlog: [], todo: [], inprogress: [], done: [] }
  if (!projects[status]) projects[status] = []
  projects[status].push(project)
  store.set('projects', projects)
  
  Toast.success('Project created', title)
  closeProjectModal()
}

// Expose globally
window.openProjectModal = openProjectModal
window.closeProjectModal = closeProjectModal
window.saveProject = saveProject
