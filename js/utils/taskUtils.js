// Time tracking utilities
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0h'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function parseDuration(input) {
  if (!input) return 0
  
  // Parse formats: "2h", "30m", "2h 30m", "150"
  const hoursMatch = input.match(/(\d+(?:\.\d+)?)\s*h/i)
  const minsMatch = input.match(/(\d+)\s*m/i)
  const plainNumber = input.match(/^(\d+)$/)
  
  let totalMinutes = 0
  
  if (hoursMatch) {
    totalMinutes += parseFloat(hoursMatch[1]) * 60
  }
  
  if (minsMatch) {
    totalMinutes += parseInt(minsMatch[1])
  }
  
  if (plainNumber && !hoursMatch && !minsMatch) {
    // Assume minutes if just a number
    totalMinutes = parseInt(plainNumber[1])
  }
  
  return Math.round(totalMinutes)
}

export function getTimeProgress(timeEstimate, timeSpent) {
  if (!timeEstimate || timeEstimate <= 0) return 0
  return Math.min((timeSpent || 0) / timeEstimate, 1)
}

export function renderTimeTracking(priority) {
  const { timeEstimate, timeSpent } = priority
  if (!timeEstimate && !timeSpent) return ''
  
  const progress = getTimeProgress(timeEstimate, timeSpent)
  const percent = Math.round(progress * 100)
  
  return `
    <div style="margin-top: 0.5rem;">
      <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted);">
        <span>⏱️ ${formatDuration(timeSpent || 0)} / ${formatDuration(timeEstimate || 0)}</span>
        <span>${percent}%</span>
      </div>
      <div style="height: 4px; background: var(--bg-secondary); border-radius: 2px; margin-top: 0.25rem; overflow: hidden;">
        <div style="height: 100%; width: ${percent}%; 
                    background: ${progress > 1 ? 'var(--accent-danger)' : progress > 0.8 ? 'var(--accent-warning)' : 'var(--accent-success)'}; 
                    border-radius: 2px; transition: width 0.3s;"></div>
      </div>
    </div>
  `
}

// Recurring task utilities
export const RECURRING_TYPES = {
  none: { label: 'None', interval: null },
  daily: { label: 'Daily', interval: 1 },
  weekly: { label: 'Weekly', interval: 7 },
  monthly: { label: 'Monthly', interval: 30 }
}

export function shouldRegenerateRecurring(priority) {
  if (!priority.recurring || priority.recurring === 'none') return false
  if (!priority.completed) return false
  
  const type = RECURRING_TYPES[priority.recurring]
  if (!type || !type.interval) return false
  
  // Check if enough time has passed since completion
  const completedAt = priority.completedAt ? new Date(priority.completedAt) : new Date()
  const daysSince = (Date.now() - completedAt) / (1000 * 60 * 60 * 24)
  
  return daysSince >= type.interval
}

export function regenerateRecurringTask(priority) {
  if (!shouldRegenerateRecurring(priority)) return null
  
  // Create new instance
  const newTask = {
    ...priority,
    id: Date.now(),
    completed: false,
    status: 'later',
    completedAt: null,
    createdAt: new Date().toISOString(),
    timeSpent: 0,
    activityLog: []
  }
  
  // Calculate new due date if exists
  if (priority.dueDate) {
    const oldDue = new Date(priority.dueDate)
    const type = RECURRING_TYPES[priority.recurring]
    
    if (type.interval) {
      const newDue = new Date(oldDue)
      if (priority.recurring === 'monthly') {
        newDue.setMonth(newDue.getMonth() + 1)
      } else {
        newDue.setDate(newDue.getDate() + type.interval)
      }
      newTask.dueDate = newDue.toISOString().split('T')[0]
    }
  }
  
  return newTask
}

// Dependency utilities
export function isPriorityBlocked(priority, allPriorities) {
  if (!priority.blockedBy || priority.blockedBy.length === 0) return false
  
  return priority.blockedBy.some(blockerId => {
    const blocker = allPriorities.find(p => p.id === blockerId)
    return blocker && !blocker.completed
  })
}

export function getBlockedByNames(priority, allPriorities) {
  if (!priority.blockedBy || priority.blockedBy.length === 0) return []
  
  return priority.blockedBy.map(id => {
    const p = allPriorities.find(p => p.id === id)
    return p ? p.text : 'Unknown'
  })
}

export function renderDependencies(priority, allPriorities) {
  if (!priority.blockedBy || priority.blockedBy.length === 0) return ''
  
  const isBlocked = isPriorityBlocked(priority, allPriorities)
  const blockerNames = getBlockedByNames(priority, allPriorities)
  
  return `
    <div style="margin-top: 0.5rem; font-size: 0.75rem; ${isBlocked ? 'color: var(--accent-danger);' : 'color: var(--text-muted);'}">
      ${isBlocked ? '🔒' : '✓'} Blocked by: ${blockerNames.join(', ')}
    </div>
  `
}

// Activity Log utilities
export function logActivity(priority, action, details = '') {
  if (!priority.activityLog) priority.activityLog = []
  
  priority.activityLog.unshift({
    timestamp: new Date().toISOString(),
    action,
    details
  })
  
  // Keep only last 20 entries
  if (priority.activityLog.length > 20) {
    priority.activityLog = priority.activityLog.slice(0, 20)
  }
}

export function renderActivityLog(priority) {
  if (!priority.activityLog || priority.activityLog.length === 0) {
    return '<div style="color: var(--text-muted); font-size: 0.875rem;">No activity yet</div>'
  }
  
  return `
    <div style="max-height: 200px; overflow-y: auto;">
      ${priority.activityLog.map(log => `
        <div style="padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); font-size: 0.875rem;">
          <div style="color: var(--text-secondary); font-size: 0.75rem;">
            ${new Date(log.timestamp).toLocaleString()}
          </div>
          <div>${log.action}${log.details ? `: ${log.details}` : ''}</div>
        </div>
      `).join('')}
    </div>
  `
}
