import { toast } from '../components/Toast.js'

class UndoManager {
  constructor() {
    this.history = []
    this.maxHistory = 50
    this.undoTimeouts = new Map()
  }
  
  // Add action to history
  add(action) {
    const entry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: action.type,
      description: action.description,
      undo: action.undo,
      redo: action.redo
    }
    
    this.history.unshift(entry)
    
    // Keep only maxHistory items
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory)
    }
    
    return entry.id
  }
  
  // Show undo toast and auto-clear after timeout
  showUndo(id, message, timeout = 30000) {
    // Clear any existing timeout for this id
    if (this.undoTimeouts.has(id)) {
      clearTimeout(this.undoTimeouts.get(id))
    }
    
    const entry = this.history.find(h => h.id === id)
    if (!entry) return
    
    // Show toast with undo action
    toast.show({
      title: message,
      type: 'info',
      duration: timeout,
      actions: [
        {
          label: 'Undo',
          primary: true,
          onClick: () => {
            this.undo(id)
          }
        }
      ]
    })
    
    // Auto-remove from history after timeout
    const timeoutId = setTimeout(() => {
      this.remove(id)
    }, timeout)
    
    this.undoTimeouts.set(id, timeoutId)
  }
  
  // Execute undo
  undo(id) {
    const entry = this.history.find(h => h.id === id)
    if (!entry || !entry.undo) return false
    
    // Clear timeout
    if (this.undoTimeouts.has(id)) {
      clearTimeout(this.undoTimeouts.get(id))
      this.undoTimeouts.delete(id)
    }
    
    try {
      entry.undo()
      this.remove(id)
      
      toast.success('Undo successful', entry.description + ' restored')
      return true
    } catch (e) {
      console.error('Undo failed:', e)
      toast.error('Undo failed', 'Could not restore item')
      return false
    }
  }
  
  // Remove from history
  remove(id) {
    this.history = this.history.filter(h => h.id !== id)
    if (this.undoTimeouts.has(id)) {
      clearTimeout(this.undoTimeouts.get(id))
      this.undoTimeouts.delete(id)
    }
  }
  
  // Clear all history
  clear() {
    this.undoTimeouts.forEach(id => clearTimeout(id))
    this.undoTimeouts.clear()
    this.history = []
  }
  
  // Get recent history
  getRecent(limit = 10) {
    return this.history.slice(0, limit)
  }
}

export const undoManager = new UndoManager()

// Helper functions for common undo actions
export function createDeletePriorityUndo(priority, store) {
  return {
    type: 'delete_priority',
    description: `Deleted "${priority.text}"`,
    undo: () => {
      const priorities = store.get('priorities') || []
      priorities.push(priority)
      store.set('priorities', priorities)
    },
    redo: () => {
      const priorities = store.get('priorities') || []
      store.set('priorities', priorities.filter(p => p.id !== priority.id))
    }
  }
}

export function createDeleteProjectUndo(project, status, store) {
  return {
    type: 'delete_project',
    description: `Deleted "${project.title}"`,
    undo: () => {
      const projects = store.get('projects') || {}
      if (!projects[status]) projects[status] = []
      projects[status].push(project)
      store.set('projects', projects)
    },
    redo: () => {
      const projects = store.get('projects') || {}
      if (projects[status]) {
        projects[status] = projects[status].filter(p => p.id !== project.id)
        store.set('projects', projects)
      }
    }
  }
}

export function createMoveProjectUndo(project, fromStatus, toStatus, store) {
  return {
    type: 'move_project',
    description: `Moved "${project.title}" to ${toStatus}`,
    undo: () => {
      const projects = store.get('projects') || {}
      if (projects[toStatus]) {
        projects[toStatus] = projects[toStatus].filter(p => p.id !== project.id)
      }
      if (!projects[fromStatus]) projects[fromStatus] = []
      projects[fromStatus].push({ ...project, status: fromStatus })
      store.set('projects', projects)
    },
    redo: () => {
      const projects = store.get('projects') || {}
      if (projects[fromStatus]) {
        projects[fromStatus] = projects[fromStatus].filter(p => p.id !== project.id)
      }
      if (!projects[toStatus]) projects[toStatus] = []
      projects[toStatus].push({ ...project, status: toStatus })
      store.set('projects', projects)
    }
  }
}
