/**
 * Projects Section
 * Project grid with progress tracking and team management
 */

import { store } from '../state/store.js'
import { Button } from '../components/Button.js'
import { Card } from '../components/Card.js'
import { Badge } from '../components/Badge.js'
import { Toast } from '../components/Toast.js'

let currentFilter = 'all'
let isMobile = window.innerWidth < 768

// Listen for resize
window.addEventListener('resize', () => {
  const newIsMobile = window.innerWidth < 768
  if (newIsMobile !== isMobile) {
    isMobile = newIsMobile
    const projectsSection = document.getElementById('projects')
    if (projectsSection && !projectsSection.classList.contains('hidden')) {
      const event = new CustomEvent('projects-rerender')
      window.dispatchEvent(event)
    }
  }
})

/**
 * Create the projects section
 * @param {string} containerId - ID of the container element
 * @returns {Object} Section API with render method
 */
export function createProjectsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`Container #${containerId} not found`)
    return
  }

  function getDaysUntilDue(dueDate) {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    due.setHours(0, 0, 0, 0)
    const diffTime = due - today
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  function getDueAlert(project) {
    if (!project.dueDate || project.status === 'done') return null
    const days = getDaysUntilDue(project.dueDate)
    if (days === null) return null
    if (days < 0) return { type: 'overdue', text: `${Math.abs(days)}d overdue` }
    if (days === 0) return { type: 'soon', text: 'Due today' }
    if (days === 1) return { type: 'soon', text: 'Due tomorrow' }
    if (days <= 3) return { type: 'soon', text: `Due in ${days}d` }
    return null
  }

  function getFilteredProjects(projects) {
    const allProjects = [
      ...(projects.backlog || []),
      ...(projects.todo || []),
      ...(projects.inprogress || []),
      ...(projects.done || [])
    ]

    if (currentFilter === 'all') return allProjects
    
    return allProjects.filter(p => {
      switch (currentFilter) {
        case 'active':
          return p.status !== 'done'
        case 'completed':
          return p.status === 'done'
        case 'high':
          return p.priority === 'high' && p.status !== 'done'
        case 'etsy':
          return p.board === 'etsy' || p.tags?.includes('etsy')
        case 'photo':
          return p.board === 'photography' || p.tags?.includes('photo')
        case 'b2b':
          return p.board === 'wholesale' || p.tags?.includes('b2b')
        default:
          return true
      }
    })
  }

  function getProjectStats(projects) {
    const allProjects = [
      ...(projects.backlog || []),
      ...(projects.todo || []),
      ...(projects.inprogress || []),
      ...(projects.done || [])
    ]
    
    const active = allProjects.filter(p => p.status !== 'done')
    const overdue = active.filter(p => {
      const alert = getDueAlert(p)
      return alert?.type === 'overdue'
    })
    const highPriority = active.filter(p => p.priority === 'high')
    
    return {
      total: allProjects.length,
      active: active.length,
      overdue: overdue.length,
      highPriority: highPriority.length
    }
  }

  function render() {
    const projects = store.getState().projects || { backlog: [], todo: [], inprogress: [], done: [] }
    const filtered = getFilteredProjects(projects)
    const stats = getProjectStats(projects)

    // Clear container
    container.innerHTML = ''

    // Header section
    const headerSection = document.createElement('div')
    headerSection.className = 'section-header'

    const headerCard = Card({
      className: 'welcome-card',
      body: (() => {
        const body = document.createElement('div')
        body.className = 'welcome-content'
        body.innerHTML = `
          <div class="welcome-text">
            <h2 class="welcome-title">
              <i data-lucide="folder" style="width: 24px; height: 24px;"></i>
              Projects
            </h2>
            <div class="welcome-badges">
              ${stats.overdue > 0 
                ? `<span class="badge badge--danger"><i data-lucide="flame" style="width: 12px; height: 12px;"></i> ${stats.overdue} overdue</span>`
                : stats.highPriority > 0
                  ? `<span class="badge badge--warning"><i data-lucide="zap" style="width: 12px; height: 12px;"></i> ${stats.highPriority} high priority</span>`
                  : `<span class="badge badge--primary">${stats.active} active</span>`
              }
            </div>
          </div>
        `
        return body
      })()
    })

    // Actions
    const actionsDiv = document.createElement('div')
    actionsDiv.className = 'header-actions'
    
    const newProjectBtn = Button({
      text: isMobile ? '' : 'New Project',
      icon: 'plus',
      variant: 'primary',
      onClick: () => {
        if (window.openProjectModal) window.openProjectModal()
      }
    })
    actionsDiv.appendChild(newProjectBtn)

    headerCard.querySelector('.card__body').appendChild(actionsDiv)
    headerSection.appendChild(headerCard)
    container.appendChild(headerSection)

    // Filter bar
    const filterSection = document.createElement('div')
    filterSection.className = 'filter-bar'

    const filters = [
      { id: 'all', label: 'All', count: stats.total },
      { id: 'active', label: 'Active' },
      { id: 'high', label: 'High Priority', icon: 'flame' },
      { id: 'etsy', label: 'Etsy', icon: 'shopping-cart' },
      { id: 'photo', label: 'Photo', icon: 'camera' },
      { id: 'b2b', label: 'B2B', icon: 'building-2' }
    ]

    filters.forEach(filter => {
      const btn = Button({
        text: filter.count ? `${filter.label} (${filter.count})` : filter.label,
        icon: filter.icon,
        variant: currentFilter === filter.id ? 'primary' : 'secondary',
        size: 'sm',
        onClick: () => {
          currentFilter = filter.id
          render()
        }
      })
      filterSection.appendChild(btn)
    })

    container.appendChild(filterSection)

    // Content area
    if (filtered.length === 0) {
      renderEmptyState(container)
    } else if (isMobile) {
      renderMobileList(container, filtered)
    } else {
      renderGrid(container, filtered)
    }

    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { 'stroke-width': 2 }, nameAttr: 'data-lucide' })
    }
  }

  function renderEmptyState(container) {
    const emptyState = document.createElement('div')
    emptyState.className = 'empty-state'
    emptyState.innerHTML = `
      <i data-lucide="folder" class="empty-state-icon" style="width: 64px; height: 64px;"></i>
      <h3 class="empty-state-title">No projects yet</h3>
      <p class="empty-state-message">Create your first project to get started</p>
    `
    
    const createBtn = Button({
      text: 'Create Project',
      icon: 'plus',
      variant: 'primary',
      onClick: () => {
        if (window.openProjectModal) window.openProjectModal()
      }
    })
    
    emptyState.appendChild(createBtn)
    container.appendChild(emptyState)
  }

  function renderMobileList(container, projects) {
    const listContainer = document.createElement('div')
    listContainer.className = 'project-list-view'

    // Group by status
    const grouped = {
      inprogress: projects.filter(p => p.status === 'inprogress'),
      todo: projects.filter(p => p.status === 'todo'),
      backlog: projects.filter(p => p.status === 'backlog'),
      done: projects.filter(p => p.status === 'done')
    }

    const statusConfig = {
      inprogress: { label: 'In Progress', icon: 'zap', color: 'var(--color-warning)' },
      todo: { label: 'To Do', icon: 'circle', color: 'var(--color-primary)' },
      backlog: { label: 'Backlog', icon: 'archive', color: 'var(--color-text-muted)' },
      done: { label: 'Done', icon: 'check-circle', color: 'var(--color-success)' }
    }

    Object.entries(grouped).forEach(([status, items]) => {
      if (items.length === 0) return

      const group = document.createElement('div')
      group.className = 'project-list-group'

      const header = document.createElement('div')
      header.className = 'project-list-group-header'
      header.innerHTML = `
        <i data-lucide="${statusConfig[status].icon}" style="width: 16px; height: 16px; color: ${statusConfig[status].color};"></i>
        <span>${statusConfig[status].label}</span>
        <span class="badge badge--neutral">${items.length}</span>
      `
      group.appendChild(header)

      items.forEach(project => {
        const card = createProjectCard(project, true)
        group.appendChild(card)
      })

      listContainer.appendChild(group)
    })

    container.appendChild(listContainer)
  }

  function renderGrid(container, projects) {
    const grid = document.createElement('div')
    grid.className = 'project-grid'

    projects.forEach(project => {
      const card = createProjectCard(project, false)
      grid.appendChild(card)
    })

    container.appendChild(grid)
  }

  function createProjectCard(project, isMobile) {
    const alert = getDueAlert(project)
    const status = project.status || 'backlog'
    
    const cardContent = document.createElement('div')
    cardContent.className = 'project-card-content'

    // Title row
    const titleRow = document.createElement('div')
    titleRow.className = 'project-card-title-row'
    
    const title = document.createElement('h4')
    title.className = 'project-card-title'
    title.textContent = project.title
    titleRow.appendChild(title)

    // Status badge
    const statusBadge = Badge({
      text: status.charAt(0).toUpperCase() + status.slice(1),
      variant: status === 'done' ? 'success' : status === 'inprogress' ? 'warning' : 'neutral'
    })
    titleRow.appendChild(statusBadge)

    cardContent.appendChild(titleRow)

    // Description
    if (project.desc) {
      const desc = document.createElement('p')
      desc.className = 'project-card-desc'
      desc.textContent = project.desc
      cardContent.appendChild(desc)
    }

    // Meta row
    const metaRow = document.createElement('div')
    metaRow.className = 'project-card-meta'

    // Due date badge
    if (alert) {
      const alertBadge = Badge({
        text: alert.text,
        variant: alert.type === 'overdue' ? 'danger' : 'warning',
        icon: alert.type === 'overdue' ? 'flame' : 'clock'
      })
      metaRow.appendChild(alertBadge)
    } else if (project.dueDate) {
      const dueBadge = Badge({
        text: formatDate(project.dueDate),
        variant: 'neutral',
        icon: 'calendar'
      })
      metaRow.appendChild(dueBadge)
    }

    // Priority badge
    if (project.priority) {
      const priorityBadge = Badge({
        text: project.priority.charAt(0).toUpperCase() + project.priority.slice(1),
        variant: project.priority === 'high' ? 'danger' : project.priority === 'medium' ? 'warning' : 'success'
      })
      metaRow.appendChild(priorityBadge)
    }

    // Board badge
    if (project.board && project.board !== 'all') {
      const boardIcons = {
        etsy: 'shopping-cart',
        photography: 'camera',
        wholesale: 'building-2',
        '3dprint': 'printer'
      }
      const boardBadge = Badge({
        text: project.board,
        variant: 'neutral',
        icon: boardIcons[project.board] || 'folder'
      })
      metaRow.appendChild(boardBadge)
    }

    cardContent.appendChild(metaRow)

    // Progress bar (for in-progress projects)
    if (status === 'inprogress' && project.progress !== undefined) {
      const progressContainer = document.createElement('div')
      progressContainer.className = 'project-progress'
      
      const progressHeader = document.createElement('div')
      progressHeader.className = 'project-progress-header'
      progressHeader.innerHTML = `
        <span>Progress</span>
        <span class="project-progress-value">${project.progress}%</span>
      `
      progressContainer.appendChild(progressHeader)

      const progressBar = document.createElement('div')
      progressBar.className = 'project-progress-bar'
      progressBar.innerHTML = `<div class="project-progress-fill" style="width: ${project.progress}%;"></div>`
      progressContainer.appendChild(progressBar)

      cardContent.appendChild(progressContainer)
    }

    // Task count
    if (project.tasks) {
      const completed = project.tasks.filter(t => t.completed).length
      const total = project.tasks.length
      const taskInfo = document.createElement('div')
      taskInfo.className = 'project-task-count'
      taskInfo.innerHTML = `
        <i data-lucide="check-square" style="width: 14px; height: 14px;"></i>
        <span>${completed}/${total} tasks</span>
      `
      cardContent.appendChild(taskInfo)
    }

    // Team members
    if (project.team?.length) {
      const teamDiv = document.createElement('div')
      teamDiv.className = 'project-team'
      
      project.team.slice(0, 4).forEach(member => {
        const avatar = document.createElement('div')
        avatar.className = 'project-team-avatar'
        avatar.textContent = member.charAt(0).toUpperCase()
        avatar.title = member
        teamDiv.appendChild(avatar)
      })
      
      if (project.team.length > 4) {
        const more = document.createElement('div')
        more.className = 'project-team-avatar project-team-more'
        more.textContent = `+${project.team.length - 4}`
        teamDiv.appendChild(more)
      }
      
      cardContent.appendChild(teamDiv)
    }

    // Tags
    if (project.tags?.length) {
      const tagsRow = document.createElement('div')
      tagsRow.className = 'project-card-tags'
      project.tags.slice(0, 3).forEach(tag => {
        const tagSpan = document.createElement('span')
        tagSpan.className = 'project-tag'
        tagSpan.textContent = `#${tag}`
        tagsRow.appendChild(tagSpan)
      })
      if (project.tags.length > 3) {
        const moreSpan = document.createElement('span')
        moreSpan.className = 'project-tag-more'
        moreSpan.textContent = `+${project.tags.length - 3}`
        tagsRow.appendChild(moreSpan)
      }
      cardContent.appendChild(tagsRow)
    }

    const card = Card({
      className: `project-card ${status === 'done' ? 'project-card--completed' : ''}`,
      body: cardContent,
      clickable: true,
      onClick: () => {
        if (window.openEditProjectModal) {
          window.openEditProjectModal(project.id, status)
        }
      }
    })

    return card
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateOnly = new Date(date)
    dateOnly.setHours(0, 0, 0, 0)
    
    const diffTime = dateOnly - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0 && diffDays < 7) return `In ${diffDays}d`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Subscribe to store changes
  store.subscribe((state, path) => {
    if (!path || path.includes('projects')) {
      render()
    }
  })

  // Listen for re-render events
  window.addEventListener('projects-rerender', render)

  // Expose functions globally
  window.setProjectFilter = (filter) => {
    currentFilter = filter
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
      Toast.success('Project completed', project.title)
    }
  }

  // Initial render
  render()

  return { render }
}

export default createProjectsSection
