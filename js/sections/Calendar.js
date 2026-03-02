/**
 * Calendar Section - Event scheduling with month/week/day views
 * Uses new design system with Card, Button, Badge components
 */

import { store } from '../state/store.js'
import { Toast } from '../components/Toast.js'
import { Card } from '../components/Card.js'
import { Button, IconButton } from '../components/Button.js'
import { Badge } from '../components/Badge.js'

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

function clearMemoCache() {
  memoCache.clear()
}

/**
 * Create the Calendar section
 * @param {string} containerId - Container element ID
 * @returns {Object} Section controller with render method
 */
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
    
    // Build header
    const headerSection = document.createElement('div')
    headerSection.className = 'section-header'
    headerSection.innerHTML = `
      <div class="section-header__content">
        <h1 class="section-header__title">
          <i data-lucide="calendar"></i> Calendar
        </h1>
        <div class="section-header__badges">
          <span class="badge badge--neutral">${monthItems.count} items this ${viewMode}</span>
          ${upcomingItems.overdue > 0 ? `
            <span class="badge badge--danger">
              <i data-lucide="flame"></i> ${upcomingItems.overdue} overdue
            </span>
          ` : ''}
        </div>
      </div>
    `
    
    // View toggle buttons
    const viewToggle = document.createElement('div')
    viewToggle.className = 'btn-group'
    viewToggle.style.display = 'flex'
    viewToggle.style.gap = 'var(--space-1)'
    
    const viewButtons = [
      { mode: 'month', label: 'Month' },
      { mode: 'week', label: 'Week' },
      { mode: 'day', label: 'Day' }
    ]
    
    viewButtons.forEach(({ mode, label }) => {
      const btn = Button({
        text: label,
        variant: viewMode === mode ? 'primary' : 'secondary',
        size: 'sm',
        onClick: () => {
          viewMode = mode
          render()
        }
      })
      viewToggle.appendChild(btn)
    })
    
    // Navigation
    const navGroup = document.createElement('div')
    navGroup.style.display = 'flex'
    navGroup.style.alignItems = 'center'
    navGroup.style.gap = 'var(--space-3)'
    
    const prevBtn = IconButton({
      icon: 'chevron-left',
      variant: 'secondary',
      onClick: () => changePeriod(-1)
    })
    
    const nextBtn = IconButton({
      icon: 'chevron-right',
      variant: 'secondary',
      onClick: () => changePeriod(1)
    })
    
    const todayBtn = Button({
      text: 'Today',
      variant: 'secondary',
      size: 'sm',
      onClick: () => goToToday()
    })
    
    const periodLabel = document.createElement('span')
    periodLabel.className = 'font-semibold'
    periodLabel.style.minWidth = '200px'
    periodLabel.style.textAlign = 'center'
    periodLabel.textContent = getPeriodLabel()
    
    navGroup.appendChild(prevBtn)
    navGroup.appendChild(periodLabel)
    navGroup.appendChild(nextBtn)
    navGroup.appendChild(todayBtn)
    
    const addBtn = Button({
      text: window.innerWidth > 768 ? 'Add Event' : '',
      variant: 'primary',
      icon: 'plus',
      onClick: () => openEventModal()
    })
    
    const headerActions = document.createElement('div')
    headerActions.style.display = 'flex'
    headerActions.style.alignItems = 'center'
    headerActions.style.gap = 'var(--space-3)'
    headerActions.appendChild(viewToggle)
    headerActions.appendChild(navGroup)
    headerActions.appendChild(addBtn)
    
    headerSection.querySelector('.section-header__content').appendChild(headerActions)
    
    // Calendar card
    const calendarCard = Card({
      body: renderCalendarView(firstDay, daysInMonth, daysInPrevMonth, monthItems, priorities, events)
    })
    
    // Clear and append
    container.innerHTML = ''
    container.appendChild(headerSection)
    container.appendChild(calendarCard)
    
    // Selected day details
    if (selectedDate) {
      const detailsCard = renderDayDetails(selectedDate, priorities, events)
      container.appendChild(detailsCard)
    }
    
    // Upcoming items card
    const upcomingCard = Card({
      header: { 
        title: 'Upcoming',
        actions: Badge({ text: `${upcomingItems.items.length} items`, variant: 'neutral' })
      },
      body: renderUpcomingList(upcomingItems.items)
    })
    container.appendChild(upcomingCard)
    
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons()
    }
  }
  
  /**
   * Render the appropriate calendar view based on viewMode
   */
  function renderCalendarView(firstDay, daysInMonth, daysInPrevMonth, monthItems, priorities, events) {
    switch (viewMode) {
      case 'month':
        return renderMonthView(firstDay, daysInMonth, daysInPrevMonth, monthItems, priorities, events)
      case 'week':
        return renderWeekView(priorities, events)
      case 'day':
        return renderDayView(priorities, events)
      default:
        return renderMonthView(firstDay, daysInMonth, daysInPrevMonth, monthItems, priorities, events)
    }
  }
  
  /**
   * Render month view
   */
  function renderMonthView(firstDay, daysInMonth, daysInPrevMonth, monthItems, priorities, events) {
    const wrapper = document.createElement('div')
    wrapper.className = 'calendar-month-view'
    
    // Weekday headers
    const weekdays = document.createElement('div')
    weekdays.style.display = 'grid'
    weekdays.style.gridTemplateColumns = 'repeat(7, 1fr)'
    weekdays.style.gap = 'var(--space-1)'
    weekdays.style.marginBottom = 'var(--space-2)'
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    dayNames.forEach(day => {
      const dayHeader = document.createElement('div')
      dayHeader.className = 'text-sm text-muted text-center'
      dayHeader.style.padding = 'var(--space-2)'
      dayHeader.textContent = day
      weekdays.appendChild(dayHeader)
    })
    
    wrapper.appendChild(weekdays)
    
    // Calendar grid
    const grid = document.createElement('div')
    grid.style.display = 'grid'
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)'
    grid.style.gap = 'var(--space-1)'
    
    const today = new Date()
    const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                          currentDate.getFullYear() === today.getFullYear()
    
    // Generate 42 cells (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dayOffset = i - firstDay
      const day = dayOffset + 1
      const isInCurrentMonth = dayOffset >= 0 && dayOffset < daysInMonth
      const displayDay = isInCurrentMonth ? day : (dayOffset < 0 ? daysInPrevMonth + dayOffset + 1 : day - daysInMonth)
      const isToday = isInCurrentMonth && day === today.getDate() && isCurrentMonth
      const isSelected = selectedDate && selectedDate.day === day && selectedDate.isCurrentMonth === isInCurrentMonth
      
      const dayData = monthItems.byDay[day] || { priorities: [], events: [], count: 0 }
      
      const cell = document.createElement('div')
      cell.className = `calendar-day ${!isInCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`
      cell.style.aspectRatio = '1'
      cell.style.padding = 'var(--space-2)'
      cell.style.borderRadius = 'var(--radius-md)'
      cell.style.cursor = 'pointer'
      cell.style.border = '1px solid transparent'
      cell.style.transition = 'all var(--transition-base)'
      cell.style.background = isSelected ? 'var(--color-primary-light)' : 
                              isToday ? 'var(--color-surface-hover)' : 
                              'transparent'
      cell.style.borderColor = isToday ? 'var(--color-primary)' : 'transparent'
      
      if (!isInCurrentMonth) {
        cell.style.opacity = '0.5'
      }
      
      cell.innerHTML = `
        <div class="flex justify-between items-start">
          <span class="text-sm ${isToday ? 'font-bold text-primary' : ''}">${displayDay}</span>
          ${dayData.count > 0 ? `
            <span class="badge badge--primary" style="font-size: 10px; padding: 2px 6px;">${dayData.count}</span>
          ` : ''}
        </div>
        <div class="day-dots" style="display: flex; gap: 2px; margin-top: var(--space-1); flex-wrap: wrap;">
          ${renderDayDots(dayData)}
        </div>
      `
      
      cell.addEventListener('click', () => {
        selectedDate = { day, isCurrentMonth: isInCurrentMonth }
        render()
      })
      
      cell.addEventListener('dblclick', () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        createEventOnDay(year, month, day)
      })
      
      // Hover effect
      cell.addEventListener('mouseenter', () => {
        if (!isSelected) {
          cell.style.background = 'var(--color-surface-hover)'
        }
      })
      cell.addEventListener('mouseleave', () => {
        if (!isSelected) {
          cell.style.background = isToday ? 'var(--color-surface-hover)' : 'transparent'
        }
      })
      
      grid.appendChild(cell)
    }
    
    wrapper.appendChild(grid)
    return wrapper
  }
  
  /**
   * Render week view
   */
  function renderWeekView(priorities, events) {
    const wrapper = document.createElement('div')
    wrapper.className = 'calendar-week-view'
    
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - currentDate.getDay())
    
    // Weekday headers
    const weekdays = document.createElement('div')
    weekdays.style.display = 'grid'
    weekdays.style.gridTemplateColumns = 'repeat(7, 1fr)'
    weekdays.style.gap = 'var(--space-2)'
    weekdays.style.marginBottom = 'var(--space-2)'
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    dayNames.forEach((day, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const isToday = date.toDateString() === new Date().toDateString()
      
      const dayHeader = document.createElement('div')
      dayHeader.className = `text-center p-2 ${isToday ? 'bg-primary-light rounded-lg' : ''}`
      dayHeader.innerHTML = `
        <div class="text-sm text-muted">${day}</div>
        <div class="font-semibold ${isToday ? 'text-primary' : ''}">${date.getDate()}</div>
      `
      weekdays.appendChild(dayHeader)
    })
    
    wrapper.appendChild(weekdays)
    
    // Week grid
    const grid = document.createElement('div')
    grid.style.display = 'grid'
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)'
    grid.style.gap = 'var(--space-2)'
    grid.style.minHeight = '300px'
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dayItems = getItemsForDate(priorities, events, date)
      const isToday = date.toDateString() === new Date().toDateString()
      
      const cell = document.createElement('div')
      cell.className = `p-2 rounded-lg ${isToday ? 'bg-primary-light border border-primary' : 'bg-surface-hover'}`
      cell.style.minHeight = '100px'
      cell.style.cursor = 'pointer'
      
      if (dayItems.length === 0) {
        cell.innerHTML = `<div class="text-muted text-sm text-center mt-4">-</div>`
      } else {
        dayItems.slice(0, 5).forEach(item => {
          const itemEl = document.createElement('div')
          itemEl.className = `text-xs p-1 mb-1 rounded ${item.type === 'priority' ? 'bg-warning-light text-warning' : 'bg-info-light text-info'}`
          itemEl.textContent = truncateText(item.text || item.name, 20)
          cell.appendChild(itemEl)
        })
        
        if (dayItems.length > 5) {
          cell.innerHTML += `<div class="text-xs text-muted text-center">+${dayItems.length - 5} more</div>`
        }
      }
      
      cell.addEventListener('click', () => {
        selectedDate = { day: date.getDate(), isCurrentMonth: true }
        currentDate = date
        render()
      })
      
      grid.appendChild(cell)
    }
    
    wrapper.appendChild(grid)
    return wrapper
  }
  
  /**
   * Render day view
   */
  function renderDayView(priorities, events) {
    const wrapper = document.createElement('div')
    wrapper.className = 'calendar-day-view'
    
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
      hoursToShow = Array.from({length: 11}, (_, i) => i + 8) // 8am-6pm
    } else {
      const minHour = Math.min(...hoursWithItems)
      const maxHour = Math.max(...hoursWithItems)
      const startHour = Math.max(0, minHour - 1)
      const endHour = Math.min(23, maxHour + 1)
      hoursToShow = Array.from({length: endHour - startHour + 1}, (_, i) => i + startHour)
    }
    
    const timeline = document.createElement('div')
    timeline.className = 'day-timeline'
    
    hoursToShow.forEach(hour => {
      const itemsAtHour = itemsByHour[hour] || []
      const isBusinessHour = hour >= 9 && hour <= 17
      
      const hourRow = document.createElement('div')
      hourRow.style.display = 'flex'
      hourRow.style.gap = 'var(--space-3)'
      hourRow.style.padding = 'var(--space-2) 0'
      hourRow.style.borderBottom = '1px solid var(--color-border)'
      hourRow.style.background = isBusinessHour ? 'transparent' : 'var(--color-surface-hover)'
      
      hourRow.innerHTML = `
        <div class="hour-label text-sm text-muted" style="width: 60px; flex-shrink: 0;">${formatHour(hour)}</div>
        <div class="hour-content flex-1">
          ${itemsAtHour.map(item => `
            <div class="calendar-event ${item.type} p-2 rounded mb-1 cursor-pointer"
                 style="background: ${item.type === 'priority' ? 'var(--color-warning-light)' : 'var(--color-info-light)'};"
                 onclick="${item.type === 'priority' ? `openEditPriorityModal(${item.id})` : `openEventModal(${item.id})`}">
              <div class="flex items-center gap-2">
                <i data-lucide="${item.type === 'priority' ? 'zap' : 'calendar'}" style="width: 14px; height: 14px;"></i>
                <span class="text-sm">${escapeHtml(item.text || item.name)}</span>
                <span class="text-xs text-muted">${formatTime(item.dueDate || item.date)}</span>
              </div>
            </div>
          `).join('')}
          
          ${itemsAtHour.length === 0 ? `
            <div class="text-xs text-muted cursor-pointer hover:text-primary p-1"
                 onclick="createEventOnDay(${currentDate.getFullYear()}, ${currentDate.getMonth()}, ${currentDate.getDate()}, ${hour})">
              + Add event
            </div>
          ` : ''}
        </div>
      `
      
      timeline.appendChild(hourRow)
    })
    
    wrapper.appendChild(timeline)
    
    if (dayItems.length === 0) {
      const emptyState = document.createElement('div')
      emptyState.className = 'empty-state-small'
      emptyState.style.padding = 'var(--space-8)'
      emptyState.style.textAlign = 'center'
      emptyState.innerHTML = `
        <i data-lucide="calendar" style="width: 32px; height: 32px; color: var(--color-text-muted); margin-bottom: var(--space-2);"></i>
        <div class="text-muted">No items for this day</div>
      `
      wrapper.appendChild(emptyState)
    }
    
    return wrapper
  }
  
  /**
   * Render day dots for month view
   */
  function renderDayDots(dayData) {
    const dots = []
    const maxDots = 6
    
    // Priority dots
    dayData.priorities.slice(0, maxDots).forEach(p => {
      const isOverdue = new Date(p.dueDate) < new Date() && !p.completed
      const color = p.completed ? 'var(--color-success)' : 
                   isOverdue ? 'var(--color-danger)' : 
                   'var(--color-warning)'
      dots.push(`<div style="width: 6px; height: 6px; border-radius: 50%; background: ${color};"></div>`)
    })
    
    // Event dots
    const remainingDots = maxDots - dots.length
    dayData.events.slice(0, remainingDots).forEach(() => {
      dots.push(`<div style="width: 6px; height: 6px; border-radius: 50%; background: var(--color-info);"></div>`)
    })
    
    return dots.join('')
  }
  
  /**
   * Render day details card
   */
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
      const eventDate = new Date(e.date)
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year
    })
    
    const body = document.createElement('div')
    
    if (dayPriorities.length === 0 && dayEvents.length === 0) {
      body.innerHTML = `
        <div class="empty-state-small text-center p-4">
          <div class="text-muted mb-3">No items for this day</div>
        </div>
      `
      const addBtn = Button({
        text: 'Add Event',
        variant: 'secondary',
        icon: 'plus',
        onClick: () => createEventOnDay(year, month, day)
      })
      body.appendChild(addBtn)
    } else {
      const list = document.createElement('div')
      list.className = 'day-details-list'
      
      dayPriorities.forEach(p => {
        const isOverdue = new Date(p.dueDate) < new Date() && !p.completed
        const item = document.createElement('div')
        item.className = 'day-detail-item flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-surface-hover mb-2'
        item.onclick = () => openEditPriorityModal(p.id)
        item.innerHTML = `
          <div class="w-5 h-5 rounded border-2 flex items-center justify-center ${p.completed ? 'bg-success border-success' : 'border-muted'}"
               onclick="event.stopPropagation(); togglePriority(${p.id})">
            ${p.completed ? '<i data-lucide="check" style="width: 12px; height: 12px; color: white;"></i>' : ''}
          </div>
          <div class="flex-1 ${p.completed ? 'line-through text-muted' : ''}">
            <div class="text-sm">${escapeHtml(p.text)}</div>
            ${isOverdue ? '<span class="text-xs text-danger">Overdue</span>' : ''}
          </div>
          <i data-lucide="zap" style="width: 14px; height: 14px; color: var(--color-warning);"></i>
        `
        list.appendChild(item)
      })
      
      dayEvents.forEach(e => {
        const item = document.createElement('div')
        item.className = 'day-detail-item flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-surface-hover mb-2'
        item.onclick = () => openEventModal(e.id)
        item.innerHTML = `
          <i data-lucide="calendar" style="width: 16px; height: 16px; color: var(--color-info);"></i>
          <div class="flex-1">
            <div class="text-sm">${escapeHtml(e.name || e.title)}</div>
            ${e.location ? `<div class="text-xs text-muted"><i data-lucide="map-pin" style="width: 10px; height: 10px;"></i> ${escapeHtml(e.location)}</div>` : ''}
          </div>
        `
        list.appendChild(item)
      })
      
      body.appendChild(list)
    }
    
    return Card({
      header: { 
        title: dateStr,
        actions: IconButton({
          icon: 'x',
          variant: 'ghost',
          onClick: () => {
            selectedDate = null
            render()
          }
        })
      },
      body
    })
  }
  
  /**
   * Render upcoming items list
   */
  function renderUpcomingList(items) {
    if (items.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'empty-state-small text-center p-4'
      empty.innerHTML = `
        <i data-lucide="calendar" style="width: 32px; height: 32px; color: var(--color-text-muted); margin-bottom: var(--space-2);"></i>
        <div class="text-muted">No upcoming items</div>
      `
      return empty
    }
    
    const list = document.createElement('div')
    list.className = 'upcoming-list'
    
    items.slice(0, 10).forEach(item => {
      const isPriority = item.type === 'priority'
      const daysUntil = Math.ceil((new Date(item.dueDate || item.date) - new Date()) / (1000 * 60 * 60 * 24))
      const isOverdue = daysUntil < 0
      
      const itemEl = document.createElement('div')
      itemEl.className = 'upcoming-item flex items-center gap-3 p-3 rounded cursor-pointer hover:bg-surface-hover mb-2'
      itemEl.onclick = () => isPriority ? openEditPriorityModal(item.id) : openEventModal(item.id)
      
      itemEl.innerHTML = `
        <div class="upcoming-date text-center p-2 rounded bg-surface" style="min-width: 50px;">
          <div class="font-bold">${new Date(item.dueDate || item.date).getDate()}</div>
          <div class="text-xs text-muted">${new Date(item.dueDate || item.date).toLocaleDateString('en-US', { month: 'short' })}</div>
        </div>
        <div class="flex-1">
          <div class="text-sm font-medium">${escapeHtml(item.text || item.name || item.title)}</div>
          <div class="text-xs text-muted">
            ${isOverdue ? `<span class="text-danger">Overdue</span>` : `in ${daysUntil}d`}
            ${item.location ? `• <i data-lucide="map-pin" style="width: 10px; height: 10px;"></i> ${escapeHtml(item.location)}` : ''}
          </div>
        </div>
        <i data-lucide="${isPriority ? 'zap' : 'calendar'}" style="width: 16px; height: 16px; color: ${isPriority ? 'var(--color-warning)' : 'var(--color-info)'};"></i>
      `
      
      list.appendChild(itemEl)
    })
    
    if (items.length > 10) {
      const more = document.createElement('div')
      more.className = 'text-center text-muted text-sm mt-2'
      more.textContent = `+${items.length - 10} more items`
      list.appendChild(more)
    }
    
    return list
  }
  
  /**
   * Get items for a specific date
   */
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
  
  /**
   * Get month items with memoization
   */
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
  
  /**
   * Get upcoming items
   */
  function getUpcomingItems(priorities, events) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const items = []
    let overdue = 0
    
    priorities.forEach(p => {
      if (!p.dueDate || p.completed) return
      const due = new Date(p.dueDate)
      if (due < today) overdue++
      
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
  
  /**
   * Get period label for header
   */
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
  
  /**
   * Change period based on view mode
   */
  function changePeriod(delta) {
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
  
  /**
   * Go to today
   */
  function goToToday() {
    currentDate = new Date()
    selectedDate = { day: currentDate.getDate(), isCurrentMonth: true }
    render()
  }
  
  /**
   * Format hour for display
   */
  function formatHour(hour) {
    if (hour === 0) return '12 AM'
    if (hour < 12) return `${hour} AM`
    if (hour === 12) return '12 PM'
    return `${hour - 12} PM`
  }
  
  /**
   * Format time for display
   */
  function formatTime(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  
  /**
   * Truncate text
   */
  function truncateText(text, maxLength) {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 2) + '..'
  }
  
  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  // Subscribe to store changes
  store.subscribe((state, path) => {
    if (!path || path.includes('priorities') || path.includes('events')) {
      clearMemoCache()
      render()
    }
  })
  
  render()
  return { render }
}

/**
 * Create event on specific day (global function for onclick handlers)
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @param {number} day - Day of month
 * @param {number} [hour] - Optional hour
 */
export function createEventOnDay(year, month, day, hour = null) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  if (window.openEventModal) {
    window.openEventModal(null, { date: dateStr, hour })
  }
}

export default createCalendarSection
