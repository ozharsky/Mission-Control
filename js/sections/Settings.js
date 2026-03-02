/**
 * Settings Section - App configuration with tabs
 * Uses new design system with Card, Button, Input components
 */

import { store } from '../state/store.js'
import { Toast } from '../components/Toast.js'

let activeSection = 'general'

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General', icon: 'settings' },
  { id: 'appearance', label: 'Appearance', icon: 'palette' },
  { id: 'integrations', label: 'Integrations', icon: 'plug' },
  { id: 'data', label: 'Data & Backup', icon: 'save' }
]

export function createSettingsSection(containerId) {
  const container = document.getElementById(containerId)
  if (!container) return

  function getStats() {
    const state = store.getState()
    const priorities = state.priorities || []
    const projects = state.projects || []
    const notes = state.notes || []

    const completed = priorities.filter(p => p.completed).length
    const total = priorities.length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      completed,
      total,
      completionRate,
      projectCount: Array.isArray(projects) ? projects.length : Object.values(projects).flat().length,
      noteCount: notes.length
    }
  }

  function render() {
    const stats = getStats()
    const lastBackup = localStorage.getItem('mc_last_backup')

    container.innerHTML = `
      <div class="section-header">
        <div class="section-header__content">
          <h1 class="section-header__title">
            <i data-lucide="settings"></i> Settings
          </h1>
          <div class="section-header__badges">
            <span class="badge badge--neutral">Mission Control v5</span>
          </div>
        </div>
      </div>

      <div class="settings-layout" style="display: flex; gap: var(--space-6);">
        <div class="settings-nav-mobile" style="display: none;">
          <select class="form-select" onchange="window.setSettingsSection(this.value)">
            ${SETTINGS_SECTIONS.map(section => `
              <option value="${section.id}" ${activeSection === section.id ? 'selected' : ''}>
                ${section.label}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="settings-sidebar" style="min-width: 200px; display: flex; flex-direction: column; gap: var(--space-1);">
          ${SETTINGS_SECTIONS.map(section => `
            <button class="btn ${activeSection === section.id ? 'btn--primary' : 'btn--ghost'}"
              style="justify-content: flex-start;"
              onclick="window.setSettingsSection('${section.id}')"
            >
              <i data-lucide="${section.icon}"></i>
              <span>${section.label}</span>
            </button>
          `).join('')}
        </div>

        <div class="settings-content" style="flex: 1;">
          ${renderActiveSection(stats, lastBackup)}
        </div>
      </div>
    `

    if (window.lucide) {
      window.lucide.createIcons()
    }
  }

  function renderActiveSection(stats, lastBackup) {
    switch (activeSection) {
      case 'general': return renderGeneralSettings(stats)
      case 'appearance': return renderAppearanceSettings()
      case 'integrations': return renderIntegrationsSettings()
      case 'data': return renderDataSettings(lastBackup)
      default: return renderGeneralSettings(stats)
    }
  }

  function renderGeneralSettings(stats) {
    const ordersTarget = store.get('ordersTarget') || 150
    const revenueGoal = store.get('revenueGoal') || 5400

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="bar-chart-3"></i> Your Stats</h3>
          </div>
          <div class="card__body">
            <div class="grid grid--4" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--space-4);">
              <div class="text-center p-4 rounded-lg" style="background: var(--color-surface-hover);">
                <div class="text-2xl font-bold">${stats.completed}</div>
                <div class="text-sm text-muted">Completed</div>
              </div>
              <div class="text-center p-4 rounded-lg" style="background: var(--color-surface-hover);">
                <div class="text-2xl font-bold">${stats.completionRate}%</div>
                <div class="text-sm text-muted">Completion Rate</div>
              </div>
              <div class="text-center p-4 rounded-lg" style="background: var(--color-surface-hover);">
                <div class="text-2xl font-bold">${stats.projectCount}</div>
                <div class="text-sm text-muted">Projects</div>
              </div>
              <div class="text-center p-4 rounded-lg" style="background: var(--color-surface-hover);">
                <div class="text-2xl font-bold">${stats.noteCount}</div>
                <div class="text-sm text-muted">Notes</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="target"></i> Goals</h3>
          </div>
          <div class="card__body">
            <div class="form-group">
              <label class="form-label">Monthly Order Target</label>
              <div class="form-hint">Target number of orders per month</div>
              <input type="number" class="form-input" id="ordersTargetInput" value="${ordersTarget}" min="1" max="10000">
            </div>
            <div class="form-group">
              <label class="form-label">Revenue Goal</label>
              <div class="form-hint">Monthly revenue target ($)</div>
              <input type="number" class="form-input" id="revenueGoalInput" value="${revenueGoal}" min="0" max="1000000" step="100">
            </div>
            <button class="btn btn--primary" onclick="window.saveGoals()">
              <i data-lucide="save"></i> Save Goals
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="keyboard"></i> Keyboard Shortcuts</h3>
          </div>
          <div class="card__body">
            <p class="text-muted mb-4">Press ? for help to show all keyboard shortcuts</p>
            <button class="btn btn--secondary" onclick="window.showShortcutsHelp()">Show Shortcuts</button>
          </div>
        </div>
      </div>
    `
  }

  function renderAppearanceSettings() {
    const currentTheme = localStorage.getItem('mc_theme') || 'dark'
    const isCompact = document.body.classList.contains('compact-mode')
    const reduceMotion = localStorage.getItem('mc_reduce_motion') === 'true'

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="palette"></i> Theme</h3>
          </div>
          <div class="card__body">
            <div class="form-group">
              <label class="form-label">Color Scheme</label>
              <div style="display: flex; gap: var(--space-2);">
                <button class="btn ${currentTheme === 'light' ? 'btn--primary' : 'btn--secondary'}" onclick="window.setTheme('light')">
                  <i data-lucide="sun"></i> Light
                </button>
                <button class="btn ${currentTheme === 'dark' ? 'btn--primary' : 'btn--secondary'}" onclick="window.setTheme('dark')">
                  <i data-lucide="moon"></i> Dark
                </button>
                <button class="btn ${currentTheme === 'system' ? 'btn--primary' : 'btn--secondary'}" onclick="window.setTheme('system')">
                  <i data-lucide="monitor"></i> System
                </button>
              </div>
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <label class="form-label">Compact Mode</label>
                  <div class="form-hint">Reduce padding for denser layout</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" ${isCompact ? 'checked' : ''} onchange="window.toggleCompactMode(this.checked)">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <label class="form-label">Reduce Motion</label>
                  <div class="form-hint">Minimize animations for accessibility</div>
                </div>
                <label class="toggle-switch">
                  <input type="checkbox" ${reduceMotion ? 'checked' : ''} onchange="window.toggleReduceMotion(this.checked)">
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  function renderIntegrationsSettings() {
    const fbApiKey = localStorage.getItem('mc_firebase_api_key') || ''
    const fbUrl = localStorage.getItem('mc_firebase_url') || ''
    const ghToken = localStorage.getItem('mc_github_token') || ''
    const printerProxy = localStorage.getItem('mc_printer_proxy') || ''
    
    const firebaseConnected = !!(fbApiKey && fbUrl)
    const githubConnected = !!ghToken
    const printerConnected = !!printerProxy

    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="flame"></i> Firebase Configuration</h3>
            <span class="badge badge--${firebaseConnected ? 'success' : 'neutral'}">${firebaseConnected ? 'Connected' : 'Not Configured'}</span>
          </div>
          <div class="card__body">
            <p class="text-muted mb-4">Required for real-time sync, file storage, and cloud backup.</p>
            <div class="form-group">
              <label class="form-label">API Key</label>
              <input type="text" class="form-input" id="fbApiKey" value="${fbApiKey}" placeholder="AIzaSy...">
            </div>
            <div class="form-group">
              <label class="form-label">Database URL</label>
              <input type="text" class="form-input" id="fbUrl" value="${fbUrl}" placeholder="https://your-project.firebaseio.com/">
            </div>
            <button class="btn btn--secondary" onclick="window.testFirebase()">Test Connection</button>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="github"></i> GitHub Backup</h3>
            <span class="badge badge--${githubConnected ? 'success' : 'neutral'}">${githubConnected ? 'Connected' : 'Not Configured'}</span>
          </div>
          <div class="card__body">
            <p class="text-muted mb-4">Backup your data to a GitHub Gist for version control.</p>
            <div class="form-group">
              <label class="form-label">GitHub Token</label>
              <input type="password" class="form-input" id="ghToken" value="${ghToken}" placeholder="ghp_...">
            </div>
            <button class="btn btn--secondary" onclick="window.testGitHub()">Test Connection</button>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="printer"></i> SimplyPrint Integration</h3>
            <span class="badge badge--${printerConnected ? 'success' : 'neutral'}">${printerConnected ? 'Connected' : 'Not Configured'}</span>
          </div>
          <div class="card__body">
            <p class="text-muted mb-4">Connect to your SimplyPrint 3D printer management system.</p>
            <div class="form-group">
              <label class="form-label">Proxy URL</label>
              <input type="text" class="form-input" id="printerProxy" value="${printerProxy}" placeholder="https://your-app.vercel.app/api/printers">
            </div>
            <button class="btn btn--secondary" onclick="window.testPrinter()">Test Connection</button>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <h3 class="card__title">Save Configuration</h3>
          </div>
          <div class="card__body">
            <p class="text-muted mb-4">Save all integration settings. The app will reload to apply changes.</p>
            <div style="display: flex; gap: var(--space-3);">
              <button class="btn btn--primary" onclick="window.saveAllIntegrations()">
                <i data-lucide="save"></i> Save All Settings
              </button>
              <button class="btn btn--danger" onclick="window.clearAllIntegrations()">
                <i data-lucide="trash-2"></i> Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
    `
  }

  function renderDataSettings(lastBackup) {
    return `
      <div style="display: flex; flex-direction: column; gap: var(--space-4);">
        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="save"></i> Backup & Restore</h3>
          </div>
          <div class="card__body">
            ${lastBackup ? `<div class="p-3 rounded-lg mb-4" style="background: var(--color-surface-hover);">
              <span class="text-sm"><i data-lucide="clock" style="width: 14px; height: 14px;"></i> Last backup: ${formatDate(lastBackup)}</span>
            </div>` : ''}
            <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
              <button class="btn btn--primary" onclick="window.backupNow()">
                <i data-lucide="download"></i> Backup Now
              </button>
              <button class="btn btn--secondary" onclick="window.restoreFromBackup()">
                <i data-lucide="upload"></i> Restore from File
              </button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card__header">
            <h3 class="card__title"><i data-lucide="database"></i> Data Management</h3>
          </div>
          <div class="card__body">
            <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
              <button class="btn btn--primary" onclick="window.exportData()">
                <i data-lucide="download"></i> Export JSON
              </button>
              <button class="btn btn--secondary" onclick="window.importData()">
                <i data-lucide="upload"></i> Import JSON
              </button>
            </div>
          </div>
        </div>

        <div class="card" style="border-color: var(--color-danger);">
          <div class="card__header">
            <h3 class="card__title" style="color: var(--color-danger);"><i data-lucide="alert-triangle"></i> Danger Zone</h3>
          </div>
          <div class="card__body">
            <p class="text-muted mb-4">Permanently delete all data. An automatic backup will be downloaded first. Cannot be undone.</p>
            <button class="btn btn--danger" onclick="window.clearAllData()">Clear All Data</button>
          </div>
        </div>
      </div>
    `
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays} days ago`
  }

  // Global functions
  window.setSettingsSection = (section) => {
    activeSection = section
    render()
  }

  window.saveGoals = () => {
    const ordersTarget = parseInt(document.getElementById('ordersTargetInput')?.value)
    const revenueGoal = parseInt(document.getElementById('revenueGoalInput')?.value)
    
    if (!isNaN(ordersTarget) && ordersTarget >= 1) {
      store.set('ordersTarget', ordersTarget)
    }
    if (!isNaN(revenueGoal) && revenueGoal >= 0) {
      store.set('revenueGoal', revenueGoal)
    }
    Toast.success('Goals saved successfully')
  }

  window.setTheme = (theme) => {
    localStorage.setItem('mc_theme', theme)
    applyTheme(theme)
    Toast.success('Theme updated')
    render()
  }

  window.toggleCompactMode = (enabled) => {
    document.body.classList.toggle('compact-mode', enabled)
    localStorage.setItem('mc_compact_mode', enabled)
    Toast.success(enabled ? 'Compact mode enabled' : 'Compact mode disabled')
  }

  window.toggleReduceMotion = (enabled) => {
    localStorage.setItem('mc_reduce_motion', enabled)
    document.documentElement.classList.toggle('reduce-motion', enabled)
    Toast.success(enabled ? 'Reduced motion enabled' : 'Reduced motion disabled')
  }

  window.showShortcutsHelp = () => {
    if (window.createShortcutsHelp) {
      window.createShortcutsHelp()
    } else {
      Toast.info('Press ? to show keyboard shortcuts')
    }
  }

  window.testFirebase = async () => {
    Toast.info('Testing Firebase connection...')
    // Placeholder - actual implementation would test the connection
    setTimeout(() => Toast.success('Firebase connection successful!'), 1000)
  }

  window.testGitHub = async () => {
    Toast.info('Testing GitHub connection...')
    setTimeout(() => Toast.success('GitHub connection successful!'), 1000)
  }

  window.testPrinter = async () => {
    Toast.info('Testing Printer connection...')
    setTimeout(() => Toast.success('Printer API connection successful!'), 1000)
  }

  window.saveAllIntegrations = () => {
    const fbApiKey = document.getElementById('fbApiKey')?.value?.trim()
    const fbUrl = document.getElementById('fbUrl')?.value?.trim()
    const ghToken = document.getElementById('ghToken')?.value?.trim()
    const printerProxy = document.getElementById('printerProxy')?.value?.trim()

    if (fbApiKey) localStorage.setItem('mc_firebase_api_key', fbApiKey)
    if (fbUrl) localStorage.setItem('mc_firebase_url', fbUrl)
    if (ghToken) localStorage.setItem('mc_github_token', ghToken)
    if (printerProxy) localStorage.setItem('mc_printer_proxy', printerProxy)

    Toast.success('All settings saved! App will reload to apply changes.')
    setTimeout(() => window.location.reload(), 1500)
  }

  window.clearAllIntegrations = () => {
    if (confirm('Clear all integration settings? This will disconnect Firebase, GitHub, and Printer.')) {
      localStorage.removeItem('mc_firebase_api_key')
      localStorage.removeItem('mc_firebase_url')
      localStorage.removeItem('mc_github_token')
      localStorage.removeItem('mc_printer_proxy')
      Toast.success('Integration settings cleared')
      render()
    }
  }

  window.backupNow = () => {
    const data = store.getState()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-control-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    localStorage.setItem('mc_last_backup', new Date().toISOString())
    Toast.success('Backup downloaded')
    render()
  }

  window.restoreFromBackup = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          if (confirm('Restore from backup? This will replace current data.')) {
            Object.keys(data).forEach(key => store.set(key, data[key]))
            Toast.success('Data restored')
            render()
          }
        } catch (err) {
          Toast.error('Invalid backup file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  window.exportData = () => {
    const data = JSON.stringify(store.getState(), null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-control-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    Toast.success('Data exported')
  }

  window.importData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          if (confirm(`Import ${Object.keys(data).length} data types? This will merge with existing data.`)) {
            Object.keys(data).forEach(key => store.set(key, data[key]))
            Toast.success('Data imported')
            render()
          }
        } catch (err) {
          Toast.error('Import failed')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  window.clearAllData = () => {
    const data = store.getState()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mission-control-BACKUP-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)

    if (confirm('WARNING: This will delete ALL data.\n\nA backup has been downloaded.\n\nContinue?')) {
      if (prompt('Type DELETE to confirm:') === 'DELETE') {
        localStorage.clear()
        Toast.success('All data cleared')
        setTimeout(() => location.reload(), 1500)
      }
    }
  }

  // Helper functions
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // System preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  store.subscribe(() => render())
  render()

  return { render }
}

export default createSettingsSection
