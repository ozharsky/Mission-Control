import { Button } from '../components/Button.js'
import { Card } from '../components/Card.js'
import { Badge, StatusBadge } from '../components/Badge.js'
import { Toast } from '../components/Toast.js'
import { store } from '../state/store.js'
import { printerAPI } from '../api/printers.js'

/**
 * Create Inventory (Printers) section with new design system
 * @param {string} containerId - Container element ID
 * @returns {Object} Inventory controller with render, startPolling, stopPolling methods
 */
export function createInventorySection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) {
    console.error(`[Inventory] Container #${containerId} not found`)
    return
  }

  let pollInterval = null
  let currentFilter = 'all'

  // Printer images mapping
  const PRINTER_IMAGES = {
    'P2S': './images/p2s.png',
    'P1S': './images/p1s.png',
    'Centauri Carbon': './images/centauri-carbon.png'
  }

  // Fallback placeholder
  const PRINTER_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxYTFhMjUiLz48cGF0aCBkPSJNNTAgMTUwTDEwMCA1MEwxNTAgMTUwSDUwWiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cmVjdCB4PSI3NSIgeT0iMTAwIiB3aWR0aD0iNTAiIGhlaWdodD0iNjAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIxMDAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY0NzQ4YiIgZm9udC1zaXplPSIxNCI+UHJpbnRlcjwvdGV4dD48L3N2Zz4='

  /**
   * Format time ago
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted time string
   */
  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'Never'
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return 'Just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  /**
   * Format duration in seconds to human readable
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  function formatDuration(seconds) {
    if (!seconds) return ''
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  /**
   * Truncate filename
   * @param {string} filename - Filename to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated filename
   */
  function truncateFilename(filename, maxLength = 25) {
    if (!filename) return ''
    if (filename.length <= maxLength) return filename
    return filename.substring(0, maxLength - 3) + '...'
  }

  /**
   * Create welcome header with printer count
   * @returns {HTMLElement} Welcome header element
   */
  function createWelcomeHeader() {
    const state = store.getState()
    const printers = state.printers || []
    const onlineCount = printers.filter(p => 
      p.status === 'operational' || p.status === 'printing' || p.status === 'idle'
    ).length
    const printingCount = printers.filter(p => p.status === 'printing').length
    const errorCount = printers.filter(p => p.status === 'error' || p.status === 'offline').length
    const lastUpdate = state.lastPrinterUpdate

    const header = document.createElement('div')
    header.className = 'inventory-header'

    const title = document.createElement('h1')
    title.className = 'inventory-title'
    title.innerHTML = `<i data-lucide="printer"></i> Printers`
    header.appendChild(title)

    // Status badges
    const badgesRow = document.createElement('div')
    badgesRow.className = 'inventory-badges'

    if (errorCount > 0) {
      badgesRow.appendChild(Badge({
        text: `${errorCount} issue${errorCount > 1 ? 's' : ''}`,
        variant: 'danger',
        icon: 'alert-circle'
      }))
    } else if (printingCount > 0) {
      badgesRow.appendChild(Badge({
        text: `${printingCount} printing`,
        variant: 'primary',
        icon: 'zap'
      }))
    } else {
      badgesRow.appendChild(Badge({
        text: 'All online',
        variant: 'success',
        icon: 'check-circle'
      }))
    }

    badgesRow.appendChild(Badge({
      text: `${onlineCount}/${printers.length} online`,
      variant: 'neutral'
    }))

    header.appendChild(badgesRow)

    // Actions row
    const actionsRow = document.createElement('div')
    actionsRow.className = 'inventory-actions'

    if (lastUpdate) {
      const lastUpdateEl = document.createElement('span')
      lastUpdateEl.className = 'last-update'
      lastUpdateEl.textContent = `Updated ${formatTimeAgo(lastUpdate)}`
      actionsRow.appendChild(lastUpdateEl)
    }

    actionsRow.appendChild(Button({
      text: 'Refresh',
      variant: 'secondary',
      icon: 'refresh-cw',
      onClick: refreshPrinters
    }))

    header.appendChild(actionsRow)

    return header
  }

  /**
   * Create filter buttons
   * @returns {HTMLElement} Filter buttons container
   */
  function createFilterButtons() {
    const filters = [
      { id: 'all', label: 'All', icon: 'layers' },
      { id: 'printing', label: 'Printing', icon: 'zap' },
      { id: 'idle', label: 'Idle', icon: 'moon' },
      { id: 'error', label: 'Error', icon: 'alert-circle' }
    ]

    const container = document.createElement('div')
    container.className = 'filter-buttons'

    filters.forEach(filter => {
      const btn = Button({
        text: filter.label,
        variant: currentFilter === filter.id ? 'primary' : 'secondary',
        icon: filter.icon,
        size: 'sm',
        onClick: () => {
          currentFilter = filter.id
          render()
        }
      })
      btn.classList.add('filter-btn')
      if (currentFilter === filter.id) {
        btn.classList.add('active')
      }
      container.appendChild(btn)
    })

    return container
  }

  /**
   * Create printer card
   * @param {Object} printer - Printer data
   * @returns {HTMLElement} Printer card element
   */
  function createPrinterCard(printer) {
    const isPrinting = printer.status === 'printing'
    const hasJob = printer.job && printer.job.name
    const timeLeft = printer.job?.timeLeft ? formatDuration(printer.job.timeLeft) : null
    const imageUrl = PRINTER_IMAGES[printer.name] || PRINTER_PLACEHOLDER

    const card = document.createElement('div')
    card.className = `printer-card ${printer.status}`

    // Card content
    const content = document.createElement('div')
    content.className = 'printer-card-content'

    // Header with name and status
    const header = document.createElement('div')
    header.className = 'printer-card-header'
    
    const name = document.createElement('h3')
    name.className = 'printer-name'
    name.textContent = printer.name
    header.appendChild(name)
    
    header.appendChild(StatusBadge(printer.status || 'idle'))
    content.appendChild(header)

    // Printer image
    const imageContainer = document.createElement('div')
    imageContainer.className = 'printer-image-container'
    imageContainer.innerHTML = `
      <img src="${imageUrl}" alt="${printer.name}" loading="lazy" 
           onerror="this.src='${PRINTER_PLACEHOLDER}'">
    `
    content.appendChild(imageContainer)

    // Temperatures
    const temps = document.createElement('div')
    temps.className = 'printer-temps'
    temps.innerHTML = `
      <div class="temp-item">
        <i data-lucide="flame"></i>
        <span class="temp-value">${printer.temp || 0}°C</span>
        ${printer.targetTemp > 0 ? `<span class="temp-target">/ ${printer.targetTemp}°C</span>` : ''}
      </div>
      <div class="temp-item">
        <i data-lucide="layers"></i>
        <span class="temp-value">${printer.bedTemp || 0}°C</span>
        ${printer.targetBedTemp > 0 ? `<span class="temp-target">/ ${printer.targetBedTemp}°C</span>` : ''}
      </div>
    `
    content.appendChild(temps)

    // Progress section (if printing)
    if (isPrinting && hasJob) {
      const progress = document.createElement('div')
      progress.className = 'printer-progress'
      progress.innerHTML = `
        <div class="progress-header">
          <span class="progress-filename">${truncateFilename(printer.job.name)}</span>
          ${timeLeft ? `<span class="progress-time"><i data-lucide="clock"></i> ${timeLeft}</span>` : ''}
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${printer.progress || 0}%"></div>
          </div>
          <span class="progress-percent">${printer.progress || 0}%</span>
        </div>
        ${printer.layer ? `<div class="progress-layer">Layer ${printer.layer}</div>` : ''}
      `
      content.appendChild(progress)
    } else if (printer.error) {
      const error = document.createElement('div')
      error.className = 'printer-error-message'
      error.innerHTML = `
        <i data-lucide="alert-circle"></i>
        <span>${printer.error}</span>
      `
      content.appendChild(error)
    } else {
      const idle = document.createElement('div')
      idle.className = 'printer-idle-message'
      idle.innerHTML = `
        <i data-lucide="check-circle"></i>
        <span>Ready to print</span>
      `
      content.appendChild(idle)
    }

    // Action buttons
    const actions = document.createElement('div')
    actions.className = 'printer-actions'
    
    actions.appendChild(Button({
      text: 'Details',
      variant: 'secondary',
      size: 'sm',
      onClick: () => showPrinterDetails(printer.id)
    }))

    content.appendChild(actions)
    card.appendChild(content)

    return card
  }

  /**
   * Create empty state for no printers
   * @returns {HTMLElement} Empty state element
   */
  function createEmptyState() {
    const empty = document.createElement('div')
    empty.className = 'empty-state'
    empty.innerHTML = `
      <i data-lucide="printer" class="empty-state-icon"></i>
      <h3 class="empty-state-title">No printers configured</h3>
      <p class="empty-state-message">Add your 3D printers to monitor their status</p>
    `
    return empty
  }

  /**
   * Create printer grid
   * @returns {HTMLElement} Printer grid container
   */
  function createPrinterGrid() {
    const state = store.getState()
    let printers = state.printers || []

    // Apply filter
    if (currentFilter !== 'all') {
      printers = printers.filter(p => p.status === currentFilter)
    }

    if (printers.length === 0) {
      if (currentFilter === 'all') {
        return createEmptyState()
      } else {
        const noResults = document.createElement('div')
        noResults.className = 'empty-state'
        noResults.innerHTML = `
          <i data-lucide="search" class="empty-state-icon"></i>
          <h3 class="empty-state-title">No ${currentFilter} printers</h3>
          <p class="empty-state-message">Try a different filter</p>
        `
        return noResults
      }
    }

    const grid = document.createElement('div')
    grid.className = 'printers-grid'

    printers.forEach(printer => {
      grid.appendChild(createPrinterCard(printer))
    })

    return grid
  }

  /**
   * Refresh printers data
   */
  async function refreshPrinters() {
    // Find refresh button and show loading state
    const refreshBtn = container.querySelector('button[data-lucide="refresh-cw"]')?.closest('button')
    if (refreshBtn) {
      refreshBtn.disabled = true
      refreshBtn.innerHTML = '<i data-lucide="loader" class="spinning"></i> Loading...'
      if (window.lucide) window.lucide.createIcons()
    }

    try {
      const printers = await printerAPI.getPrinters()
      if (printers) {
        store.set('printers', printers)
        store.set('lastPrinterUpdate', Date.now())
        Toast.success('Printers refreshed successfully')
      } else {
        Toast.error('Failed to fetch printers')
      }
    } catch (err) {
      console.error('[Inventory] Refresh error:', err)
      Toast.error('Failed to refresh printers')
    } finally {
      if (refreshBtn) {
        refreshBtn.disabled = false
        refreshBtn.innerHTML = '<i data-lucide="refresh-cw"></i> Refresh'
        if (window.lucide) window.lucide.createIcons()
      }
    }
  }

  /**
   * Show printer details
   * @param {number} id - Printer ID
   */
  function showPrinterDetails(id) {
    const printers = store.get('printers') || []
    const printer = printers.find(p => p.id === id)
    if (printer) {
      Toast.info(
        printer.name,
        `Status: ${printer.status} | Temp: ${printer.temp || 0}°C`
      )
    }
  }

  /**
   * Start polling for printer updates
   */
  function startPolling() {
    if (pollInterval) return
    
    pollInterval = printerAPI.startPolling((printers) => {
      store.set('printers', printers)
      store.set('lastPrinterUpdate', Date.now())
    })
    
    if (!pollInterval) {
      console.log('[Inventory] Auto-polling disabled - use manual refresh')
    }
  }

  /**
   * Stop polling for printer updates
   */
  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  /**
   * Render the inventory section
   */
  function render() {
    try {
      // Clear container
      container.innerHTML = ''

      // Create inventory layout
      const inventory = document.createElement('div')
      inventory.className = 'inventory-container'

      // Welcome header
      inventory.appendChild(createWelcomeHeader())

      // Filter buttons
      inventory.appendChild(createFilterButtons())

      // Printer grid
      inventory.appendChild(createPrinterGrid())

      container.appendChild(inventory)

      // Initialize Lucide icons
      if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons()
      }

    } catch (err) {
      console.error('[Inventory] Render error:', err)
      container.innerHTML = `
        <div class="error-state">
          <i data-lucide="alert-circle"></i>
          <h3>Error loading printers</h3>
          <p>Please refresh the page</p>
        </div>
      `
    }
  }

  // Subscribe to store updates
  const unsubscribe = store.subscribe((state, path) => {
    if (!path || path.includes('printers') || path.includes('lastPrinterUpdate')) {
      render()
    }
  })

  // Initial render
  render()

  // Start polling
  startPolling()

  // Expose global functions
  window.refreshPrinters = refreshPrinters
  window.showPrinterDetails = showPrinterDetails

  return {
    render,
    startPolling,
    stopPolling,
    destroy: () => {
      stopPolling()
      unsubscribe()
    }
  }
}

export default createInventorySection
