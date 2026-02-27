// Calendar Keyboard Navigation
// Arrow key navigation for calendar

export class CalendarKeyboardNav {
  constructor(calendarElement, options = {}) {
    this.element = calendarElement
    this.options = {
      onDateSelect: options.onDateSelect || (() => {}),
      onViewChange: options.onViewChange || (() => {}),
      getCurrentDate: options.getCurrentDate,
      setCurrentDate: options.setCurrentDate,
      ...options
    }
    
    this.focusedDate = new Date()
    this.isKeyboardMode = false
    
    this.init()
  }
  
  init() {
    // Make calendar focusable
    this.element.setAttribute('tabindex', '0')
    this.element.setAttribute('role', 'grid')
    this.element.setAttribute('aria-label', 'Calendar')
    
    // Add keyboard handler
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this))
    
    // Track focus
    this.element.addEventListener('focus', () => {
      this.isKeyboardMode = true
      this.element.classList.add('keyboard-mode')
      this.highlightFocusedDate()
    })
    
    this.element.addEventListener('blur', () => {
      this.isKeyboardMode = false
      this.element.classList.remove('keyboard-mode')
      this.clearHighlight()
    })
    
    // Click to focus
    this.element.addEventListener('click', () => {
      this.element.focus()
    })
  }
  
  handleKeyDown(e) {
    if (!this.isKeyboardMode) return
    
    const current = this.options.getCurrentDate ? this.options.getCurrentDate() : new Date()
    let newDate = new Date(current)
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        newDate.setDate(newDate.getDate() - 1)
        this.moveToDate(newDate)
        break
        
      case 'ArrowRight':
        e.preventDefault()
        newDate.setDate(newDate.getDate() + 1)
        this.moveToDate(newDate)
        break
        
      case 'ArrowUp':
        e.preventDefault()
        newDate.setDate(newDate.getDate() - 7)
        this.moveToDate(newDate)
        break
        
      case 'ArrowDown':
        e.preventDefault()
        newDate.setDate(newDate.getDate() + 7)
        this.moveToDate(newDate)
        break
        
      case 'PageUp':
        e.preventDefault()
        if (e.shiftKey) {
          newDate.setFullYear(newDate.getFullYear() - 1)
        } else {
          newDate.setMonth(newDate.getMonth() - 1)
        }
        this.moveToDate(newDate)
        break
        
      case 'PageDown':
        e.preventDefault()
        if (e.shiftKey) {
          newDate.setFullYear(newDate.getFullYear() + 1)
        } else {
          newDate.setMonth(newDate.getMonth() + 1)
        }
        this.moveToDate(newDate)
        break
        
      case 'Home':
        e.preventDefault()
        newDate.setDate(1)
        this.moveToDate(newDate)
        break
        
      case 'End':
        e.preventDefault()
        newDate.setMonth(newDate.getMonth() + 1, 0)
        this.moveToDate(newDate)
        break
        
      case 'Enter':
      case ' ':
        e.preventDefault()
        this.selectDate(this.focusedDate)
        break
        
      case 'Escape':
        this.element.blur()
        break
        
      case 'v':
        if (e.ctrlKey) {
          e.preventDefault()
          this.options.onViewChange('month')
        }
        break
        
      case 'w':
        if (e.ctrlKey) {
          e.preventDefault()
          this.options.onViewChange('week')
        }
        break
        
      case 'd':
        if (e.ctrlKey) {
          e.preventDefault()
          this.options.onViewChange('day')
        }
        break
    }
  }
  
  moveToDate(date) {
    this.focusedDate = date
    
    if (this.options.setCurrentDate) {
      this.options.setCurrentDate(date)
    }
    
    this.highlightFocusedDate()
    this.announceDate(date)
  }
  
  selectDate(date) {
    this.options.onDateSelect(date)
    
    // Visual feedback
    const cell = this.getDateCell(date)
    if (cell) {
      cell.classList.add('selected')
      setTimeout(() => cell.classList.remove('selected'), 200)
    }
  }
  
  highlightFocusedDate() {
    this.clearHighlight()
    
    const cell = this.getDateCell(this.focusedDate)
    if (cell) {
      cell.classList.add('keyboard-focus')
      cell.setAttribute('aria-selected', 'true')
      
      // Scroll into view if needed
      cell.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    }
  }
  
  clearHighlight() {
    const highlighted = this.element.querySelectorAll('.keyboard-focus')
    highlighted.forEach(el => {
      el.classList.remove('keyboard-focus')
      el.removeAttribute('aria-selected')
    })
  }
  
  getDateCell(date) {
    const dateStr = date.toISOString().split('T')[0]
    return this.element.querySelector(`[data-date="${dateStr}"]`)
  }
  
  announceDate(date) {
    // For screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.className = 'sr-only'
    announcement.textContent = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    document.body.appendChild(announcement)
    setTimeout(() => announcement.remove(), 1000)
  }
  
  // Focus the calendar
  focus() {
    this.element.focus()
  }
  
  // Destroy
  destroy() {
    this.element.removeEventListener('keydown', this.handleKeyDown)
    this.clearHighlight()
  }
}

// Initialize on calendar
export function initCalendarKeyboardNav(calendarElement, options) {
  return new CalendarKeyboardNav(calendarElement, options)
}

// CSS for keyboard navigation
export const calendarKeyboardCSS = `
  .calendar.keyboard-mode {
    outline: 2px solid var(--accent-primary);
    outline-offset: 2px;
  }
  
  .calendar-day.keyboard-focus {
    background: var(--accent-primary) !important;
    color: white !important;
    transform: scale(1.1);
    z-index: 10;
    box-shadow: 0 0 0 3px var(--accent-primary);
  }
  
  .calendar-day.keyboard-focus .day-number {
    color: white;
  }
  
  .calendar-day.keyboard-focus .day-events {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .calendar-day.selected {
    animation: calendarSelect 0.2s ease;
  }
  
  @keyframes calendarSelect {
    0% { transform: scale(1); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
  
  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
`

export default CalendarKeyboardNav
