/**
 * Priorities Section
 * Kanban board (desktop) and list view (mobile) for managing priorities
 */

import { store } from '../state/store.js'
import { Button } from '../components/Button.js'
import { Card } from '../components/Card.js'
import { Badge } from '../components/Badge.js'
import { Toast } from '../components/Toast.js'

let currentFilter = 'all'
let currentAssignee = null
let isMobile = window.innerWidth < 768
let viewMode = isMobile ? 'list' : 'kanban'
let draggedItem = null
let draggedSourceColumn = null

// Listen for resize to switch between mobile/desktop views
window.addEventListener('resize', () => {
  const newIsMobile = window.innerWidth < 768
  if (newIsMobile !== isMobile) {
    isMobile = newIsMobile
    viewMode = isMobile ? 'list' : 'kanban'
    const prioritiesSection = document.getElementById('priorities')
    if (prioritiesSection && !prioritiesSection.classList.contains('hidden')) {
      const event = new CustomEvent('priorities-rerender')
      window.dispatchEvent(event)
    }
  }
})

/**
 * Create the priorities section
 * @param {string} containerId - ID of the container element
 * @returns {Object} Section API with render method
 */
export function createPrioritiesSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`Container #${containerId} not found`)
    return
  }

  function getFilteredPriorities(priorities) {
    let filtered = [...priorities]

    // Filter by status
    if (currentFilter === 'active') {
      filtered = filtered.filter(p => !p.completed)
    } else if (currentFilter === 'completed') {
      filtered = filtered.filter(p => p.completed)
    } else if (currentFilter === 'urgent') {
      filtered = filtered.filter(p => p.priority === 'high' || p.tags?.includes('urgent'))
    } else if (currentFilter === 'due-soon') {
      filtered = filtered.filter(p => {
        const daysUntil = getDaysUntilDue(p.dueDate)
        return daysUntil !== null && daysUntil <= 3 && !p.completed
      })
    }

    // Filter by assignee
    if (currentAssignee) {
      filtered = filtered.filter(p => p.assignee === currentAssignee)
    }

    return filtered
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

  function getDueAlert(priority) {
    if (!priority.dueDate || priority.completed) return null
    const days = getDaysUntilDue(priority.dueDate)
    if (days === null) return null
    if (days < 0) return { type: 'overdue', text: `${Math.abs(days)}d overdue` }
    if (days === 0) return { type: 'soon', text: 'Due today' }
    if (days === 1) return { type: 'soon', text: 'Due tomorrow' }
    if (days <= 3) return { type: 'soon', text: `Due in ${days}d` }
    return null
  }

  function getPriorityVariant(priority) {
    const map = {
      high: 'danger',
      medium: 'warning',
      low: 'success'
    }
    return map[priority?.toLowerCase()] || 'neutral'
  }

  function getStatusVariant(status) {
    const map = {
      now: 'primary',
      later: 'neutral',
      done: 'success'
    }
    return map[status] || 'neutral'
  }

  function render() {
    const priorities = store.getState().priorities || []
    const allPriorities = [...priorities]
    const filtered = getFilteredPriorities(priorities)

    // Group by status
    const columns = {
      later: filtered.filter(p => !p.completed && (!p.status || p.status === 'later')),
      now: filtered.filter(p => !p.completed && p.status === 'now'),
      done: filtered.filter(p => p.completed || p.status === 'done')
    }

    const activeCount = allPriorities.filter(p => !p.completed).length
    const overdueCount = allPriorities.filter(p => {
      const alert = getDueAlert(p)
      return alert?.type === 'overdue'
    }).length

    // Clear container
    container.innerHTML = ''

    // Create header section
    const headerSection = document.createElement('div')
    headerSection.className = 'section-header'

    // Welcome header card
    const headerCard = Card({
      className: 'welcome-card',
      body: (() => {
        const body = document.createElement('div')
        body.className = 'welcome-content'
        body.innerHTML = `
          <div class="welcome-text">
            <h2 class="welcome-title">
              <i data-lucide="star" style="width: 24px; height: 24px;"></i>
              Priorities
            </h2>
            <div class="welcome-badges">
              ${overdueCount > 0 
                ? `<span class="badge badge--danger"><i data-lucide="flame" style="width: 12px; height: 12px;"></i> ${overdueCount} overdue</span>`
                : `<span class="badge badge--primary">${activeCount} active</span>`
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
    
    const newPriorityBtn = Button({
      text: isMobile ? '' : 'New Priority',
      icon: 'plus',
      variant: 'primary',
      onClick: () => {
        if (window.openPriorityModal) window.openPriorityModal()
      }
    })
    actionsDiv.appendChild(newPriorityBtn)

    headerCard.querySelector('.card__body').appendChild(actionsDiv)
    headerSection.appendChild(headerCard)
    container.appendChild(headerSection)

    // Filter bar
    const filterSection = document.createElement('div')
    filterSection.className = 'filter-bar'

    const filters = [
      { id: 'all', label: 'All', count: activeCount },
      { id: 'active', label: 'Active' },
      { id: 'urgent', label: 'Urgent', icon: 'flame' },
      { id: 'due-soon', label: 'Due Soon', icon: 'clock' },
      { id: 'completed', label: 'Done', icon: 'check' }
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

    // Assignee filters
    const assigneeDiv = document.createElement('div')
    assigneeDiv.className = 'assignee-filters'
    
    ;['KimiClaw', 'Oleg'].forEach(assignee => {
      const btn = Button({
        text: assignee,
        icon: assignee === 'KimiClaw' ? 'bot' : 'user',
        variant: currentAssignee === assignee ? 'primary' : 'ghost',
        size: 'sm',
        onClick: () => {
          currentAssignee = currentAssignee === assignee ? null : assignee
          render()
        }
      })
      assigneeDiv.appendChild(btn)
    })

    filterSection.appendChild(assigneeDiv)
    container.appendChild(filterSection)

    // View toggle (desktop only)
    if (!isMobile) {
      const viewToggle = document.createElement('div')
      viewToggle.className = 'view-toggle'
      
      const kanbanBtn = Button({
        text: 'Board',
        icon: 'layout-kanban',
        variant: viewMode === 'kanban' ? 'primary' : 'secondary',
        size: 'sm',
        onClick: () => {
          viewMode = 'kanban'
          render()
        }
      })
      
      const listBtn = Button({
        text: 'List',
        icon: 'list',
        variant: viewMode === 'list' ? 'primary' : 'secondary',
        size: 'sm',
        onClick: () => {
          viewMode = 'list'
          render()
        }
      })
      
      viewToggle.appendChild(kanbanBtn)
      viewToggle.appendChild(listBtn)
      container.appendChild(viewToggle)
    }

    // Content area
    if (filtered.length === 0) {
      renderEmptyState(container)
    } else if (isMobile || viewMode === 'list') {
      renderListView(container, columns)
    } else {
      renderKanbanView(container, columns)
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
      <i data-lucide="star" class="empty-state-icon" style="width: 64px; height: 64px;"></i>
      <h3 class="empty-state-title">No priorities found</h3>
      <p class="empty-state-message">
        ${currentFilter !== 'all' || currentAssignee 
          ? 'Try changing your filters or create a new priority' 
          : 'Create your first priority to get started'}
      </p>
    `
    
    const createBtn = Button({
      text: 'Create Priority',
      icon: 'plus',
      variant: 'primary',
      onClick: () => {
        if (window.openPriorityModal) window.openPriorityModal()
      }
    })
    
    emptyState.appendChild(createBtn)
    container.appendChild(emptyState)
  }

  function renderListView(container, columns) {
    const listContainer = document.createElement('div')
    listContainer.className = 'priority-list-view'

    const columnOrder = ['now', 'later', 'done']
    const columnLabels = {
      now: { label: 'Now', icon: 'zap', color: 'var(--color-primary)' },
      later: { label: 'Later', icon: 'clock', color: 'var(--color-text-muted)' },
      done: { label: 'Done', icon: 'check', color: 'var(--color-success)' }
    }

    columnOrder.forEach(columnId => {
      const items = columns[columnId]
      if (items.length === 0) return

      const group = document.createElement('div')
      group.className = 'priority-list-group'

      const header = document.createElement('div')
      header.className = 'priority-list-group-header'
      header.innerHTML = `
        <i data-lucide="${columnLabels[columnId].icon}" style="width: 16px; height: 16px; color: ${columnLabels[columnId].color};"></i>
        <span>${columnLabels[columnId].label}</span>
        <span class="badge badge--neutral">${items.length}</span>
      `
      group.appendChild(header)

      items.forEach(priority => {
        const card = createPriorityCard(priority, true)
        group.appendChild(card)
      })

      listContainer.appendChild(group)
    })

    container.appendChild(listContainer)
  }

  function renderKanbanView(container, columns) {
    const kanban = document.createElement('div')
    kanban.className = 'kanban-board'

    const columnConfig = {
      later: { label: 'Later', icon: 'clock' },
      now: { label: 'Now', icon: 'zap' },
      done: { label: 'Done', icon: 'check' }
    }

    Object.entries(columnConfig).forEach(([columnId, config]) => {
      const column = document.createElement('div')
      column.className = 'kanban-column'
      column.dataset.column = columnId

      // Column header
      const header = document.createElement('div')
      header.className = 'kanban-column-header'
      header.innerHTML = `
        <div class="kanban-column-title">
          <i data-lucide="${config.icon}" style="width: 16px; height: 16px;"></i>
          <span>${config.label}</span>
          <span class="badge badge--neutral">${columns[columnId].length}</span>
        </div>
      `
      column.appendChild(header)

      // Column content (drop zone)
      const content = document.createElement('div')
      content.className = 'kanban-column-content'
      content.dataset.column = columnId

      // Drag and drop handlers
      content.addEventListener('dragover', handleDragOver)
      content.addEventListener('dragleave', handleDragLeave)
      content.addEventListener('drop', (e) => handleDrop(e, columnId))

      columns[columnId].forEach(priority => {
        const card = createPriorityCard(priority, false)
        content.appendChild(card)
      })

      column.appendChild(content)
      kanban.appendChild(column)
    })

    container.appendChild(kanban)
  }

  function createPriorityCard(priority, isListView) {
    const alert = getDueAlert(priority)
    const status = priority.completed ? 'done' : (priority.status || 'later')
    
    const cardContent = document.createElement('div')
    cardContent.className = 'priority-card-content'

    // Title row
    const titleRow = document.createElement('div')
    titleRow.className = 'priority-card-title-row'
    
    const title = document.createElement('h4')
    title.className = 'priority-card-title'
    title.textContent = priority.text
    titleRow.appendChild(title)

    // Complete button
    if (!priority.completed) {
      const completeBtn = document.createElement('button')
      completeBtn.className = 'priority-complete-btn'
      completeBtn.innerHTML = `<i data-lucide="circle" style="width: 20px; height: 20px;"></i>`
      completeBtn.onclick = (e) => {
        e.stopPropagation()
        completePriority(priority.id)
      }
      titleRow.appendChild(completeBtn)
    } else {
      const doneIcon = document.createElement('span')
      doneIcon.className = 'priority-done-icon'
      doneIcon.innerHTML = `<i data-lucide="check-circle" style="width: 20px; height: 20px; color: var(--color-success);"></i>`
      titleRow.appendChild(doneIcon)
    }

    cardContent.appendChild(titleRow)

    // Description
    if (priority.desc) {
      const desc = document.createElement('p')
      desc.className = 'priority-card-desc'
      desc.textContent = priority.desc
      cardContent.appendChild(desc)
    }

    // Meta row
    const metaRow = document.createElement('div')
    metaRow.className = 'priority-card-meta'

    // Due date badge
    if (alert) {
      const alertBadge = Badge({
        text: alert.text,
        variant: alert.type === 'overdue' ? 'danger' : 'warning',
        icon: alert.type === 'overdue' ? 'flame' : 'clock'
      })
      metaRow.appendChild(alertBadge)
    } else if (priority.dueDate) {
      const dueBadge = Badge({
        text: formatDate(priority.dueDate),
        variant: 'neutral',
        icon: 'calendar'
      })
      metaRow.appendChild(dueBadge)
    }

    // Priority badge
    if (priority.priority) {
      const priorityBadge = Badge({
        text: priority.priority.charAt(0).toUpperCase() + priority.priority.slice(1),
        variant: getPriorityVariant(priority.priority)
      })
      metaRow.appendChild(priorityBadge)
    }

    // Assignee badge
    if (priority.assignee) {
      const assigneeBadge = Badge({
        text: priority.assignee,
        variant: 'neutral',
        icon: priority.assignee === 'KimiClaw' ? 'bot' : 'user'
      })
      metaRow.appendChild(assigneeBadge)
    }

    cardContent.appendChild(metaRow)

    // Tags
    if (priority.tags?.length) {
      const tagsRow = document.createElement('div')
      tagsRow.className = 'priority-card-tags'
      priority.tags.slice(0, 3).forEach(tag => {
        const tagSpan = document.createElement('span')
        tagSpan.className = `priority-tag ${tag === 'urgent' ? 'priority-tag--urgent' : ''}`
        tagSpan.textContent = tag
        tagsRow.appendChild(tagSpan)
      })
      if (priority.tags.length > 3) {
        const moreSpan = document.createElement('span')
        moreSpan.className = 'priority-tag-more'
        moreSpan.textContent = `+${priority.tags.length - 3}`
        tagsRow.appendChild(moreSpan)
      }
      cardContent.appendChild(tagsRow)
    }

    const card = Card({
      className: `priority-card ${priority.completed ? 'priority-card--completed' : ''}`,
      body: cardContent,
      clickable: true,
      onClick: () => {
        if (window.openEditPriorityModal) {
          window.openEditPriorityModal(priority.id)
        }
      }
    })

    // Add drag attributes for kanban
    if (!isListView && !priority.completed) {
      card.draggable = true
      card.dataset.priorityId = priority.id
      card.addEventListener('dragstart', handleDragStart)
      card.addEventListener('dragend', handleDragEnd)
    }

    return card
  }

  // Drag and drop handlers
  function handleDragStart(e) {
    draggedItem = this
    draggedSourceColumn = this.closest('.kanban-column-content')?.dataset.column
    this.classList.add('dragging')
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', this.dataset.priorityId)
  }

  function handleDragEnd(e) {
    this.classList.remove('dragging')
    draggedItem = null
    draggedSourceColumn = null
    document.querySelectorAll('.kanban-column-content').forEach(col => {
      col.classList.remove('drag-over')
    })
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    this.classList.add('drag-over')
  }

  function handleDragLeave(e) {
    this.classList.remove('drag-over')
  }

  function handleDrop(e, targetColumn) {
    e.preventDefault()
    this.classList.remove('drag-over')
    
    const priorityId = parseInt(e.dataTransfer.getData('text/plain'))
    if (!priorityId) return

    const priorities = store.get('priorities')
    const priority = priorities.find(p => p.id === priorityId)
    if (!priority) return

    // Update status based on column
    if (targetColumn === 'done') {
      priority.completed = true
      priority.status = 'done'
      priority.completedAt = new Date().toISOString()
    } else {
      priority.completed = false
      priority.status = targetColumn
      delete priority.completedAt
    }

    store.set('priorities', priorities)
    Toast.success(`Moved to ${targetColumn}`)
    render()
  }

  function completePriority(id) {
    const priorities = store.get('priorities')
    const priority = priorities.find(p => p.id === id)
    if (!priority) return

    priority.completed = true
    priority.status = 'done'
    priority.completedAt = new Date().toISOString()
    store.set('priorities', priorities)
    Toast.success('Priority completed')
    render()
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
    if (!path || path.includes('priorities')) {
      render()
    }
  })

  // Listen for re-render events
  window.addEventListener('priorities-rerender', render)

  // Expose functions globally
  window.setPriorityFilter = (filter) => {
    currentFilter = filter
    render()
  }

  window.setPriorityAssignee = (assignee) => {
    currentAssignee = assignee
    render()
  }

  window.setPriorityView = (mode) => {
    viewMode = mode
    render()
  }

  window.quickCompletePriority = completePriority

  // Initial render
  render()

  return { render }
}

export default createPrioritiesSection
