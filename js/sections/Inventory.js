import { store } from '../state/store.js'
import { printerAPI } from '../api/printers.js'
import { toast } from '../components/Toast.js'
import { addTouchFeedback } from '../utils/mobileInteractions.js'

let pollInterval = null

// Printer images - PNG files
const PRINTER_IMAGES = {
  'P2S': './images/p2s.png',
  'P1S': './images/p1s.png',
  'Centauri Carbon': './images/centauri-carbon.png'
}

// SVG placeholder as data URI - fallback
const PRINTER_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMxYTFhMjUiLz48cGF0aCBkPSJNNTAgMTUwTDEwMCA1MEwxNTAgMTUwSDUwWiIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz48cmVjdCB4PSI3NSIgeT0iMTAwIiB3aWR0aD0iNTAiIGhlaWdodD0iNjAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSIxMDAiIHk9IjE4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzY0NzQ4YiIgZm9udC1zaXplPSIxNCI+UHJpbnRlcjwvdGV4dD48L3N2Zz4='

// Lucide icon names for each status
const STATUS_CONFIG = {
  operational: { label: 'Online', icon: 'check-circle', colorClass: 'm-badge-success', badgeClass: 'm-badge-online' },
  printing: { label: 'Printing', icon: 'zap', colorClass: 'm-badge-primary', badgeClass: 'm-badge-printing' },
  paused: { label: 'Paused', icon: 'pause-circle', colorClass: 'm-badge-warning', badgeClass: 'm-badge-paused' },
  error: { label: 'Error', icon: 'alert-circle', colorClass: 'm-badge-danger', badgeClass: 'm-badge-error' },
  offline: { label: 'Offline', icon: 'power-off', colorClass: 'm-badge-muted', badgeClass: 'm-badge-offline' },
  idle: { label: 'Idle', icon: 'moon', colorClass: 'm-badge-secondary', badgeClass: 'm-badge-idle' }
}

