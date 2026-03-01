import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { filterByBoard, getCurrentBoardLabel } from '../components/BoardSelector.js'
import { openEventModal } from '../components/EventModal.js'
import { confirmDelete } from '../components/ConfirmDialog.js'

let currentFilter = 'upcoming'
let searchQuery = ''

const EVENT_TYPES = {
  cannabis: { label: 'Cannabis', icon: '🌿', colorClass: 'badge-event-cannabis' },
  trade: { label: 'Trade Show', icon: '🏢', colorClass: 'badge-event-trade' },
  photo: { label: 'Photography', icon: '📸', colorClass: 'badge-event-photo' },
  etsy: { label: 'Etsy', icon: '🛒', colorClass: 'badge-event-etsy' },
  other: { label: 'Other', icon: '📅', colorClass: 'badge-event-other' }
}

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', icon: '📅', colorClass: 'badge-status-pending' },
  confirmed: { label: 'Confirmed', icon: '✅', colorClass: 'badge-status-active' },
  tentative: { label: 'Tentative', icon: '❓', colorClass: 'badge-status-blocked' },
  completed: { label: 'Completed', icon: '✓', colorClass: 'text-muted' },
  cancelled: { label: 'Cancelled', icon: '✕', colorClass: 'text-danger' }
}

export function createEventsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function getFilteredEvents(events) {
    let filtered = filterByBoard(events, 'board')
    
    // Apply status filter
    if (currentFilter === 'upcoming') {
      filtered = filtered.filter(e => e.status !== 'completed' && e.status !== 'cancelled')
    } else if (currentFilter === 'past') {
      filtered = filtered.filter(e => e.status === 'completed' || e.status === 'cancelled')
    } else if (currentFilter !== 'all') {
      filtered = filtered.filter(e => e.status === currentFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(e =>
        e.name?.toLowerCase().includes(query) ||
        e.location?.toLowerCase().includes(query) ||
        e.notes?.toLowerCase().includes(query)
      )
    }
    
    // Sort by date (nearest first)
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
  }
  
  function getDaysUntil(dateStr) {
    const eventDate = new Date(dateStr)
    const today = new Date()
    const diffTime = eventDate - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  function getEventUrgency(days) {
    if (days < 0) return { label: 'Past', class: 'past' }
    if (days === 0) return { label: 'Today', class: 'urgent' }
    if (days <= 7) return { label: `${days}d`, class: 'soon' }
    if (days <= 30) return { label: `${Math.floor(days / 7)}w`, class: 'upcoming' }
    return { label: `${Math.floor(days / 30)}m`, class: 'future' }
  }
  
  function render() {
    const allEvents = store.getState().events || []
    const events = getFilteredEvents(allEvents)
    
    const upcomingCount = allEvents.filter(e => {
      const days = getDaysUntil(e.date)
      return days >= 0 && e.status !== 'cancelled'
    }).length
    
    const thisWeekCount = allEvents.filter(e => {
      const days = getDaysUntil(e.date)
      return days >= 0 && days <= 7 && e.status !== 'cancelled'
    }).length
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting">📅 Events</div>
          <div class="welcome-status">
            ${thisWeekCount > 0 ? `
              <span class="status-badge" style="background: rgba(245, 158, 11, 0.15); color: var(--accent-warning);"
              >⚡ ${thisWeekCount} this week</span>
            ` : ''}
            <span class="status-badge">${upcomingCount} upcoming</span>
          </div>
        </div>
        <button class="btn btn-primary" onclick="openEventModal()">
          <span>➕</span>
          <span class="hide-mobile">Add Event</span>
        </button>
      </div>
      
      <!-- Search & Filters -->
      <div class="events-toolbar">
        <div class="events-search">
          <input type="text" 
            class="search-input" 
            placeholder="🔍 Search events..."
            value="${searchQuery}"
            oninput="setEventSearch(this.value)"
          >
        </div>
        <div class="filter-bar event-filters">
          <button class="filter-btn ${currentFilter === 'upcoming' ? 'active' : ''}" 
            onclick="setEventFilter('upcoming')">
            <span>📅 Upcoming</span>
          </button>
          <button class="filter-btn ${currentFilter === 'confirmed' ? 'active' : ''}" 
            onclick="setEventFilter('confirmed')">
            <span>✅ Confirmed</span>
          </button>
        <button class="filter-btn ${currentFilter === 'tentative' ? 'active' : ''}" 
          onclick="setEventFilter('tentative')">
          <span>❓ Tentative</span>
        </button>
        <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" 
          onclick="setEventFilter('completed')">
          <span>✓ Past</span>
        </button>
        <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
          onclick="setEventFilter('all')">
          <span>All</span>
        </button>
      </div>
      
      <!-- Board Filter Notice -->
      ${store.get('currentBoard') !== 'all' ? `
        <div class="board-filter-notice">
          <span>📍 Showing events for: ${getCurrentBoardLabel()}</span>
          <button class="btn btn-sm btn-text" onclick="clearBoardFilter()">Show All</button>
        </div>
      ` : ''}
      
      <!-- Events Timeline -->
      ${events.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">📅</div>
          <div class="empty-state-title">${allEvents.length === 0 ? 'No events scheduled' : 'No events match filter'}</div>
          <div class="empty-state-text">
            ${allEvents.length === 0 
              ? 'Add your first event to start tracking shows, deadlines, and opportunities.'
              : store.get('currentBoard') !== 'all' 
                ? 'No events for this board. Try switching to "All Boards" or change the filter.'
                : 'Try changing your filter to see more events.'}
          </div>
          ${store.get('currentBoard') !== 'all' && allEvents.length > 0 ? `
            <button class="btn btn-secondary" onclick="clearBoardFilter()" style="margin-bottom: 0.5rem;">📍 Show All Boards</button>
          ` : ''}
          <button class="btn btn-primary" onclick="openEventModal()">➕ Add Event</button>
        </div>
      ` : `
        <div class="events-timeline">
          ${events.map(event => renderEventCard(event)).join('')}
        </div>
      `}
    `
  }
  
  function renderEventCard(event) {
    const typeConfig = EVENT_TYPES[event.type] || EVENT_TYPES.other
    const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.upcoming
    const daysUntil = getDaysUntil(event.date)
    const urgency = getEventUrgency(daysUntil)
    const eventDate = new Date(event.date)
    
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' })
    const day = eventDate.getDate()
    const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' })
    const year = eventDate.getFullYear()
    
    return `
      <div class="event-card ${urgency.class} ${event.status}"
           onclick="openEditEventModal(${event.id})">
        <div class="event-date-block">
          <div class="event-month">${month}</div>
          <div class="event-day">${day}</div>
          <div class="event-weekday">${weekday}</div>
        </div>
        
        <div class="event-content">
          <div class="event-header">
            <div class="event-title-row">
              <h4 class="event-name">${escapeHtml(event.name)}</h4>
              <span class="event-urgency ${urgency.class}">${urgency.label}</span>
            </div>
            
            <div class="event-meta-row">
              <span class="event-type-badge ${typeConfig.colorClass}"
              >${typeConfig.icon} ${typeConfig.label}</span>
              
              <span class="event-status-badge ${statusConfig.colorClass}"
              >${statusConfig.icon} ${statusConfig.label}</span>
              
              ${event.board && event.board !== 'all' ? `
                <span class="event-board">${getBoardEmoji(event.board)} ${event.board}</span>
              ` : ''}
            </div>
          </div>
          
          <div class="event-details">
            <div class="event-location">
              <span class="location-icon">📍</span>
              <span>${escapeHtml(event.location || 'TBD')}</span>
            </div>
            
            ${event.notes ? `
              <div class="event-notes">${escapeHtml(event.notes)}</div>
            ` : ''}
          </div>
          
          <div class="event-actions">
            <button class="event-action-btn" 
              onclick="event.stopPropagation(); openEditEventModal(${event.id})"
            >✏️ Edit</button>
            ${event.status !== 'confirmed' && event.status !== 'completed' && event.status !== 'cancelled' ? `
              <button class="event-action-btn success" 
                onclick="event.stopPropagation(); updateEventStatus(${event.id}, 'confirmed')"
              >✅ Confirm</button>
            ` : ''}
            ${event.status !== 'completed' && event.status !== 'cancelled' ? `
              <button class="event-action-btn"
                onclick="event.stopPropagation(); updateEventStatus(${event.id}, 'completed')"
              >✓ Complete</button>
            ` : ''}
            <button class="event-action-btn danger"
              onclick="event.stopPropagation(); deleteEvent(${event.id})"
            >🗑️ Delete</button>
          </div>
        </div>
      </div>
    `
  }
  
  window.openEditEventModal = (id) => {
    openEventModal(id)
  }
  
  window.deleteEvent = async (id) => {
    const event = store.get('events').find(e => e.id === id)
    const confirmed = await confirmDelete(event?.name || 'this event')
    if (!confirmed) return
    
    const events = store.get('events').filter(e => e.id !== id)
    store.set('events', events)
    toast.success('Event deleted')
  }
  
  // Expose functions globally
  window.setEventFilter = (filter) => {
    currentFilter = filter
    render()
  }
  
  window.setEventSearch = (query) => {
    searchQuery = query
    render()
  }
  
  window.updateEventStatus = (id, newStatus) => {
    const events = store.get('events')
    const event = events.find(e => e.id === id)
    if (event) {
      event.status = newStatus
      store.set('events', events)
      
      const statusConfig = STATUS_CONFIG[newStatus]
      toast.success(`Marked as ${statusConfig.label}`, event.name)
    }
  }
  
  window.clearBoardFilter = () => {
    store.set('currentBoard', 'all')
    toast.success('Showing all boards')
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('events') || path.includes('currentBoard')) render()
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