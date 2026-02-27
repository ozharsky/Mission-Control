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

let currentFilter = 'all'
let currentAssignee = null
let viewMode = 'kanban' // 'kanban' or 'list'
let kanbanInstance = null
let draggableList = null

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
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting">⭐ Priorities</div>
          <div class="welcome-status">
            ${overdueCount > 0 
              ? `<span class="status-badge" style="background: rgba(239, 68, 68, 0.15); color: var(--accent-danger);"
              >🔥 ${overdueCount} overdue</span>`
              : blockedCount > 0
                ? `<span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-warning);"
                >🔒 ${blockedCount} blocked</span>`
                : `<span class="status-badge">${activeCount} active</span>`
            }
            <span class="board-label">${boardLabel}</span>
            ${currentFilter !== 'all' || currentAssignee ? 
              `<span class="status-badge" style="background: var(--accent-primary); color: white;"
              >Showing ${filteredCount}</span>` : ''}
          </div>
        </div>
        <div class="welcome-actions">
          <button class="btn btn-secondary hide-mobile" onclick="toggleBulkMode()"
            style="${bulk.isActive ? 'background: var(--accent-primary); color: white;' : ''}"
          >${bulk.isActive ? '✓ Done' : '☰ Bulk'}</button>
          <button class="btn btn-primary" onclick="openPriorityModal()">
            <span>➕</span>
            <span class="hide-mobile">New Priority</span>
          </button>
        </div>
      </div>
      
      <!-- View Toggle & Filters -->
      <div class="priority-toolbar" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div class="filter-bar priority-filters">
          <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" onclick="setPriorityFilter('all')"
            title="Show all priorities">
            <span>All</span>
            <span class="filter-count">${activeCount}</span>
          </button>
          <button class="filter-btn ${currentFilter === 'active' ? 'active' : ''}" onclick="setPriorityFilter('active')"
            title="Active priorities">
            <span>Active</span>
          </button>
          <button class="filter-btn ${currentFilter === 'urgent' ? 'active' : ''}" onclick="setPriorityFilter('urgent')"
            title="Urgent & high priority">
            <span>🔥 Urgent</span>
          </button>
          <button class="filter-btn ${currentFilter === 'due-soon' ? 'active' : ''}" onclick="setPriorityFilter('due-soon')"
            title="Due within 3 days">
            <span>⏰ Due Soon</span>
          </button>
          <button class="filter-btn ${currentFilter === 'blocked' ? 'active' : ''}" onclick="setPriorityFilter('blocked')"
            title="Blocked by dependencies">
            <span>🔒 Blocked</span>
          </button>
          <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" onclick="setPriorityFilter('completed')"
            title="Completed priorities">
            <span>✅ Done</span>
          </button>
          
          <div class="filter-divider"></div>
          
          <button class="filter-btn assignee-btn ${currentAssignee === 'KimiClaw' ? 'active' : ''}" 
            onclick="setPriorityAssignee('KimiClaw')"
            title="Assigned to KimiClaw">
            <span>🤖 Kimi</span>
          </button>
          <button class="filter-btn assignee-btn ${currentAssignee === 'Oleg' ? 'active' : ''}" 
            onclick="setPriorityAssignee('Oleg')"
            title="Assigned to Oleg">
            <span>👤 Oleg</span>
          </button>
          ${currentAssignee ? `
            <button class="filter-btn" onclick="setPriorityAssignee(null)" title="Clear assignee filter">
              <span>✕</span>
            </button>
          ` : ''}
        </div>
        
        <div class="view-toggle" style="display: flex; gap: 0.5rem;">
          <button class="btn btn-sm ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}" 
            onclick="setPriorityView('kanban')" title="Kanban view">
            📋 Board
          </button>
          <button class="btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}" 
            onclick="setPriorityView('list')" title="List view with drag & drop">
            ☰ List
          </button>
        </div>
      </div>
      
      <!-- Kanban Board or List View -->
      ${viewMode === 'kanban' ? `
        <div id="prioritiesKanban"></div>
      ` : `
        <div id="prioritiesList" class="priority-list-view"></div>
      `}
      
      ${filteredCount === 0 && items.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">⭐</div>
          <div class="empty-state-title">No priorities found</div>
          <div class="empty-state-text">
            ${currentFilter !== 'all' || currentAssignee 
              ? 'Try changing your filters or create a new priority' 
              : 'Create your first priority to get started'}
          </div>
          <button class="btn btn-primary" onclick="openPriorityModal()">➕ Create Priority</button>
        </div>
      ` : ''}
    `
    
    // Only init kanban or list if we have items
    if (items.length > 0) {
      if (viewMode === 'kanban') {
        kanbanInstance = createKanban('prioritiesKanban', {
          columns: [
            { id: 'later', label: 'Later', icon: '📥' },
            { id: 'now', label: 'Now', icon: '⚡' },
            { id: 'done', label: 'Done', icon: '✅' }
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
    
    return `
      <div class="priority-card ${borderClass} ${priority.completed ? 'completed' : ''} ${isBlocked ? 'blocked' : ''}"
           onclick="${!bulk.isActive ? `openEditPriorityModal(${priority.id})` : `bulk.toggleSelection(${priority.id})`}">
        
        <div class="priority-card-inner">
          ${bulk.isActive ? renderBulkCheckbox(priority.id) : ''}
          
          <div class="priority-card-content">
            <!-- Header Row -->
            <div class="priority-card-header">
              <h4 class="priority-card-title">
                ${isBlocked ? '<span class="blocked-badge" title="Blocked">🔒</span>' : ''}
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
                <span class="priority-done-icon">✓</span>
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
                  ${alert.type === 'overdue' ? '🔥' : '⏰'} ${alert.text}
                </span>
              ` : ''}
              
              ${priority.dueDate && !alert ? `
                <span class="priority-due">📅 ${formatDate(priority.dueDate)}</span>
              ` : ''}
              
              ${priority.assignee ? `
                <span class="priority-assignee ${priority.assignee}">
                  ${priority.assignee === 'KimiClaw' ? '🤖' : '👤'} ${priority.assignee}
                </span>
              ` : ''}
              
              ${priority.board && priority.board !== 'all' ? `
                <span class="priority-board">${getBoardEmoji(priority.board)} ${priority.board}</span>
              ` : ''}
              
              ${priority.recurring && priority.recurring !== 'none' ? `
                <span class="priority-recurring" title="Recurring: ${priority.recurring}">🔄</span>
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
           style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem; border-bottom: 1px solid var(--border); cursor: pointer;"
      >
        <div class="priority-list-drag" style="color: var(--text-muted); cursor: grab;"
             onclick="event.stopPropagation()"
        >⋮⋮</div>
        
        <div class="priority-list-status" style="width: 8px; height: 8px; border-radius: 50%; background: ${getStatusColor(priority)};"
        ></div>
        
        <div class="priority-list-content" style="flex: 1; min-width: 0;"
        >
          <div class="priority-list-title" style="font-weight: 500; margin-bottom: 0.25rem;"
          >${isBlocked ? '🔒 ' : ''}${escapeHtml(priority.text)}</div>
          
          <div class="priority-list-meta" style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 0.5rem; flex-wrap: wrap;"
          >
            ${alert ? `<span class="${alert.type}">${alert.type === 'overdue' ? '🔥' : '⏰'} ${alert.text}</span>` : ''}
            ${priority.dueDate ? `<span>📅 ${formatDate(priority.dueDate)}</span>` : ''}
            ${priority.assignee ? `<span>${priority.assignee === 'KimiClaw' ? '🤖' : '👤'} ${priority.assignee}</span>` : ''}
            ${priority.board && priority.board !== 'all' ? `<span>${getBoardEmoji(priority.board)} ${priority.board}</span>` : ''}
            ${priority.tags?.length ? `<span>🏷️ ${priority.tags.slice(0, 2).join(', ')}</span>` : ''}
          </div>
        </div>
        
        <div class="priority-list-score" style="font-size: 0.75rem; color: var(--text-muted); text-align: right;"
        >
          <div style="font-weight: 600; color: var(--text-primary);">${Math.round(score)}</div>
          <div>score</div>
        </div>
        
        ${!priority.completed ? `
          <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); quickComplete(${priority.id})"
          >✓</button>
        ` : '<span style="color: var(--accent-success);">✓</span>'}
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
          ${isChecked ? '✓' : ''}
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
          <span>⏱️ ${formatDuration(spent)} / ${formatDuration(estimate)}</span>
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
        <span>🔒 Blocked by: ${blockerNames.join(', ')}</span>
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
  
  store.subscribe((state, path) => {
    if (!path || path.includes('priorities') || path.includes('currentBoard')) render()
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

function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}