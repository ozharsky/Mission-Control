import { store } from '../state/store.js'
import { toast } from './Toast.js'
import { undoManager } from '../state/undo.js'
import { logActivity } from '../utils/taskUtils.js'
import { confirmDelete } from './ConfirmDialog.js'

export function openEditPriorityModal(id) {
  const priorities = store.get('priorities') || []
  const priority = priorities.find(p => p.id === id)
  if (!priority) return
  
  const existing = document.getElementById('editPriorityModal')
  if (existing) existing.remove()
  
  const modal = document.createElement('div')
  modal.id = 'editPriorityModal'
  modal.className = 'modal-overlay active'
  modal.onclick = (e) => {
    if (e.target === modal) document.getElementById('editPriorityModal')?.remove()
  }
  
  modal.innerHTML = `
    <div class="modal" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <div class="modal-title">✏️ Edit Priority</div>
        <button class="modal-close" onclick="document.getElementById('editPriorityModal').remove()">✕</button>
      </div>
      
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Task *</label>
          <input type="text" class="form-input" id="editPriorityText" value="${escapeHtml(priority.text)}" required>
        </div>
        
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="editPriorityDesc" rows="2">${escapeHtml(priority.desc || '')}</textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-textarea" id="editPriorityNotes" rows="3" placeholder="Add notes, updates, comments...">${escapeHtml(priority.notes || '')}</textarea>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input type="date" class="form-input" id="editPriorityDueDate" value="${priority.dueDate || ''}">
          </div>
          
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" id="editPriorityStatus">
              <option value="later" ${priority.status === 'later' ? 'selected' : ''}>📥 Later</option>
              <option value="now" ${priority.status === 'now' ? 'selected' : ''}>⚡ Now</option>
              <option value="done" ${priority.status === 'done' ? 'selected' : ''}>✅ Done</option>
            </select>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Time Estimate (minutes)</label>
            <input type="number" class="form-input" id="editPriorityTimeEstimate" value="${priority.timeEstimate || ''}" placeholder="e.g., 120">
          </div>
          
          <div class="form-group">
            <label class="form-label">Time Spent (minutes)</label>
            <input type="number" class="form-input" id="editPriorityTimeSpent" value="${priority.timeSpent || ''}" placeholder="e.g., 60">
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Tags (comma separated)</label>
          <input type="text" class="form-input" id="editPriorityTags" value="${(priority.tags || []).join(', ')}" placeholder="urgent, seo, client">
        </div>
        
        <div class="form-group">
          <label class="form-label">Recurring</label>
          <select class="form-input" id="editPriorityRecurring">
            <option value="none" ${priority.recurring === 'none' ? 'selected' : ''}>None</option>
            <option value="daily" ${priority.recurring === 'daily' ? 'selected' : ''}>Daily</option>
            <option value="weekly" ${priority.recurring === 'weekly' ? 'selected' : ''}>Weekly</option>
            <option value="monthly" ${priority.recurring === 'monthly' ? 'selected' : ''}>Monthly</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Assignee</label>
          <select class="form-input" id="editPriorityAssignee">
            <option value="" ${!priority.assignee ? 'selected' : ''}>Unassigned</option>
            <option value="KimiClaw" ${priority.assignee === 'KimiClaw' ? 'selected' : ''}>🤖 KimiClaw</option>
            <option value="Oleg" ${priority.assignee === 'Oleg' ? 'selected' : ''}>👤 Oleg</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Board</label>
          <select class="form-input" id="editPriorityBoard">
            <option value="all" ${priority.board === 'all' ? 'selected' : ''}>🏢 All</option>
            <option value="etsy" ${priority.board === 'etsy' ? 'selected' : ''}>🛒 Etsy</option>
            <option value="photography" ${priority.board === 'photography' ? 'selected' : ''}>📸 Photo</option>
            <option value="wholesale" ${priority.board === 'wholesale' ? 'selected' : ''}>🏪 B2B</option>
            <option value="3dprint" ${priority.board === '3dprint' ? 'selected' : ''}>🖨️ 3D Print</option>
          </select>
        </div>
        
        <div class="form-group">
          <label class="form-label">Document Path</label>
          <input type="text" class="form-input" id="editPriorityDocPath" value="${escapeHtml(priority.docPath || '')}" placeholder="path/to/file.md">
        </div>
        
        ${priority.activityLog?.length > 0 ? `
          <div class="form-group">
            <label class="form-label">Activity Log</label>
            <div style="max-height: 150px; overflow-y: auto; background: var(--bg-tertiary); padding: 0.75rem; border-radius: var(--radius-sm);">
              ${priority.activityLog.map(log => `
                <div style="padding: 0.375rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.8125rem;">
                  <span style="color: var(--text-muted);">${new Date(log.timestamp).toLocaleString()}</span>
                  <div>${log.action}${log.details ? `: ${log.details}` : ''}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      
      <div class="modal-footer" style="display: flex; justify-content: space-between;">
        <button class="btn btn-secondary" onclick="document.getElementById('editPriorityModal').remove()">Cancel</button>
        <div>
          <button class="btn btn-danger" onclick="deletePriority(${id})" style="margin-right: 0.5rem;">🗑️ Delete</button>
          <button class="btn btn-primary" onclick="saveEditedPriority(${id})">💾 Save Changes</button>
        </div>
      </div>
    </div>
  `
  
  document.body.appendChild(modal)
  
  // Expose functions
  window.saveEditedPriority = (id) => {
    const priorities = store.get('priorities')
    const priority = priorities.find(p => p.id === id)
    if (!priority) return
    
    const oldValues = { ...priority }
    
    // Update fields
    priority.text = document.getElementById('editPriorityText').value.trim()
    priority.desc = document.getElementById('editPriorityDesc').value.trim()
    priority.notes = document.getElementById('editPriorityNotes').value.trim()
    priority.dueDate = document.getElementById('editPriorityDueDate').value
    priority.status = document.getElementById('editPriorityStatus').value
    priority.completed = priority.status === 'done'
    priority.timeEstimate = parseInt(document.getElementById('editPriorityTimeEstimate').value) || 0
    priority.timeSpent = parseInt(document.getElementById('editPriorityTimeSpent').value) || 0
    priority.recurring = document.getElementById('editPriorityRecurring').value
    priority.docPath = document.getElementById('editPriorityDocPath').value.trim()
    priority.assignee = document.getElementById('editPriorityAssignee').value
    priority.board = document.getElementById('editPriorityBoard').value
    
    // Parse tags
    const tagsInput = document.getElementById('editPriorityTags').value
    priority.tags = tagsInput.split(',').map(t => t.trim()).filter(t => t)
    
    priority.updatedAt = new Date().toISOString()
    
    // Log activity
    logActivity(priority, 'Edited', 'Updated task details')
    
    store.set('priorities', priorities)
    
    // Add to undo
    undoManager.add({
      type: 'edit_priority',
      description: `Edited "${priority.text}"`,
      undo: () => {
        const idx = priorities.findIndex(p => p.id === id)
        if (idx >= 0) {
          priorities[idx] = oldValues
          store.set('priorities', priorities)
        }
      }
    })
    
    toast.success('Priority updated')
    document.getElementById('editPriorityModal').remove()
  }
  
  window.deletePriority = (id) => {
    confirmDelete('this priority').then(confirmed => {
      if (!confirmed) return
      
      const priorities = store.get('priorities')
      const priority = priorities.find(p => p.id === id)
      if (!priority) return
      
      const deletedPriority = { ...priority }
      
      // Remove from array
      const newPriorities = priorities.filter(p => p.id !== id)
      store.set('priorities', newPriorities)
      
      // Add undo
      const undoId = undoManager.add({
        type: 'delete_priority',
        description: `Deleted "${deletedPriority.text}"`,
        undo: () => {
          const current = store.get('priorities') || []
          store.set('priorities', [...current, deletedPriority])
        }
      })
      
      undoManager.showUndo(undoId, `Deleted "${deletedPriority.text}"`)
      document.getElementById('editPriorityModal').remove()
    })
  }
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Expose globally
window.openEditPriorityModal = openEditPriorityModal
