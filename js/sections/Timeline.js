import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { icons } from '../utils/icons.js'

let expandedPhases = new Set()

const STATUS_CONFIG = {
  completed: { label: 'Completed', icon: 'check', color: 'var(--accent-success)', bg: 'rgba(16, 185, 129, 0.1)' },
  active: { label: 'In Progress', icon: 'zap', color: 'var(--accent-primary)', bg: 'rgba(99, 102, 241, 0.1)' },
  pending: { label: 'Upcoming', icon: 'hourglass', color: 'var(--text-muted)', bg: 'rgba(156, 163, 175, 0.1)' }
}

export function createTimelineSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function render() {
    const timeline = store.getState().timeline || []
    
    // Calculate stats
    const totalMilestones = timeline.reduce((sum, phase) => sum + (phase.milestones?.length || 0), 0)
    const completedMilestones = timeline.reduce((sum, phase) => 
      sum + (phase.milestones?.filter(m => m.completed).length || 0), 0)
    const currentPhase = timeline.find(p => p.status === 'active')
    
    const progress = totalMilestones > 0 
      ? Math.round((completedMilestones / totalMilestones) * 100) 
      : 0
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting m-title">${icons.mapPin()} Timeline</div>
          <div class="welcome-status">
            <span class="m-badge-success">${icons.check()} ${completedMilestones}/${totalMilestones} milestones</span>
            ${currentPhase ? `
              <span class="m-badge-primary">${icons.zap()} ${currentPhase.title}</span>
            ` : ''}
          </div>
        </div>
      </div>
      
      <!-- Progress Overview -->
      <div class="m-card timeline-progress-card">
        <div class="timeline-progress-header">
          <div class="progress-info">
            <div class="progress-percentage m-title">${progress}%</div>
            <div class="progress-label m-caption">Overall Progress</div>
          </div>          
          <div class="progress-bar timeline">
            <div class="progress-fill" style="width: ${progress}%;"></div>
          </div>
        </div>
        
        <div class="timeline-stats">
          <div class="timeline-stat">
            <div class="stat-value m-title" style="color: var(--accent-success);">${completedMilestones}</div>
            <div class="stat-label m-caption">Completed</div>
          </div>
          <div class="timeline-stat">
            <div class="stat-value m-title" style="color: var(--accent-primary);">${totalMilestones - completedMilestones}</div>
            <div class="stat-label m-caption">Remaining</div>
          </div>
          <div class="timeline-stat">
            <div class="stat-value m-title">${timeline.length}</div>
            <div class="stat-label m-caption">Phases</div>
          </div>
        </div>
      </div>
      
      <!-- Timeline Phases -->
      ${timeline.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">${icons.mapPin()}</div>
          <div class="empty-state-title m-title">No timeline yet</div>
          <div class="empty-state-text m-body">Add project phases and milestones to track progress.</div>
        </div>
      ` : `
        <div class="timeline-phases">
          ${timeline.map((phase, index) => renderPhase(phase, index, timeline.length)).join('')}
        </div>
      `}
    `
  }
  
  function renderPhase(phase, index, total) {
    const statusConfig = STATUS_CONFIG[phase.status] || STATUS_CONFIG.pending
    const isExpanded = expandedPhases.has(phase.id)
    const milestoneProgress = phase.milestones?.length > 0
      ? Math.round((phase.milestones.filter(m => m.completed).length / phase.milestones.length) * 100)
      : 0
    
    return `
      <div class="timeline-phase ${phase.status} ${isExpanded ? 'expanded' : ''}"
           style="border-left-color: ${statusConfig.color};">
        <div class="phase-header" onclick="togglePhase(${phase.id})">
          <div class="phase-connector">
            <div class="connector-line ${index === 0 ? 'first' : ''} ${index === total - 1 ? 'last' : ''}"
            ></div>
            <div class="phase-dot" style="background: ${statusConfig.color};">${icons[statusConfig.icon]()}</div>
          </div>
          
          <div class="phase-content">
            <div class="phase-title-row">
              <h4 class="phase-title m-title">${phase.title}</h4>
              <span class="m-badge" style="background: ${statusConfig.bg}; color: ${statusConfig.color};"
              >${statusConfig.label}</span>
            </div>            
            <div class="phase-meta m-caption">
              <span class="phase-date">${phase.date}</span>
              <span class="phase-desc">${phase.desc}</span>
            </div>            
            <div class="phase-progress">
              <div class="progress-bar phase">
                <div class="progress-fill" style="width: ${milestoneProgress}%; background: ${statusConfig.color};"
                ></div>
              </div>
              <span class="progress-text m-caption">${phase.milestones?.filter(m => m.completed).length || 0}/${phase.milestones?.length || 0} milestones</span>
            </div>          
          </div>          
          <div class="phase-toggle">
            <span class="toggle-icon">${isExpanded ? icons.chevronDown() : icons.chevronRight()}</span>
          </div>
        </div>        
        
        ${isExpanded && phase.milestones?.length > 0 ? `
          <div class="phase-milestones">
            ${phase.milestones.map((milestone, mIndex) => renderMilestone(milestone, mIndex, phase.milestones.length)).join('')}
          </div>
        ` : ''}
      </div>
    `
  }
  
  function renderMilestone(milestone, index, total) {
    return `
      <div class="milestone-item ${milestone.completed ? 'completed' : ''}"
           style="${index === total - 1 ? 'border-bottom: none;' : ''}">
        <div class="milestone-checkbox ${milestone.completed ? 'checked' : ''}"
             onclick="toggleMilestone(${milestone.id})">
          ${milestone.completed ? icons.check() : ''}
        </div>        
        <div class="milestone-content">
          <div class="milestone-text ${milestone.completed ? 'completed' : ''} m-body"
          >${milestone.text}</div>          
          ${milestone.completed && milestone.completedAt ? `
            <div class="milestone-completed-date m-caption">
              Completed ${formatDate(milestone.completedAt)}
            </div>
          ` : ''}
        </div>      </div>
    `
  }
  
  // Global functions
  window.togglePhase = (phaseId) => {
    if (expandedPhases.has(phaseId)) {
      expandedPhases.delete(phaseId)
    } else {
      expandedPhases.add(phaseId)
    }
    render()
  }
  
  window.toggleMilestone = (milestoneId) => {
    const timeline = store.get('timeline')
    let found = false
    
    timeline.forEach(phase => {
      const milestone = phase.milestones?.find(m => m.id === milestoneId)
      if (milestone) {
        milestone.completed = !milestone.completed
        milestone.completedAt = milestone.completed ? new Date().toISOString() : null
        found = true
        
        // Update phase status based on milestones
        const allCompleted = phase.milestones.every(m => m.completed)
        const someCompleted = phase.milestones.some(m => m.completed)
        
        if (allCompleted) {
          phase.status = 'completed'
        } else if (someCompleted) {
          phase.status = 'active'
        } else {
          phase.status = 'pending'
        }
        
        toast.success(
          milestone.completed ? 'Milestone completed' : 'Milestone reopened',
          milestone.text
        )
      }
    })
    
    if (found) {
      store.set('timeline', timeline)
    }
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('timeline')) render()
  })
  
  render()
  return { render }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
