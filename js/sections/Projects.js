import { store } from '../state/store.js'
import { createKanban } from '../components/Kanban.js'
import { openProjectModal } from '../components/ProjectModal.js'
import { openEditProjectModal } from '../components/EditProjectModal.js'
import { toast } from '../components/Toast.js'
import { filterByBoard, getCurrentBoardLabel } from '../components/BoardSelector.js'
import { getDueAlert } from '../utils/priority.js'

let currentFilter = 'all'
let searchQuery = ''
let kanbanInstance = null

export function createProjectsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function getFilteredProjects(projects) {
    // Filter by board first
    let filtered = {}
    Object.keys(projects).forEach(status => {
      filtered[status] = filterByBoard(projects[status], 'board')
    })
    
    // Then apply category filter
    if (currentFilter !== 'all') {
      Object.keys(filtered).forEach(status => {
        filtered[status] = filtered[status].filter(p => {
          if (currentFilter === 'etsy') {
            return p.tags?.includes('etsy') || p.board === 'etsy'
          }
          if (currentFilter === 'photo') {
            return p.tags?.includes('photo') || p.board === 'photography'
          }
          if (currentFilter === 'b2b') {
            return p.tags?.includes('b2b') || p.board === 'wholesale'
          }
          if (currentFilter === 'high') {
            return p.priority === 'high'
          }
          return true
        })
      })
    }
    
    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      Object.keys(filtered).forEach(status => {
        filtered[status] = filtered[status].filter(p =>
          p.title?.toLowerCase().includes(query) ||
          p.desc?.toLowerCase().includes(query) ||
          p.tags?.some(t => t.toLowerCase().includes(query))
        )
      })
    }
    
    return filtered
  }
  
  function getProjectAlert(project) {
    if (!project.dueDate) return null
    return getDueAlert({ dueDate: project.dueDate })
  }
  
  function render() {
    const projects = store.getState().projects || { backlog: [], todo: [], inprogress: [], done: [] }
    const filteredProjects = getFilteredProjects(projects)
    
    // Ensure all arrays exist
    const backlog = filteredProjects.backlog || []
    const todo = filteredProjects.todo || []
    const inprogress = filteredProjects.inprogress || []
    const done = filteredProjects.done || []
    
    const allProjects = [
      ...backlog.map(p => ({ ...p, status: 'backlog' })),
      ...todo.map(p => ({ ...p, status: 'todo' })),
      ...inprogress.map(p => ({ ...p, status: 'inprogress' })),
      ...done.map(p => ({ ...p, status: 'done' }))
    ]
    
    const totalActive = backlog.length + todo.length + inprogress.length
    const highPriorityCount = allProjects.filter(p => p.priority === 'high' && p.status !== 'done').length
    const overdueCount = allProjects.filter(p => {
      const alert = getProjectAlert(p)
      return alert?.type === 'overdue' && p.status !== 'done'
    }).length
    
    const boardLabel = getCurrentBoardLabel()
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting">📁 Projects</div>
          <div class="welcome-status">
            ${overdueCount > 0 
              ? `<span class="status-badge" style="background: rgba(239, 68, 68, 0.15); color: var(--accent-danger);">🔥 ${overdueCount} overdue</span>`
              : highPriorityCount > 0
                ? `<span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-warning);">⚡ ${highPriorityCount} high priority</span>`
                : `<span class="status-badge">${totalActive} active</span>`
            }
            <span class="board-label">${boardLabel}</span>
          </div>
        </div>
        <button class="btn btn-primary" onclick="openProjectModal()">
          <span>➕</span>
          <span class="hide-mobile">New Project</span>
        </button>
      </div>
      
      <!-- Category Filters -->
      <div class="filter-bar project-filters">
        <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="setProjectFilter('all')">
          <span>All</span>
          <span class="filter-count">${totalActive + done.length}</span>
        </button>
        <button class="filter-btn ${currentFilter === 'etsy' ? 'active' : ''}" onclick="setProjectFilter('etsy')">
          <span>🛒 Etsy</span>
        </button>
        <button class="filter-btn ${currentFilter === 'photo' ? 'active' : ''}" onclick="setProjectFilter('photo')">
          <span>📸 Photo</span>
        </button>
        <button class="filter-btn ${currentFilter === 'b2b' ? 'active' : ''}" onclick="setProjectFilter('b2b')">
          <span>🏪 B2B</span>
        </button>
        <button class="filter-btn ${currentFilter === 'high' ? 'active' : ''}" onclick="setProjectFilter('high')">
          <span>🔥 High Priority</span>
        </button>
      </div>
      
      <!-- Search -->
      <div class="project-search" style="margin-bottom: 1rem;">
        <input type="text" 
          class="search-input" 
          id="projectSearchInput"
          placeholder="🔍 Search projects..."
          oninput="setProjectSearch(this.value)"
        >
      </div>
      
      <!-- Kanban Board -->
      <div id="projectsKanban"></div>
      
      ${totalActive === 0 && done.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📁</div>
          <div class="empty-state-title">No projects yet</div>
          <div class="empty-state-text">Create your first project to get started</div>
          <button class="btn btn-primary" onclick="openProjectModal()">➕ Create Project</button>
        </div>
      ` : ''}
    `
    
    // Only init kanban if we have projects
    if (totalActive > 0 || done.length > 0) {
      kanbanInstance = createKanban('projectsKanban', {
        columns: [
          { id: 'backlog', label: 'Backlog', icon: '📥' },
          { id: 'todo', label: 'To Do', icon: '📝' },
          { id: 'inprogress', label: 'In Progress', icon: '⚡' },
          { id: 'done', label: 'Done', icon: '✅' }
        ],
        items: allProjects,
        renderItem: (project) => renderProjectCard(project)
      })
    }
  }
  
  function renderProjectCard(project) {
    const alert = getProjectAlert(project)
    const isDone = project.status === 'done'
    
    return `
      <div class="project-card ${alert?.type || ''} ${isDone ? 'completed' : ''}" 
           onclick="openEditProjectModal(${project.id}, '${project.status}')">
        
        <!-- Header Row -->
        <div class="project-card-header">
          <h4 class="project-title">${escapeHtml(project.title)}</h4>
          ${!isDone ? `
            <button class="project-complete-btn" 
                    onclick="event.stopPropagation(); quickCompleteProject(${project.id}, '${project.status}')"
                    title="Mark complete">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                <path d="M6 10l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
              </svg>
            </button>
          ` : `
            <span class="project-done-icon">✓</span>
          `}
        </div>
        
        <!-- Description -->
        ${project.desc ? `
          <p class="project-desc">${escapeHtml(project.desc)}</p>
        ` : ''}
        
        <!-- Meta Row -->
        <div class="project-meta">
          ${project.priority ? `
            <span class="project-priority ${project.priority}">${project.priority}</span>
          ` : ''}
          
          ${alert && !isDone ? `
            <span class="project-alert ${alert.type}">
              ${alert.type === 'overdue' ? '🔥' : '⏰'} ${alert.text}
            </span>
          ` : ''}
          
          ${project.dueDate && !alert ? `
            <span class="project-due">📅 ${formatDate(project.dueDate)}</span>
          ` : ''}
          
          ${project.board && project.board !== 'all' ? `
            <span class="project-board">${getBoardEmoji(project.board)} ${project.board}</span>
          ` : ''}
        </div>
        
        <!-- Tags -->
        ${project.tags?.length ? `
          <div class="project-tags">
            ${project.tags.slice(0, 3).map(tag => `
              <span class="project-tag">#${escapeHtml(tag)}</span>
            `).join('')}
            ${project.tags.length > 3 ? `
              <span class="project-tag-more">+${project.tags.length - 3}</span>
            ` : ''}
          </div>
        ` : ''}
        
        <!-- Progress Bar (if in progress) -->
        ${project.status === 'inprogress' && project.progress !== undefined ? `
          <div class="project-progress">
            <div class="project-progress-bar" style="width: ${project.progress}%"></div>
          </div>
        ` : ''}
      </div>
    `
  }
  
  // Expose filter function globally
  window.setProjectFilter = (filter) => {
    currentFilter = filter
    render()
  }
  
  window.setProjectSearch = (query) => {
    searchQuery = query
    render()
  }
  
  window.quickCompleteProject = (id, status) => {
    const projects = store.get('projects')
    const project = projects[status]?.find(p => p.id === id)
    if (project) {
      // Remove from current status
      projects[status] = projects[status].filter(p => p.id !== id)
      // Add to done
      project.status = 'done'
      project.updatedAt = new Date().toISOString()
      project.completedAt = new Date().toISOString()
      if (!projects.done) projects.done = []
      projects.done.push(project)
      store.set('projects', projects)
      toast.success('Project completed', project.title)
    }
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('projects') || path.includes('currentBoard')) render()
  })
  
  render()
  return { render }
}

function getBoardEmoji(board) {
  const emojis = {
    'etsy': '🛒',
    'photography': '📸',
    'wholesale': '🏪',
    '3dprint': '🖨️',
    'all': '🏢'
  }
  return emojis[board] || '📋'
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const today = new Date()
  const diffTime = date - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 0 && diffDays < 7) return `In ${diffDays}d`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}