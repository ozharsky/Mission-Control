import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { filterByBoard, getCurrentBoardLabel } from '../components/BoardSelector.js'
import { openLeadModal } from '../components/LeadModal.js'
import { confirmDelete } from '../components/ConfirmDialog.js'

let currentFilter = 'all'
let currentStatus = 'all'
let searchQuery = ''

const STATUS_CONFIG = {
  new: { label: 'New', icon: '🆕', color: 'var(--accent-primary)' },
  contacted: { label: 'Contacted', icon: '📧', color: 'var(--accent-warning)' },
  qualified: { label: 'Qualified', icon: '✅', color: 'var(--accent-success)' },
  proposal: { label: 'Proposal', icon: '📄', color: 'var(--accent-secondary)' },
  closed: { label: 'Closed', icon: '🔒', color: 'var(--text-muted)' },
  lost: { label: 'Lost', icon: '❌', color: 'var(--accent-danger)' }
}

export function createLeadsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  function getFilteredLeads(leads) {
    let filtered = filterByBoard(leads, 'board')
    
    if (currentStatus !== 'all') {
      filtered = filtered.filter(l => l.status === currentStatus)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(l =>
        l.name?.toLowerCase().includes(query) ||
        l.company?.toLowerCase().includes(query) ||
        l.email?.toLowerCase().includes(query) ||
        l.notes?.toLowerCase().includes(query)
      )
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
      <div class="welcome-bar">
        <div class="welcome-content">
          <div class="welcome-greeting">🎯 Leads</div>
          <div class="welcome-status">
            ${newCount > 0 ? `
              <span class="status-badge" style="background: rgba(99, 102, 241, 0.15); color: var(--accent-primary);"
              >🆕 ${newCount} new</span>
            ` : ''}
            ${qualifiedCount > 0 ? `
              <span class="status-badge" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-success);"
              >✅ ${qualifiedCount} qualified</span>
            ` : ''}
            <span class="status-badge">${allLeads.length} total</span>
          </div>
        </div>
        <button class="btn btn-primary" onclick="openLeadModal()">
          <span>➕</span>
          <span class="hide-mobile">Add Lead</span>
        </button>
      </div>
      
      <!-- Pipeline Value Card -->
      <div class="card pipeline-card">
        <div class="pipeline-stats">
          <div class="pipeline-stat">
            <div class="pipeline-value">$${totalValue.toLocaleString()}</div>
            <div class="pipeline-label">Filtered Pipeline</div>
          </div>
          <div class="pipeline-divider"></div>
          <div class="pipeline-stat">
            <div class="pipeline-value total">$${totalPotential.toLocaleString()}</div>
            <div class="pipeline-label">Total Potential</div>
          </div>
          <div class="pipeline-divider"></div>
          <div class="pipeline-stat">
            <div class="pipeline-value">${Math.round((qualifiedCount / allLeads.length) * 100) || 0}%</div>
            <div class="pipeline-label">Conversion Rate</div>
          </div>
        </div>
      </div>
      
      <!-- Search & Filters -->
      <div class="leads-toolbar">
        <div class="leads-search">
          <input type="text" 
            class="search-input" 
            id="leadSearchInput"
            placeholder="🔍 Search leads..."
            oninput="setLeadSearch(this.value)"
          >
        </div>
        
        <div class="filter-bar lead-filters">
          <button class="filter-btn ${currentStatus === 'all' ? 'active' : ''}" onclick="setLeadStatus('all')"
          title="Show all leads">
          <span>All</span>
          <span class="filter-count">${allLeads.length}</span>
        </button>
        
        ${Object.entries(STATUS_CONFIG).map(([key, config]) => `
          <button class="filter-btn ${currentStatus === key ? 'active' : ''}" 
            onclick="setLeadStatus('${key}')"
            title="${config.label} leads"
            style="${currentStatus === key ? `border-color: ${config.color};` : ''}"
          >
            <span>${config.icon} ${config.label}</span>
            <span class="filter-count" style="background: ${config.color}20; color: ${config.color};"
            >${statusCounts[key] || 0}</span>
          </button>
        `).join('')}
      </div>
      
      <!-- Board Filter Notice -->
      ${store.get('currentBoard') !== 'all' ? `
        <div class="board-filter-notice">
          <span>📍 Showing leads for: ${getCurrentBoardLabel()}</span>
          <button class="btn btn-sm btn-text" onclick="clearBoardFilter()">Show All</button>
        </div>
      ` : ''}
      
      <!-- Leads List -->
      ${leads.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <div class="empty-state-title">${allLeads.length === 0 ? 'No leads yet' : 'No leads match filter'}</div>
          <div class="empty-state-text">
            ${allLeads.length === 0 
              ? 'Add your first B2B wholesale lead to start tracking opportunities.'
              : store.get('currentBoard') !== 'all' 
                ? 'No leads for this board. Try switching to "All Boards" or change the status filter.'
                : 'Try changing your status filter to see more leads.'}
          </div>
          ${store.get('currentBoard') !== 'all' && allLeads.length > 0 ? `
            <button class="btn btn-secondary" onclick="clearBoardFilter()" style="margin-bottom: 0.5rem;">📍 Show All Boards</button>
          ` : ''}
          <button class="btn btn-primary" onclick="openLeadModal()">➕ Add Lead</button>
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
      <div class="lead-card" onclick="openEditLeadModal(${lead.id})"
           style="border-left-color: ${statusConfig.color};">
        <div class="lead-card-header">
          <div class="lead-info">
            <h4 class="lead-name">${escapeHtml(lead.name)}</h4>
            <div class="lead-company">${escapeHtml(lead.company)}</div>
          </div>
          <div class="lead-value">
            <div class="value-amount">$${(lead.value || 0).toLocaleString()}</div>
            <div class="value-label">est. value</div>
          </div>
        </div>
        
        <div class="lead-card-body">
          <div class="lead-status-row">
            <span class="lead-status-badge" style="background: ${statusConfig.color}20; color: ${statusConfig.color};"
            >${statusConfig.icon} ${statusConfig.label}</span>
            
            ${lead.board && lead.board !== 'all' ? `
              <span class="lead-board">${getBoardEmoji(lead.board)} ${lead.board}</span>
            ` : ''}
          </div>
          
          ${lead.notes ? `
            <div class="lead-notes">${escapeHtml(lead.notes)}</div>
          ` : ''}
          
          <div class="lead-meta">
            ${daysSinceContact !== null ? `
              <span class="lead-last-contact ${daysSinceContact > 7 ? 'stale' : ''}"
              >
                ${daysSinceContact === 0 ? 'Today' : daysSinceContact === 1 ? 'Yesterday' : `${daysSinceContact}d ago`}
              </span>
            ` : '<span class="lead-last-contact">Never contacted</span>'}
          </div>
        </div>
        
        <div class="lead-card-actions">
          <button class="lead-action-btn" onclick="event.stopPropagation(); openEditLeadModal(${lead.id})"
          >✏️ Edit</button>
          <button class="lead-action-btn" onclick="event.stopPropagation(); updateLeadStatus(${lead.id}, 'contacted')"
            ${lead.status === 'contacted' ? 'disabled' : ''}
          >📧 Contact</button>
          <button class="lead-action-btn danger" onclick="event.stopPropagation(); deleteLead(${lead.id})"
          >🗑️ Delete</button>
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
    toast.success('Lead deleted')
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
      toast.success(`Moved to ${statusConfig.label}`, lead.name)
    }
  }
  
  window.setLeadSearch = (query) => {
    searchQuery = query
    render()
  }
  
  window.clearBoardFilter = () => {
    store.set('currentBoard', 'all')
    toast.success('Showing all boards')
  }
  
  store.subscribe((state, path) => {
    if (!path || path.includes('leads') || path.includes('currentBoard')) render()
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