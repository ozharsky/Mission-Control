import { store } from '../state/store.js'
import { createKanban } from '../components/Kanban.js'
import { sortPriorities, getDueAlert, getPriorityBorderClass, getPriorityScore } from '../utils/priority.js'
import { bulk } from '../components/Bulk.js'
import { isPriorityBlocked } from '../utils/taskUtils.js'
import { openEditPriorityModal } from '../components/EditPriorityModal.js'
import { openPriorityModal } from '../components/PriorityModal.js'
import { toast } from '../components/Toast.js'
import { filterByBoard, getCurrentBoardLabel } from '../components/BoardSelector.js'
import { createDraggableList } from '../utils/dragDrop.js'
import { addTouchFeedback, initSwipe, haptic } from '../utils/mobileInteractions.js'
import { icons } from '../utils/icons.js'

let currentFilter = 'all'
let currentAssignee = null
let isMobile = window.innerWidth < 768
let viewMode = isMobile ? 'list' : 'kanban' // Default to list on mobile, kanban on desktop
let kanbanInstance = null
let draggableList = null

// Listen for resize to switch between mobile/desktop views
window.addEventListener('resize', () => {
  const newIsMobile = window.innerWidth < 768
  if (newIsMobile !== isMobile) {
    isMobile = newIsMobile
    // Switch to appropriate view mode when crossing mobile/desktop boundary
    viewMode = isMobile ? 'list' : 'kanban'
    // Re-render if priorities section is active
    const prioritiesSection = document.getElementById('priorities')
    if (prioritiesSection && !prioritiesSection.classList.contains('hidden')) {
      const event = new CustomEvent('priorities-rerender')
      window.dispatchEvent(event)
    }
  }
})

