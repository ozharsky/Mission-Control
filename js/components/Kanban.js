import { store } from '../state/store.js'
import { toast } from './Toast.js'

export function createKanban(containerId, options = {}) {
  const container = document.getElementById(containerId)
  if (!container) return
  
  const columns = options.columns || []
  let items = Array.isArray(options.items) ? options.items : []
  let sortableInstances = []
  
  function render() {
    const isMobile = window.innerWidth <= 1024
    
    // Destroy existing sortable instances
    sortableInstances.forEach(instance => instance.destroy())
    sortableInstances = []
    
    if (isMobile) {
      renderMobile()
    } else {
      renderDesktop()
      initDragAndDrop()
    }
  }
  
  function renderDesktop() {
    container.innerHTML = `
      <div class="kanban">
        ${columns.map(col => `
          <div class="kanban-column" data-column="${col.id}">
            <div class="kanban-header">
              <span>${col.icon} ${col.label}</span>
              <span class="kanban-count">${getCount(col.id)}</span>
            </div>
            <div class="kanban-tasks" id="${col.id}Tasks" data-status="${col.id}">
              ${renderItems(col.id)}
            </div>
          </div>
        `).join('')}
      </div>
    `
  }
  
  function renderMobile() {
    const activeColumn = columns[0]?.id
    
    container.innerHTML = `
      <div class="mobile-tabs">
        ${columns.map(col => `
          <button class="mobile-tab ${col.id === activeColumn ? 'active' : ''}" 
                  onclick="window.showMobileColumn('${col.id}', '${containerId}')">
            ${col.icon} ${col.label}
          </button>
        `).join('')}
      </div>
      <div class="kanban">
        ${columns.map(col => `
          <div class="kanban-column ${col.id === activeColumn ? 'active' : ''}" data-column="${col.id}">
            <div class="kanban-header">
              <span class="kanban-title">${col.icon} ${col.label}</span>
              <span class="kanban-count">${getCount(col.id)}</span>
            </div>
            <div class="kanban-items">${renderItems(col.id)}</div>
          </div>
        `).join('')}
      </div>
    `
    
    window.showMobileColumn = (columnId, contId) => {
      const cont = document.getElementById(contId)
      if (!cont) return
      
      cont.querySelectorAll('.mobile-tab').forEach(tab => {
        const isActive = tab.textContent.toLowerCase().includes(columnId.toLowerCase())
        tab.classList.toggle('active', isActive)
      })
      
      cont.querySelectorAll('.kanban-column').forEach(col => {
        col.classList.toggle('active', col.dataset.column === columnId)
      })
    }
  }
  
  function renderItems(columnId) {
    if (!Array.isArray(items)) return ''
    const columnItems = items.filter(item => item && item.status === columnId)
    if (columnItems.length === 0) {
      return `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <div class="empty-state-icon" style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
          <div style="font-size: 0.875rem; color: var(--text-muted);">No items</div>
        </div>
      `
    }
    return columnItems.map(item => `
      <div class="kanban-item" data-id="${item.id}">
        ${options.renderItem(item)}
      </div>
    `).join('')
  }
  
  function getCount(columnId) {
    if (!Array.isArray(items)) return 0
    return items.filter(item => item && item.status === columnId).length
  }
  
  function initDragAndDrop() {
    // Check if Sortable is available
    if (typeof Sortable === 'undefined') {
      return
    }
    
    columns.forEach(col => {
      const container = document.getElementById(`${col.id}Tasks`)
      if (!container) return
      
      const sortable = new Sortable(container, {
        group: 'kanban',
        animation: 150,
        ghostClass: 'dragging',
        dragClass: 'dragging',
        delay: 100,
        delayOnTouchOnly: true,
        onStart: function(evt) {
          evt.item.classList.add('dragging')
        },
        onEnd: function(evt) {
          evt.item.classList.remove('dragging')
          
          const itemId = evt.item.dataset.id
          const newStatus = evt.to.dataset.status
          const oldStatus = evt.from.dataset.status
          
          if (newStatus !== oldStatus) {
            // Update item status
            const item = items.find(i => i.id == itemId)
            if (item && options.onMove) {
              options.onMove(item, oldStatus, newStatus)
            }
            
            // Visual feedback
            evt.to.closest('.kanban-column').classList.add('drag-over')
            setTimeout(() => {
              evt.to.closest('.kanban-column').classList.remove('drag-over')
            }, 300)
          }
        }
      })
      
      sortableInstances.push(sortable)
    })
  }
  
  function updateItems(newItems) {
    items = newItems
    render()
  }
  
  render()
  
  // Debounced resize handler
  let resizeTimeout
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(render, 100)
  })
  
  return { render, updateItems }
}
