import { store } from '../state/store.js'
import { Toast } from '../components/Toast.js'
import { filterByBoard, getCurrentBoardLabel } from '../components/BoardSelector.js'
import { openLeadModal } from '../components/LeadModal.js'
import { confirmDelete } from '../components/ConfirmDialog.js'
import { icons } from '../utils/icons.js'

let currentFilter = 'all'
let currentStatus = 'all'

const STATUS_CONFIG = {
  new: { label: 'New', icon: icons.star(), colorClass: 'm-badge-primary' },
  contacted: { label: 'Contacted', icon: icons.mail(), colorClass: 'm-badge-warning' },
  qualified: { label: 'Qualified', icon: icons.check(), colorClass: 'm-badge-success' },
  proposal: { label: 'Proposal', icon: icons.file(), colorClass: 'm-badge-info' },
  closed: { label: 'Closed', icon: icons.lock(), colorClass: 'm-badge-muted' },
  lost: { label: 'Lost', icon: icons.x(), colorClass: 'm-badge-danger' }
}

export function createLeadsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function getFilteredLeads(leads) {
    let filtered = filterByBoard(leads, 'board')
    
    if (currentStatus !== 'all') {
      filtered = filtered.filter(l => l.status === currentStatus)
    }
    
    // Sort by value (highest first), then by last contact (oldest first)
    return filtered.sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value
      return new Date(a.lastContact || 0) - new Date(b.lastContact || 0)
    })
  }
  
  function getStatusCounts(leads) {
    const counts = {}
    Object.keys(STATUS_CONFIG).forEach(s => counts[s] = 0)
    leads.forEach(l => {
      if (counts[l.status] !== undefined) {
        counts[l.status]++
      }
    })
    return counts
  }
  
  function getTotalValue(leads) {
    return leads.reduce((sum, l) => sum + (l.value || 0), 0)
  }
  
  function render() {
    const allLeads = store.getState().leads || []
    const leads = getFilteredLeads(allLeads)
    const statusCounts = getStatusCounts(allLeads)
    const totalValue = getTotalValue(leads)
    const totalPotential = getTotalValue(allLeads)
    
    const newCount = statusCounts.new || 0
    const qualifiedCount = statusCounts.qualified || 0
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="welcome-bar m-card">
        <div class="welcome-content">
          <div class="welcome-greeting m-title">${icons.target()} Leads</div>
          <div class="welcome-status">
            ${newCount > 0 ? `
              <span class="m-badge-primary"
              >${icons.star()} ${newCount} new</span>
            ` : ''}
            ${qualifiedCount > 0 ? `
              <span class="m-badge-success"
              >${icons.check()} ${qualifiedCount} qualified</span>
            ` : ''}
            <span class="m-badge-secondary">${allLeads.length} total</span>
          </div>
        </div>
        <button class="m-btn-primary m-touch" onclick="openLeadModal()">
          <span>${icons.plus()}</span>
          <span class="hide-mobile">Add Lead</span>
        </button>
      </div>
      
      <!-- Pipeline Value Card -->
      <div class="m-card pipeline-card">
        <div class="pipeline-stats">
          <div class="pipeline-stat">
            <div class="pipeline-value m-title">$${totalValue.toLocaleString()}</div>
            <div class="pipeline-label m-caption">Filtered Pipeline</div>
          </div>
          <div class="pipeline-divider"></div>
          <div class="pipeline-stat">
            <div class="pipeline-value total m-title">$${totalPotential.toLocaleString()}</div>
            <div class="pipeline-label m-caption">Total Potential</div>
          </div>
          <div class="pipeline-divider"></div>
          <div class="pipeline-stat">
            <div class="pipeline-value m-title">${Math.round((qualifiedCount / allLeads.length) * 100) || 0}%</div>
            <div class="pipeline-label m-caption">Conversion Rate</div>
          </div>
        </div>
      </div>
      
      <!-- Filters -->
      <div class="leads-toolbar">
        <div class="filter-bar lead-filters">
          <button class="m-btn-secondary ${currentStatus === 'all' ? 'active' : ''} m-touch" onclick="setLeadStatus('all')"
          title="Show all leads">
          <span>All</span>
          <span class="filter-count m-badge-secondary">${allLeads.length}</span>
        </button>
        
        ${Object.entries(STATUS_CONFIG).map(([key, config]) => `
          <button class="m-btn-secondary ${currentStatus === key ? 'active' : ''} m-touch"
            onclick="setLeadStatus('${key}')"
            title="${config.label} leads"
          >
            <span>${config.icon} ${config.label}</span>
            <span class="filter-count ${config.colorClass}"
            >${statusCounts[key] || 0}</span>
          </button>
        `).join('')}
      </div>
      
      <!-- Board Filter Notice -->
      ${store.get('currentBoard') !== 'all' ? `
        <div class="board-filter-notice">
          <span>${icons.mapPin()} Showing leads for: ${getCurrentBoardLabel()}</span>
          <button class="m-btn-secondary m-touch" onclick="clearBoardFilter()">Show All</button>
        </div>
      ` : ''}
      
      <!-- Leads List -->
      ${leads.length === 0 ? `
        <div class="empty-state m-card">
          <div class="empty-state-icon">${icons.target()}</div>
          <div class="empty-state-title m-title">${allLeads.length === 0 ? 'No leads yet' : 'No leads match filter'}</div>
          <div class="empty-state-text m-body">
            ${allLeads.length === 0 
              ? 'Add your first B2B wholesale lead to start tracking opportunities.'
              : store.get('currentBoard') !== 'all' 
                ? 'No leads for this board. Try switching to "All Boards" or change the status filter.'
                : 'Try changing your status filter to see more leads.'}
          </div>
          ${store.get('currentBoard') !== 'all' && allLeads.length > 0 ? `
            <button class="m-btn-secondary m-touch" onclick="clearBoardFilter()" style="margin-bottom: 0.5rem;">${icons.mapPin()} Show All Boards</button>
          ` : ''}
          <button class="m-btn-primary m-touch" onclick="openLeadModal()">${icons.plus()} Add Lead</button>
        </div>
      ` : `
        <div class="leads-grid">
          ${leads.map(lead => renderLeadCard(lead)).join('')}
        </div>
      `}
    `
  }
  
  function renderLeadCard(lead) {
    const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new
    const daysSinceContact = lead.lastContact 
      ? Math.floor((Date.now() - new Date(lead.lastContact).getTime()) / (1000 * 60 * 60 * 24))
      : null
    
    return `
      <div class="m-card lead-card lead-card-${lead.status}" onclick="openEditLeadModal(${lead.id})">
        <div class="lead-card-header">
          <div class="lead-info">
            <h4 class="lead-name m-title">${escapeHtml(lead.name)}</h4>
            <div class="lead-company m-body">${escapeHtml(lead.company)}</div>
          </div>
          <div class="lead-value">
            <div class="value-amount m-title">$${(lead.value || 0).toLocaleString()}</div>
            <div class="value-label m-caption">est. value</div>
          </div>
        </div>
        
        <div class="lead-card-body">
          <div class="lead-status-row">
            <span class="${statusConfig.colorClass}"
            >${statusConfig.icon} ${statusConfig.label}</span>
            
            ${lead.board && lead.board !== 'all' ? `
              <span class="lead-board m-caption">${getBoardIcon(lead.board)} ${lead.board}</span>
            ` : ''}
          </div>
          
          ${lead.notes ? `
            <div class="lead-notes m-body">${escapeHtml(lead.notes)}</div>
          ` : ''}
          
          <div class="lead-meta">
            ${daysSinceContact !== null ? `
              <span class="lead-last-contact ${daysSinceContact > 7 ? 'stale' : ''} m-caption"
              >
                ${daysSinceContact === 0 ? 'Today' : daysSinceContact === 1 ? 'Yesterday' : `${daysSinceContact}d ago`}
              </span>
            ` : '<span class="lead-last-contact m-caption">Never contacted</span>'}
          </div>
        </div>
        
        <div class="lead-card-actions">
          <button class="m-btn-secondary m-touch" onclick="event.stopPropagation(); openEditLeadModal(${lead.id})"
          >${icons.edit()} Edit</button>
          <button class="m-btn-secondary m-touch" onclick="event.stopPropagation(); updateLeadStatus(${lead.id}, 'contacted')"
            ${lead.status === 'contacted' ? 'disabled' : ''}
          >${icons.mail()} Contact</button>
          <button class="m-btn-danger m-touch" onclick="event.stopPropagation(); deleteLead(${lead.id})"
          >${icons.delete()} Delete</button>
        </div>
      </div>
    `
  }
  
  window.openEditLeadModal = (id) => {
    openLeadModal(id)
  }
  
  window.deleteLead = async (id) => {
    const lead = store.get('leads').find(l => l.id === id)
    const confirmed = await confirmDelete(lead?.name || 'this lead')
    if (!confirmed) return
    
    const leads = store.get('leads').filter(l => l.id !== id)
    store.set('leads', leads)
    Toast.success('Lead deleted')
  }
  
  window.updateLeadStatus = (id, newStatus) => {
    const leads = store.get('leads')
    const lead = leads.find(l => l.id === id)
    if (lead) {
      const oldStatus = lead.status
      lead.status = newStatus
      lead.lastContact = new Date().toISOString()
      store.set('leads', leads)
      
      const statusConfig = STATUS_CONFIG[newStatus]
      Toast.success(`Moved to ${statusConfig.label}`, lead.name)
    }
  }
  
  window.setLeadStatus = (status) => {
    currentStatus = status
    render()
  }
  
  window.clearBoardFilter = () => {
    store.set('currentBoard', 'all')
    Toast.success('Showing all boards')
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('leads') || path.includes('currentBoard')) render()
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
