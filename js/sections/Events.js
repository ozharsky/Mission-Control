import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { filterByBoard, getCurrentBoardLabel } from '../components/BoardSelector.js'
import { openEventModal } from '../components/EventModal.js'
import { confirmDelete } from '../components/ConfirmDialog.js'
import { icons } from '../utils/icons.js'

let currentFilter = 'upcoming'

const EVENT_TYPES = {
  cannabis: { label: 'Cannabis', icon: icons.leaf(), colorClass: 'm-badge-warning' },
  trade: { label: 'Trade Show', icon: icons.building(), colorClass: 'm-badge-primary' },
  photo: { label: 'Photography', icon: icons.camera(), colorClass: 'm-badge-info' },
  etsy: { label: 'Etsy', icon: icons.cart(), colorClass: 'm-badge-success' },
  other: { label: 'Other', icon: icons.calendar(), colorClass: 'm-badge-secondary' }
}

const STATUS_CONFIG = {
  upcoming: { label: 'Upcoming', icon: icons.calendar(), colorClass: 'm-badge-warning' },
  confirmed: { label: 'Confirmed', icon: icons.check(), colorClass: 'm-badge-success' },
  tentative: { label: 'Tentative', icon: icons.help(), colorClass: 'm-badge-secondary' },
  completed: { label: 'Completed', icon: icons.check(), colorClass: 'm-badge-muted' },
  cancelled: { label: 'Cancelled', icon: icons.x(), colorClass: 'm-badge-danger' }
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
          <div class="welcome-greeting m-title">${icons.calendar()} Events</div>
          <div class="welcome-status">
            ${thisWeekCount > 0 ? `
              <span class="m-badge-warning"
              >${icons.zap()} ${thisWeekCount} this week</span>
            ` : ''}
            <span class="m-badge-secondary">${upcomingCount} upcoming</span>
          </div>
        </div>
        <button class="m-btn-primary m-touch" onclick="openEventModal()">
          <span>${icons.plus()}</span>
          <span class="hide-mobile">Add Event</span>
        </button>
      </div>
      
      <!-- Filters -->
      <div class="events-toolbar">
        <div class="filter-bar event-filters">
          <button class="m-btn-secondary ${currentFilter === 'upcoming' ? 'active' : ''} m-touch" 
            onclick="setEventFilter('upcoming')">
            <span>${icons.calendar()} Upcoming</span>
          </button>
          <button class="m-btn-secondary ${currentFilter === 'confirmed' ? 'active' : ''} m-touch" 
            onclick="setEventFilter('confirmed')">
            <span>${icons.check()} Confirmed</span>
          </button>
        <button class="m-btn-secondary ${currentFilter === 'tentative' ? 'active' : ''} m-touch" 
          onclick="setEventFilter('tentative')">
          <span>${icons.help()} Tentative</span>
        </button>
        <button class="m-btn-secondary ${currentFilter === 'completed' ? 'active' : ''} m-touch" 
          onclick="setEventFilter('completed')">
          <span>${icons.check()} Past</span>
        </button>
        <button class="m-btn-secondary ${currentFilter === 'all' ? 'active' : ''} m-touch" 
          onclick="setEventFilter('all')">
          <span>All</span>
        </button>
      </div>
      
      <!-- Board Filter Notice -->
      ${store.get('currentBoard') !== 'all' ? `
        <div class="board-filter-notice">
          <span>${icons.mapPin()} Showing events for: ${getCurrentBoardLabel()}</span>
          <button class="m-btn-secondary m-touch" onclick="clearBoardFilter()">Show All</button>
        </div>
      ` : ''}
      
      <!-- Events Timeline -->
      ${events.length === 0 ? `
        <div class="empty-state m-card">
          <div class="empty-state-icon">${icons.calendar()}</div>
          <div class="empty-state-title m-title">${allEvents.length === 0 ? 'No events scheduled' : 'No events match filter'}</div>
          <div class="empty-state-text m-body">
            ${allEvents.length === 0 
              ? 'Add your first event to start tracking shows, deadlines, and opportunities.'
              : store.get('currentBoard') !== 'all' 
                ? 'No events for this board. Try switching to "All Boards" or change the filter.'
                : 'Try changing your filter to see more events.'}
          </div>
          ${store.get('currentBoard') !== 'all' && allEvents.length > 0 ? `
            <button class="m-btn-secondary m-touch" onclick="clearBoardFilter()" style="margin-bottom: 0.5rem;">${icons.mapPin()} Show All Boards</button>
          ` : ''}
          <button class="m-btn-primary m-touch" onclick="openEventModal()">${icons.plus()} Add Event</button>
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
      <div class="m-card event-card ${urgency.class} ${event.status}"
           onclick="openEditEventModal(${event.id})">
        <div class="event-date-block">
          <div class="event-month m-caption">${month}</div>
          <div class="event-day m-title">${day}</div>
          <div class="event-weekday m-caption">${weekday}</div>
        </div>
        
        <div class="event-content">
          <div class="event-header">
            <div class="event-title-row">
              <h4 class="event-name m-title">${escapeHtml(event.name)}</h4>
              <span class="event-urgency ${urgency.class} m-badge-${urgency.class === 'urgent' ? 'danger' : urgency.class === 'soon' ? 'warning' : 'secondary'}">${urgency.label}</span>
            </div>
            
            <div class="event-meta-row">
              <span class="event-type-badge ${typeConfig.colorClass}"
              >${typeConfig.icon} ${typeConfig.label}</span>
              
              <span class="${statusConfig.colorClass}"
              >${statusConfig.icon} ${statusConfig.label}</span>
              
              ${event.board && event.board !== 'all' ? `
                <span class="event-board m-caption">${getBoardIcon(event.board)} ${event.board}</span>
              ` : ''}
            </div>
          </div>
          
          <div class="event-details">
            <div class="event-location">
              <span class="location-icon">${icons.mapPin()}</span>
              <span class="m-body">${escapeHtml(event.location || 'TBD')}</span>
            </div>
            
            ${event.notes ? `
              <div class="event-notes m-body">${escapeHtml(event.notes)}</div>
            ` : ''}
          </div>
          
          <div class="event-actions">
            <button class="m-btn-secondary m-touch" 
              onclick="event.stopPropagation(); openEditEventModal(${event.id})"
            >${icons.edit()} Edit</button>
            ${event.status !== 'confirmed' && event.status !== 'completed' && event.status !== 'cancelled' ? `
              <button class="m-btn-primary m-touch" 
                onclick="event.stopPropagation(); updateEventStatus(${event.id}, 'confirmed')"
              >${icons.check()} Confirm</button>
            ` : ''}
            ${event.status !== 'completed' && event.status !== 'cancelled' ? `
              <button class="m-btn-secondary m-touch"
                onclick="event.stopPropagation(); updateEventStatus(${event.id}, 'completed')"
              >${icons.check()} Complete</button>
            ` : ''}
            <button class="m-btn-danger m-touch"
              onclick="event.stopPropagation(); deleteEvent(${event.id})"
            >${icons.delete()} Delete</button>
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

function getBoardIcon(board) {
  const boardIcons = {
    'etsy': icons.cart(),
    'photography': icons.camera(),
    'wholesale': icons.store(),
    '3dprint': icons.printer(),
    'all': icons.building()
  }
  return boardIcons[board] || icons.clipboard()
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
