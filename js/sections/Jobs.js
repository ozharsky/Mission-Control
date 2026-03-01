// Print Jobs Section for Mission Control V5
// Shows active and completed print jobs from SimplyPrint

import { store } from '../state/store.js'
import { toast } from '../components/Toast.js'
import { icons } from '../utils/icons.js'
import { addTouchFeedback } from '../utils/mobileInteractions.js'

export function createJobsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  function render() {
    const jobs = store.getState().printJobs || []
    const printers = store.getState().printers || []
    
    // Filter jobs by status
    const activeJobs = jobs.filter(j => j.state === 'printing' || j.state === 'paused')
    const completedJobs = jobs.filter(j => j.state === 'completed').slice(0, 10)
    
    container.innerHTML = `
      <!-- Welcome Header -->
      <div class="m-card welcome-bar">
        <div class="welcome-content">
          <div class="m-title welcome-greeting">
            ${icons.file()} Print Jobs
          </div>
          <div class="welcome-status">
            <span class="m-badge ${activeJobs.length > 0 ? 'm-badge-primary' : 'm-badge-success'}">
              ${activeJobs.length > 0 ? icons.zap() + ' ' + activeJobs.length + ' active' : icons.check() + ' All done'}
            </span>
          </div>
        </div>
        <div class="welcome-actions">
          <button class="m-btn-secondary m-touch" onclick="refreshJobs()" id="refreshJobsBtn">
            ${icons.refresh()} Refresh
          </button>
        </div>
      </div>

      <!-- Active Jobs -->
      ${activeJobs.length > 0 ? `
        <div class="m-card jobs-section">
          <div class="section-header">
            <h3 class="m-title">${icons.zap()} Active Jobs</h3>
          </div>
          <div class="jobs-list">
            ${activeJobs.map(job => renderJobCard(job, printers)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Completed Jobs -->
      ${completedJobs.length > 0 ? `
        <div class="m-card jobs-section">
          <div class="section-header">
            <h3 class="m-title">${icons.check()} Recently Completed</h3>
          </div>
          <div class="jobs-list">
            ${completedJobs.map(job => renderJobCard(job, printers)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Empty State -->
      ${activeJobs.length === 0 && completedJobs.length === 0 ? `
        <div class="m-card empty-state">
          <div class="empty-state-icon">${icons.file()}</div>
          <div class="m-title empty-state-title">No print jobs</div>
          <div class="m-caption empty-state-text">Start a print from SimplyPrint to see it here.</div>
        </div>
      ` : ''}
    `

    // Apply touch feedback
    container.querySelectorAll('.m-touch').forEach(addTouchFeedback)
  }

  function renderJobCard(job, printers) {
    const printer = printers.find(p => p.id === job.printer_id) || { name: 'Unknown Printer' }
    const progress = job.percentage || 0
    const isPrinting = job.state === 'printing'
    const isPaused = job.state === 'paused'
    
    return `
      <div class="job-card">
        <div class="job-header">
          <div class="job-info">
            <div class="job-file">${job.file || 'Unknown File'}</div>
            <div class="job-printer m-caption">${icons.printer()} ${printer.name}</div>
          </div>
          <div class="job-status">
            <span class="m-badge ${isPrinting ? 'm-badge-primary' : isPaused ? 'm-badge-warning' : 'm-badge-success'}">
              ${isPrinting ? icons.zap() + ' Printing' : isPaused ? icons.pause() + ' Paused' : icons.check() + ' Done'}
            </span>
          </div>
        </div>
        
        <div class="job-progress">
          <div class="progress-bar job">
            <div class="progress-fill ${isPrinting ? 'printing' : ''}" style="width: ${progress}%"></div>
          </div>
          <div class="progress-text">
            <span>${progress}%</span>
            ${job.time ? `<span class="m-caption">${formatTime(job.time)}</span>` : ''}
          </div>
        </div>
        
        ${job.canPreview ? `
          <div class="job-actions">
            <button class="m-btn-secondary m-touch m-btn-sm" onclick="viewJobPreview(${job.id})">
              ${icons.eye()} Preview
            </button>
          </div>
        ` : ''}
      </div>
    `
  }

  function formatTime(seconds) {
    if (!seconds) return ''
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  // Global functions
  window.refreshJobs = async () => {
    const btn = document.getElementById('refreshJobsBtn')
    if (btn) {
      btn.disabled = true
      btn.innerHTML = `${icons.loader({ className: 'spinning' })} Refreshing...`
    }

    try {
      const res = await fetch('/js/api/printers?action=get_jobs')
      if (res.ok) {
        const data = await res.json()
        store.set('printJobs', data.jobs || [])
        toast.success('Jobs refreshed')
      } else {
        toast.error('Failed to fetch jobs')
      }
    } catch (err) {
      toast.error('Refresh failed', err.message)
    } finally {
      if (btn) {
        btn.disabled = false
        btn.innerHTML = `${icons.refresh()} Refresh`
      }
    }
  }

  window.viewJobPreview = (jobId) => {
    toast.info('Preview', `Viewing job ${jobId}`)
  }

  // Subscribe to store changes
  store.subscribe((state, path) => {
    if (!path || path.includes('printJobs')) render()
  })

  // Initial render
  render()
  
  // Auto-refresh every 30 seconds
  const interval = setInterval(() => {
    if (document.getElementById(containerId)) {
      refreshJobs()
    } else {
      clearInterval(interval)
    }
  }, 30000)
}
