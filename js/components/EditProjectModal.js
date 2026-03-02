import { store } from '../state/store.js'
import { Toast } from './Toast.js'
import { undoManager } from '../state/undo.js'
import { confirmDelete } from './ConfirmDialog.js'
import { lockBodyScroll, unlockBodyScroll } from '../utils/modalScrollLock.js'
import { icon } from '../utils/icons.js'

export function openEditProjectModal(id, status) {
  const projects = store.get('projects') || {}
  const project = projects[status]?.find(p => p.id === id)
  if (!project) return
  
  const existing = document.getElementById('editProjectModal')
  if (existing) existing.remove()
  
  const modal = document.createElement('div')
  modal.id = 'editProjectModal'
  modal.className = 'modal-overlay active'
  modal.onclick = (e) => {
    if (e.target === modal) closeEditProjectModal()
  }
  
  modal.innerHTML = `
    <div class="modal" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <div class="modal-title">${icon('pencil', 'modal-title-icon')} Edit Project</div>
        <button class="modal-close m-touch" onclick="closeEditProjectModal()">${icon('x')}</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Project Title *</label>
          <input type="text" class="form-input" id="editProjectTitle" value="${escapeHtml(project.title)}" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="editProjectDesc" rows="3">${escapeHtml(project.desc || '')}</textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" id="editProjectStatus">
              <option value="backlog" ${project.status === 'backlog' ? 'selected' : ''}>${icon('inbox', 'select-icon')} Backlog</option>
              <option value="todo" ${project.status === 'todo' ? 'selected' : ''}>${icon('circle', 'select-icon')} To Do</option>
              <option value="inprogress" ${project.status === 'inprogress' ? 'selected' : ''}>${icon('zap', 'select-icon')} In Progress</option>
              <option value="done" ${project.status === 'done' ? 'selected' : ''}>${icon('check-circle', 'select-icon')} Done</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-input" id="editProjectPriority">
              <option value="low" ${project.priority === 'low' ? 'selected' : ''}>Low</option>
              <option value="medium" ${project.priority === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="high" ${project.priority === 'high' ? 'selected' : ''}>High</option>
            </select>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input type="date" class="form-input" id="editProjectDueDate" value="${project.dueDate || ''}">
          </div>
          
          <div class="form-group">
            <label class="form-label">Board</label>
            <select class="form-input" id="editProjectBoard">
              <option value="all" ${project.board === 'all' ? 'selected' : ''}>${icon('building-2', 'select-icon')} All</option>
              <option value="etsy" ${project.board === 'etsy' ? 'selected' : ''}>${icon('shopping-cart', 'select-icon')} Etsy</option>
              <option value="photography" ${project.board === 'photography' ? 'selected' : ''}>${icon('camera', 'select-icon')} Photo</option>
              <option value="wholesale" ${project.board === 'wholesale' ? 'selected' : ''}>${icon('store', 'select-icon')} B2B</option>
              <option value="3dprint" ${project.board === '3dprint' ? 'selected' : ''}>${icon('printer', 'select-icon')} 3D Print</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tags (comma separated)</label>
          <input type="text" class="form-input" id="editProjectTags" value="${(project.tags || []).join(', ')}">
        </div>
        
        <div class="form-group">
          <label class="form-label">Document Path</label>
          <input type="text" class="form-input" id="editProjectDocPath" value="${escapeHtml(project.docPath || '')}">
        </div>
      </div>
      
      <div class="modal-footer" style="display: flex; justify-content: space-between;">
        <button class="btn btn-secondary m-touch" onclick="closeEditProjectModal()">Cancel</button>
        <div>
          <button class="btn btn-danger m-touch" onclick="deleteProject(${id}, '${status}')" style="margin-right: 0.5rem;">${icon('trash-2')} Delete</button>
          <button class="btn btn-primary m-touch" onclick="saveEditedProject(${id}, '${status}')">${icon('save')} Save Changes</button>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Lock body scroll on mobile
  if (window.innerWidth <= 768) {
    lockBodyScroll()
  }
}

export function closeEditProjectModal() {
  const modal = document.getElementById('editProjectModal')
  if (modal) modal.remove()
  
  // Unlock body scroll
  unlockBodyScroll()
}

export function saveEditedProject(id, oldStatus) {
  const projects = store.get('projects') || {}
  const project = projects[oldStatus]?.find(p => p.id === id)
  if (!project) return
  
  const oldValues = { ...project, status: oldStatus }
  
  const title = document.getElementById('editProjectTitle').value.trim()
  if (!title) {
    Toast.error('Please enter a project title')
    return
  }
  
  const newStatus = document.getElementById('editProjectStatus').value
  
  // Update fields
  project.title = title
  project.desc = document.getElementById('editProjectDesc').value.trim()
  project.status = newStatus
  project.priority = document.getElementById('editProjectPriority').value
  project.dueDate = document.getElementById('editProjectDueDate').value
  project.board = document.getElementById('editProjectBoard').value
  project.docPath = document.getElementById('editProjectDocPath').value.trim()
  
  // Parse tags
  const tagsInput = document.getElementById('editProjectTags').value
  project.tags = tagsInput.split(',').map(t => t.trim()).filter(t => t)
  
  project.updatedAt = new Date().toISOString()
  
  // Handle status change
  if (newStatus !== oldStatus) {
    // Remove from old status
    projects[oldStatus] = projects[oldStatus].filter(p => p.id !== id)
    // Add to new status
    if (!projects[newStatus]) projects[newStatus] = []
    projects[newStatus].push(project)
  }
  
  store.set('projects', projects)
  
  // Add undo
  undoManager.add({
    type: 'edit_project',
    description: `Edited "${project.title}"`,
    undo: () => {
      const current = store.get('projects')
      // Remove from current location
      Object.keys(current).forEach(key => {
        current[key] = current[key].filter(p => p.id !== id)
      })
      // Restore to old location
      if (!current[oldValues.status]) current[oldValues.status] = []
      current[oldValues.status].push(oldValues)
      store.set('projects', current)
    }
  })
  
  Toast.success('Project updated')
  closeEditProjectModal()
}

export function deleteProject(id, status) {
  const projects = store.get('projects') || {}
  const project = projects[status]?.find(p => p.id === id)
  if (!project) return
  
  confirmDelete(project.title).then(confirmed => {
    if (!confirmed) return
    
    const deletedProject = { ...project }
    
    // Remove from array
    projects[status] = projects[status].filter(p => p.id !== id)
    store.set('projects', projects)
    
    // Add undo
    const undoId = undoManager.add({
      type: 'delete_project',
      description: `Deleted "${deletedProject.title}"`,
      undo: () => {
        const current = store.get('projects') || {}
        if (!current[status]) current[status] = []
        current[status].push(deletedProject)
        store.set('projects', current)
      }
    })
    
    undoManager.showUndo(undoId, `Deleted "${deletedProject.title}"`)
    closeEditProjectModal()
  })
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Expose globally
window.openEditProjectModal = openEditProjectModal
window.closeEditProjectModal = closeEditProjectModal
window.saveEditedProject = saveEditedProject
window.deleteProject = deleteProject