export function createInventorySection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  function render() {
    const printers = store.getState().printers || []
    const lastUpdate = store.getState().lastPrinterUpdate

    const onlineCount = printers.filter(p => p.status === 'operational' || p.status === 'printing' || p.status === 'idle').length
    const printingCount = printers.filter(p => p.status === 'printing').length
    const errorCount = printers.filter(p => p.status === 'error' || p.status === 'offline').length

    // Calculate total progress for printing printers
    const activePrinters = printers.filter(p => p.status === 'printing' && p.progress > 0)
    const avgProgress = activePrinters.length > 0
      ? Math.round(activePrinters.reduce((sum, p) => sum + p.progress, 0) / activePrinters.length)
      : 0

    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="m-card welcome-bar">
        <div class="welcome-content">
          <div class="m-title welcome-greeting">
            <i data-lucide="printer" class="lucide-icon"></i>
            Printers
          </div>
          <div class="welcome-status">
            ${errorCount > 0 ? `
              <span class="m-badge m-badge-danger">
                <i data-lucide="alert-circle" class="lucide-icon"></i>
                ${errorCount} issue${errorCount > 1 ? 's' : ''}
              </span>
            ` : printingCount > 0 ? `
              <span class="m-badge m-badge-primary">
                <i data-lucide="zap" class="lucide-icon"></i>
                ${printingCount} printing
              </span>
            ` : `
              <span class="m-badge m-badge-success">
                <i data-lucide="check-circle" class="lucide-icon"></i>
                All online
              </span>
            `}
            <span class="m-caption m-badge m-badge-outline">${onlineCount}/${printers.length} online</span>
          </div>
        </div>
        <div class="welcome-actions">
          ${lastUpdate ? `
            <span class="m-caption last-update hide-mobile">Updated ${formatTimeAgo(lastUpdate)}</span>
          ` : ''}
          <button class="m-btn-secondary m-touch" onclick="refreshPrinters()" id="refreshPrintersBtn">
            <i data-lucide="refresh-cw" class="lucide-icon"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="m-grid-2 metrics-grid printer-metrics">
        <div class="m-card metric-card">
          <div class="metric-value ${onlineCount === printers.length ? 'text-success' : ''}"
          >${onlineCount}</div>
          <div class="m-caption metric-label">Online</div>
        </div>

        <div class="m-card metric-card">
          <div class="metric-value ${printingCount > 0 ? 'text-primary' : ''}"
          >${printingCount}</div>
          <div class="m-caption metric-label">Printing</div>
          ${printingCount > 0 ? `
            <div class="m-caption metric-sub">${avgProgress}% avg</div>
          ` : ''}
        </div>

        <div class="m-card metric-card">
          <div class="metric-value">${printers.length}</div>
          <div class="m-caption metric-label">Total</div>
        </div>

        <div class="m-card metric-card">
          <div class="metric-value ${errorCount > 0 ? 'text-danger' : ''}"
          >${errorCount}</div>
          <div class="m-caption metric-label">Issues</div>
        </div>
      </div>

      <!-- Printers Grid -->
      ${printers.length === 0 ? `
        <div class="m-card empty-state">
          <div class="empty-state-icon">
            <i data-lucide="printer" class="lucide-icon"></i>
          </div>
          <div class="m-title empty-state-title">No printers configured</div>
          <div class="m-caption empty-state-text">Add your 3D printers to monitor their status.</div>
        </div>
      ` : `
        <div class="m-grid-2 printers-grid">
          ${printers.map(printer => renderPrinterCard(printer)).join('')}
        </div>
      `}
    `

    // Apply touch feedback after render
    applyTouchFeedback()
  }

  function renderPrinterCard(printer) {
    const statusConfig = STATUS_CONFIG[printer.status] || STATUS_CONFIG.idle
    const imageUrl = PRINTER_IMAGES[printer.name] || PRINTER_PLACEHOLDER

    // Format temperatures - handle both old and new data formats
    const toolTemp = printer.temp || 0
    const bedTemp = printer.bedTemp || 0
    const targetTool = printer.targetTemp || 0
    const targetBed = printer.targetBedTemp || 0

    // Format time remaining
    const timeLeft = printer.job?.timeLeft
      ? formatDuration(printer.job.timeLeft)
      : null

    // Determine if printer is actively printing
    const isPrinting = printer.status === 'printing' && printer.progress > 0
    const hasJob = printer.job && printer.job.name

    return `
      <div class="m-card printer-card ${printer.status} m-touch"
           onclick="showPrinterDetails(${printer.id})">
        <div class="m-card-header printer-header">
          <span class="m-title printer-name">${printer.name}</span>
          <span class="m-badge ${statusConfig.badgeClass}">
            <i data-lucide="${statusConfig.icon}" class="lucide-icon"></i>
            ${statusConfig.label}
          </span>
        </div>

        <div class="printer-image">
          <img src="${imageUrl}" alt="${printer.name}" loading="lazy"
               onerror="this.src='${PRINTER_PLACEHOLDER}'">
          <div class="printer-status-indicator ${statusConfig.badgeClass}"
               title="${statusConfig.label}"></div>
        </div>

        <div class="printer-info">
          <div class="printer-temps">
            <div class="temp-item">
              <i data-lucide="flame" class="lucide-icon temp-icon"></i>
              <span class="temp-value">${toolTemp}°C</span>
              ${targetTool > 0 ? `<span class="temp-target">→ ${targetTool}°C</span>` : ''}
            </div>
            <div class="temp-item">
              <i data-lucide="layers" class="lucide-icon temp-icon"></i>
              <span class="temp-value">${bedTemp}°C</span>
              ${targetBed > 0 ? `<span class="temp-target">→ ${targetBed}°C</span>` : ''}
            </div>
          </div>

          ${isPrinting && hasJob ? `
            <div class="printer-progress">
              <div class="progress-header">
                <span class="progress-filename">${truncateFilename(printer.job.name, 25)}</span>
                <span class="progress-meta">
                  ${printer.layer ? `<span class="m-caption">Layer ${printer.layer}</span>` : ''}
                  ${timeLeft ? `
                    <span class="progress-time">
                      <i data-lucide="clock" class="lucide-icon"></i>
                      ${timeLeft}
                    </span>
                  ` : ''}
                </span>
              </div>
              <div class="progress-bar printer">
                <div class="progress-fill ${printer.status}" style="width: ${printer.progress}%"></div>
              </div>
              <div class="progress-footer">
                <span>${printer.progress}% complete</span>
                ${printer.job.totalTime ? `<span class="m-caption">Total: ${formatDuration(printer.job.totalTime)}</span>` : ''}
              </div>
            </div>
          ` : printer.error ? `
            <div class="printer-error">
              <i data-lucide="alert-circle" class="lucide-icon"></i>
              <span>${printer.error}</span>
            </div>
          ` : `
            <div class="printer-idle">
              <i data-lucide="moon" class="lucide-icon"></i>
              <span>Idle - Ready to print</span>
            </div>
          `}
        </div>
      </div>
    `
  }

  // Apply touch feedback after render
  function applyTouchFeedback() {
    container.querySelectorAll('.m-touch').forEach(addTouchFeedback)
  }

  // Global functions
  window.refreshPrinters = async () => {
    const btn = document.getElementById('refreshPrintersBtn')
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<i data-lucide="loader" class="lucide-icon spinning"></i> ...'
    }

    try {
      const printers = await printerAPI.getPrinters()
      if (printers) {
        store.set('printers', printers)
        store.set('lastPrinterUpdate', Date.now())
        toast.success('Printers refreshed')
      } else {
        toast.error('Failed to fetch printers')
      }
    } catch (err) {
      toast.error('Refresh failed', err.message)
    } finally {
      if (btn) {
        btn.disabled = false
        btn.innerHTML = '<i data-lucide="refresh-cw" class="lucide-icon"></i> Refresh'
        // Re-initialize Lucide icons
        if (window.lucide) {
          window.lucide.createIcons()
        }
      }
    }
  }

  window.showPrinterDetails = (id) => {
    const printer = store.get('printers').find(p => p.id === id)
    if (printer) {
      toast.info(printer.name, `${printer.status} - ${printer.temp}°C`)
    }
  }

  // Polling
  function startPolling() {
    if (pollInterval) return
    pollInterval = printerAPI.startPolling((printers) => {
      store.set('printers', printers)
      store.set('lastPrinterUpdate', Date.now())
    })
    // polling may return null if disabled
    if (!pollInterval) {
      console.log('[Inventory] Auto-polling disabled - use manual refresh')
    }
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  store.subscribe((state, path) => {
    if (!path || path.includes('printers') || path.includes('lastPrinterUpdate')) render()
  })

  render()
  startPolling()

  return { render, startPolling, stopPolling }
}

function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatDuration(seconds) {
  if (!seconds) return ''
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

function truncateFilename(filename, maxLength) {
  if (!filename) return ''
  if (filename.length <= maxLength) return filename
  return filename.substring(0, maxLength - 3) + '...'
}
