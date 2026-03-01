import { store } from '../state/store.js'
import { createKanban } from '../components/Kanban.js'
import { openProjectModal } from '../components/ProjectModal.js'
import { openEditProjectModal } from '../components/EditProjectModal.js'
import { toast } from '../components/Toast.js'
import { filterByBoard, getCurrentBoardLabel } from '../components/BoardSelector.js'
import { getDueAlert } from '../utils/priority.js'
import { addTouchFeedback, initSwipeActions, haptic } from '../utils/mobileInteractions.js'
import { icons } from '../utils/icons.js'

let currentFilter = 'all'
let searchQuery = ''
let viewMode = window.innerWidth < 768 ? 'list' : 'kanban' // Default to list on mobile
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
      <div class="welcome-bar m-card">
        <div class="welcome-content">
          <div class="welcome-greeting m-title">${icons.folder()} Projects</div>
          <div class="welcome-status">
            ${overdueCount > 0 
              ? `<span class="m-badge-danger">${icons.flame()} ${overdueCount} overdue</span>`
              : highPriorityCount > 0
                ? `<span class="m-badge-warning">${icons.zap()} ${highPriorityCount} high priority</span>`
                : `<span class="m-badge-primary">${totalActive} active</span>`
            }
            <span class="m-badge-secondary">${boardLabel}</span>
          </div>
        </div>
        <button class="m-btn-primary m-touch" onclick="openProjectModal()">
          <span>${icons.plus()}</span>
          <span class="hide-mobile">New Project</span>
        </button>
      </div>
      
      <!-- Category Filters -->
      <div class="filter-bar project-filters m-scroll-x">
        <button class="m-btn-secondary ${currentFilter === 'all' ? 'active' : ''} m-touch" onclick="setProjectFilter('all')">
          <span>All</span>
          <span class="filter-count m-badge">${totalActive + done.length}</span>
        </button>
        <button class="m-btn-secondary ${currentFilter === 'etsy' ? 'active' : ''} m-touch" onclick="setProjectFilter('etsy')">
          <span>${icons.cart()} Etsy</span>
        </button>
        <button class="m-btn-secondary ${currentFilter === 'photo' ? 'active' : ''} m-touch" onclick="setProjectFilter('photo')">
          <span>${icons.camera()} Photo</span>
        </button>
        <button class="m-btn-secondary ${currentFilter === 'b2b' ? 'active' : ''} m-touch" onclick="setProjectFilter('b2b')">
          <span>${icons.store()} B2B</span>
        </button>
        <button class="m-btn-secondary ${currentFilter === 'high' ? 'active' : ''} m-touch" onclick="setProjectFilter('high')">
          <span>${icons.flame()} High Priority</span>
        </button>
      </div>
      
      <!-- Search & View Toggle -->
      <div class="project-toolbar m-toolbar">
        <div class="project-search">
          <input type="text" 
            class="m-input" 
            placeholder="${icons.search()} Search projects..."
            value="${searchQuery}"
            oninput="setProjectSearch(this.value)"
          >
        </div>
        
        <div class="view-toggle m-view-toggle">
          <button class="m-btn-secondary m-touch ${viewMode === 'kanban' ? 'active' : ''}" 
            onclick="setProjectView('kanban')" title="Kanban board view">
            ${icons.clipboard()} Board
          </button>
          <button class="m-btn-secondary m-touch ${viewMode === 'list' ? 'active' : ''}" 
            onclick="setProjectView('list')" title="List view">
            ${icons.menu()} List
          </button>
        </div>
      </div>
      
      <!-- Kanban Board or List View -->
      ${viewMode === 'kanban' ? `
        <div id="projectsKanban"></div>
      ` : `
        <div id="projectsList" class="project-list-view"></div>
      `}
      
      ${totalActive === 0 && done.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">${icons.folder()}</div>
          <div class="empty-state-title m-title">No projects yet</div>
          <div class="empty-state-text m-body">Create your first project to get started</div>
          <button class="m-btn-primary m-touch" onclick="openProjectModal()">${icons.plus()} Create Project</button>
        </div>
      ` : ''}
    `
    
    // Only init kanban or list if we have projects
    if (totalActive > 0 || done.length > 0) {
      if (viewMode === 'kanban') {
        kanbanInstance = createKanban('projectsKanban', {
          columns: [
            { id: 'backlog', label: 'Backlog', icon: 'download' },
            { id: 'todo', label: 'To Do', icon: 'file-text' },
            { id: 'inprogress', label: 'In Progress', icon: 'zap' },
            { id: 'done', label: 'Done', icon: 'check' }
          ],
          items: allProjects,
          renderItem: (project) => renderProjectCard(project)
        })
      } else {
        // List view - group by status
        renderProjectListView(allProjects)
      }
    }
  }
  
  function renderProjectCard(project) {
    const alert = getProjectAlert(project)
    const isDone = project.status === 'done'
    
    return `
      <div class="m-card project-card ${alert?.type || ''} ${isDone ? 'completed' : ''}" 
           onclick="openEditProjectModal(${project.id}, '${project.status}')">
        
        <!-- Header Row -->
        <div class="m-card-header project-card-header">
          <h4 class="m-card-title project-title">${escapeHtml(project.title)}</h4>
          ${!isDone ? `
            <button class="m-btn-secondary m-touch project-complete-btn" 
                    onclick="event.stopPropagation(); quickCompleteProject(${project.id}, '${project.status}')"
                    title="Mark complete">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                <path d="M6 10l3 3 5-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
              </svg>
            </button>
          ` : `
            <span class="project-done-icon">${icons.check()}</span>
          `}
        </div>
        
        <!-- Description -->
        ${project.desc ? `
          <p class="project-desc">${escapeHtml(project.desc)}</p>
        ` : ''}
        
        <!-- Meta Row -->
        <div class="m-card-meta project-meta">
          ${project.priority ? `
            <span class="project-priority ${project.priority}">${project.priority}</span>
          ` : ''}
          
          ${alert && !isDone ? `
            <span class="project-alert ${alert.type}">
              ${alert.type === 'overdue' ? icons.flame() : icons.clock()} ${alert.text}
            </span>
          ` : ''}
          
          ${project.dueDate && !alert ? `
            <span class="project-due">${icons.calendar()} ${formatDate(project.dueDate)}</span>
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
  
  function renderProjectListView(projects) {
    const listContainer = document.getElementById('projectsList')
    if (!listContainer) return
    
    // Group by status
    const grouped = {
      backlog: projects.filter(p => p.status === 'backlog'),
      todo: projects.filter(p => p.status === 'todo'),
      inprogress: projects.filter(p => p.status === 'inprogress'),
      done: projects.filter(p => p.status === 'done')
    }
    
    const statusConfig = {
      backlog: { label: 'Backlog', icon: icons.download(), color: 'var(--text-muted)' },
      todo: { label: 'To Do', icon: icons.file(), color: 'var(--accent-primary)' },
      inprogress: { label: 'In Progress', icon: icons.zap(), color: 'var(--accent-warning)' },
      done: { label: 'Done', icon: icons.check(), color: 'var(--accent-success)' }
    }
    
    listContainer.innerHTML = Object.entries(grouped)
      .filter(([_, items]) => items.length > 0)
      .map(([status, items]) => `
        <div class="project-list-group">
          <div class="project-list-header">
            <span class="project-list-header-icon">${statusConfig[status].icon}</span>
            <span class="project-list-header-label">${statusConfig[status].label}</span>
            <span class="project-list-header-count">${items.length}</span>
          </div>
          <div class="project-list-items">
            ${items.map(project => renderProjectListItem(project)).join('')}
          </div>
        </div>
      `).join('')
  }
  
  function renderProjectListItem(project) {
    const alert = getProjectAlert(project)
    const isDone = project.status === 'done'
    
    return `
      <div class="m-card project-list-item m-touch ${alert?.type || ''} ${isDone ? 'completed' : ''}" 
           onclick="openEditProjectModal(${project.id}, '${project.status}')"
      >
        <!-- Header Row -->
        <div class="project-list-item-row">
          <div class="project-list-item-main">
            <div class="project-list-item-title">
              ${escapeHtml(project.title)}
            </div>
            ${project.desc ? `
              <div class="project-list-item-desc">
                ${escapeHtml(project.desc)}
              </div>
            ` : ''}
          </div>
          
          ${!isDone ? `
            <button class="m-btn-secondary m-touch project-list-item-btn" 
                    onclick="event.stopPropagation(); quickCompleteProject(${project.id}, '${project.status}')"
                    title="Mark complete">
              ${icons.check()}
            </button>
          ` : `
            <span class="project-list-item-done">${icons.check()}</span>
          `}
        </div>
        
        <!-- Meta Row -->
        <div class="project-list-item-meta">
          ${project.priority ? `
            <span class="project-priority ${project.priority}">${project.priority}</span>
          ` : ''}
          
          ${alert && !isDone ? `
            <span class="project-alert ${alert.type}">
              ${alert.type === 'overdue' ? icons.flame() : icons.clock()} ${alert.text}
            </span>
          ` : ''}
          
          ${project.dueDate && !alert ? `
            <span class="project-list-item-due">${icons.calendar()} ${formatDate(project.dueDate)}</span>
          ` : ''}
          
          ${project.board && project.board !== 'all' ? `
            <span class="project-list-item-board">${getBoardEmoji(project.board)} ${project.board}</span>
          ` : ''}
        </div>
        
        <!-- Progress Bar -->
        ${project.status === 'inprogress' && project.progress !== undefined ? `
          <div class="project-list-item-progress">
            <div class="project-list-item-progress-header">
              <span>Progress</span>
              <span>${project.progress}%</span>
            </div>
            <div class="project-list-item-progress-bar">
              <div class="project-list-item-progress-fill" style="width: ${project.progress}%;"></div>
            </div>
          </div>
        ` : ''}
        
        <!-- Tags -->
        ${project.tags?.length ? `
          <div class="project-list-item-tags">
            ${project.tags.slice(0, 3).map(tag => `
              <span class="project-list-item-tag">#${escapeHtml(tag)}</span>
            `).join('')}
            ${project.tags.length > 3 ? `
              <span class="project-list-item-tag-more">+${project.tags.length - 3}</span>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `
  }
  
  // Expose functions globally
  window.setProjectFilter = (filter) => {
    currentFilter = filter
    render()
  }
  
  window.setProjectSearch = (query) => {
    searchQuery = query
    render()
  }
  
  window.setProjectView = (mode) => {
    viewMode = mode
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
  
  // Initialize mobile interactions after render
  setTimeout(() => {
    // Add touch feedback to all interactive elements with m-touch class
    container.querySelectorAll('.m-touch').forEach(addTouchFeedback)
    
    // Add swipe actions for mobile project items
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      document.querySelectorAll('.project-card, .project-list-item').forEach(el => {
        const onclick = el.getAttribute('onclick') || ''
        const projectMatch = onclick.match(/openEditProjectModal\((\d+)/)
        const statusMatch = onclick.match(/openEditProjectModal\(\d+,\s*['"]([^'"]+)['"]\)/)
        
        if (projectMatch) {
          const projectId = parseInt(projectMatch[1])
          const status = statusMatch ? statusMatch[1] : 'backlog'
          
          initSwipeActions(el, [
            { 
              icon: icons.check(), 
              label: 'Complete', 
              variant: 'success',
              onClick: () => {
                if (window.quickCompleteProject) {
                  window.quickCompleteProject(projectId, status)
                  haptic('medium')
                }
              }
            }
          ])
        }
      })
    }
  }, 100)
  
  return { render }
}

function getBoardEmoji(board) {
  const iconMap = {
    'etsy': icons.cart(),
    'photography': icons.camera(),
    'wholesale': icons.store(),
    '3dprint': icons.printer(),
    'all': icons.building()
  }
  return iconMap[board] || icons.clipboard()
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