export function createPrioritiesSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function getFilteredPriorities(priorities) {
    // First filter by board
    let filtered = filterByBoard(priorities, 'board')
    
    // Then filter by status
    if (currentFilter === 'active') {
      filtered = filtered.filter(p => !p.completed)
    } else if (currentFilter === 'completed') {
      filtered = filtered.filter(p => p.completed)
    } else if (currentFilter === 'urgent') {
      filtered = filtered.filter(p => p.tags?.includes('urgent') || p.priority === 'high')
    } else if (currentFilter === 'due-soon') {
      filtered = filtered.filter(p => {
        const alert = getDueAlert(p)
        return alert?.type === 'soon' || alert?.type === 'overdue'
      })
    } else if (currentFilter === 'blocked') {
      filtered = filtered.filter(p => isPriorityBlocked(p, priorities))
    }
    
    // Filter by assignee
    if (currentAssignee) {
      filtered = filtered.filter(p => p.assignee === currentAssignee)
    }
    
    return filtered
  }
  
  function render() {
    let priorities = store.getState().priorities || []
    const allPriorities = [...priorities]
    
    // Apply filters
    priorities = getFilteredPriorities(priorities)
    
    // Sort by priority score
    priorities = sortPriorities(priorities)
    
    const items = priorities.map(p => ({ ...p, status: p.status || 'later' }))
    
    const activeCount = allPriorities.filter(p => !p.completed).length
    const filteredCount = priorities.filter(p => !p.completed).length
    const overdueCount = priorities.filter(p => {
      const alert = getDueAlert(p)
      return alert?.type === 'overdue' && !p.completed
    }).length
    const blockedCount = priorities.filter(p => isPriorityBlocked(p, allPriorities) && !p.completed).length
    
    const boardLabel = getCurrentBoardLabel()
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar m-card">
        <div class="welcome-content">
          <div class="welcome-greeting m-title">${icons.star()} Priorities</div>
          <div class="welcome-status">
            ${overdueCount > 0 
              ? `<span class="m-badge-danger">${icons.flame()} ${overdueCount} overdue</span>`
              : blockedCount > 0
                ? `<span class="m-badge-warning">${icons.lock()} ${blockedCount} blocked</span>`
                : `<span class="m-badge-primary">${activeCount} active</span>`
            }
            <span class="m-badge-secondary">${boardLabel}</span>
            ${currentFilter !== 'all' || currentAssignee ? 
              `<span class="m-badge-info">Showing ${filteredCount}</span>` : ''}
          </div>
        </div>
        <div class="welcome-actions">
          <button class="m-btn-secondary hide-mobile m-touch" onclick="toggleBulkMode()"
          >${bulk.isActive ? icons.check() + ' Done' : icons.menu() + ' Bulk'}</button>
          <button class="m-btn-primary m-touch" onclick="openPriorityModal()">
            <span>${icons.plus()}</span>
            <span class="hide-mobile">New Priority</span>
          </button>
        </div>
      </div>
      
      <!-- View Toggle & Filters -->
      <div class="priority-toolbar m-toolbar">
        <div class="filter-bar priority-filters m-scroll-x">
          <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''} m-touch" onclick="setPriorityFilter('all')"
            title="Show all priorities">
            <span>All</span>
            <span class="filter-count m-badge">${activeCount}</span>
          </button>
          <button class="filter-btn ${currentFilter === 'active' ? 'active' : ''} m-touch" onclick="setPriorityFilter('active')"
            title="Active priorities">
            <span>Active</span>
          </button>
          <button class="filter-btn ${currentFilter === 'urgent' ? 'active' : ''} m-touch" onclick="setPriorityFilter('urgent')"
            title="Urgent & high priority">
            <span>${icons.flame()} Urgent</span>
          </button>
          <button class="filter-btn ${currentFilter === 'due-soon' ? 'active' : ''} m-touch" onclick="setPriorityFilter('due-soon')"
            title="Due within 3 days">
            <span>${icons.clock()} Due Soon</span>
          </button>
          <button class="filter-btn ${currentFilter === 'blocked' ? 'active' : ''} m-touch" onclick="setPriorityFilter('blocked')"
            title="Blocked by dependencies">
            <span>${icons.lock()} Blocked</span>
          </button>
          <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''} m-touch" onclick="setPriorityFilter('completed')"
            title="Completed priorities">
            <span>${icons.check()} Done</span>
          </button>
          
          <div class="filter-divider"></div>
          
          <button class="filter-btn assignee-btn ${currentAssignee === 'KimiClaw' ? 'active' : ''} m-touch" 
            onclick="setPriorityAssignee('KimiClaw')"
            title="Assigned to KimiClaw">
            <span>${icons.bot()} Kimi</span>
          </button>
          <button class="filter-btn assignee-btn ${currentAssignee === 'Oleg' ? 'active' : ''} m-touch" 
            onclick="setPriorityAssignee('Oleg')"
            title="Assigned to Oleg">
            <span>${icons.user()} Oleg</span>
          </button>
          ${currentAssignee ? `
            <button class="filter-btn m-touch" onclick="setPriorityAssignee(null)" title="Clear assignee filter">
              <span>${icons.x()}</span>
            </button>
          ` : ''}
        </div>
        
        <div class="view-toggle m-view-toggle">
          <button class="m-btn-secondary m-touch ${viewMode === 'kanban' ? 'active' : ''}" 
            onclick="setPriorityView('kanban')" title="Kanban view">
            ${icons.clipboard()} Board
          </button>
          <button class="m-btn-secondary m-touch ${viewMode === 'list' ? 'active' : ''}" 
            onclick="setPriorityView('list')" title="List view with drag & drop">
            ${icons.menu()} List
          </button>
        </div>
      </div>
      
      <!-- Kanban Board, List View, or Mobile Grouped List -->
      ${isMobile ? `
        <div id="prioritiesMobileList" class="priorities-mobile-list"></div>
      ` : viewMode === 'kanban' ? `
        <div id="prioritiesKanban"></div>
      ` : `
        <div id="prioritiesList" class="priority-list-view"></div>
      `}
      
      ${filteredCount === 0 && items.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">${icons.star()}</div>
          <div class="empty-state-title m-title">No priorities found</div>
          <div class="empty-state-text m-body">
            ${currentFilter !== 'all' || currentAssignee 
              ? 'Try changing your filters or create a new priority' 
              : 'Create your first priority to get started'}
          </div>
          <button class="m-btn-primary m-touch" onclick="openPriorityModal()">${icons.plus()} Create Priority</button>
        </div>
      ` : ''}
    `
    
    // Only init kanban or list if we have items
    if (items.length > 0) {
      if (isMobile) {
        // Mobile grouped list view
        renderMobileGroupedList(items, allPriorities)
      } else if (viewMode === 'kanban') {
        kanbanInstance = createKanban('prioritiesKanban', {
          columns: [
            { id: 'later', label: 'Later', icon: 'download' },
            { id: 'now', label: 'Now', icon: 'zap' },
            { id: 'done', label: 'Done', icon: 'check' }
          ],
          items: items,
          renderItem: (priority) => renderPriorityCard(priority, allPriorities)
        })
      } else {
        // List view with drag and drop
        const listContainer = document.getElementById('prioritiesList')
        if (listContainer) {
          // Sort by order if exists, otherwise by priority score
          const sortedItems = [...items].sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              return a.order - b.order
            }
            return getPriorityScore(b) - getPriorityScore(a)
          })
          
          draggableList = createDraggableList({
            container: listContainer,
            items: sortedItems,
            onReorder: (newItems) => {
              store.set('priorities', newItems)
              toast.success('Priorities reordered')
            },
            renderItem: (priority) => renderPriorityListItem(priority, allPriorities)
          })
        }
      }
    }
  }
  
  function renderPriorityCard(priority, allPriorities) {
    const alert = getDueAlert(priority)
    const borderClass = getPriorityBorderClass(priority)
    const isBlocked = isPriorityBlocked(priority, allPriorities)
    const score = getPriorityScore(priority)
    
    // Get attached files count
    const docs = store.get('docs') || []
    const attachedFiles = docs.filter(d => d.priorityId == priority.id || d.priorityId === priority.id)
    const fileCount = attachedFiles.length
    
    return `
      <div class="priority-card ${borderClass} ${priority.completed ? 'completed' : ''} ${isBlocked ? 'blocked' : ''}"
           onclick="${!bulk.isActive ? `openEditPriorityModal(${priority.id})` : `bulk.toggleSelection(${priority.id})`}">
        
        <div class="priority-card-inner">
          ${bulk.isActive ? renderBulkCheckbox(priority.id) : ''}
          
          <div class="priority-card-content">
            <!-- Header Row -->
            <div class="priority-card-header">
              <h4 class="priority-card-title">
                ${isBlocked ? `<span class="blocked-badge" title="Blocked">${icons.lock()}</span>` : ''}
                ${escapeHtml(priority.text)}
              </h4>
              
              ${!bulk.isActive && !priority.completed ? `
                <button class="priority-complete-btn" 
                  onclick="event.stopPropagation(); quickComplete(${priority.id})"
                  title="Mark complete">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" stroke-width="2" opacity="0.3"/>
                    <path d="M6 10l3 3 5-6" stroke="currentColor" stroke-width="2" 
                      stroke-linecap="round" stroke-linejoin="round" opacity="0"/>
                  </svg>
                </button>
              ` : priority.completed ? `
                <span class="priority-done-icon">${icons.check()}</span>
              ` : ''}
            </div>
            
            <!-- Description -->
            ${priority.desc ? `
              <p class="priority-card-desc">${escapeHtml(priority.desc)}</p>
            ` : ''}
            
            <!-- Meta Row -->
            <div class="priority-card-meta">
              ${alert ? `
                <span class="priority-alert ${alert.type}">
                  ${alert.type === 'overdue' ? icons.flame() : icons.clock()} ${alert.text}
                </span>
              ` : ''}
              
              ${priority.dueDate && !alert ? `
                <span class="priority-due">${icons.calendar()} ${formatDate(priority.dueDate)}</span>
              ` : ''}
              
              ${priority.assignee ? `
                <span class="priority-assignee ${priority.assignee}">
                  ${priority.assignee === 'KimiClaw' ? icons.bot() : icons.user()} ${priority.assignee}
                </span>
              ` : ''}
              
              ${priority.board && priority.board !== 'all' ? `
                <span class="priority-board">${getBoardEmoji(priority.board)} ${priority.board}</span>
              ` : ''}
              
              ${priority.recurring && priority.recurring !== 'none' ? `
                <span class="priority-recurring" title="Recurring: ${priority.recurring}">${icons.refresh()}</span>
              ` : ''}
              
              ${fileCount > 0 ? `
                <span class="priority-files" title="${fileCount} file${fileCount > 1 ? 's' : ''} attached">${icons.paperclip()} ${fileCount}</span>
              ` : ''}
            </div>
            
            <!-- Tags -->
            ${priority.tags?.length ? `
              <div class="priority-card-tags">
                ${priority.tags.slice(0, 3).map(tag => `
                  <span class="priority-tag ${tag === 'urgent' ? 'urgent' : ''}">${escapeHtml(tag)}</span>
                `).join('')}
                ${priority.tags.length > 3 ? `
                  <span class="priority-tag-more">+${priority.tags.length - 3}</span>
                ` : ''}
              </div>
            ` : ''}
            
            <!-- Time Tracking -->
            ${renderTimeBar(priority)}
            
            <!-- Blocked By -->
            ${isBlocked ? renderBlockedBy(priority, allPriorities) : ''}
          </div>
        </div>
      </div>
    `
  }
  
  function renderPriorityListItem(priority, allPriorities) {
    const alert = getDueAlert(priority)
    const isBlocked = isPriorityBlocked(priority, allPriorities)
    const score = getPriorityScore(priority)
    
    return `
      <div class="priority-list-item ${priority.completed ? 'completed' : ''} ${isBlocked ? 'blocked' : ''}"
           onclick="openEditPriorityModal(${priority.id})"
      >
        <div class="priority-list-drag"
             onclick="event.stopPropagation()"
        >⋮⋮</div>
        
        <div class="priority-list-status"
             style="background: ${getStatusColor(priority)};"
        ></div>
        
        <div class="priority-list-content"
        >
          <div class="priority-list-title"
          >${isBlocked ? icons.lock() + ' ' : ''}${escapeHtml(priority.text)}</div>
          
          <div class="priority-list-meta"
          >
            ${alert ? `<span class="${alert.type}">${alert.type === 'overdue' ? icons.flame() : icons.clock()} ${alert.text}</span>` : ''}
            ${priority.dueDate ? `<span>${icons.calendar()} ${formatDate(priority.dueDate)}</span>` : ''}
            ${priority.assignee ? `<span>${priority.assignee === 'KimiClaw' ? icons.bot() : icons.user()} ${priority.assignee}</span>` : ''}
            ${priority.board && priority.board !== 'all' ? `<span>${getBoardEmoji(priority.board)} ${priority.board}</span>` : ''}
            ${priority.tags?.length ? `<span>${icons.tag()} ${priority.tags.slice(0, 2).join(', ')}</span>` : ''}
          </div>
        </div>
        
        <div class="priority-list-score"
        >
          <div style="font-weight: 600; color: var(--text-primary);">${Math.round(score)}</div>
          <div>score</div>
        </div>
        
        ${!priority.completed ? `
          <button class="m-btn-secondary" onclick="event.stopPropagation(); quickComplete(${priority.id})"
          >${icons.check()}</button>
        ` : `<span style="color: var(--accent-success);">${icons.check()}</span>`}
      </div>
    `
  }
  
  function renderMobileGroupedList(items, allPriorities) {
    const container = document.getElementById('prioritiesMobileList')
    if (!container) return
    
    // Group items by status
    const groups = {
      now: { label: 'Now', icon: icons.zap(), items: [] },
      later: { label: 'Later', icon: icons.download(), items: [] },
      done: { label: 'Done', icon: icons.check(), items: [] }
    }
    
    items.forEach(item => {
      const status = item.status || 'later'
      if (groups[status]) {
        groups[status].items.push(item)
      } else {
        groups.later.items.push(item)
      }
    })
    
    // Sort items within each group by priority score
    Object.keys(groups).forEach(key => {
      groups[key].items.sort((a, b) => getPriorityScore(b) - getPriorityScore(a))
    })
    
    container.innerHTML = `
      <div class="mobile-priority-groups">
        ${Object.entries(groups).map(([key, group]) => `
          ${group.items.length > 0 ? `
            <div class="mobile-priority-group m-card" data-group="${key}">
              <div class="mobile-priority-group-header m-touch" onclick="toggleMobileGroup('${key}')">
                <div class="mobile-priority-group-title">
                  <span class="mobile-priority-group-icon">${group.icon}</span>
                  <span>${group.label}</span>
                  <span class="mobile-priority-group-count">${group.items.length}</span>
                </div>
                <div class="mobile-priority-group-toggle">
                  <svg class="mobile-group-chevron ${window.mobileGroupCollapsed?.[key] ? 'collapsed' : ''}" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <div class="mobile-priority-group-content ${window.mobileGroupCollapsed?.[key] ? 'collapsed' : ''}">
                ${group.items.map(item => renderMobilePriorityItem(item, allPriorities)).join('')}
              </div>
            </div>
          ` : ''}
        `).join('')}
      </div>
    `
  }
  
  function renderMobilePriorityItem(priority, allPriorities) {
    const alert = getDueAlert(priority)
    const isBlocked = isPriorityBlocked(priority, allPriorities)
    const borderClass = getPriorityBorderClass(priority)
    
    return `
      <div class="m-list-item m-card m-touch mobile-priority-item ${borderClass} ${priority.completed ? 'completed' : ''} ${isBlocked ? 'blocked' : ''}"
           onclick="${!bulk.isActive ? `openEditPriorityModal(${priority.id})` : `bulk.toggleSelection(${priority.id})`}">
        
        ${bulk.isActive ? renderMobileBulkCheckbox(priority.id) : `
          <div class="m-list-item-checkbox mobile-priority-checkbox m-touch" onclick="event.stopPropagation(); quickComplete(${priority.id})"
               title="${priority.completed ? 'Completed' : 'Mark complete'}">
            ${priority.completed ? `
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" fill="var(--accent-success)" stroke="var(--accent-success)" stroke-width="2"/>
                <path d="M6 10l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            ` : `
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="9" stroke="var(--border-color)" stroke-width="2"/>
              </svg>
            `}
          </div>
        `}
        
        <div class="m-list-item-content mobile-priority-content">
          <div class="m-list-item-title mobile-priority-title">
            ${isBlocked ? '<span class="mobile-blocked-indicator" title="Blocked">' + icons.lock() + '</span>' : ''}
            ${escapeHtml(priority.text)}
          </div>
          
          <div class="m-card-meta mobile-priority-meta">
            ${alert ? `
              <span class="mobile-priority-alert ${alert.type}">
                ${alert.type === 'overdue' ? icons.flame() : icons.clock()} ${alert.text}
              </span>
            ` : ''}
            
            ${priority.dueDate && !alert ? `
              <span class="mobile-priority-due">${icons.calendar()} ${formatDate(priority.dueDate)}</span>
            ` : ''}
            
            ${priority.assignee ? `
              <span class="mobile-priority-assignee ${priority.assignee}">
                ${priority.assignee === 'KimiClaw' ? icons.bot() : icons.user()} ${priority.assignee}
              </span>
            ` : ''}
            
            ${priority.board && priority.board !== 'all' ? `
              <span class="mobile-priority-board">${getBoardEmoji(priority.board)} ${priority.board}</span>
            ` : ''}
          </div>
          
          ${priority.tags?.length ? `
            <div class="mobile-priority-tags">
              ${priority.tags.slice(0, 3).map(tag => `
                <span class="mobile-priority-tag ${tag === 'urgent' ? 'urgent' : ''}">${escapeHtml(tag)}</span>
              `).join('')}
              ${priority.tags.length > 3 ? `
                <span class="mobile-priority-tag-more">+${priority.tags.length - 3}</span>
              ` : ''}
            </div>
          ` : ''}
        </div>
        
        <div class="m-list-item-actions mobile-priority-actions">
          <button class="m-touch mobile-priority-menu-btn" onclick="event.stopPropagation(); openEditPriorityModal(${priority.id})"
                  title="Edit priority">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15l7.5-7.5-2.5-2.5L5 12.5v2.5h2.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M13.5 5.5l2.5-2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    `
  }
  
  function renderMobileBulkCheckbox(id) {
    const isChecked = bulk.selected.has(id)
    return `
      <div class="mobile-priority-checkbox bulk" onclick="event.stopPropagation(); bulk.toggleSelection(${id})"
           title="${isChecked ? 'Deselect' : 'Select'}">
        ${isChecked ? `
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="4" fill="var(--accent-primary)"/>
            <path d="M6 10l3 3 5-6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        ` : `
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="16" height="16" rx="4" stroke="var(--border-color)" stroke-width="2"/>
          </svg>
        `}
      </div>
    `
  }
  
  function getStatusColor(priority) {
    if (priority.completed) return 'var(--accent-success)'
    if (priority.status === 'now') return 'var(--accent-primary)'
    if (priority.priority === 'high') return 'var(--accent-danger)'
    if (priority.priority === 'medium') return 'var(--accent-warning)'
    return 'var(--text-muted)'
  }
  
  function renderBulkCheckbox(id) {
    const isChecked = bulk.selected.has(id)
    return `
      <div class="bulk-checkbox-wrapper">
        <div class="bulk-checkbox ${isChecked ? 'checked' : ''}" data-id="${id}">
          ${isChecked ? icons.check() : ''}
        </div>
      </div>
    `
  }
  
  function renderTimeBar(priority) {
    if (!priority.timeEstimate && !priority.timeSpent) return ''
    
    const estimate = priority.timeEstimate || 0
    const spent = priority.timeSpent || 0
    const progress = estimate > 0 ? Math.min(spent / estimate, 1) : 0
    const percent = Math.round(progress * 100)
    
    let barColor = 'var(--accent-success)'
    if (progress > 1) barColor = 'var(--accent-danger)'
    else if (progress > 0.8) barColor = 'var(--accent-warning)'
    
    return `
      <div class="priority-time-bar">
        <div class="priority-time-header">
          <span>${icons.clock()} ${formatDuration(spent)} / ${formatDuration(estimate)}</span>
          <span>${percent}%</span>
        </div>
        <div class="priority-time-progress">
          <div class="priority-time-fill" style="width: ${percent}%; background: ${barColor};"></div>
        </div>
      </div>
    `
  }
  
  function renderBlockedBy(priority, allPriorities) {
    const blockerNames = priority.blockedBy
      ?.map(id => allPriorities.find(p => p.id === id))
      ?.filter(p => p && !p.completed)
      ?.map(p => p.text)
      ?.slice(0, 2) || []
    
    if (blockerNames.length === 0) return ''
    
    return `
      <div class="priority-blocked-by">
        <span>${icons.lock()} Blocked by: ${blockerNames.join(', ')}</span>
      </div>
    `
  }
  
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
  
  window.handlePriorityReorder = (newPriorities) => {
    store.set('priorities', newPriorities)
    toast.success('Priorities reordered')
  }
  
  window.toggleBulkMode = () => {
    bulk.toggle()
    render()
  }
  
  window.quickComplete = (id) => {
    const priorities = store.get('priorities')
    const priority = priorities.find(p => p.id === id)
    if (priority && !isPriorityBlocked(priority, priorities)) {
      priority.completed = true
      priority.status = 'done'
      priority.completedAt = new Date().toISOString()
      store.set('priorities', priorities)
      toast.success('Completed', priority.text)
    } else if (isPriorityBlocked(priority, priorities)) {
      toast.error('Cannot complete - blocked by dependencies')
    }
  }
  
  // Mobile group collapse toggle
  window.mobileGroupCollapsed = window.mobileGroupCollapsed || {}
  window.toggleMobileGroup = (groupKey) => {
    window.mobileGroupCollapsed[groupKey] = !window.mobileGroupCollapsed[groupKey]
    const groupEl = document.querySelector(`.mobile-priority-group[data-group="${groupKey}"]`)
    if (groupEl) {
      const content = groupEl.querySelector('.mobile-priority-group-content')
      const chevron = groupEl.querySelector('.mobile-group-chevron')
      if (content) {
        content.classList.toggle('collapsed', window.mobileGroupCollapsed[groupKey])
      }
      if (chevron) {
        chevron.classList.toggle('collapsed', window.mobileGroupCollapsed[groupKey])
      }
    }
  }
  
  // Listen for re-render events from resize handler
  window.addEventListener('priorities-rerender', render)
  
  store.subscribe((state, path) => {
    if (!path || path.includes('priorities') || path.includes('currentBoard')) render()
  })
  
  render()
  
  // Initialize mobile interactions after render
  setTimeout(() => {
    // Add touch feedback to all interactive elements with .m-touch class
    container.querySelectorAll('.m-touch').forEach(el => {
      addTouchFeedback(el)
    })
    
    // Add swipe to complete for mobile priority items
    if (isMobile) {
      document.querySelectorAll('.mobile-priority-item').forEach(el => {
        const priorityId = el.getAttribute('onclick')?.match(/\d+/)?.[0]
        if (priorityId) {
          initSwipe(el, 
            () => {
              // Swipe left - complete
              if (window.quickComplete) {
                window.quickComplete(parseInt(priorityId))
                haptic('medium')
              }
            },
            null,
            { threshold: 80 }
          )
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

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}