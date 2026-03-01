import { store } from '../state/store.js'

// Calculate priority score for sorting
export function getPriorityScore(priority) {
  let score = 0
  const now = new Date()
  
  // Urgent tag = +100
  if (priority.tags?.includes('urgent')) score += 100
  
  // Due date scoring
  if (priority.dueDate) {
    const due = new Date(priority.dueDate)
    const daysUntil = (due - now) / (1000 * 60 * 60 * 24)
    
    if (daysUntil < 0) {
      // Overdue = +90 + days overdue (more overdue = higher)
      score += 90 + Math.abs(Math.floor(daysUntil))
    } else if (daysUntil <= 3) {
      // Due within 3 days = +80
      score += 80
    } else if (daysUntil <= 7) {
      // Due within week = +50
      score += 50
    } else if (daysUntil <= 14) {
      // Due within 2 weeks = +20
      score += 20
    }
  }
  
  // Client tag boost
  if (priority.tags?.includes('client')) score += 5
  
  // High priority projects
  if (priority.priority === 'high') score += 10
  
  return score
}

// Get alert status for priority
export function getDueAlert(priority) {
  if (!priority.dueDate || priority.completed) return null
  
  const now = new Date()
  const due = new Date(priority.dueDate)
  const daysUntil = (due - now) / (1000 * 60 * 60 * 24)
  
  if (daysUntil < 0) {
    return { type: 'overdue', text: 'OVERDUE', days: Math.abs(Math.floor(daysUntil)) }
  } else if (daysUntil <= 2) {
    return { type: 'soon', text: 'DUE SOON', days: Math.ceil(daysUntil) }
  } else if (daysUntil <= 7) {
    return { type: 'upcoming', text: 'UPCOMING', days: Math.ceil(daysUntil) }
  }
  
  return null
}

// Get border color class based on priority
export function getPriorityBorderClass(priority) {
  const alert = getDueAlert(priority)
  
  if (alert?.type === 'overdue') return 'priority-overdue'
  if (alert?.type === 'soon') return 'priority-soon'
  if (priority.tags?.includes('urgent')) return 'priority-urgent'
  if (priority.completed) return 'priority-done'
  
  return 'priority-normal'
}

// Sort priorities by score (highest first)
export function sortPriorities(priorities) {
  return [...priorities].sort((a, b) => {
    const scoreA = getPriorityScore(a)
    const scoreB = getPriorityScore(b)
    return scoreB - scoreA
  })
}

// Get total alert count
export function getAlertCount() {
  const priorities = store.get('priorities') || []
  return priorities.filter(p => {
    const alert = getDueAlert(p)
    return alert && (alert.type === 'overdue' || alert.type === 'soon')
  }).length
}
