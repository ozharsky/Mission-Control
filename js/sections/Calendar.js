import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { getDueAlert } from '../utils/priority.js'
import { openEventModal } from '../components/EventModal.js'
import { addTouchFeedback } from '../utils/mobileInteractions.js'

let currentDate = new Date()
let selectedDate = null
let viewMode = 'month' // 'month', 'week', 'day'

// Memoization for expensive calculations
const memoCache = new Map()
const MEMO_TTL = 10000 // 10 seconds

function memoize(key, computeFn) {
  const now = Date.now()
  const cached = memoCache.get(key)
  if (cached && (now - cached.timestamp) < MEMO_TTL) {
    return cached.value
  }
  const value = computeFn()
  memoCache.set(key, { value, timestamp: now })
  return value
}

// Clear memo cache when data changes
function clearMemoCache() {
  memoCache.clear()
}

export function createCalendarSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function render() {
    const state = store.getState()
    const priorities = state.priorities || []
    const events = state.events || []
    
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // Calculate calendar values for month view
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()
    
    // Get items for this period
    const monthItems = getMonthItems(priorities, events, month, year)
    
    // Get upcoming items
    const upcomingItems = getUpcomingItems(priorities, events)
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar m-card">
        <div class="welcome-content">
          <div class="welcome-greeting m-title">📅 Calendar</div>
          <div class="welcome-status">
            <span class="status-badge m-badge">${monthItems.count} items this ${viewMode}</span>
            ${upcomingItems.overdue > 0 ? `
              <span class="status-badge status-danger m-badge">🔥 ${upcomingItems.overdue} overdue</span>
            ` : ''}
          </div>
        </div>
        <div class="welcome-actions">
          <div class="view-toggle m-view-toggle">
            <button class="btn btn-sm ${viewMode === 'month' ? 'btn-primary' : 'btn-secondary'} m-touch" 
              onclick="setCalendarView('month')">Month</button>
            <button class="btn btn-sm ${viewMode === 'week' ? 'btn-primary' : 'btn-secondary'} m-touch" 
              onclick="setCalendarView('week')">Week</button>
            <button class="btn btn-sm ${viewMode === 'day' ? 'btn-primary' : 'btn-secondary'} m-touch" 
              onclick="setCalendarView('day')">Day</button>
          </div>
          <div class="calendar-nav">
            <button class="btn btn-sm btn-secondary m-touch" onclick="changePeriod(-1)">◀</button>
            <div class="calendar-month m-title">${getPeriodLabel()}</div>
            <button class="btn btn-sm btn-secondary m-touch" onclick="changePeriod(1)">▶</button>
            <button class="btn btn-sm btn-text m-touch" onclick="goToToday()">Today</button>
          </div>
          <button class="btn btn-primary m-btn-primary m-touch" onclick="openEventModal()">
            <span>➕</span>
            <span class="hide-mobile">Add Event</span>
          </button>
        </div>
      </div>
      
      <!-- Calendar Grid -->
      <div class="card calendar-card m-card">
        ${viewMode === 'month' ? renderMonthView(firstDay, daysInMonth, daysInPrevMonth, monthItems, priorities, events) : ''}
        ${viewMode === 'week' ? renderWeekView(priorities, events) : ''}
        ${viewMode === 'day' ? renderDayView(priorities, events) : ''}
      </div>
      
      <!-- Selected Day Details -->
      ${selectedDate ? renderDayDetails(selectedDate, priorities, events) : ''}
      
      <!-- Upcoming Items -->
      <div class="card upcoming-card m-card">
        <div class="card-header">
          <div class="card-title m-title">⏰ Upcoming</div>
          <span class="upcoming-count m-badge">${upcomingItems.items.length} items</span>
        </div>
        
        ${upcomingItems.items.length === 0 ? `
          <div class="empty-state-small">
            <div class="empty-state-icon">📅</div>
            <div class="empty-state-text m-body">No upcoming items</div>
          </div>
        ` : `
          <div class="upcoming-list m-list">
            ${upcomingItems.items.slice(0, 10).map(item => renderUpcomingItem(item)).join('')}
            ${upcomingItems.items.length > 10 ? `
              <div class="upcoming-more m-caption">+${upcomingItems.items.length - 10} more items</div>
            ` : ''}
          </div>
        `}
      </div>
    `
    
    // Apply touch feedback to all interactive elements
    container.querySelectorAll('.m-touch').forEach(addTouchFeedback)
  }
  
  function getPeriodLabel() {
    if (viewMode === 'month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })
    }
  }

  function renderMonthView(firstDay, daysInMonth, daysInPrevMonth, monthItems, priorities, events) {
    return `
      <div class="calendar-weekdays">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `
          <div class="calendar-weekday">${d}</div>
        `).join('')}
      </div>
      <div class="calendar-days">
        ${renderCalendarDays(firstDay, daysInMonth, daysInPrevMonth, monthItems, priorities, events)}
      </div>
    `
  }

  function renderWeekView(priorities, events) {
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - currentDate.getDay())
    
    return `
      <div class="calendar-weekdays">
        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => {
          const date = new Date(weekStart)
          date.setDate(weekStart.getDate() + i)
          const isToday = date.toDateString() === new Date().toDateString()
          return `<div class="calendar-weekday ${isToday ? 'today' : ''}">${d} ${date.getDate()}</div>`
        }).join('')}
      </div>
      <div class="calendar-week-view">
        ${Array.from({ length: 7 }, (_, i) => {
          const date = new Date(weekStart)
          date.setDate(weekStart.getDate() + i)
          const dayItems = getItemsForDate(priorities, events, date)
          const isToday = date.toDateString() === new Date().toDateString()
          
          return `
            <div class="week-day ${isToday ? 'today' : ''}" onclick="selectDate('${date.toISOString().split('T')[0]}')">
              <div class="week-day-items">
                ${dayItems.length === 0 ? '<span class="no-items">-</span>' : 
                  dayItems.slice(0, 5).map(item => `
                    <div class="week-item ${item.type} ${item.completed ? 'completed' : ''}">
                      ${item.type === 'priority' ? '⚡' : '🎉'} ${truncateText(item.text || item.name, 20)}
                    </div>
                  `).join('')}
                ${dayItems.length > 5 ? `<div class="more-items">+${dayItems.length - 5} more</div>` : ''}
              </div>
            </div>
          `
        }).join('')}
      </div>
    `
  }

  function renderDayView(priorities, events) {
    const dayItems = getItemsForDate(priorities, events, currentDate)
    
    // Group items by hour
    const itemsByHour = {}
    const hoursWithItems = new Set()
    
    dayItems.forEach(item => {
      const itemDate = new Date(item.dueDate || item.date)
      const hour = itemDate.getHours()
      if (!itemsByHour[hour]) itemsByHour[hour] = []
      itemsByHour[hour].push(item)
      hoursWithItems.add(hour)
    })
    
    // Determine which hours to show
    let hoursToShow = []
    if (hoursWithItems.size === 0) {
      // No items - show business hours (8am-6pm)
      hoursToShow = Array.from({length: 11}, (_, i) => i + 8)
    } else {
      // Show hours with items plus surrounding hours
      const minHour = Math.min(...hoursWithItems)
      const maxHour = Math.max(...hoursWithItems)
      const startHour = Math.max(0, minHour - 1)
      const endHour = Math.min(23, maxHour + 1)
      hoursToShow = Array.from({length: endHour - startHour + 1}, (_, i) => i + startHour)
    }
    
    return `
      <div class="day-view">
        <div class="day-timeline">
          ${hoursToShow.map(hour => {
            const itemsAtHour = itemsByHour[hour] || []
            const isBusinessHour = hour >= 9 && hour <= 17
            
            return `
              <div class="day-hour ${isBusinessHour ? 'business-hour' : ''}">
                <div class="hour-label">${formatHour(hour)}</div>
                <div class="hour-content">
                  ${itemsAtHour.map(item => `
                    <div class="day-item-detail ${item.type}" 
                         onclick="${item.type === 'priority' ? `openEditPriorityModal(${item.id})` : `openEventModal(${item.id})`}">
                      <span class="item-icon">${item.type === 'priority' ? '⚡' : '🎉'}</span>
                      <span class="item-text">${escapeHtml(item.text || item.name)}</span>
                      <span class="item-time">${formatTime(item.dueDate || item.date)}</span>
                    </div>
                  `).join('')}
                  
                  ${itemsAtHour.length === 0 ? `
                    <div class="hour-empty" onclick="createEventOnDay(${currentDate.getFullYear()}, ${currentDate.getMonth()}, ${currentDate.getDate()}, ${hour})">
                      <span class="add-hint">+ Add event</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `
          }).join('')}
        </div>
        
        ${dayItems.length === 0 ? `
          <div class="empty-state-small">
            <div class="empty-state-icon">📅</div>
            <div class="empty-state-text">No items for this day</div>
            <button class="btn btn-sm btn-secondary" 
                    onclick="createEventOnDay(${currentDate.getFullYear()}, ${currentDate.getMonth()}, ${currentDate.getDate()})" 
                    style="margin-top: 1rem;">
              ➕ Add Event
            </button>
          </div>
        ` : ''}
        
        <div class="day-view-footer">
          <button class="btn btn-sm btn-text" onclick="showAllHours()">
            ${hoursToShow.length < 24 ? '🕐 Show All Hours' : '📅 Show Business Hours'}
          </button>
        </div>
      </div>
    `
  }
  
  function formatHour(hour) {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }
  
  function formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  function getItemsForDate(priorities, events, date) {
    const items = []
    
    priorities.forEach(p => {
      if (!p.dueDate) return
      const due = new Date(p.dueDate)
      if (due.toDateString() === date.toDateString()) {
        items.push({ ...p, type: 'priority' })
      }
    })
    
    events.forEach(e => {
      if (!e.date) return
      const eventDate = new Date(e.date)
      if (eventDate.toDateString() === date.toDateString()) {
        items.push({ ...e, type: 'event' })
      }
    })
    
    return items.sort((a, b) => {
      const aDate = new Date(a.dueDate || a.date)
      const bDate = new Date(b.dueDate || b.date)
      return aDate - bDate
    })
  }

  function renderCalendarDays(firstDay, daysInMonth, daysInPrevMonth, monthItems, priorities, events) {
    const today = new Date()
    const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                          currentDate.getFullYear() === today.getFullYear()
    
    // Check if mobile viewport
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
    
    return Array.from({ length: 42 }, (_, i) => {
      const dayOffset = i - firstDay
      const day = dayOffset + 1
      const isCurrentMonth = dayOffset >= 0 && dayOffset < daysInMonth
      const displayDay = isCurrentMonth ? day : (dayOffset < 0 ? daysInPrevMonth + dayOffset + 1 : day - daysInMonth)
      const isToday = isCurrentMonth && day === today.getDate() && isCurrentMonth
      const isSelected = selectedDate && selectedDate.day === day && selectedDate.isCurrentMonth === isCurrentMonth
      
      const dayKey = isCurrentMonth ? day : (dayOffset < 0 ? `prev-${displayDay}` : `next-${displayDay}`)
      const dayData = monthItems.byDay[day] || { priorities: [], events: [], count: 0 }
      
      const hasOverdue = dayData.priorities.some(p => {
        const alert = getDueAlert(p)
        return alert?.type === 'overdue'
      })
      
      const hasUrgent = dayData.priorities.some(p => 
        p.tags?.includes('urgent') || p.priority === 'high'
      )
      
      return `
        <div class="calendar-day m-touch ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasOverdue ? 'has-overdue' : ''} ${hasUrgent ? 'has-urgent' : ''}"
             onclick="selectCalendarDay(${day}, ${isCurrentMonth})"
             ondblclick="createEventOnDay(${currentDate.getFullYear()}, ${currentDate.getMonth()}, ${day})"
        >
          <div class="day-header">
            <span class="day-number">${displayDay}</span>
            ${dayData.count > 0 ? `
              <span class="day-count ${hasOverdue ? 'overdue' : hasUrgent ? 'urgent' : ''}">${dayData.count}</span>
            ` : ''}
          </div>
          
          <div class="day-items">
            ${isMobile ? renderMobileEventDots(dayData) : renderDesktopEventItems(dayData)}
          </div>
        </div>
      `
    }).join('')
  }
  
  // Render event dots for mobile (compact view)
  function renderMobileEventDots(dayData) {
    const dots = []
    const maxDots = 6
    
    // Add priority dots (urgent first, then normal)
    const sortedPriorities = [...dayData.priorities].sort((a, b) => {
      const aUrgent = a.tags?.includes('urgent') || a.priority === 'high'
      const bUrgent = b.tags?.includes('urgent') || b.priority === 'high'
      if (aUrgent && !bUrgent) return -1
      if (!aUrgent && bUrgent) return 1
      return 0
    })
    
    sortedPriorities.slice(0, maxDots).forEach(p => {
      const alert = getDueAlert(p)
      let dotClass = 'priority'
      if (p.completed) dotClass += ' completed'
      else if (alert?.type === 'overdue') dotClass += ' overdue'
      else if (alert?.type === 'soon') dotClass += ' soon'
      else if (p.tags?.includes('urgent') || p.priority === 'high') dotClass += ' urgent'
      
      dots.push(`<div class="day-item-dot ${dotClass}" title="${escapeHtml(p.text)}"></div>`)
    })
    
    // Add event dots
    const remainingDots = maxDots - dots.length
    dayData.events.slice(0, remainingDots).forEach(e => {
      dots.push(`<div class="day-item-dot event" title="${escapeHtml(e.name || e.title)}"></div>`)
    })
    
    // Add "more" indicator if needed
    const totalItems = dayData.priorities.length + dayData.events.length
    if (totalItems > maxDots) {
      dots.push(`<div class="day-more">+${totalItems - maxDots}</div>`)
    }
    
    return dots.join('')
  }
  
  // Render full event items for desktop
  function renderDesktopEventItems(dayData) {
    let items = []
    
    items.push(...dayData.priorities.slice(0, 2).map(p => {
      const alert = getDueAlert(p)
      return `
        <div class="day-item priority ${p.completed ? 'completed' : ''} ${alert?.type || ''}"
             title="${escapeHtml(p.text)}"
             onclick="event.stopPropagation(); openEditPriorityModal(${p.id})"
        >
          <span class="item-dot"></span>
          <span class="item-text">${truncateText(p.text, 12)}</span>
        </div>
      `
    }))
    
    items.push(...dayData.events.slice(0, 2).map(e => `
      <div class="day-item event" title="${escapeHtml(e.name || e.title)}"
           onclick="event.stopPropagation(); openEventModal(${e.id})"
      >
        <span class="item-dot">🎉</span>
        <span class="item-text">${truncateText(e.name || e.title, 10)}</span>
      </div>
    `))
    
    if (dayData.count > 4) {
      items.push(`<div class="day-more">+${dayData.count - 4} more</div>`)
    }
    
    return items.join('')
  }
  
  function renderDayDetails(dateInfo, priorities, events) {
    const { day, isCurrentMonth } = dateInfo
    const month = isCurrentMonth ? currentDate.getMonth() : (day > 15 ? currentDate.getMonth() - 1 : currentDate.getMonth() + 1)
    const year = currentDate.getFullYear()
    
    const dateStr = new Date(year, month, day).toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric' 
    })
    
    const dayPriorities = priorities.filter(p => {
      if (!p.dueDate) return false
      const due = new Date(p.dueDate)
      return due.getDate() === day && due.getMonth() === month && due.getFullYear() === year
    })
    
    const dayEvents = events.filter(e => {
      if (!e.date) return false
      const date = new Date(e.date)
      return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year
    })
    
    return `
      <div class="card day-details-card m-card">
        <div class="day-details-header">
          <div class="day-details-title m-title">${dateStr}</div>
          <div class="day-details-actions">
            <button class="btn btn-sm btn-primary m-touch" onclick="openEventModalForDate('${dateStr}')">➕ Add Event</button>
            <button class="btn btn-sm btn-text m-touch" onclick="closeDayDetails()">✕</button>
          </div>
        </div>
        
        ${dayPriorities.length === 0 && dayEvents.length === 0 ? `
          <div class="empty-state-small">
            <div class="empty-state-text m-body">No items for this day</div>
            <button class="btn btn-sm btn-secondary m-touch" onclick="createEventOnDay(${year}, ${month}, ${day})" style="margin-top: 1rem;">
              ➕ Add Event
            </button>
          </div>
        ` : `
          <div class="day-details-list">
            ${dayPriorities.map(p => {
              const alert = getDueAlert(p)
              return `
                <div class="day-detail-item priority ${p.completed ? 'completed' : ''} ${alert?.type || ''} m-touch"
                     onclick="openEditPriorityModal(${p.id})">
                  <div class="detail-checkbox ${p.completed ? 'checked' : ''} m-touch"
                       onclick="event.stopPropagation(); togglePriority(${p.id})"></div>
                  <div class="detail-content">
                    <div class="detail-text m-body">${escapeHtml(p.text)}</div>
                    <div class="detail-meta m-caption">
                      ${alert ? `<span class="detail-alert ${alert.type}">${alert.icon} ${alert.text}</span>` : ''}
                      ${p.tags?.map(t => `<span class="detail-tag">#${t}</span>`).join('') || ''}
                    </div>
                  </div>
                </div>
              `
            }).join('')}
            
            ${dayEvents.map(e => `
              <div class="day-detail-item event m-touch" onclick="openEventModal(${e.id})">
                <div class="detail-icon">🎉</div>
                <div class="detail-content">
                  <div class="detail-text m-body">${escapeHtml(e.name || e.title)}</div>
                  <div class="detail-meta m-caption">
                    <span>📍 ${escapeHtml(e.location || 'TBD')}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
            <button class="btn btn-sm btn-secondary m-touch" onclick="createEventOnDay(${year}, ${month}, ${day})" style="width: 100%;">
              ➕ Add Event
            </button>
          </div>
        `}
      </div>
    `
  }
  
  function renderUpcomingItem(item) {
    const isPriority = item.type === 'priority'
    const alert = isPriority ? getDueAlert(item) : null
    const daysUntil = Math.ceil((new Date(item.dueDate || item.date) - new Date()) / (1000 * 60 * 60 * 24))
    
    return `
      <div class="m-list-item upcoming-item ${isPriority ? 'priority' : 'event'} ${alert?.type || ''} ${daysUntil < 0 ? 'past' : ''}"
           onclick="${isPriority ? `openEditPriorityModal(${item.id})` : `openEditEventModal(${item.id})`}">
        <div class="upcoming-date">
          <div class="upcoming-day">${new Date(item.dueDate || item.date).getDate()}</div>
          <div class="upcoming-month">${new Date(item.dueDate || item.date).toLocaleDateString('en-US', { month: 'short' })}</div>
        </div>
        <div class="m-list-item-content upcoming-content">
          <div class="m-list-item-title upcoming-title">${escapeHtml(item.text || item.name || item.title)}</div>
          <div class="m-card-meta upcoming-meta">
            ${alert ? `<span class="upcoming-alert ${alert.type}">${alert.icon} ${alert.text}</span>` : ''}
            ${daysUntil >= 0 ? `<span class="upcoming-countdown">in ${daysUntil}d</span>` : ''}
            ${item.location ? `<span>📍 ${escapeHtml(item.location)}</span>` : ''}
          </div>
        </div>
        
        <div class="m-list-item-actions upcoming-type">
          ${isPriority ? '⭐' : '🎉'}
        </div>
      </div>
    `
  }
  
  function getMonthItems(priorities, events, month, year) {
    const cacheKey = `month-${month}-${year}-${priorities.length}-${events.length}`
    return memoize(cacheKey, () => {
      const byDay = {}
      let count = 0
      
      priorities.forEach(p => {
        if (!p.dueDate) return
        const due = new Date(p.dueDate)
        if (due.getMonth() === month && due.getFullYear() === year) {
          const day = due.getDate()
          if (!byDay[day]) byDay[day] = { priorities: [], events: [], count: 0 }
          byDay[day].priorities.push(p)
          byDay[day].count++
          count++
        }
      })
      
      events.forEach(e => {
        if (!e.date) return
        const date = new Date(e.date)
        if (date.getMonth() === month && date.getFullYear() === year) {
          const day = date.getDate()
          if (!byDay[day]) byDay[day] = { priorities: [], events: [], count: 0 }
          byDay[day].events.push(e)
          byDay[day].count++
          count++
        }
      })
      
      return { byDay, count }
    })
  }
  
  function getUpcomingItems(priorities, events) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const items = []
    let overdue = 0
    
    priorities.forEach(p => {
      if (!p.dueDate || p.completed) return
      const due = new Date(p.dueDate)
      const alert = getDueAlert(p)
      if (alert?.type === 'overdue') overdue++
      
      items.push({
        ...p,
        type: 'priority',
        sortDate: due
      })
    })
    
    events.forEach(e => {
      if (!e.date) return
      const date = new Date(e.date)
      if (date >= today) {
        items.push({
          ...e,
          type: 'event',
          sortDate: date
        })
      }
    })
    
    items.sort((a, b) => a.sortDate - b.sortDate)
    
    return { items, overdue }
  }
  
  // Global functions
  window.setCalendarView = (mode) => {
    viewMode = mode
    render()
  }
  
  window.changePeriod = (delta) => {
    if (viewMode === 'month') {
      currentDate.setMonth(currentDate.getMonth() + delta)
    } else if (viewMode === 'week') {
      currentDate.setDate(currentDate.getDate() + (delta * 7))
    } else {
      currentDate.setDate(currentDate.getDate() + delta)
    }
    selectedDate = null
    render()
  }
  
  window.changeMonth = (delta) => {
    currentDate.setMonth(currentDate.getMonth() + delta)
    selectedDate = null
    render()
  }
  
  window.goToToday = () => {
    currentDate = new Date()
    selectedDate = { day: currentDate.getDate(), isCurrentMonth: true }
    render()
  }
  
  window.selectCalendarDay = (day, isCurrentMonth) => {
    selectedDate = { day, isCurrentMonth }
    render()
  }
  
  window.selectDate = (dateStr) => {
    const date = new Date(dateStr)
    selectedDate = { day: date.getDate(), isCurrentMonth: true }
    currentDate = date
    render()
  }
  
  window.closeDayDetails = () => {
    selectedDate = null
    render()
  }
  
  window.openEventModalForDate = (dateStr) => {
    // Parse the date string and pre-fill the event modal
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      // Store the date temporarily for the modal to pick up
      window._calendarSelectedDate = date.toISOString().split('T')[0]
      openEventModal()
    }
  }
  
  window.openEditEventModal = (eventId) => {
    openEventModal(eventId)
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('priorities') || path.includes('events')) {
      clearMemoCache()
      render()
    }
  })
  
  render()
  return { render }
}

// Create event on specific day
window.createEventOnDay = (year, month, day) => {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  openEventModal(null, { date: dateStr })
}

function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 2) + '..'
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}